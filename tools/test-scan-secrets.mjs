#!/usr/bin/env node
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scanSecretsScript = path.resolve(__dirname, 'scan-secrets.mjs');

console.log('--- Starting scan-secrets unit verification ---');

// Create isolated temporary git repository
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'athloniq-scan-test-'));

try {
  const runGit = (cmd) => execSync(cmd, { cwd: tempDir, encoding: 'utf8', stdio: 'pipe' });

  runGit('git init');
  runGit('git config user.name "Test Runner"');
  runGit('git config user.email "test@athloniq.local"');

  // =========================================================================
  // 1. Clean repo test: assert exit 0 and .env.example is allowed
  // =========================================================================
  fs.writeFileSync(
    path.join(tempDir, '.env.example'),
    [
      '# Clean environment template',
      'SUPABASE_URL=https://example.supabase.co',
      'SUPABASE_ANON_KEY=your-supabase-anon-key',
      'SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key',
      'SUPABASE_JWT_SECRET=your-supabase-jwt-secret',
    ].join('\n') + '\n'
  );

  fs.writeFileSync(
    path.join(tempDir, 'clean-app.ts'),
    [
      '// Normal clean source file',
      'export const APP_NAME = "AthlonIQ";',
      'export type UserRole = "anon" | "authenticated" | "service_role";',
      'console.log("Database role:", "service_role");',
    ].join('\n') + '\n'
  );

  runGit('git add .env.example clean-app.ts');
  runGit('git commit -m "chore: initial clean files"');

  const cleanRun = spawnSync(process.execPath, [scanSecretsScript], {
    cwd: tempDir,
    encoding: 'utf8',
  });

  assert.strictEqual(
    cleanRun.status,
    0,
    `Expected clean repo to exit 0, got status ${cleanRun.status}. Stderr: ${cleanRun.stderr}`
  );
  assert(
    cleanRun.stdout.includes('Secrets scan clean'),
    `Expected success message in output. Got: ${cleanRun.stdout}`
  );
  assert(
    cleanRun.stdout.includes('0 violations'),
    `Expected 0 violations reported. Got: ${cleanRun.stdout}`
  );
  console.log('✓ Test 1 Passed: Clean repo exits 0 and .env.example is permitted.');

  // =========================================================================
  // 2. Dirty repo test: fake sb_secret_, JWT-shaped string, service_role key, .env.production
  // =========================================================================
  // Construct fixtures at runtime so this test file contains no static secret literals
  const FAKE_SB_SECRET = ['sb', 'secret', 'fakeSecretToken9876543210'].join('_');
  const fakeHdr = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const fakePayload = Buffer.from(JSON.stringify({ sub: '1234567890' })).toString('base64url');
  const fakeSig = 'dozjgNryP4J_HQStupm18eL4g8k';
  const FAKE_JWT = `${fakeHdr}.${fakePayload}.${fakeSig}`;
  const fakeSvcToken = 'super_secret_production_service_role_key_value_999';

  // File with sb_secret_
  fs.writeFileSync(
    path.join(tempDir, 'fixture-sb-secret.txt'),
    `line 1: safe\nline 2: ${FAKE_SB_SECRET}\nline 3: safe\n`
  );

  // File with JWT-shaped string
  fs.writeFileSync(
    path.join(tempDir, 'fixture-jwt.js'),
    `const testAuthToken = "${FAKE_JWT}";\n`
  );

  // File with service_role assignment
  const serviceRoleVar = ['SUPABASE', 'SERVICE', 'ROLE', 'KEY'].join('_');
  fs.writeFileSync(
    path.join(tempDir, 'fixture-service-role.py'),
    `${serviceRoleVar} = "${fakeSvcToken}"\n`
  );

  // File named .env.production
  fs.writeFileSync(
    path.join(tempDir, '.env.production'),
    'DATABASE_URL=postgresql://postgres:secretpassword@localhost:5432/prod\n'
  );

  runGit('git add -f fixture-sb-secret.txt fixture-jwt.js fixture-service-role.py .env.production');
  runGit('git commit -m "test: commit forbidden secret fixtures"');

  const dirtyRun = spawnSync(process.execPath, [scanSecretsScript], {
    cwd: tempDir,
    encoding: 'utf8',
  });

  // Must exit with code 1
  assert.strictEqual(
    dirtyRun.status,
    1,
    `Expected dirty repo to exit 1, got status ${dirtyRun.status}`
  );

  const lines = dirtyRun.stdout.trim().split(/\r?\n/).filter(Boolean);

  // Every printed line MUST match file:line only (never the secret value or line content)
  const fileLinePattern = /^[^:\s]+:\d+$/;
  for (const line of lines) {
    assert(
      fileLinePattern.test(line),
      `Expected output to be strictly "file:line", but got: "${line}"`
    );
  }

  // Assert expected hits are present
  assert(
    lines.includes('fixture-sb-secret.txt:2'),
    'Expected violation hit for fixture-sb-secret.txt:2'
  );
  assert(
    lines.includes('fixture-jwt.js:1'),
    'Expected violation hit for fixture-jwt.js:1'
  );
  assert(
    lines.includes('fixture-service-role.py:1'),
    'Expected violation hit for fixture-service-role.py:1'
  );
  assert(
    lines.includes('.env.production:1'),
    'Expected violation hit for .env.production:1'
  );

  // Assert secret values are NEVER printed or leaked in stdout or stderr
  const combinedOutput = dirtyRun.stdout + dirtyRun.stderr;
  assert(!combinedOutput.includes(FAKE_SB_SECRET), 'LEAK: fake sb_secret_ appeared in output!');
  assert(!combinedOutput.includes(FAKE_JWT), 'LEAK: fake JWT appeared in output!');
  assert(!combinedOutput.includes(fakeSvcToken), 'LEAK: service_role key appeared in output!');
  assert(!combinedOutput.includes('secretpassword'), 'LEAK: .env.production content appeared in output!');

  console.log('✓ Test 2 Passed: Dirty repo exits 1, prints file:line only, and never leaks secret values.');
  console.log('--- All scan-secrets tests passed successfully ---');
} finally {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (err) {
    // Ignore cleanup errors
  }
}

