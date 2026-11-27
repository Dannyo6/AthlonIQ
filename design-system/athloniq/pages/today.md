# Today Page Overrides

> **PROJECT:** AthlonIQ
> **Generated:** 2026-11-27 00:36:09
> **Page Type:** Dashboard / Data View

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1200px (standard)
- **Layout:** Full-width sections, centered content

### Spacing Overrides

- No overrides — use Master spacing

### Typography Overrides

- No overrides — use Master typography

### Color Overrides

- No overrides — use Master colors

### Component Overrides

- Avoid: Load everything upfront
- Avoid: No caching strategy
- Avoid: Ignore bundle size growth

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: Soft box-shadow (multiple: -5px -5px 15px, 5px 5px 15px), smooth press (150ms), inner subtle shadow
- Performance: Lazy load below-fold images and content
- Performance: Set appropriate cache headers
- Performance: Monitor and minimize bundle size

---

## AthlonIQ Canonical Overrides (`/today`)

- **Lazy Route Chunk Isolation & Sticky Desktop Rail**:
  - All UI changes for `/today` live strictly inside `web/src/features/dashboard/` (lazy chunk) and shared CSS classes inside `web/src/styles/globals.css`, while the authenticated desktop left rail (`App.tsx`) uses `md:sticky md:top-0 md:h-dvh overflow-hidden` (`w-60`, collapsible to `w-[72px]`) with grouped navigation (`OVERVIEW`, `TRAINING & FUEL`, `RECOVERY & INSIGHTS`, `ACCOUNT`), active `.surface-elevated` pill + `3px` electric-lime left accent bar, scrollable middle `<nav>` (`flex-1 overflow-y-auto min-h-0`), and a pinned footer. `html, body` uses `overflow-x: clip` so sticky positioning remains intact.
- **2-Tier Telemetry Bento Rhythm (`max-w-[1280px]`)**:
  - `390px` Mobile: Single-column zero-overflow stack (`space-y-3.5`) with fixed bottom navigation dock and `QuickActionsRow` (`2×2`, `min-h-[44px]`).
  - Above the Fold (`md+` / Desktop): Compact single-row Onboarding notice (when incomplete) → `DashboardHeader` + compact `QuickActionsRow` (`4` actions in a single row).
  - Row 1 (`lg:grid-cols-12`, `items-stretch`): Hero `ReadinessStrip` (`lg:col-span-5`, `Ring` score when logged or guided `"No check-in yet"` + `"Log recovery check-in"` + `"Quick Check-in"`) + `NutritionCard` (`lg:col-span-7`, horizontal `Daily Calories` & `Daily Protein` wells + compact `Carbs`/`Fats`/`Pending` strip).
  - Row 2 (`md:grid-cols-2 xl:grid-cols-3`, `items-stretch`): Three balanced peer cards — `TodayTrainingCard`, `WeeklyConsistencyCard`, and `WeightTrendCard` (`md:col-span-2 xl:col-span-1` to avoid orphan spans on `md`).
  - Row 3 (`MoreAccordion`): 4 insight accordions arranged in `grid-cols-1 md:grid-cols-2 gap-3`.
- **De-Noised Provenance & Typography**:
  - Cards on `/today` use compact `<ProvenanceDot compact />` indicators (`title` + `aria-label` + `.sr-only` copy) instead of repeating `"Initial baseline estimate"` text across every card; `Barlow Condensed` headings apply `.font-display` (`letter-spacing: 0.015em`).
- **Surface Elevation Hierarchy**:
  - Hero `ReadinessStrip` uses `.surface-card` + subtle pointer spotlight (`Card spotlight` pattern) and recessed `.surface-well` telemetry containers.
  - Primary cards (`NutritionCard`, `TodayTrainingCard`, `WeightTrendCard`, `WeeklyConsistencyCard`) use Tier 2 `.surface-card` (`SectionCard`) framing Tier 4 `.surface-well` KPI readouts, progress tracks, `Ring`/sparklines, and adherence strips.
- **Honest Guided Empty States**: Preserve exact contract copy (`"No check-in yet"`, `"Calorie target not set — finish onboarding"`, `"Confirm your equipment"`, `"Need 3 weigh-ins"`, `"Weekly frequency not set"`, and neutral `"No sessions"` on `Weekly Workload Balance` when 0 workouts and 0 activities exist in the 7-day window — never `"OPTIMAL"`).

