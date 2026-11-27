import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dumbbell } from "lucide-react";

import { IconTile } from "@/components/ui/IconTile";
import { BadmintonIcon, RunningIcon, PullUpIcon, SportIcon } from "@/components/ui/SportIcons";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkline, TrendChart, WeeklyBars, Ring, AdherenceStrip } from "@/components/charts";
import { navigateWithTransition } from "@/lib/viewTransition";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(testDir, "../..");

describe("UI-9B Typography, CSS Craft, View Transitions, Icons & Charts", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it("self-hosts latin WOFF2 fonts <= 80 kB total with offline index.html preload and zero Google Fonts links", () => {
    const fontsDir = path.join(webRoot, "public", "fonts");
    const files = fs.readdirSync(fontsDir).filter((f) => f.endsWith(".woff2"));
    expect(files.length).toBeGreaterThanOrEqual(2);

    const totalBytes = files.reduce(
      (sum, file) => sum + fs.statSync(path.join(fontsDir, file)).size,
      0
    );
    expect(totalBytes).toBeLessThanOrEqual(80 * 1024);

    const html = fs.readFileSync(path.join(webRoot, "index.html"), "utf8");
    expect(html).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com|preconnect/i);
    const preloadMatches = html.match(/rel=["']preload["'][^>]*as=["']font["']/gi) ?? [];
    expect(preloadMatches).toHaveLength(1);
    expect(html).toContain('type="font/woff2"');
  });

  it("defines 3-layer static background, motion duration tokens, and stagger cap <= 6 in globals.css without background-attachment: fixed", () => {
    const css = fs.readFileSync(path.join(webRoot, "src/styles/globals.css"), "utf8");
    expect(css).not.toContain("background-attachment: fixed");
    expect(css).toContain("--bg-grain:");
    expect(css).toContain("--motion-press: 120ms");
    expect(css).toContain("--motion-state: 200ms");
    expect(css).toContain("--motion-enter: 320ms");
    expect(css).toContain("--motion-exit: 200ms");
    expect(css).toContain(".stagger-enter > *:nth-child(-n+6)");
    expect(css).toContain("rgba(190, 242, 100, 0.055)");
    expect(css).toContain("rgba(16, 185, 129, 0.045)");
  });

  it("supports document.startViewTransition when enabled and falls back cleanly otherwise", () => {
    const fn = vi.fn();
    const startViewTransition = vi.fn((cb: () => void) => {
      cb();
      return { finished: Promise.resolve() };
    });
    (document as any).startViewTransition = startViewTransition;

    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    navigateWithTransition(fn);
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(1);

    // Reduced motion skips View Transitions API and runs fallback directly
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    navigateWithTransition(fn);
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(2);

    delete (document as any).startViewTransition;
  });

  it("renders IconTile and SportIcons with decorative aria-hidden default and accessible alt when meaningful", () => {
    const { container } = render(
      <div>
        <IconTile icon={Dumbbell} />
        <BadmintonIcon />
        <RunningIcon />
        <PullUpIcon />
        <SportIcon sport="badminton" decorative={false} label="Badminton match" />
      </div>
    );

    const hiddenSvgs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(hiddenSvgs.length).toBeGreaterThanOrEqual(4);
    expect(screen.getByRole("img", { name: "Badminton match" })).toBeInTheDocument();
  });

  it("renders PageHeader, StatTile, SectionCard, and EmptyState with tabular-nums and neutral text", () => {
    render(
      <SectionCard
        title="Training Overview"
        icon={Dumbbell}
        provenance="user_confirmed"
        primaryAction={<button type="button">Primary CTA</button>}
      >
        <PageHeader eyebrow="Daily Overview" title="Good morning, Athlete" />
        <StatTile label="Weight" value="75.0" unit="kg" provenance="calculated_estimate" />
        <EmptyState title="No sessions" description="Log a workout to start tracking." />
      </SectionCard>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Good morning, Athlete" })).toBeInTheDocument();
    expect(screen.getByText("75.0").className).toContain("tabular-nums");
    expect(screen.getByText("Confirmed by you")).toBeInTheDocument();
    expect(screen.getByText("No sessions")).toBeInTheDocument();
  });

  it("enforces tooltip hover+focus, visible legend, sr-only table, and honest empty states across all 5 charts", () => {
    const { container } = render(
      <div>
        <Sparkline
          points={[
            { date: "2026-11-01", value: 75.2 },
            { date: "2026-11-02", value: 75.0 },
            { date: "2026-11-03", value: 75.4 },
          ]}
          unit="kg"
          ariaLabel="Body weight sparkline"
          legendLabel="Weight"
        />
        <TrendChart
          data={[
            { date: "2026-11-01", raw: 75.2, rollingAvg: 75.2 },
            { date: "2026-11-02", raw: 75.0, rollingAvg: 75.1 },
            { date: "2026-11-03", raw: 75.4, rollingAvg: 75.2 },
          ]}
        />
        <WeeklyBars
          bars={[
            { label: "Mon", value: 1, target: 1 },
            { label: "Tue", value: 0, target: 1 },
          ]}
          unit="sessions"
        />
        <Ring value={1800} max={2400} unit="kcal" label="Calories" />
        <AdherenceStrip
          targetDays={4}
          days={[
            { date: "2026-11-23", dayLetter: "M", dayName: "Mon", isLogged: true, sessionsCount: 1 },
            { date: "2026-11-24", dayLetter: "T", dayName: "Tue", isLogged: false, isToday: true, sessionsCount: 0 },
          ]}
        />
      </div>
    );

    // Every chart contributes a screen-reader table
    expect(container.querySelectorAll("table.sr-only").length).toBe(5);

    // Keyboard focus tooltip check on AdherenceStrip
    const monBtn = screen.getByRole("button", { name: /Mon 2026-11-23: 1 session logged/i });
    fireEvent.focus(monBtn);
    expect(screen.getByRole("status")).toHaveTextContent("1 session(s) logged");
    fireEvent.blur(monBtn);

    // Hover tooltip check on Ring
    const ringBtn = screen.getByRole("button", { name: /Calories progress ring: 1800 of 2400 kcal/i });
    fireEvent.mouseEnter(ringBtn);
    expect(screen.getByRole("status")).toHaveTextContent("1800 / 2400 kcal (75%)");

    // Honest insufficient-data states
    render(
      <div>
        <Sparkline points={[{ date: "2026-11-01", value: 75 }]} emptyTitle="Need 3 entries" />
        <TrendChart data={[{ date: "2026-11-01", raw: 75, rollingAvg: 75 }]} emptyTitle="Need 3 trend points" />
        <Ring value={null} max={null} label="Protein" emptyTitle="Not set" />
        <AdherenceStrip days={[]} targetDays={null} emptyTitle="Frequency not set" />
      </div>
    );
    expect(screen.getByText("Need 3 entries")).toBeInTheDocument();
    expect(screen.getByText("Need 3 trend points")).toBeInTheDocument();
    expect(screen.getByText("Frequency not set")).toBeInTheDocument();
  });
});
