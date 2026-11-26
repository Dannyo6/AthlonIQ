import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { CountUp } from "@/components/ui/CountUp";
import { ClickSpark } from "@/components/ui/ClickSpark";
import { Card } from "@/components/ui/Card";
import { NutritionTotalsHeader } from "@/features/nutrition/components/NutritionTotalsHeader";
import { ReadinessStrip } from "@/features/dashboard/components/ReadinessStrip";
import { WorkoutActiveSession } from "@/features/workouts/components/WorkoutActiveSession";
import { CandidateReviewForm } from "@/features/nutrition/components/CandidateReviewForm";
import { WorkoutPersonalRecords } from "@/features/workouts/components/WorkoutPersonalRecords";

const testDir = path.dirname(fileURLToPath(import.meta.url));

function createMatchMediaMock(initialMatches: boolean) {
  let currentMatches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mql = {
    get matches() {
      return currentMatches;
    },
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
      if (event === "change") listeners.add(cb);
    }),
    removeEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
      if (event === "change") listeners.delete(cb);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };

  window.matchMedia = vi.fn().mockImplementation(() => mql);

  return {
    mql,
    setMatches(next: boolean) {
      currentMatches = next;
      const evt = { matches: next, media: "(prefers-reduced-motion: reduce)" } as MediaQueryListEvent;
      listeners.forEach((cb) => cb(evt));
    },
    listenerCount: () => listeners.size,
  };
}

const HookProbe: React.FC = () => {
  const prefersReduced = usePrefersReducedMotion();
  return <span data-testid="reduced-motion-state">{prefersReduced ? "reduced" : "motion"}</span>;
};

describe("UI-8A Motion, Micro-Interactions & Palette Baseline", () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Step 1: JSDOM animation/observer stubs", () => {
    it("provides ResizeObserver, IntersectionObserver, and Element.prototype.animate stubs", () => {
      const ro = new ResizeObserver(() => {});
      ro.observe(document.body);
      ro.disconnect();

      const io = new IntersectionObserver(() => {});
      io.observe(document.body);
      expect(io.takeRecords()).toEqual([]);
      io.disconnect();

      const el = document.createElement("div");
      expect(typeof el.animate).toBe("function");
      const anim = el.animate([], { duration: 100 });
      expect(typeof anim.cancel).toBe("function");
    });
  });

  describe("Step 2: usePrefersReducedMotion & global reduced-motion CSS", () => {
    it("reflects initial match state and subscribes/cleans up on live change events", () => {
      const mm = createMatchMediaMock(false);
      const { unmount } = render(<HookProbe />);

      expect(screen.getByTestId("reduced-motion-state")).toHaveTextContent("motion");
      expect(mm.listenerCount()).toBe(1);

      act(() => {
        mm.setMatches(true);
      });
      expect(screen.getByTestId("reduced-motion-state")).toHaveTextContent("reduced");

      act(() => {
        mm.setMatches(false);
      });
      expect(screen.getByTestId("reduced-motion-state")).toHaveTextContent("motion");

      unmount();
      expect(mm.mql.removeEventListener).toHaveBeenCalledTimes(1);
      expect(mm.listenerCount()).toBe(0);
    });

    it("initializes as true when media query matches initially", () => {
      createMatchMediaMock(true);
      render(<HookProbe />);
      expect(screen.getByTestId("reduced-motion-state")).toHaveTextContent("reduced");
    });

    it("defines global prefers-reduced-motion rules disabling animate-pulse and scroll-behavior", () => {
      const cssPath = path.resolve(testDir, "../styles/globals.css");
      const css = fs.readFileSync(cssPath, "utf8");
      expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
      expect(css).toContain(".animate-pulse");
      expect(css).toContain("scroll-behavior: auto");
      expect(css).toContain("transition-duration");
    });
  });

  describe("Step 3: CountUp component (< 60 lines) & wiring", () => {
    it("keeps CountUp.tsx strictly under 60 lines", () => {
      const countUpPath = path.resolve(testDir, "../components/ui/CountUp.tsx");
      const lineCount = fs.readFileSync(countUpPath, "utf8").split(/\r?\n/).length;
      expect(lineCount).toBeLessThan(60);
    });

    it("renders exact final formatted value immediately on initial paint with aria-label and tabular-nums", () => {
      createMatchMediaMock(false);
      render(<CountUp value={1845} prefix="+" suffix=" kcal" />);
      const el = screen.getByLabelText("+1845 kcal");
      expect(el).toHaveTextContent("+1845 kcal");
      expect(el.className).toContain("tabular-nums");
    });

    it("formats decimals accurately on first paint", () => {
      createMatchMediaMock(false);
      render(<CountUp value={82.456} decimals={1} suffix="%" />);
      const el = screen.getByLabelText("82.5%");
      expect(el).toHaveTextContent("82.5%");
      expect(el.className).toContain("tabular-nums");
    });

    it("renders 'Not set' (or fallback) for null or non-finite values without rAF", () => {
      createMatchMediaMock(false);
      const rafSpy = vi.spyOn(window, "requestAnimationFrame");
      const { rerender } = render(<CountUp value={null} />);
      expect(screen.getByText("Not set").className).toContain("tabular-nums");

      rerender(<CountUp value={Number.NaN} fallback="Unset" />);
      expect(screen.getByText("Unset")).toBeInTheDocument();

      rerender(<CountUp value={Number.POSITIVE_INFINITY} />);
      expect(screen.getByText("Not set")).toBeInTheDocument();
      expect(rafSpy).not.toHaveBeenCalled();
    });

    it("updates statically without rAF when prefers-reduced-motion is enabled", () => {
      createMatchMediaMock(true);
      const rafSpy = vi.spyOn(window, "requestAnimationFrame");
      const { rerender } = render(<CountUp value={100} suffix=" kg" />);
      rerender(<CountUp value={125} suffix=" kg" />);
      expect(screen.getByLabelText("125 kg")).toHaveTextContent("125 kg");
      expect(rafSpy).not.toHaveBeenCalled();
    });

    it("wires CountUp onto NutritionTotalsHeader confirmed totals only", () => {
      createMatchMediaMock(false);
      render(
        <MemoryRouter>
          <NutritionTotalsHeader
            confirmedTotals={{
              caloriesKcal: 420,
              proteinG: 32,
              carbsG: 48,
              fatG: 12,
              entryCount: 2,
            }}
            unconfirmedCalories={150}
            unconfirmedCount={1}
            calorieTargetKcal={null}
            proteinTargetG={140}
            proteinMinG={120}
            proteinMaxG={155}
            carbsTargetG={null}
            fatTargetG={null}
          />
        </MemoryRouter>
      );

      expect(screen.getByText("420 kcal logged")).toBeInTheDocument();
      expect(screen.getByLabelText("420 kcal logged")).toHaveTextContent("420 kcal logged");
      expect(screen.getByLabelText("32 / 140 g")).toHaveTextContent("32 / 140 g");
      expect(screen.getByLabelText("48 g logged")).toHaveTextContent("48 g logged");
      expect(screen.getByLabelText("12 g logged")).toHaveTextContent("12 g logged");
    });

    it("wires CountUp onto ReadinessStrip score and preserves 'No check-in yet' when unlogged", () => {
      createMatchMediaMock(false);
      const { rerender } = render(
        <MemoryRouter>
          <ReadinessStrip
            hasTodayCheckIn={false}
            readiness={null}
            todayCheckIn={{ sleepHours: 8, sleepQuality: 4, soreness: 2, fatigue: 2 }}
            onSubmitCheckIn={vi.fn()}
          />
        </MemoryRouter>
      );
      expect(screen.getByText("No check-in yet")).toBeInTheDocument();

      rerender(
        <MemoryRouter>
          <ReadinessStrip
            hasTodayCheckIn={true}
            readiness={{
              readinessScore: 84,
              status: "Prime",
              guidance: "Push compound progression.",
              triggers: [],
              provenance: "calculated_estimate",
            }}
            todayCheckIn={{ sleepHours: 8, sleepQuality: 4, soreness: 2, fatigue: 2 }}
            onSubmitCheckIn={vi.fn()}
          />
        </MemoryRouter>
      );

      expect(screen.getByLabelText("84% (Prime)")).toHaveTextContent("84% (Prime)");
      expect(screen.getByText(/84% \(Prime\)/)).toBeInTheDocument();
    });
  });

  describe("Step 4: ClickSpark component (< 60 lines) & wiring", () => {
    it("keeps ClickSpark.tsx strictly under 60 lines", () => {
      const sparkPath = path.resolve(testDir, "../components/ui/ClickSpark.tsx");
      const lineCount = fs.readFileSync(sparkPath, "utf8").split(/\r?\n/).length;
      expect(lineCount).toBeLessThan(60);
    });

    it("fires child onClick exactly once per click and emits 6 pointer-events-none lime particles cleared after 350ms", () => {
      vi.useFakeTimers();
      createMatchMediaMock(false);
      const handleClick = vi.fn();

      render(
        <ClickSpark>
          <button type="button" onClick={handleClick} className="min-h-[44px]">
            Confirm Action
          </button>
        </ClickSpark>
      );

      const btn = screen.getByRole("button", { name: "Confirm Action" });
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);

      const burst = screen.getByTestId("click-spark-burst");
      expect(burst.className).toContain("pointer-events-none");
      const particles = screen.getAllByTestId("click-spark-particle");
      expect(particles).toHaveLength(6);

      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(2);

      act(() => {
        vi.advanceTimersByTime(360);
      });
      expect(screen.queryAllByTestId("click-spark-particle")).toHaveLength(0);
    });

    it("does not emit sparks under prefers-reduced-motion while preserving single child onClick", () => {
      createMatchMediaMock(true);
      const handleClick = vi.fn();

      render(
        <ClickSpark>
          <button type="button" onClick={handleClick}>
            Reduced Confirm
          </button>
        </ClickSpark>
      );

      fireEvent.click(screen.getByRole("button", { name: "Reduced Confirm" }));
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(screen.queryAllByTestId("click-spark-particle")).toHaveLength(0);
    });

    it("wires ClickSpark onto WorkoutActiveSession complete-set action, CandidateReviewForm confirm button, and WorkoutPersonalRecords PR badge", () => {
      createMatchMediaMock(false);
      const onUpdateSet = vi.fn();

      render(
        <WorkoutActiveSession
          sessionTitle="Upper A"
          onSessionTitleChange={vi.fn()}
          sessionStartTime={null}
          sessionExercises={[
            {
              id: "ex-1",
              exerciseName: "Barbell Bench Press",
              category: "push",
              equipmentKey: "barbell",
              targetSets: 1,
              targetRepsMin: 6,
              targetRepsMax: 8,
              restSeconds: 90,
              sortOrder: 0,
              sets: [
                {
                  id: "s-1",
                  exerciseName: "Barbell Bench Press",
                  setOrder: 1,
                  reps: 8,
                  loadKg: 60,
                  isBodyweight: false,
                  rpe: 8,
                  rir: 2,
                  isCompleted: false,
                  isPr: false,
                },
              ],
            },
          ]}
          sessionRpe={null}
          onSessionRpeChange={vi.fn()}
          sessionNotes=""
          onSessionNotesChange={vi.fn()}
          restTimer={0}
          restRunning={false}
          restPreset={90}
          onStartRestTimer={vi.fn()}
          onAdjustRestTimer={vi.fn()}
          onToggleRestRunning={vi.fn()}
          onResetRestTimer={vi.fn()}
          onSelectRestPreset={vi.fn()}
          onAddSet={vi.fn()}
          onUpdateSet={onUpdateSet}
          onRemoveSet={vi.fn()}
          onFinishSession={vi.fn()}
          onBrowseTemplates={vi.fn()}
          equipment={[]}
          profile={{}}
        />
      );

      const checkbox = screen.getByLabelText("Set completed");
      fireEvent.click(checkbox);
      expect(onUpdateSet).toHaveBeenCalledTimes(1);
      expect(screen.getAllByTestId("click-spark-particle")).toHaveLength(6);

      const onConfirm = vi.fn();
      render(
        <CandidateReviewForm
          candidates={[
            {
              id: "c1",
              food_name: "Oats",
              estimated_serving: "1 bowl",
              serving_label: "1 bowl",
              quantity: 1,
              calories_kcal: 300,
              protein_g: 10,
              carbs_g: 50,
              fat_g: 6,
              confidence: "high",
              provenance: "ai_estimated",
              is_confirmed: false,
            },
          ]}
          previewUrl={null}
          selectedDate="2026-11-26"
          selectedSlot="breakfast"
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      );
      const confirmBtn = screen.getByRole("button", { name: /Confirm & Log/i });
      fireEvent.click(confirmBtn);
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(screen.getAllByTestId("click-spark-particle").length).toBeGreaterThanOrEqual(6);

      render(
        <WorkoutPersonalRecords
          workoutSessions={[
            {
              id: "w1",
              loggedDate: "2026-11-26",
              title: "Upper A",
              completed: true,
              sets: [
                {
                  id: "s1",
                  exerciseName: "Barbell Bench Press",
                  setOrder: 1,
                  reps: 5,
                  loadKg: 100,
                  isBodyweight: false,
                  rpe: 8,
                  rir: 2,
                  isCompleted: true,
                  isPr: true,
                },
              ],
            },
          ]}
        />
      );
      const prBadge = screen.getByText("1 PR");
      fireEvent.click(prBadge);
      expect(screen.getAllByTestId("click-spark-particle").length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("Step 5: Card spotlight & complete cyan removal", () => {
    it("renders Card with optional spotlight prop updating CSS vars without inline colors", () => {
      const { rerender } = render(<Card data-testid="card">Default</Card>);
      expect(screen.getByTestId("card").className).not.toContain("card-spotlight");

      rerender(
        <Card spotlight data-testid="card">
          Spot
        </Card>
      );
      const spotCard = screen.getByTestId("card");
      expect(spotCard.className).toContain("card-spotlight");

      fireEvent.mouseMove(spotCard, { clientX: 42, clientY: 24 });
      expect(spotCard.style.getPropertyValue("--card-spot-x")).toBe("42px");
      expect(spotCard.style.getPropertyValue("--card-spot-y")).toBe("24px");

      const cssPath = path.resolve(testDir, "../styles/globals.css");
      const css = fs.readFileSync(cssPath, "utf8");
      expect(css).toContain("--card-spot-x");
      expect(css).toContain("--card-spot-y");
      expect(css).toMatch(/@media\s*\(\s*hover:\s*hover\s*\)\s*and\s*\(\s*pointer:\s*fine\s*\)/);
    });

    it("removes all cyan references from web/src and AGENTS.md", () => {
      const srcRoot = path.resolve(testDir, "..");
      const offenders: string[] = [];

      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name === "test") continue;
            walk(full);
          } else if (/\.(ts|tsx|css)$/.test(entry.name)) {
            const text = fs.readFileSync(full, "utf8");
            if (/\bcyan\b|bg-cyan|text-cyan|glow="cyan"/i.test(text)) {
              offenders.push(path.relative(srcRoot, full));
            }
          }
        }
      };
      walk(srcRoot);

      const agentsPath = path.resolve(testDir, "../../../AGENTS.md");
      const agentsText = fs.readFileSync(agentsPath, "utf8");
      if (/\bcyan\b/i.test(agentsText)) {
        offenders.push("AGENTS.md");
      }

      expect(offenders).toEqual([]);
    });
  });
});
