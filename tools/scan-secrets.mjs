#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Known binary extensions to skip content reading
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp',
  '.svg', '.woff', '.woff2', '.ttf', '.eot', '.pdf',
  '.zip', '.tar', '.gz', '.exe', '.dll', '.so', '.dylib'
]);

// Secret pattern matchers:
// 1. sb_secret_ prefix
// 2. JWT-like strings (three base64url segments, starting with eyJ)
// 3. service_role key assignments (excluding safe placeholders)
const PATTERNS = [
  {
    name: 'sb_secret',
    regex: /\bsb_secret_[a-zA-Z0-9_-]+\b/
  },
  {
    name: 'jwt',
    regex: /(?:^|[^a-zA-Z0-9_-])(eyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,})/
  },
  {
    name: 'service_role_key',
    regex: /(?:supabase_)?service_role(?:_key)?\s*[:=]\s*["']?(?!your-|\$|<|placeholder|none|null|""|'')[a-zA-Z0-9_.-]{16,}["']?/i
  }
];

function isBinaryFile(buffer) {
  const checkLength = Math.min(buffer.length, 4096);
  for (let i = 0; i < checkLength; i++) {
    if (buffer[i] === 0) return true;
  }
  return false;
}

function scanTrackedFiles() {
  let output = '';
  try {
    output = execSync('git ls-files', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch (err) {
    console.error('Error: Failed to execute git ls-files');
    process.exit(1);
  }

  const files = output
    .split(/\r?\n/)
    .map((f) => f.trim())
    .filter(Boolean);

  const violations = [];
  let scannedCount = 0;

  for (const rawFile of files) {
    const file = rawFile.replace(/\\/g, '/');
    const baseName = path.basename(file);

    // Rule 1: Flag any .env* file other than .env.example
    const isEnvFile = baseName.startsWith('.env') || /(?:^|\/)\.env(?:[.-]|$)/.test(file);
    if (isEnvFile && baseName !== '.env.example') {
      violations.push(`${file}:1`);
      continue;
    }

    // Skip scanning this script itself to prevent false positives on pattern regexes
    if (file === 'tools/scan-secrets.mjs' || file.endsWith('/scan-secrets.mjs')) {
      continue;
    }

    // Skip binary files
    const ext = path.extname(file).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) {
      continue;
    }

    if (!fs.existsSync(file)) {
      continue;
    }

    let buffer;
    try {
      buffer = fs.readFileSync(file);
    } catch {
      continue;
    }

    if (isBinaryFile(buffer)) {
      continue;
    }

    scannedCount++;
    const text = buffer.toString('utf8');
    const lines = text.split(/\r?\n/);

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const lineNum = idx + 1;

      for (const pattern of PATTERNS) {
        if (pattern.regex.test(line)) {
          violations.push(`${file}:${lineNum}`);
          break; // Avoid duplicate reports for the same line
        }
      }
    }
  }

  if (violations.length > 0) {
    // Print file:line only, never the value
    for (const v of violations) {
      console.log(v);
    }
    process.exit(1);
  }

  console.log(`Secrets scan clean: 0 violations found across ${scannedCount} tracked files.`);
  process.exit(0);
}

scanTrackedFiles();

