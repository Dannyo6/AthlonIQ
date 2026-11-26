# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** AthlonIQ
**Generated:** 2026-11-27 00:36:09
**Category:** Fitness/Gym App
**Design Dials:** Variance 6/10 (Balanced / Modern) | Motion 3/10 (Subtle) | Density 8/10 (Dense / Dashboard)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#F97316` | `--color-primary` |
| On Primary | `#0F172A` | `--color-on-primary` |
| Secondary | `#FB923C` | `--color-secondary` |
| On Secondary | `#0F172A` | `--color-on-secondary` |
| Accent/CTA | `#22C55E` | `--color-accent` |
| On Accent/CTA | `#0F172A` | `--color-on-accent` |
| Background | `#1F2937` | `--color-background` |
| Foreground | `#F8FAFC` | `--color-foreground` |
| Card | `#313742` | `--color-card` |
| Card Foreground | `#F8FAFC` | `--color-card-foreground` |
| Muted | `#37414F` | `--color-muted` |
| Muted Foreground | `#CBD5E1` | `--color-muted-foreground` |
| Border | `#374151` | `--color-border` |
| Destructive | `#EF4444` | `--color-destructive` |
| On Destructive | `#000000` | `--color-on-destructive` |
| Ring | `#F97316` | `--color-ring` |

**Color Notes:** Energy orange + success green

### Typography

- **Heading Font:** Barlow Condensed
- **Body Font:** Barlow
- **Mood:** sports, fitness, athletic, energetic, condensed, action
- **Google Fonts:** [Barlow Condensed + Barlow](https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

*Density: 8/10 — Dense / Dashboard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `2px` / `0.125rem` | Tight gaps |
| `--space-sm` | `4px` / `0.25rem` | Icon gaps, inline spacing |
| `--space-md` | `8px` / `0.5rem` | Standard padding |
| `--space-lg` | `12px` / `0.75rem` | Section padding |
| `--space-xl` | `16px` / `1rem` | Large gaps |
| `--space-2xl` | `24px` / `1.5rem` | Section margins |
| `--space-3xl` | `32px` / `2rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #22C55E;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #F97316;
  border: 2px solid #F97316;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #1F2937;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #F97316;
  outline: none;
  box-shadow: 0 0 0 3px #F9731620;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Vibrant & Block-based

**Keywords:** Bold, energetic, playful, block layout, geometric shapes, high color contrast, duotone, modern, energetic

**Best For:** Startups, creative agencies, gaming, social media, youth-focused, entertainment, consumer

**Key Effects:** Large sections (48px+ gaps), animated patterns, bold hover (color shift), scroll-snap, large type (32px+), 200-300ms

### Page Pattern

**Pattern Name:** Feature-Rich Showcase

- **Conversion Strategy:** Clear feature hierarchy. One key message per card. Strong CTA repetition.
- **CTA Placement:** Hero (sticky) + After features + Bottom
- **Section Order:** Hero (value prop) > Feature grid/cards (4-6) > Use cases or benefits > Social proof or logos > CTA

---

## Motion

**Scroll Reveal** (Subtle) — Trigger: scroll (viewport enter) | Duration: 300-400ms | Easing: `power1.out`

```js
gsap.from(el, { opacity: 0, y: 12, duration: 0.35, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
```

**Framework notes:** Requires the ScrollTrigger plugin registered once via gsap.registerPlugin(ScrollTrigger); Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately

- ✅ Keep the y offset small (8-16px) so it reads as a fade, not a slide
- ❌ Don't reveal below-the-fold content needed for SEO/crawlers as invisible-by-default without a no-JS fallback
- ⚡ toggleActions 'play none none reverse' avoids re-triggering on every scroll direction change

---

## Anti-Patterns (Do NOT Use)

- ❌ Static design
- ❌ No gamification

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile

---

## AthlonIQ Canonical Overrides

> **PRECEDENCE:** Where generic generator recommendations above conflict with AthlonIQ's production codebase rules, the overrides below **govern all AthlonIQ UI work**.

### 1. Locked Brand Palette (Deep Obsidian + Lime Primary + Emerald Secondary)
| Tier / Token Role | Canonical Hex / Value | CSS Variable (`web/src/styles/globals.css`) | Tailwind Utility |
|---|---|---|---|
| **Tier 1 — Canvas** | `#090a0f` + ambient radial depth | `--color-bg` / `--color-ambient-lime` / `--color-ambient-emerald` | `bg-athloniq-dark` / `.canvas-depth` |
| **Tier 2 — Surface / Card** | `#12151e` + `1px` hairline + top inner sheen | `--color-card` / `--color-border-hairline` / `--color-surface-sheen` | `bg-athloniq-card` / `.surface-card` |
| **Tier 3 — Elevated Interactive** | `#181d2a` -> `#1b2130` | `--color-surface` / `--color-elevated` / `--color-border-elevated` | `bg-athloniq-surface` / `.surface-elevated` |
| **Tier 4 — Recessed Telemetry Well** | `#0d1017` + inset depth | `--color-well` / `--color-well-border` / `--color-well-shadow` | `.surface-well` |
| **Primary Accent (Electric Lime)** | `#bef264` (hover `#a3e635`) | `--color-lime` / `--color-lime-border` | `text-athloniq-lime` / `bg-athloniq-lime` |
| **Secondary Accent (Emerald)** | `#10b981` | `--color-emerald` / `--color-emerald-border` | `text-emerald-400` / `bg-emerald-500/15` |
| **Forbidden Accents** | Zero **orange (`#F97316`)**, zero **cyan**, zero **purple/violet**, zero default Tailwind `lime-\d{2,3}`, zero raw hex/rgba in `.tsx` or `.css` outside `:root` variable definitions in `globals.css`. | — | Enforce via `tailwind-tokens.test.ts` |

### 2. Typography & Numerical Precision
- **Font Stack**: `Inter` (UI & display headings with tight `-0.025em` / `tracking-tight`) + `JetBrains Mono` (telemetry labels, units, badges, tabular stats) — loaded cleanly without external generator fonts (`Barlow` is **not** used).
- **Mandatory Tabular Numerals**: Apply `tabular-nums` (or `.font-mono` / `[data-numeric="true"]`) to every numeric metric, calorie/macro count, load, readiness score, countdown, and timestamp to prevent horizontal jitter.

### 3. Icons, Motion & Budget Gates
- **Icons**: `lucide-react` ONLY (`aria-hidden="true"` on decorative icons beside text; mandatory `aria-label` on icon-only controls; **zero emojis** as UI icons).
- **Motion & Zero WebGL**: Pure CSS transitions/keyframes + `usePrefersReducedMotion` (`CountUp`, `ClickSpark`, `Card spotlight` gated behind `@media (hover: hover) and (pointer: fine)`). **Zero GSAP, zero Three.js/WebGL, zero new packages** (`budget-gate.test.ts` enforces exact `web/package.json` snapshot and `dist/assets/index-*.js <= 210 KiB`).
- **Reduced Motion**: Global `@media (prefers-reduced-motion: reduce)` rule in `web/src/styles/globals.css` neutralizes animations, `.animate-pulse`/`.animate-bounce`/`.animate-spin`, transitions, and smooth scrolling.

### 4. Mobile-First Ergonomics & Truth-in-UI
- **Breakpoints & Viewport**: `390px` mobile-first zero-overflow single column expanding into balanced telemetry bento grids at `md`/`lg`/`xl`, plus `env(safe-area-inset-bottom)` safe-area compensation for fixed mobile navigation.
- **Touch Targets & Accessibility**: All interactive triggers, action links, tabs, and icon buttons enforce `min-h-[44px]` with `>= 8px` gap, visible `<label htmlFor>`, `:focus-visible` high-contrast lime outlines (`>= 3:1`), and `role="alert"` inline validation.
- **Zero Fabricated Defaults**: Missing metrics stay `null` in state and render explicit guided states (`"Not set"`, `"No check-in yet"`, `"Calorie target not set — finish onboarding"`, `"Confirm your equipment"`, `"0/3 weigh-ins"` / `"Need 3 weigh-ins"`). Every metric preserves its auditable provenance tag.

