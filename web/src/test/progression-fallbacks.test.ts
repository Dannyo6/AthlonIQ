/**
 * Progression Fallback Guard Tests (Step 3)
 *
 * Verifies that evaluateProgressionSuggestion never returns a numeric
 * progression when equipment is unconfirmed or limits are null.
 * Tests the same logic that WorkoutsView.getProgressionSuggestion uses
 * (after the ?? 70 / ?? 2.5 fallbacks were removed).
 */

import { describe, it, expect } from "vitest";
import { gatedProgressionSuggestion, evaluateProgressionSuggestion } from "@/lib";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseSet = { reps: 10, loadKg: 40, rpe: 8, isBodyweight: false };
const bwSet = { reps: 10, loadKg: 0, rpe: 8, isBodyweight: true };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Progression guard — null limits", () => {
  it("returns confirm_equipment_first when maxLoadKg is null", () => {
    const result = gatedProgressionSuggestion(null, 2.5, true);
    expect(result.action).toBe("confirm_equipment_first");
    expect(result.newLoadKg).toBeUndefined();
    expect(result.explanation).toContain("equipment limits");
  });

  it("returns confirm_equipment_first when minIncrementKg is null", () => {
    const result = gatedProgressionSuggestion(70, null, true);
    expect(result.action).toBe("confirm_equipment_first");
    expect(result.newLoadKg).toBeUndefined();
  });

  it("returns confirm_equipment_first when both limits are null", () => {
    const result = gatedProgressionSuggestion(null, null, true);
    expect(result.action).toBe("confirm_equipment_first");
    expect(result.newLoadKg).toBeUndefined();
  });
});

describe("Progression guard — unconfirmed equipment", () => {
  it("returns confirm_equipment_first when equipmentConfirmed is false, even with valid limits", () => {
    const result = gatedProgressionSuggestion(70, 2.5, false);
    expect(result.action).toBe("confirm_equipment_first");
    expect(result.newLoadKg).toBeUndefined();
  });

  it("evaluateProgressionSuggestion itself gates on unconfirmed", () => {
    const result = evaluateProgressionSuggestion(
      "Overhead Press (BB/DB)",
      [baseSet],
      70,
      2.5,
      false,
      "Prime",
      10
    );
    expect(result.action).toBe("confirm_equipment_first");
    expect(result.newLoadKg).toBeUndefined();
  });
});

describe("Progression guard — confirmed with limits", () => {
  it("returns increase_load when all sets hit targetRepsMax and RPE <= 8.5", () => {
    const sets = [
      { reps: 10, loadKg: 40, rpe: 8, isBodyweight: false },
      { reps: 10, loadKg: 40, rpe: 8, isBodyweight: false },
    ];
    const result = gatedProgressionSuggestion(70, 2.5, true, sets, 10);
    expect(result.action).toBe("increase_load");
    expect(result.newLoadKg).toBe(42.5);
    expect(result.newLoadKg).toBeGreaterThan(40);
    expect(result.newLoadKg).toBeLessThanOrEqual(70);
  });

  it("returns increase_reps_or_tempo at equipment cap", () => {
    const sets = [{ reps: 10, loadKg: 70, rpe: 8, isBodyweight: false }];
    const result = gatedProgressionSuggestion(70, 2.5, true, sets, 10);
    expect(result.action).toBe("increase_reps_or_tempo");
    expect(result.newLoadKg).toBeUndefined();
  });

  it("returns maintain when reps did not hit target", () => {
    const sets = [{ reps: 7, loadKg: 50, rpe: 8, isBodyweight: false }];
    const result = gatedProgressionSuggestion(70, 2.5, true, sets, 10);
    expect(result.action).toBe("maintain");
    expect(result.newLoadKg).toBeUndefined();
  });

  it("returns increase_reps_or_tempo for bodyweight exercises at target reps", () => {
    const sets = [bwSet, bwSet];
    const result = gatedProgressionSuggestion(70, 2.5, true, sets, 10);
    expect(result.action).toBe("increase_reps_or_tempo");
    expect(result.newLoadKg).toBeUndefined();
  });
});
