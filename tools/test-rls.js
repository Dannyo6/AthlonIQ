import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createStubbedDb } from "./audit-migrations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../supabase/migrations");
const seedFile = path.resolve(__dirname, "../supabase/seed.sql");

const USER_A_ID = "11111111-1111-4111-a111-111111111111";
const USER_B_ID = "22222222-2222-4222-a222-222222222222";

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  testsRun++;
  if (condition) {
    testsPassed++;
  } else {
    testsFailed++;
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function setSession(db, userId, role = "authenticated") {
  if (role === "anon") {
    await db.exec(`
      RESET request.jwt.claim.sub;
      SET request.jwt.claim.role = 'anon';
      SET ROLE anon;
    `);
  } else if (role === "service_role") {
    await db.exec(`
      RESET request.jwt.claim.sub;
      SET request.jwt.claim.role = 'service_role';
      SET ROLE service_role;
    `);
  } else {
    await db.exec(`
      SET request.jwt.claim.sub = '${userId}';
      SET request.jwt.claim.role = 'authenticated';
      SET ROLE authenticated;
    `);
  }
}

async function resetRole(db) {
  await db.exec(`
    RESET ROLE;
    RESET request.jwt.claim.sub;
    RESET request.jwt.claim.role;
  `);
}

async function runRlsTests() {
  console.log("================================================================");
  console.log("       AthlonIQ Automated RLS & Schema Isolation Suite          ");
  console.log("================================================================\n");

  const db = await createStubbedDb();

  // 1. Apply all migrations in order
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log("1. Applying Migrations in Order:");
  for (const file of migrationFiles) {
    let sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    sql = sql.replace(/CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+"uuid-ossp";?/gi, "-- uuid-ossp stubbed");
    sql = sql.replace(/CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+"pgcrypto";?/gi, "-- pgcrypto stubbed");
    await db.exec(sql);
    console.log(`  ✓ Applied ${file}`);
  }

  // 2. Apply seed file
  if (fs.existsSync(seedFile)) {
    const seedSql = fs.readFileSync(seedFile, "utf-8");
    await db.exec(seedSql);
    console.log("  ✓ Applied seed.sql (Global reference exercises)");
  }

  // 3. Schema & RLS Policy Completeness Audit
  console.log("\n2. Auditing Public Tables for RLS & Policy Completeness:");
  const publicTablesRes = await db.query(`
    SELECT c.relname, c.relrowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname;
  `);

  const tables = publicTablesRes.rows;
  console.log(`  Found ${tables.length} tables in public schema.`);
  assert(tables.length >= 17, `Expected at least 17 public tables, found ${tables.length}`);

  for (const tbl of tables) {
    // Assert RLS is enabled
    assert(tbl.relrowsecurity === true, `Table '${tbl.relname}' must have RLS enabled`);

    // Fetch policies
    const polRes = await db.query(
      `SELECT cmd, roles, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = $1`,
      [tbl.relname]
    );

    const commands = polRes.rows.map((r) => r.cmd);
    const hasSelect = commands.includes("SELECT");
    const hasInsert = commands.includes("INSERT");
    const hasUpdate = commands.includes("UPDATE");
    const hasDelete = commands.includes("DELETE");

    assert(hasSelect, `Table '${tbl.relname}' is missing SELECT policy`);
    assert(hasInsert, `Table '${tbl.relname}' is missing INSERT policy`);
    assert(hasUpdate, `Table '${tbl.relname}' is missing UPDATE policy`);
    assert(hasDelete, `Table '${tbl.relname}' is missing DELETE policy`);

    // Verify no policies grant access to anon
    for (const pol of polRes.rows) {
      const roles = Array.isArray(pol.roles) ? pol.roles : [pol.roles];
      const anonAllowed = roles.some((r) => r && (r.toLowerCase() === "anon" || r.toLowerCase() === "public"));
      assert(!anonAllowed, `Table '${tbl.relname}' policy '${pol.policyname}' must NOT grant access to anon or public`);
    }

    console.log(`  ✓ ${tbl.relname.padEnd(28)}: RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)`);
  }

  // 4. Create User A and User B in auth.users as superuser / admin
  console.log("\n3. Provisioning Isolated Athletes in auth.users:");
  await resetRole(db);

  await db.query(`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES
      ($1, 'athlete.a@athloniq.local', '{"full_name": "Athlete Alpha"}'::jsonb),
      ($2, 'athlete.b@athloniq.local', '{"full_name": "Athlete Bravo"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
  `, [USER_A_ID, USER_B_ID]);

  console.log(`  ✓ Created Athlete A (${USER_A_ID})`);
  console.log(`  ✓ Created Athlete B (${USER_B_ID})`);

  // Verify provisioning trigger seeded profiles, equipment, goals, preferences for both
  const profileCount = await db.query(`SELECT count(*) FROM public.profiles WHERE id IN ($1, $2)`, [USER_A_ID, USER_B_ID]);
  assert(parseInt(profileCount.rows[0].count, 10) === 2, "Both profiles must be automatically provisioned");

  // Populate Athlete B's data across all domain tables
  console.log("\n4. Populating Private Dataset for Athlete B:");
  await setSession(db, USER_B_ID, "authenticated");

  // Custom food
  const bFood = await db.query(`
    INSERT INTO public.custom_foods (user_id, name, serving_label, calories_kcal, protein_g, carbs_g, fat_g)
    VALUES ($1, 'B Homemade Protein Bar', '1 bar', 250, 25, 20, 8)
    RETURNING id;
  `, [USER_B_ID]);
  const bFoodId = bFood.rows[0].id;

  // Food entry
  const bEntry = await db.query(`
    INSERT INTO public.food_entries (user_id, meal_slot, food_name, serving_label, calories_kcal, protein_g, carbs_g, fat_g)
    VALUES ($1, 'breakfast', 'B Morning Oats', '1 bowl', 350, 15, 60, 5)
    RETURNING id;
  `, [USER_B_ID]);
  const bEntryId = bEntry.rows[0].id;

  // Workout template & exercise
  const bTpl = await db.query(`
    INSERT INTO public.workout_templates (user_id, name, focus)
    VALUES ($1, 'B Hypertrophy Split', 'Upper Body')
    RETURNING id;
  `, [USER_B_ID]);
  const bTplId = bTpl.rows[0].id;

  const bTplEx = await db.query(`
    INSERT INTO public.workout_template_exercises (template_id, user_id, exercise_name)
    VALUES ($1, $2, 'Incline Dumbbell Press')
    RETURNING id;
  `, [bTplId, USER_B_ID]);
  const bTplExId = bTplEx.rows[0].id;

  // Workout session & exercise set
  const bWk = await db.query(`
    INSERT INTO public.workout_sessions (user_id, title)
    VALUES ($1, 'B Heavy Push Day')
    RETURNING id;
  `, [USER_B_ID]);
  const bWkId = bWk.rows[0].id;

  const bSet = await db.query(`
    INSERT INTO public.exercise_sets (session_id, user_id, exercise_name, set_order, reps, load_kg)
    VALUES ($1, $2, 'Incline Dumbbell Press', 1, 10, 32.5)
    RETURNING id;
  `, [bWkId, USER_B_ID]);
  const bSetId = bSet.rows[0].id;

  // Activity session
  const bAct = await db.query(`
    INSERT INTO public.activity_sessions (user_id, activity_type, duration_minutes, distance_km)
    VALUES ($1, 'running', 30, 5.2)
    RETURNING id;
  `, [USER_B_ID]);
  const bActId = bAct.rows[0].id;

  // Body metric
  const bMetric = await db.query(`
    INSERT INTO public.body_metrics (user_id, weight_kg)
    VALUES ($1, 74.5)
    RETURNING id;
  `, [USER_B_ID]);
  const bMetricId = bMetric.rows[0].id;

  // Recovery log
  const bRec = await db.query(`
    INSERT INTO public.recovery_logs (user_id, sleep_hours, sleep_quality, soreness, fatigue, readiness_score, readiness_status)
    VALUES ($1, 7.5, 4, 2, 2, 85, 'Prime')
    RETURNING id;
  `, [USER_B_ID]);
  const bRecId = bRec.rows[0].id;

  // Coach conversation & message
  const bConv = await db.query(`
    INSERT INTO public.coach_conversations (user_id, title)
    VALUES ($1, 'B Deload Strategy')
    RETURNING id;
  `, [USER_B_ID]);
  const bConvId = bConv.rows[0].id;

  const bMsg = await db.query(`
    INSERT INTO public.coach_messages (conversation_id, user_id, role, content)
    VALUES ($1, $2, 'user', 'Should I deload this week?')
    RETURNING id;
  `, [bConvId, USER_B_ID]);
  const bMsgId = bMsg.rows[0].id;

  // Weekly report
  const bRep = await db.query(`
    INSERT INTO public.weekly_reports (user_id, week_start_date, week_end_date, summary_payload)
    VALUES ($1, '2026-10-12', '2026-10-18', '{"adherence_score": 92}'::jsonb)
    RETURNING id;
  `, [USER_B_ID]);
  const bRepId = bRep.rows[0].id;

  // Progress photo
  const bPhoto = await db.query(`
    INSERT INTO public.progress_photos (user_id, image_url, category)
    VALUES ($1, 'https://storage.local/athlete-b/front-lat.jpg', 'progress')
    RETURNING id;
  `, [USER_B_ID]);
  const bPhotoId = bPhoto.rows[0].id;

  // Custom exercise
  const bEx = await db.query(`
    INSERT INTO public.exercises (name, category, primary_muscle, is_custom, user_id)
    VALUES ('B Special Neutral Grip Row', 'cable', 'Mid Back', TRUE, $1)
    RETURNING id;
  `, [USER_B_ID]);
  const bExId = bEx.rows[0].id;

  // Storage object in private bucket
  const bObj = await db.query(`
    INSERT INTO storage.objects (bucket_id, name, owner)
    VALUES ('progress-photos', $1 || '/front-double-bicep.jpg', $1::uuid)
    RETURNING id;
  `, [USER_B_ID]);
  const bObjId = bObj.rows[0].id;

  console.log("  ✓ Inserted records for Athlete B across all tables and private storage.");

  // 5. Test Athlete A Isolation against Athlete B
  console.log("\n5. Testing Athlete A Cross-Tenant Isolation (Anti-Tampering & Anti-Leakage):");
  await setSession(db, USER_A_ID, "authenticated");

  const tablesToVerify = [
    { table: "profiles", idCol: "id", bId: USER_B_ID, userCol: "id", updateSql: "full_name = 'Hacked by A'" },
    { table: "user_equipment", idCol: "user_id", bId: USER_B_ID, userCol: "user_id", updateSql: "notes = 'Hacked by A'" },
    { table: "user_goals", idCol: "user_id", bId: USER_B_ID, userCol: "user_id", updateSql: "water_target_ml = 9999" },
    { table: "user_preferences", idCol: "user_id", bId: USER_B_ID, userCol: "user_id", updateSql: "timezone = 'UTC'" },
    { table: "custom_foods", idCol: "id", bId: bFoodId, userCol: "user_id", updateSql: "name = 'Hacked by A'" },
    { table: "food_entries", idCol: "id", bId: bEntryId, userCol: "user_id", updateSql: "food_name = 'Hacked by A'" },
    { table: "workout_templates", idCol: "id", bId: bTplId, userCol: "user_id", updateSql: "name = 'Hacked by A'" },
    { table: "workout_template_exercises", idCol: "id", bId: bTplExId, userCol: "user_id", updateSql: "exercise_name = 'Hacked by A'" },
    { table: "workout_sessions", idCol: "id", bId: bWkId, userCol: "user_id", updateSql: "title = 'Hacked by A'" },
    { table: "exercise_sets", idCol: "id", bId: bSetId, userCol: "user_id", updateSql: "exercise_name = 'Hacked by A'" },
    { table: "activity_sessions", idCol: "id", bId: bActId, userCol: "user_id", updateSql: "route_or_notes = 'Hacked by A'" },
    { table: "body_metrics", idCol: "id", bId: bMetricId, userCol: "user_id", updateSql: "notes = 'Hacked by A'" },
    { table: "recovery_logs", idCol: "id", bId: bRecId, userCol: "user_id", updateSql: "notes = 'Hacked by A'" },
    { table: "coach_conversations", idCol: "id", bId: bConvId, userCol: "user_id", updateSql: "title = 'Hacked by A'" },
    { table: "coach_messages", idCol: "id", bId: bMsgId, userCol: "user_id", updateSql: "content = 'Hacked by A'" },
    { table: "weekly_reports", idCol: "id", bId: bRepId, userCol: "user_id", updateSql: "summary_payload = '{\"hacked\": true}'::jsonb" },
    { table: "progress_photos", idCol: "id", bId: bPhotoId, userCol: "user_id", updateSql: "notes = 'Hacked by A'" }
  ];

  for (const item of tablesToVerify) {
    // 5a. SELECT: User A selects User B's row -> Must return 0 rows
    const selRes = await db.query(`SELECT * FROM public.${item.table} WHERE ${item.idCol} = $1`, [item.bId]);
    assert(selRes.rows.length === 0, `User A was able to SELECT User B's row in '${item.table}'!`);

    // 5b. UPDATE: User A attempts to UPDATE User B's row -> Must update 0 rows
    const updRes = await db.query(
      `UPDATE public.${item.table} SET ${item.updateSql} WHERE ${item.idCol} = $1`,
      [item.bId]
    );
    const affected = updRes.affectedRows ?? updRes.rowCount ?? 0;
    assert(affected === 0, `User A was able to UPDATE User B's row in '${item.table}'!`);

    // 5c. DELETE: User A attempts to DELETE User B's row -> Must delete 0 rows
    const delRes = await db.query(`DELETE FROM public.${item.table} WHERE ${item.idCol} = $1`, [item.bId]);
    const deleted = delRes.affectedRows ?? delRes.rowCount ?? 0;
    assert(deleted === 0, `User A was able to DELETE User B's row in '${item.table}'!`);

    console.log(`  ✓ ${item.table.padEnd(28)}: SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)`);
  }

  // 5d. INSERT: User A attempts to INSERT using User B's user_id -> Must throw RLS check violation
  console.log("\n6. Testing Spoofed Foreign Key Inserts (User A inserting with User B's user_id):");

  // Custom food spoof
  let threw = false;
  try {
    await db.query(`
      INSERT INTO public.custom_foods (user_id, name, serving_label, calories_kcal, protein_g, carbs_g, fat_g)
      VALUES ($1, 'Spoofed Food', '100g', 100, 10, 10, 2)
    `, [USER_B_ID]);
  } catch (err) {
    threw = true;
    assert(err.message.includes("row-level security"), `Expected RLS error, got: ${err.message}`);
  }
  assert(threw, "User A was able to INSERT custom_foods using User B's user_id!");
  console.log("  ✓ Spoofed INSERT on custom_foods BLOCKED by RLS WITH CHECK");

  // Workout template spoof
  threw = false;
  try {
    await db.query(`
      INSERT INTO public.workout_templates (user_id, name, focus)
      VALUES ($1, 'Spoofed Template', 'Legs')
    `, [USER_B_ID]);
  } catch (err) {
    threw = true;
    assert(err.message.includes("row-level security"), `Expected RLS error, got: ${err.message}`);
  }
  assert(threw, "User A was able to INSERT workout_templates using User B's user_id!");
  console.log("  ✓ Spoofed INSERT on workout_templates BLOCKED by RLS WITH CHECK");

  // Workout template exercises spoof
  threw = false;
  try {
    await db.query(`
      INSERT INTO public.workout_template_exercises (template_id, user_id, exercise_name)
      VALUES ($1, $2, 'Spoofed Exercise')
    `, [bTplId, USER_B_ID]);
  } catch (err) {
    threw = true;
    assert(err.message.includes("row-level security"), `Expected RLS error, got: ${err.message}`);
  }
  assert(threw, "User A was able to INSERT workout_template_exercises using User B's user_id!");
  console.log("  ✓ Spoofed INSERT on workout_template_exercises BLOCKED by RLS WITH CHECK");

  // Exercise set spoof
  threw = false;
  try {
    await db.query(`
      INSERT INTO public.exercise_sets (session_id, user_id, exercise_name, set_order, reps, load_kg)
      VALUES ($1, $2, 'Spoofed Set', 1, 10, 50)
    `, [bWkId, USER_B_ID]);
  } catch (err) {
    threw = true;
    assert(err.message.includes("row-level security"), `Expected RLS error, got: ${err.message}`);
  }
  assert(threw, "User A was able to INSERT exercise_sets using User B's user_id!");
  console.log("  ✓ Spoofed INSERT on exercise_sets BLOCKED by RLS WITH CHECK");

  // Coach message spoof
  threw = false;
  try {
    await db.query(`
      INSERT INTO public.coach_messages (conversation_id, user_id, role, content)
      VALUES ($1, $2, 'user', 'Spoofed Message')
    `, [bConvId, USER_B_ID]);
  } catch (err) {
    threw = true;
    assert(err.message.includes("row-level security"), `Expected RLS error, got: ${err.message}`);
  }
  assert(threw, "User A was able to INSERT coach_messages using User B's user_id!");
  console.log("  ✓ Spoofed INSERT on coach_messages BLOCKED by RLS WITH CHECK");

  // Recovery logs spoof
  threw = false;
  try {
    await db.query(`
      INSERT INTO public.recovery_logs (user_id, sleep_hours, sleep_quality, soreness, fatigue, readiness_score, readiness_status)
      VALUES ($1, 8.0, 5, 1, 1, 95, 'Prime')
    `, [USER_B_ID]);
  } catch (err) {
    threw = true;
    assert(err.message.includes("row-level security"), `Expected RLS error, got: ${err.message}`);
  }
  assert(threw, "User A was able to INSERT recovery_logs using User B's user_id!");
  console.log("  ✓ Spoofed INSERT on recovery_logs BLOCKED by RLS WITH CHECK");

  // 6. Test Exercise Library Visibility
  console.log("\n7. Testing Exercise Library Permissions:");
  // Global reference exercises must be visible to authenticated User A
  const globalEx = await db.query(`SELECT * FROM public.exercises WHERE name = 'Barbell Back Squat'`);
  assert(globalEx.rows.length === 1, "Authenticated users must be able to view global reference exercises");
  console.log("  ✓ Global reference exercise readable by authenticated Athlete A");

  // User B custom exercise must NOT be visible to User A
  const customBEx = await db.query(`SELECT * FROM public.exercises WHERE id = $1`, [bExId]);
  assert(customBEx.rows.length === 0, "Athlete A must NOT see Athlete B's custom exercises");
  console.log("  ✓ Custom exercise created by Athlete B is HIDDEN from Athlete A");

  // 7. Test Storage Object Isolation
  console.log("\n8. Testing Storage Object Isolation:");
  const storageRes = await db.query(`SELECT * FROM storage.objects WHERE id = $1`, [bObjId]);
  assert(storageRes.rows.length === 0, "Athlete A must NOT see Athlete B's private storage files");
  console.log("  ✓ Athlete B storage object is INVISIBLE to Athlete A");

  threw = false;
  try {
    await db.query(`
      INSERT INTO storage.objects (bucket_id, name, owner)
      VALUES ('progress-photos', $1 || '/hacked.jpg', $1::uuid)
    `, [USER_B_ID]);
  } catch (err) {
    threw = true;
    assert(err.message.includes("row-level security"), `Expected storage RLS error, got: ${err.message}`);
  }
  assert(threw, "Athlete A must NOT be able to insert file into Athlete B's folder");
  console.log("  ✓ Cross-tenant storage upload BLOCKED by folder-name RLS check");

  // 8. Test Role Anon Has Zero Access
  console.log("\n9. Testing Anonymous (Unauthenticated) Access Rejection:");
  await setSession(db, null, "anon");

  for (const item of tablesToVerify) {
    const anonSel = await db.query(`SELECT * FROM public.${item.table}`);
    assert(anonSel.rows.length === 0, `Role 'anon' must see 0 rows in '${item.table}'!`);
  }
  console.log("  ✓ Role 'anon' read query returned 0 rows across all 17 public tables");

  // Storage anon test
  const anonStorage = await db.query(`SELECT * FROM storage.objects`);
  assert(anonStorage.rows.length === 0, "Role 'anon' must see 0 storage objects");
  console.log("  ✓ Role 'anon' storage query returned 0 rows");

  // Anon write test
  threw = false;
  try {
    await db.query(`
      INSERT INTO public.profiles (id, email, age, height_cm, weight_kg)
      VALUES ('33333333-3333-4333-a333-333333333333', 'anon@hacker.io', 25, 175, 70)
    `);
  } catch (err) {
    threw = true;
    assert(err.message.includes("row-level security") || err.message.includes("permission denied"), "Anon write must be rejected");
  }
  assert(threw, "Role 'anon' must NOT be able to INSERT rows!");
  console.log("  ✓ Role 'anon' write attempts REJECTED by RLS");

  await db.close();

  console.log("\n================================================================");
  console.log(`  ALL ${testsRun} RLS & ISOLATION CHECKS PASSED PERFECTLY! (0 failures)`);
  console.log("================================================================\n");
}

runRlsTests().catch((err) => {
  console.error("\n❌ RLS Suite Failed:", err);
  process.exit(1);
});
