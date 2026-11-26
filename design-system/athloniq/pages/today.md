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

- **Lazy Route Chunk Isolation**: All UI changes for `/today` live strictly inside `web/src/features/dashboard/` (lazy chunk) and shared CSS classes inside `web/src/styles/globals.css` so `dist/assets/index-*.js` remains strictly under `210 KiB` (`215,040 B`).
- **Asymmetric Telemetry Bento Rhythm**:
  - `390px` Mobile: Clean zero-overflow stack (`space-y-4`, `gap-3.5`) following strict task priority: Action Notice (when uncalibrated/unconfirmed) → `DashboardHeader` → Hero `ReadinessStrip` → `QuickActionsRow` (`2×2` grid, `min-h-[44px]`) → Telemetry Cards → `MoreAccordion`.
  - Desktop (`lg+`): `12`-column asymmetric bento grid (`NutritionCard` `lg:col-span-7` + `TodayTrainingCard` `lg:col-span-5`; `WeightTrendCard` `lg:col-span-7` + `WeeklyConsistencyCard` `lg:col-span-5`) capped cleanly at `lg:max-w-6xl` for high-density scannability.
- **Surface Elevation Hierarchy**:
  - Hero `ReadinessStrip` uses `surface-card` + subtle pointer spotlight (`Card spotlight` pattern) and recessed `.surface-well` chips for triggers / quick check-in inputs.
  - Primary cards (`NutritionCard`, `TodayTrainingCard`, `WeightTrendCard`, `WeeklyConsistencyCard`) use Tier 2 `.surface-card` (`Card`) framing Tier 4 `.surface-well` KPI readouts, progress tracks, sparklines, and weekly adherence pills.
- **Hero KPI Scannability**: Hero metric figures (`CountUp` readiness score, calories/protein intake, weight latest/delta, weekly days completed) use tight display tracking, `tabular-nums`, uppercase `10px`/`11px` mono labels, and semantic `lime`/`emerald`/`amber` badges.
- **Honest Guided Empty States**: Preserve exact contract copy (`"No check-in yet"`, `"Calorie target not set — finish onboarding"`, `"Confirm your equipment"`, `"Need 3 weigh-ins"`, `"Weekly frequency not set"`) styled inside `.surface-well` calibration containers with `min-h-[44px]` guided links.

