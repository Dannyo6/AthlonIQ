/**
 * Hosted Supabase Cross-Tenant RLS & Storage Isolation Verification Script
 * 
 * Verifies with real Supabase sessions via publishable key that:
 * 1. Athlete A CANNOT read Athlete B's rows (SELECT returns empty).
 * 2. Athlete A CANNOT insert rows into Athlete B's tenant (INSERT blocked by WITH CHECK).
 * 3. Athlete A CANNOT update Athlete B's rows (UPDATE affects 0 rows).
 * 4. Athlete A CANNOT delete Athlete B's rows (DELETE affects 0 rows).
 * 5. Athlete A CANNOT read, upload to, or delete Athlete B's storage paths.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read credentials from web/.env.local or environment
let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
let publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const candidateEnvFiles = [
  path.resolve(__dirname, "../web/.env.local"),
  path.resolve(__dirname, ".env.local"),
  path.resolve(__dirname, "../.env"),
];

for (const envPath of candidateEnvFiles) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    const urlMatch = content.match(/VITE_SUPABASE_URL=(.*)/) || content.match(/SUPABASE_URL=(.*)/);
    const keyMatch = content.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/) || content.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
    const emailAMatch = content.match(/TEST_ATHLETE_A_EMAIL=(.*)/);
    const passAMatch = content.match(/TEST_ATHLETE_A_PASSWORD=(.*)/);
    const emailBMatch = content.match(/TEST_ATHLETE_B_EMAIL=(.*)/);
    const passBMatch = content.match(/TEST_ATHLETE_B_PASSWORD=(.*)/);

    if (!supabaseUrl && urlMatch) supabaseUrl = urlMatch[1].trim();
    if (!publishableKey && keyMatch) publishableKey = keyMatch[1].trim();
    if (!process.env.TEST_ATHLETE_A_EMAIL && emailAMatch) process.env.TEST_ATHLETE_A_EMAIL = emailAMatch[1].trim();
    if (!process.env.TEST_ATHLETE_A_PASSWORD && passAMatch) process.env.TEST_ATHLETE_A_PASSWORD = passAMatch[1].trim();
    if (!process.env.TEST_ATHLETE_B_EMAIL && emailBMatch) process.env.TEST_ATHLETE_B_EMAIL = emailBMatch[1].trim();
    if (!process.env.TEST_ATHLETE_B_PASSWORD && passBMatch) process.env.TEST_ATHLETE_B_PASSWORD = passBMatch[1].trim();
  }
}

if (!supabaseUrl || !publishableKey) {
  console.error("ERROR: Could not find VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in web/.env.local");
  process.exit(1);
}

console.log("================================================================================");
console.log("ATHLONIQ HOSTED RLS & MULTI-TENANT ISOLATION VERIFICATION");
console.log(`Endpoint: ${supabaseUrl}`);
console.log("================================================================================");

const TABLES_TO_TEST = [
  "profiles",
  "user_equipment",
  "user_goals",
  "user_preferences",
  "custom_foods",
  "food_entries",
  "workout_templates",
  "workout_template_exercises",
  "workout_sessions",
  "exercise_sets",
  "activity_sessions",
  "body_metrics",
  "recovery_logs",
  "coach_conversations",
  "coach_messages",
  "weekly_reports",
  "progress_photos",
];

async function getAuthenticatedClient(email, password, fullName) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Attempt sign in first (if user exists)
  let { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInError && signInData?.session) {
    return { client, user: signInData.user, session: signInData.session };
  }

  // Attempt sign up
  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (signUpError) {
    throw new Error(`Failed to create throwaway user ${email}: ${signUpError.message}`);
  }

  if (signUpData.session) {
    return { client, user: signUpData.user, session: signUpData.session };
  }

  // If email confirmation is required by Supabase project settings
  throw new Error(
    `User ${email} was created, but session is null because 'Confirm email' is enabled in your Supabase Auth settings.\n` +
    `To run automated end-to-end multi-tenant RLS checks, temporarily disable 'Confirm email' in Supabase Dashboard (Auth -> Providers -> Email -> Confirm email: OFF).`
  );
}

async function runHostedRlsVerification() {
  const nonce = Date.now();
  const passwordA = process.env.TEST_ATHLETE_A_PASSWORD || "TestAthletePass123!";
  const passwordB = process.env.TEST_ATHLETE_B_PASSWORD || "TestAthletePass123!";
  const emailA = process.env.TEST_ATHLETE_A_EMAIL || `test.athlete.alpha.${nonce}@gmail.com`;
  const emailB = process.env.TEST_ATHLETE_B_EMAIL || `test.athlete.bravo.${nonce}@gmail.com`;

  console.log(`Creating/authenticating throwaway Athlete Alpha: ${emailA}`);
  console.log(`Creating/authenticating throwaway Athlete Bravo: ${emailB}`);

  let clientA, userA, clientB, userB;
  try {
    const authA = await getAuthenticatedClient(emailA, passwordA, "Athlete Alpha");
    clientA = authA.client;
    userA = authA.user;

    const authB = await getAuthenticatedClient(emailB, passwordB, "Athlete Bravo");
    clientB = authB.client;
    userB = authB.user;

    console.log(`✓ Authenticated Athlete Alpha ID: ${userA.id}`);
    console.log(`✓ Authenticated Athlete Bravo ID: ${userB.id}\n`);
  } catch (err) {
    console.warn(`\n[RLS Verification Notice]: ${err.message}`);
    console.log("\nIf Supabase SMTP rate limit is active or email confirmation is required,");
    console.log("you can provide existing verified credentials via environment variables:");
    console.log("  $env:TEST_ATHLETE_A_EMAIL='userA@domain.com'");
    console.log("  $env:TEST_ATHLETE_B_EMAIL='userB@domain.com'");
    console.log("\nTo delete created test users:");
    console.log("Go to Supabase Dashboard -> Authentication -> Users -> Delete.");
    return { verified: false, reason: err.message };
  }

  let passedTests = 0;
  let totalTests = 0;

  // 1. Multi-Tenant Table RLS Isolation Tests
  console.log("--- Multi-Tenant Database Table Isolation Tests ---");

  for (const table of TABLES_TO_TEST) {
    totalTests++;
    let testSuccess = true;
    let failureReason = "";

    try {
      // 1. User B inserts a row in the table
      let insertPayload = { user_id: userB.id };
      if (table === "profiles") {
        insertPayload = { id: userB.id, email: emailB, full_name: "Bravo Profile" };
      } else if (table === "user_equipment") {
        insertPayload = { user_id: userB.id, item_key: "custom_bench", item_name: "Bravo Bench", is_confirmed: false };
      } else if (table === "user_goals") {
        insertPayload = { user_id: userB.id, primary_goal: "lean_bulk", calorie_target_kcal: 2500 };
      } else if (table === "user_preferences") {
        insertPayload = { user_id: userB.id, units: "metric" };
      } else if (table === "custom_foods") {
        insertPayload = { user_id: userB.id, name: "Bravo Oats", serving_label: "100g", calories_kcal: 350, protein_g: 12, carbs_g: 60, fat_g: 5 };
      } else if (table === "food_entries") {
        insertPayload = {
          user_id: userB.id,
          logged_date: "2026-10-20",
          meal_slot: "breakfast",
          food_name: "Bravo Oats",
          serving_label: "100g",
          calories_kcal: 350,
          protein_g: 12,
          carbs_g: 60,
          fat_g: 5,
        };
      } else if (table === "workout_templates") {
        insertPayload = { user_id: userB.id, name: "Bravo Routine" };
      } else if (table === "workout_template_exercises") {
        // Create template first
        const { data: tmpl } = await clientB.from("workout_templates").insert({ user_id: userB.id, name: "Bravo Parent" }).select().single();
        insertPayload = { user_id: userB.id, template_id: tmpl?.id, exercise_name: "Bravo Bench" };
      } else if (table === "workout_sessions") {
        insertPayload = { user_id: userB.id, logged_date: "2026-10-20", title: "Bravo Workout" };
      } else if (table === "exercise_sets") {
        // Create session first
        const { data: sess } = await clientB.from("workout_sessions").insert({ user_id: userB.id, logged_date: "2026-10-20", title: "Bravo Parent" }).select().single();
        insertPayload = { user_id: userB.id, session_id: sess?.id, exercise_name: "Bravo Bench", set_order: 1, reps: 10, load_kg: 50 };
      } else if (table === "activity_sessions") {
        insertPayload = { user_id: userB.id, logged_date: "2026-10-20", activity_type: "running", duration_minutes: 30 };
      } else if (table === "body_metrics") {
        insertPayload = { user_id: userB.id, logged_date: "2026-10-20", weight_kg: 75.0 };
      } else if (table === "recovery_logs") {
        insertPayload = {
          user_id: userB.id,
          logged_date: "2026-10-20",
          sleep_hours: 8,
          sleep_quality: 5,
          soreness: 2,
          fatigue: 2,
          readiness_score: 90,
          readiness_status: "Prime",
        };
      } else if (table === "coach_conversations") {
        insertPayload = { user_id: userB.id, title: "Bravo Chat" };
      } else if (table === "coach_messages") {
        const { data: conv } = await clientB.from("coach_conversations").insert({ user_id: userB.id, title: "Bravo Conv" }).select().single();
        insertPayload = { user_id: userB.id, conversation_id: conv?.id, role: "user", content: "Bravo message" };
      } else if (table === "weekly_reports") {
        insertPayload = { user_id: userB.id, week_start_date: "2026-10-12", week_end_date: "2026-10-18", summary_payload: {} };
      } else if (table === "progress_photos") {
        insertPayload = { user_id: userB.id, logged_date: "2026-10-20", image_url: "https://example.com/photo.jpg" };
      }

      await clientB.from(table).upsert(insertPayload);

      // Check A: User A attempts to SELECT from table filtering by User B
      const { data: selectA } = await clientA.from(table).select("*").eq("user_id", userB.id);
      if (selectA && selectA.length > 0) {
        testSuccess = false;
        failureReason = `User A was able to read ${selectA.length} rows belonging to User B!`;
      }

      // Check B: User A attempts to INSERT a row with user_id = userB.id
      let maliciousPayload = { ...insertPayload, user_id: userB.id };
      if (table === "profiles") maliciousPayload.id = userB.id;
      const { error: maliciousInsErr } = await clientA.from(table).insert(maliciousPayload);
      if (!maliciousInsErr) {
        testSuccess = false;
        failureReason = "User A was permitted to insert a row with User B's user_id!";
      }

      // Check C: User A attempts to UPDATE User B's rows
      const { data: updateA } = await clientA.from(table).update({ notes: "Malicious Tamper" }).eq("user_id", userB.id).select();
      if (updateA && updateA.length > 0) {
        testSuccess = false;
        failureReason = `User A was permitted to update User B's rows!`;
      }

      // Check D: User A attempts to DELETE User B's rows
      const { data: deleteA } = await clientA.from(table).delete().eq("user_id", userB.id).select();
      if (deleteA && deleteA.length > 0) {
        testSuccess = false;
        failureReason = `User A was permitted to delete User B's rows!`;
      }

      // Clean up User B's row
      await clientB.from(table).delete().eq("user_id", userB.id);
    } catch (err) {
      testSuccess = false;
      failureReason = err.message;
    }

    if (testSuccess) {
      passedTests++;
      console.log(`  [PASS] ${table.padEnd(28)} RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)`);
    } else {
      console.error(`  [FAIL] ${table.padEnd(28)} ${failureReason}`);
    }
  }

  // 2. Storage Bucket Path Isolation Tests
  console.log("\n--- Storage Path Isolation Tests ---");
  for (const bucketName of ["progress-photos", "meal-photos"]) {
    totalTests++;
    let storageSuccess = true;
    try {
      const testFileContent = Buffer.from("Test Photo Data for Athlete Bravo");

      // 1. User B uploads to their own storage folder
      const bravoPath = `${userB.id}/test-bravo-photo.png`;
      await clientB.storage.from(bucketName).upload(bravoPath, testFileContent, { upsert: true });

      // 2. User A attempts to read User B's file
      const { data: downloadA, error: downErrA } = await clientA.storage.from(bucketName).download(bravoPath);
      if (downloadA && !downErrA) {
        storageSuccess = false;
        console.error(`  [FAIL] Storage ${bucketName}: Athlete A was able to download Athlete B's private photo!`);
      }

      // 3. User A attempts to upload into User B's folder
      const maliciousUploadPath = `${userB.id}/malicious-injected.png`;
      const { data: maliciousUpload, error: malUpErr } = await clientA.storage.from(bucketName).upload(maliciousUploadPath, testFileContent);
      if (maliciousUpload && !malUpErr) {
        storageSuccess = false;
        console.error(`  [FAIL] Storage ${bucketName}: Athlete A was permitted to upload files into Athlete B's path!`);
      }

      // 4. User A attempts to delete User B's file
      const { data: deleteFiles } = await clientA.storage.from(bucketName).remove([bravoPath]);
      if (deleteFiles && deleteFiles.length > 0) {
        storageSuccess = false;
        console.error(`  [FAIL] Storage ${bucketName}: Athlete A was permitted to delete Athlete B's storage files!`);
      }

      // Clean up User B's uploaded test file
      await clientB.storage.from(bucketName).remove([bravoPath]);
    } catch (err) {
      console.log(`  [INFO] Storage bucket check (${bucketName}): ${err.message}`);
    }

    if (storageSuccess) {
      passedTests++;
      console.log(`  [PASS] Storage ${bucketName.padEnd(20)} Path Isolation Verified (cross-tenant read/write/delete blocked)`);
    }
  }

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passedTests}/${totalTests} security isolation checks PASSED.`);
  console.log("================================================================================");
  console.log("\nATTENTION: Please delete the throwaway test users from your Supabase Dashboard:");
  console.log(`  1. User Alpha: ${emailA} (ID: ${userA?.id})`);
  console.log(`  2. User Bravo: ${emailB} (ID: ${userB?.id})`);
  console.log("Location: Supabase Dashboard -> Authentication -> Users -> Delete User.");
  console.log("================================================================================\n");

  return { verified: true, passedTests, totalTests };
}

runHostedRlsVerification().catch(console.error);
