import { describe, it, expect } from "vitest";

/**
 * UI-1 Test Suite: Tailwind Token Enforcement & Arbitrary Hex Detector
 *
 * Verifies that:
 * 1. Brand surfaces and high-frequency (3+) colors (#12151e, #181d2a, #1e2330, #090a0f,
 *    #141824, #1e2433, #0c0e15, #232a3b, #a3e635) NEVER appear as arbitrary [#hex] classes.
 * 2. Any arbitrary [#hex] class in non-test source files outside the documented
 *    one-off hex list causes this test to fail.
 */
describe("Tailwind Token & Arbitrary Hex Enforcement (UI-1)", () => {
  // Tokenized brand surfaces and 3+ frequency colors that must NEVER appear as [#hex]
  const FORBIDDEN_TOKENIZED_HEXES = new Set([
    "#1E2330", // athloniq-border
    "#181D2A", // athloniq-surface
    "#12151E", // athloniq-card
    "#141824", // athloniq-card-alt
    "#090A0F", // athloniq-dark
    "#1E2433", // athloniq-surface-alt
    "#0C0E15", // athloniq-dark-nav
    "#232A3B", // athloniq-border-alt
    "#A3E635", // athloniq-lime-hover
  ]);

  // Exact set of leftover one-off hexes preserved per UI-1 specification ("do not guess")
  const DOCUMENTED_LEFTOVER_HEXES = new Set([
    "src/components/ui/Button.tsx:29:#1C2234",
    "src/features/coach/CoachView.tsx:379:#0E121B",
    "src/features/coach/CoachView.tsx:405:#121622",
    "src/features/coach/CoachView.tsx:422:#1A2030",
    "src/features/coach/CoachView.tsx:469:#161B28",
    "src/features/coach/CoachView.tsx:501:#161D2B",
    "src/features/coach/CoachView.tsx:507:#10141E",
    "src/features/coach/CoachView.tsx:523:#10141E",
    "src/features/coach/CoachView.tsx:565:#121622",
    "src/features/coach/CoachView.tsx:574:#131724",
    "src/features/coach/CoachView.tsx:584:#181E2E",
    "src/features/coach/CoachView.tsx:584:#222A40",
    "src/features/coach/CoachView.tsx:593:#0E121B",
    "src/features/coach/CoachView.tsx:673:#141A26",
    "src/features/coach/CoachView.tsx:673:#0E131E",
    "src/features/coach/CoachView.tsx:685:#181F2F",
    "src/features/coach/CoachView.tsx:685:#263148",
    "src/features/coach/CoachView.tsx:878:#10141F",
    "src/features/nutrition/components/MealPhotoUploader.tsx:292:#0F121B",
    "src/features/nutrition/components/MealPhotoUploader.tsx:407:#2A3142",
    "src/features/nutrition/NutritionView.tsx:430:#1A1F2E",
    "src/features/nutrition/NutritionView.tsx:430:#252D42",
    "src/features/profile/ProfileView.tsx:1366:#0E121A",
    "src/features/profile/ProfileView.tsx:1388:#141923",
    "src/features/profile/ProfileView.tsx:1388:#232936",
  ]);

  // Eagerly import all non-test source files as raw text using Vite's glob import
  const rawModules = import.meta.glob<string>("../**/*.{tsx,ts,css}", {
    query: "?raw",
    import: "default",
    eager: true,
  });

  const hexPattern = /\[#([0-9a-fA-F]{3,8})\]/g;

  interface HexOccurrence {
    file: string;
    line: number;
    hex: string;
    rawLine: string;
  }

  function collectAllHexes(): HexOccurrence[] {
    const list: HexOccurrence[] = [];
    for (const [modulePath, content] of Object.entries(rawModules)) {
      // Normalize modulePath: '../app/App.tsx' -> 'src/app/App.tsx'
      const cleanPath = modulePath.replace(/^\.\.\//, "src/");
      if (cleanPath.includes("/test/") || cleanPath.includes(".test.")) {
        continue;
      }

      const lines = content.split("\n");
      lines.forEach((line: string, idx: number) => {
        let match: RegExpExecArray | null;
        while ((match = hexPattern.exec(line)) !== null) {
          list.push({
            file: cleanPath,
            line: idx + 1,
            hex: "#" + match[1].toUpperCase(),
            rawLine: line.trim(),
          });
        }
      });
    }
    return list;
  }

  it("zero tokenized brand surfaces or 3+ frequency colors remain as arbitrary [#hex] classes", () => {
    const allHexes = collectAllHexes();
    const tokenizedViolations = allHexes.filter((occ) => FORBIDDEN_TOKENIZED_HEXES.has(occ.hex));

    if (tokenizedViolations.length > 0) {
      const formatted = tokenizedViolations
        .map((v) => `  ${v.file}:${v.line} (${v.hex}) -> ${v.rawLine}`)
        .join("\n");
      throw new Error(
        `Found ${tokenizedViolations.length} arbitrary [#hex] class(es) that must use Tailwind tokens:\n${formatted}`
      );
    }

    expect(tokenizedViolations).toHaveLength(0);
  });

  it("fails if any non-test source file contains an unauthorized arbitrary [#hex] class", () => {
    const allHexes = collectAllHexes();
    const unauthorizedHexes = allHexes.filter((occ) => {
      const key = `${occ.file}:${occ.line}:${occ.hex}`;
      return !DOCUMENTED_LEFTOVER_HEXES.has(key);
    });

    if (unauthorizedHexes.length > 0) {
      const formatted = unauthorizedHexes
        .map((v) => `  ${v.file}:${v.line} (${v.hex}) -> ${v.rawLine}`)
        .join("\n");
      throw new Error(
        `Found ${unauthorizedHexes.length} unauthorized arbitrary [#hex] class(es) outside the documented one-off list:\n${formatted}`
      );
    }

    expect(unauthorizedHexes).toHaveLength(0);
  });

  it("fails on synthetic arbitrary [#hex] class injection", () => {
    const sampleClass = "bg-[#1E2330] border-[#FF00AA]";
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    const testRegex = /\[#([0-9a-fA-F]{3,8})\]/g;
    while ((m = testRegex.exec(sampleClass)) !== null) {
      matches.push("#" + m[1].toUpperCase());
    }
    expect(matches).toContain("#1E2330");
    expect(matches).toContain("#FF00AA");
  });
});
