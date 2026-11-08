import { describe, it, expect } from "vitest";

/**
 * UI-1 & UI-4 Test Suite: Full-App Tailwind Token & Canonical Palette Enforcement
 *
 * Scans all `.tsx` files under `web/src/features/`, `web/src/components/`, and `web/src/app/`
 * and asserts:
 * 1. Zero arbitrary [#hex] color classes exist anywhere in the UI tree.
 * 2. Zero default Tailwind lime classes (lime-300, lime-400, etc.) exist anywhere in the UI tree.
 *    All lime accents must use canonical tokens (athloniq-lime, athloniq-lime-hover, athloniq-lime/20, etc.).
 */
describe("Tailwind Token, Hex & Default Lime Enforcement (UI-4)", () => {
  // Eagerly import all UI .tsx files as raw text using Vite's glob import
  const uiModules = import.meta.glob<string>(
    ["../features/**/*.tsx", "../components/**/*.tsx", "../app/**/*.tsx"],
    {
      query: "?raw",
      import: "default",
      eager: true,
    }
  );

  const hexPattern = /\[#([0-9a-fA-F]{3,8})\]/g;
  const defaultLimePattern = /\b(bg|text|border|ring|from|to|via|fill|stroke)?-?lime-\d{2,3}\b/g;

  interface ViolationOccurrence {
    file: string;
    line: number;
    match: string;
    rawLine: string;
  }

  function collectHexViolations(): ViolationOccurrence[] {
    const list: ViolationOccurrence[] = [];
    for (const [modulePath, content] of Object.entries(uiModules)) {
      const cleanPath = modulePath.replace(/^\.\.\//, "src/");
      if (cleanPath.includes("/test/") || cleanPath.includes(".test.")) {
        continue;
      }

      const lines = content.split("\n");
      lines.forEach((line: string, idx: number) => {
        let match: RegExpExecArray | null;
        hexPattern.lastIndex = 0;
        while ((match = hexPattern.exec(line)) !== null) {
          list.push({
            file: cleanPath,
            line: idx + 1,
            match: "#" + match[1].toUpperCase(),
            rawLine: line.trim(),
          });
        }
      });
    }
    return list;
  }

  function collectDefaultLimeViolations(): ViolationOccurrence[] {
    const list: ViolationOccurrence[] = [];
    for (const [modulePath, content] of Object.entries(uiModules)) {
      const cleanPath = modulePath.replace(/^\.\.\//, "src/");
      if (cleanPath.includes("/test/") || cleanPath.includes(".test.")) {
        continue;
      }

      const lines = content.split("\n");
      lines.forEach((line: string, idx: number) => {
        let match: RegExpExecArray | null;
        defaultLimePattern.lastIndex = 0;
        while ((match = defaultLimePattern.exec(line)) !== null) {
          list.push({
            file: cleanPath,
            line: idx + 1,
            match: match[0],
            rawLine: line.trim(),
          });
        }
      });
    }
    return list;
  }

  it("asserts zero arbitrary [#hex] classes exist anywhere across the UI component tree", () => {
    const hexViolations = collectHexViolations();

    if (hexViolations.length > 0) {
      const formatted = hexViolations
        .map((v) => `  ${v.file}:${v.line} (${v.match}) -> ${v.rawLine}`)
        .join("\n");
      throw new Error(
        `Found ${hexViolations.length} unauthorized arbitrary [#hex] class(es) in UI tree:\n${formatted}`
      );
    }

    expect(hexViolations).toHaveLength(0);
  });

  it("asserts zero default Tailwind lime-* classes exist anywhere across the UI component tree", () => {
    const limeViolations = collectDefaultLimeViolations();

    if (limeViolations.length > 0) {
      const formatted = limeViolations
        .map((v) => `  ${v.file}:${v.line} (${v.match}) -> ${v.rawLine}`)
        .join("\n");
      throw new Error(
        `Found ${limeViolations.length} unauthorized default lime class(es) in UI tree (use athloniq-lime):\n${formatted}`
      );
    }

    expect(limeViolations).toHaveLength(0);
  });

  it("fails on synthetic arbitrary [#hex] and default lime-* class injection", () => {
    const sampleClass = "bg-[#1E2330] text-lime-400 border-[#FF00AA]";
    const hexMatches: string[] = [];
    let m: RegExpExecArray | null;
    const testHexRegex = /\[#([0-9a-fA-F]{3,8})\]/g;
    while ((m = testHexRegex.exec(sampleClass)) !== null) {
      hexMatches.push("#" + m[1].toUpperCase());
    }
    expect(hexMatches).toContain("#1E2330");
    expect(hexMatches).toContain("#FF00AA");

    const testLimeRegex = /\b(bg|text|border|ring|from|to|via|fill|stroke)?-?lime-\d{2,3}\b/g;
    const limeMatches: string[] = [];
    while ((m = testLimeRegex.exec(sampleClass)) !== null) {
      limeMatches.push(m[0]);
    }
    expect(limeMatches).toContain("text-lime-400");
  });
});
