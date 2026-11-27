import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

/**
 * UI-9B Dependency & Initial-Load Gzip Budget Gate
 *
 * 1. Fails if any package is added to (or removed from) web/package.json dependencies/devDependencies.
 * 2. Fails if total gzipped size of all JS/CSS assets reachable from web/dist/index.html
 *    exceeds MAX_INITIAL_GZIP_BYTES (190 KiB / 194,560 B, calibrated tightly above the 179.2 KiB baseline).
 * 3. Emits a console.warn if raw web/dist/assets/index-*.js exceeds 215,040 bytes.
 * 4. Verifies useAthloniqState.tsx does not eagerly static-import all repos from @/services/repo.
 */
const EXPECTED_DEPENDENCIES = [
  "@hookform/resolvers",
  "@supabase/supabase-js",
  "@tanstack/react-query",
  "clsx",
  "lucide-react",
  "react",
  "react-dom",
  "react-hook-form",
  "react-router-dom",
  "tailwind-merge",
  "zod",
].sort();

const EXPECTED_DEV_DEPENDENCIES = [
  "@testing-library/jest-dom",
  "@testing-library/react",
  "@types/react",
  "@types/react-dom",
  "@vitejs/plugin-react",
  "autoprefixer",
  "jsdom",
  "postcss",
  "tailwindcss",
  "typescript",
  "vite",
  "vite-plugin-pwa",
  "vitest",
].sort();

const RAW_ENTRY_WARN_BYTES = 210 * 1024; // 215,040 bytes
const MAX_INITIAL_GZIP_BYTES = 190 * 1024; // 194,560 bytes

function collectReachableInitialAssets(distDir: string): string[] {
  const htmlPath = path.join(distDir, "index.html");
  if (!fs.existsSync(htmlPath)) {
    throw new Error(
      `Missing build artifact at "${htmlPath}". Run "npm --prefix web run build" before running tests.`
    );
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  const initialRefs = new Set<string>();
  const tagPattern = /(?:src|href)=["']([^"']+\.(?:js|css))["']/gi;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(html)) !== null) {
    initialRefs.add(match[1].replace(/^\//, ""));
  }

  // Also walk static ESM import specifiers from initial JS chunks to ensure completeness
  const queue = [...initialRefs].filter((rel) => rel.endsWith(".js"));
  const visited = new Set<string>(initialRefs);
  const staticImportRe = /\bfrom\s*["'](\.[^"']+\.js)["']/g;

  while (queue.length > 0) {
    const rel = queue.shift()!;
    const full = path.join(distDir, rel);
    if (!fs.existsSync(full)) continue;
    const code = fs.readFileSync(full, "utf8");
    const baseUrl = new URL(rel, "https://dist.local/");
    staticImportRe.lastIndex = 0;
    let imp: RegExpExecArray | null;
    while ((imp = staticImportRe.exec(code)) !== null) {
      const resolved = new URL(imp[1], baseUrl).pathname.replace(/^\//, "");
      if (!visited.has(resolved)) {
        visited.add(resolved);
        queue.push(resolved);
      }
    }
  }

  return [...visited].sort();
}

describe("UI-9B Dependency & Bundle Size Budget Gate", () => {
  const testDir = path.dirname(fileURLToPath(import.meta.url));
  const webRoot = path.resolve(testDir, "../..");

  it("matches exact snapshotted dependencies and devDependencies keys in web/package.json", () => {
    const pkgPath = path.join(webRoot, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const actualDeps = Object.keys(pkg.dependencies ?? {}).sort();
    const actualDevDeps = Object.keys(pkg.devDependencies ?? {}).sort();

    expect(actualDeps).toEqual(EXPECTED_DEPENDENCIES);
    expect(actualDevDeps).toEqual(EXPECTED_DEV_DEPENDENCIES);
  });

  it("avoids eager static barrel import of @/services/repo in useAthloniqState", () => {
    const stateHookPath = path.join(webRoot, "src", "hooks", "useAthloniqState.tsx");
    const source = fs.readFileSync(stateHookPath, "utf8");
    expect(source).not.toMatch(/import\s*\{[\s\S]*?\}\s*from\s*["']@\/services\/repo["']/);
    expect(source).toContain('import("@/services/repo/profilesRepo")');
  });

  it("keeps total initial-load gzipped JS/CSS reachable from web/dist/index.html <= 190 KiB and warns on raw entry > 215,040 B", () => {
    const distDir = path.join(webRoot, "dist");
    const assetsDir = path.join(distDir, "assets");
    if (!fs.existsSync(assetsDir)) {
      throw new Error(
        `Missing build artifacts at "${assetsDir}". Run "npm --prefix web run build" before running tests.`
      );
    }

    const indexChunk = fs
      .readdirSync(assetsDir)
      .find((file) => /^index-.*\.js$/.test(file));

    if (!indexChunk) {
      throw new Error(
        `No entry chunk matching index-*.js found in "${assetsDir}". Run "npm --prefix web run build" first.`
      );
    }

    const rawEntryBytes = fs.statSync(path.join(assetsDir, indexChunk)).size;
    if (rawEntryBytes > RAW_ENTRY_WARN_BYTES) {
      console.warn(
        `[budget-gate] Warning: raw ${indexChunk} is ${rawEntryBytes} bytes (> ${RAW_ENTRY_WARN_BYTES} bytes).`
      );
    }

    const reachableAssets = collectReachableInitialAssets(distDir);
    expect(reachableAssets.length).toBeGreaterThanOrEqual(2);

    const totalGzipBytes = reachableAssets.reduce((sum, rel) => {
      const buf = fs.readFileSync(path.join(distDir, rel));
      return sum + zlib.gzipSync(buf).byteLength;
    }, 0);

    expect(totalGzipBytes).toBeLessThanOrEqual(MAX_INITIAL_GZIP_BYTES);
  });
});
