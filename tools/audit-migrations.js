import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../supabase/migrations");

export async function createStubbedDb() {
  const db = new PGlite();

  // 1. Stub Supabase roles
  await db.exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
      END IF;
    END $$;

    -- Standard Supabase schema grants
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
  `);

  // 2. Stub auth schema & auth.users & auth.uid()
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE,
      raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS UUID AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION auth.role()
    RETURNS TEXT AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.role', true), '')::TEXT;
    $$ LANGUAGE sql STABLE;

    -- Fallback for uuid-ossp if not bundled in pglite wasm
    CREATE OR REPLACE FUNCTION uuid_generate_v4()
    RETURNS UUID AS $$
      SELECT gen_random_uuid();
    $$ LANGUAGE sql;

    GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;
  `);

  // 3. Stub minimal storage schema
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS storage;
    CREATE TABLE IF NOT EXISTS storage.buckets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner UUID REFERENCES auth.users(id),
      public BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS storage.objects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bucket_id TEXT REFERENCES storage.buckets(id),
      name TEXT NOT NULL,
      owner UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'::jsonb
    );
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    CREATE OR REPLACE FUNCTION storage.foldername(name text)
    RETURNS text[] AS $$
      SELECT string_to_array(name, '/');
    $$ LANGUAGE sql IMMUTABLE;

    CREATE OR REPLACE FUNCTION storage.filename(name text)
    RETURNS text AS $$
      SELECT split_part(name, '/', array_length(string_to_array(name, '/'), 1));
    $$ LANGUAGE sql IMMUTABLE;

    GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON TABLES TO anon, authenticated, service_role;
  `);

  return db;
}

async function runAudit() {
  console.log("=== AthlonIQ Migration Audit via PGlite ===");
  const db = await createStubbedDb();

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Found ${migrationFiles.length} migration files in supabase/migrations/:`);
  migrationFiles.forEach((f) => console.log(` - ${f}`));

  // Track tables defined per file
  const tablesPerFile = {};

  for (const file of migrationFiles) {
    console.log(`\n--- Applying ${file} ---`);
    let sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    sql = sql.replace(/CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+"uuid-ossp";?/gi, "-- uuid-ossp stubbed");
    sql = sql.replace(/CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+"pgcrypto";?/gi, "-- pgcrypto stubbed");

    // Extract table names
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
    let match;
    const tablesInThisFile = [];
    while ((match = tableRegex.exec(sql)) !== null) {
      tablesInThisFile.push(match[1].toLowerCase());
    }
    tablesPerFile[file] = tablesInThisFile;
    console.log(`  Declared tables (${tablesInThisFile.length}): ${tablesInThisFile.join(", ")}`);

    try {
      await db.exec(sql);
      console.log(`  ✓ Applied cleanly without fatal syntax error.`);
    } catch (err) {
      console.error(`  ✗ Error applying ${file}:`, err.message);
    }
  }

  // Inspect existing tables and columns in pg_catalog
  const existingTablesRes = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  console.log("\n=== Active Tables in Database after All Migrations ===");
  const tableNames = existingTablesRes.rows.map((r) => r.table_name);
  console.log(tableNames.join(", "));

  // Check columns for each active table
  console.log("\n=== Table Column Summaries ===");
  for (const tbl of tableNames) {
    const colsRes = await db.query(
      `SELECT column_name, data_type, is_nullable, column_default 
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position;`,
      [tbl]
    );
    const colList = colsRes.rows.map((c) => `${c.column_name} (${c.data_type})`).join(", ");
    console.log(`\n[${tbl}] (${colsRes.rows.length} columns):\n  ${colList}`);
  }

  // Check RLS status on all public tables
  const rlsRes = await db.query(`
    SELECT relname, relrowsecurity, relforcerowsecurity 
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY relname;
  `);
  console.log("\n=== Row Level Security (RLS) Status ===");
  rlsRes.rows.forEach((r) => {
    console.log(` - ${r.relname}: RLS=${r.relrowsecurity ? "ENABLED" : "DISABLED"}`);
  });

  // Check policies
  const polRes = await db.query(`
    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);
  console.log(`\n=== Total Policies Defined: ${polRes.rows.length} ===`);
  const polsByTable = {};
  polRes.rows.forEach((p) => {
    polsByTable[p.tablename] = polsByTable[p.tablename] || [];
    polsByTable[p.tablename].push(`${p.cmd}: ${p.policyname} (roles: ${p.roles})`);
  });
  for (const [tbl, pols] of Object.entries(polsByTable)) {
    console.log(`\n[${tbl}] (${pols.length} policies):`);
    pols.forEach((p) => console.log(`   * ${p}`));
  }

  await db.close();
}

if (process.argv[1] && process.argv[1].endsWith("audit-migrations.js")) {
  runAudit().catch((err) => {
    console.error("Audit failed:", err);
    process.exit(1);
  });
}
