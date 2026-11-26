import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

/**
 * UI-8A Budget & Dependency Gate
 *
 * 1. Fails if any package is added to (or removed from) web/package.json dependencies/devDependencies.
 * 2. Fails if web/dist/assets/index-*.js is missing or exceeds 210 KiB (215,040 raw bytes).
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

const MAX_ENTRY_CHUNK_BYTES = 210 * 1024;

describe("UI-8A Dependency & Bundle Size Budget Gate", () => {
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

  it("keeps built entry chunk web/dist/assets/index-*.js under 210 KiB (215,040 bytes)", () => {
    const assetsDir = path.join(webRoot, "dist", "assets");
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

    const byteSize = fs.statSync(path.join(assetsDir, indexChunk)).size;
    expect(byteSize).toBeLessThanOrEqual(MAX_ENTRY_CHUNK_BYTES);
  });
});
