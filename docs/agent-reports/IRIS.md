# IRIS — UI/UX & Design Quality Audit Report
**Agent**: IRIS
**Role**: Visual design specialist, interaction quality auditor
**Date**: 2026-03-02
**Status**: Complete

---

## Executive Summary

ProPortrait AI has a solid visual identity built around indigo/slate tones and clean card surfaces. However, the implementation has critical mobile breakage in Steps 3 and 4, a generation flow that provides zero feedback during a 20–40 second wait, and a complete absence of dark mode and semantic web accessibility infrastructure (no OG tags, no `theme-color`, no custom font stack). The most urgent issues are the fixed `w-72`/`w-80` sidebars that collapse below content at viewport widths under 768px, and the spinner-only generation state that causes users to abandon before seeing results.

**Score breakdown**:

| Dimension | Score | Verdict |
|---|---|---|
| Visual consistency | 7/10 | Good palette, minor spacing drift |
| Mobile responsiveness | 3/10 | Two full steps are broken below 768px |
| Loading/feedback states | 2/10 | Generation state is a single spinner for 20–40s |
| Interaction quality | 6/10 | Good animations; undo/redo only visible on hover |
| Accessibility / dark mode | 2/10 | No dark mode, no `prefers-color-scheme`, no ARIA |
| Design system coherence | 5/10 | No tokens — values are inlined throughout |

---

## Visual Consistency Audit

### Color Palette
The palette is informal — there are no design tokens, only inlined Tailwind utilities. Observed colors in use:

| Role | Values found | Issue |
|---|---|---|
| Primary action | `indigo-600`, `indigo-700` (Steps 1–4) | Consistent |
| Accent / highlight | `amber-500` (Advanced Settings section), `amber-100`, `amber-50` | Amber used for section chrome; inconsistent with indigo-primary |
| Success | `green-50`, `green-600`, `emerald-50`, `emerald-200` | **Two separate green families**: `green-*` used in Step 1 and Step 3; `emerald-*` used in PrivacyNotice.tsx. These should be unified. |
| Error | `red-50`, `red-500`, `red-600` | Consistent |
| Background | `slate-50` (app shell, ApiKeyGuard), `white` (cards) | Consistent |
| Border | `slate-200`, `slate-100`, `slate-300` | Three shades used interchangeably with no hierarchy |
| Text | `slate-900`, `slate-700`, `slate-600`, `slate-500`, `slate-400` | Full ramp used; acceptable |
| Gradient | `from-indigo-600 to-purple-600` (Pro banner, Step 4:980) | One-off gradient; purple introduced nowhere else |

**Specific green inconsistency**: `PrivacyNotice.tsx:9` uses `bg-emerald-50 border-emerald-200`; Step 1 upload tips at `PortraitGenerator.tsx:421` use `bg-green-50 border-green-100`. Both represent "good/success" content. Pick one family.

### Typography
- `text-4xl font-bold` for the H1 (`PortraitGenerator.tsx:367`) is correct.
- Step headings (`text-2xl font-bold`) at lines 462, 698, 882 are consistent.
- Section headings alternate between `text-sm font-bold` and `text-sm font-semibold` with no clear rule — e.g., `text-sm font-bold` at line 539, `text-sm font-semibold` at line 576.
- Micro-labels use `text-[10px]` (lines 513, 531, 615) — a non-standard Tailwind arbitrary value that will not scale. Should be `text-xs` (12px) minimum for legibility.
- No custom font is declared. `index.html` has no `<link>` for Google Fonts or any web font. The app falls back to the system sans-serif stack via Tailwind's `font-sans`. The brand would benefit from a declared variable font (e.g. Inter).

### Spacing Inconsistencies
- Step 1 upload motion wrapper: `p-10` (`PortraitGenerator.tsx:400`)
- Steps 2/3/4 motion wrappers: `p-8` (lines 457, 693, 877)
- This creates a visible jump in content margin when transitioning from Step 1 to Step 2. All steps should share the same padding value, or the variation should be intentional and documented.

### Icon Inconsistency
- `ShieldCheck` is used on line 434 inside the "Avoid" red box — semantically this communicates protection/safety, opposite of the warning intent. `XCircle` or `AlertTriangle` would be correct.

---

## Findings

### CRITICAL

#### Fixed Sidebar Width — Step 3 Unusable Below 768px (`PortraitGenerator.tsx:762`)
**Description**: The Step 3 Edit layout is a hard-coded flex row: `flex-1` image area + `w-72` sidebar (`className="w-72 flex flex-col gap-4 overflow-y-auto"`). Below `md` breakpoint (768px), both elements compete for screen width and the sidebar either clips or pushes the image to zero-width. There are no responsive classes (`sm:w-72`, `md:w-72`, or a `flex-col` fallback).
**Impact**: The entire "Review & Edit" step is unusable for all mobile users and small-laptop users (768px–900px range). This is the most-used step in the flow.
**Remediation**:
```jsx
// Line 705 — change flex row to stacked on small screens
<div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">

// Line 762 — make sidebar full-width on mobile, fixed on lg
<div className="w-full lg:w-72 flex flex-col gap-4 overflow-y-auto">
```
**Effort**: S

---

#### Fixed Sidebar Width — Step 4 Unusable Below 900px (`PortraitGenerator.tsx:901`)
**Description**: The Step 4 Export layout is `flex gap-8` with a hard-coded `w-80` controls column (`className="w-80 flex flex-col gap-5 overflow-y-auto"`). Same problem as Step 3 — no responsive stacking, no breakpoint guard.
**Impact**: Export step (the conversion/monetization step) is broken for ~40–50% of mobile and tablet traffic.
**Remediation**:
```jsx
// Line 886 — add flex-col fallback
<div className="flex flex-col xl:flex-row gap-8 flex-1">

// Line 901 — make sidebar responsive
<div className="w-full xl:w-80 flex flex-col gap-5 overflow-y-auto">
```
**Effort**: S

---

#### Generation Wait State — 20–40s With Only a Spinner (`PortraitGenerator.tsx:672–683`)
**Description**: When the user clicks "Generate Portraits", the button changes to a spinner and a pulsing text appears below: `"This may take 20–40 seconds"`. The entire Step 2 form remains visible, frozen, with no visual progress indication, no skeleton of what is coming, and no animated preview placeholder. The wait time is 20–40 seconds — industry data shows abandonment spikes after 8–10 seconds without feedback.
**Impact**: High abandonment rate at the moment of peak user investment (they just configured all settings). This is the most important UX fix in the product.
**Remediation**: Implement a multi-phase progress UI with estimated step labels and an animated skeleton of the result. At minimum, a determinate-feeling progress bar with steps ("Analyzing your photo", "Applying style", "Locking identity features", "Rendering portrait") gives perceived progress. The text hint already exists at line 680–683 but is invisible below the fold.

Example structure:
```jsx
// Replace the isGenerating text block (lines 679–683) with:
{isGenerating && (
  <div className="mt-6 space-y-3 max-w-sm mx-auto">
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span className="animate-pulse">Analyzing your photo...</span>
      <span className="text-slate-400 tabular-nums" id="progress-timer" />
    </div>
    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
      <div className="h-full bg-indigo-500 rounded-full animate-[progress_30s_ease-in-out_forwards] w-0" />
    </div>
    {/* Skeleton placeholder for result grid */}
    <div className="grid grid-cols-2 gap-3 mt-4 opacity-40">
      {Array.from({ length: numVariations }).map((_, i) => (
        <div key={i} className="aspect-[3/4] bg-slate-200 rounded-xl animate-pulse" />
      ))}
    </div>
  </div>
)}
```
**Effort**: M

---

### HIGH

#### Upload Zone Fixed Height — Clips on Short/Mobile Screens (`PortraitGenerator.tsx:408`)
**Description**: The upload drop zone uses `h-72` (288px fixed height). On short screens (e.g. iPhone SE: 667px viewport) combined with the header, stepper, and privacy notice above it, the upload zone partially clips below the fold. There is no `min-h` or responsive height class.
**Impact**: First-time users on mobile may see a truncated drop zone and not understand they need to tap it. Click/tap target is also partially hidden.
**Remediation**:
```jsx
// Line 408 — replace h-72 with a responsive min-height
className="w-full max-w-xl min-h-[160px] h-48 sm:h-64 md:h-72 border-2 border-dashed..."
```
**Effort**: XS

---

#### Undo/Redo Controls Hidden Behind Hover State (`PortraitGenerator.tsx:735`)
**Description**: The undo/redo toolbar uses `opacity-0 group-hover:opacity-100` — it is completely invisible until the user hovers the image container. On touch devices (no hover state), these controls are permanently invisible. Users will not discover undo/redo exists.
**Impact**: Phase 3 edit history feature (a key differentiator) is effectively hidden from all mobile users and from desktop users who haven't discovered the hover interaction.
**Remediation**: Show the toolbar persistently when `historyStep[selectedResultIndex] > 0` (i.e., edits have been made). Use `opacity-0` only as initial state before any edits.
```jsx
// Line 735 — make persistent when history exists
className={cn(
  'absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-slate-200 transition-opacity',
  (historyStep[selectedResultIndex] || 0) > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
)}
```
**Effort**: XS

---

#### Edit History Thumbnails at 48px — Indistinguishable (`PortraitGenerator.tsx:784`)
**Description**: Edit history thumbnail buttons are `w-12` (48px wide) with `aspect-[3/4]` — yielding a 48×64px image. Portrait photos at this size are completely indistinguishable from each other, especially when edits are subtle (background color changes, lighting adjustments). The images confirm they display `object-cover` which means the face is cropped differently in every thumbnail, making differentiation even harder.
**Impact**: The visual history feature (Phase 3 differentiator) is functionally unusable. Users cannot identify which thumbnail represents which edit state.
**Remediation**: Increase to at minimum `w-16` (64px) — ideally `w-20` (80px) — and add a step number overlay and edit label badge on each thumbnail. This requires the history array to store edit labels alongside image data.
```jsx
// Line 784 — increase thumbnail size
className={cn('shrink-0 w-20 aspect-[3/4] rounded-md overflow-hidden border-2 relative transition-all', ...)}
// Add inside the button:
<span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5">
  {idx === 0 ? 'Original' : `Edit ${idx}`}
</span>
```
**Effort**: S

---

#### Stepper Horizontal Scroll Issue on Mobile (`PortraitGenerator.tsx:377–392`)
**Description**: The step indicator is a flex row with `gap-3` and connector dividers (`w-10`). At 320px viewport width (iPhone SE), the four-step stepper with labels "Upload / Style / Edit / Export" plus `w-10` connectors will overflow horizontally. There is no `overflow-x-auto` wrapper and no mobile-responsive condensation (icon-only mode).
**Impact**: Navigation context is lost on narrow phones. Users cannot see which step they are on.
**Remediation**:
```jsx
// Line 377 — add overflow safety and responsive label hiding
<div className="flex justify-center mb-10 overflow-x-auto px-2">
  // Inside each step label:
  <span className="text-sm hidden sm:inline">{s.label}</span>
```
**Effort**: XS

---

#### Style Grid Collapses to 2 Columns on Mobile (`PortraitGenerator.tsx:503`)
**Description**: The styles grid is `grid-cols-2 sm:grid-cols-4 lg:grid-cols-8`. At 2 columns, 16 style options require 8 rows of scrolling. Each card is tappable but at `p-3` with a 24px icon and two text lines, they are only ~72px tall — acceptable, but 8 rows of scrolling before reaching Expression controls and Advanced Settings means users on mobile will not see those sections.
**Impact**: Expression presets and identity locks — key differentiators — are below the fold on mobile behind an unexpectedly long scrollable list.
**Remediation**: Consider a horizontal scroll carousel on mobile (`grid-cols-4` as minimum with `overflow-x-auto`) or a "show more" disclosure pattern after the first 8 styles.
**Effort**: M

---

#### `index.html` Missing Critical Head Meta Tags (`index.html`)
**Description**: The `index.html` is missing multiple essential meta tags for a production tool:
- No `<meta name="theme-color">` — browser chrome stays white/default on mobile
- No Open Graph tags (`og:title`, `og:description`, `og:image`) — social shares show no preview
- No Twitter Card meta tags
- No `<link rel="apple-touch-icon">` — iOS home screen icon is blank
- No `<meta name="color-scheme" content="light dark">` — browser cannot negotiate dark mode
- The `google-site-verification` placeholder value `"google-site-verification=google-site-verification"` (line 14) is invalid and will fail Search Console verification

**Impact**: Poor social shareability; broken iOS PWA experience; no dark mode OS negotiation; invalid SEO meta.
**Remediation**: Add complete head meta block — see Design System section for the `theme-color` value. Remove or replace the invalid verification string.
**Effort**: XS

---

#### External Noise Texture via `vercel.app` Domain (`App.tsx:13`)
**Description**: The background grain texture is loaded from `https://grainy-gradients.vercel.app/noise.svg` — a third-party Vercel deployment. If that deployment goes down or rate-limits, the background breaks. More critically, this is a network request on every page load with no fallback, and it creates a CSP (Content Security Policy) exception requirement.
**Impact**: Fragile dependency; potential privacy concern (third-party request logged); build/production CSP risk.
**Remediation**: Download the SVG noise texture and serve it as a local asset from `/public/noise.svg` or inline it as a CSS `background-image: url("data:image/svg+xml,...")`.
**Effort**: XS

---

### MEDIUM

#### App Shell Adds `py-12` Padding Even When ApiKeyGuard Fills Viewport (`App.tsx:14`)
**Description**: The outer wrapper adds `py-12` (48px top/bottom) unconditionally. When `ApiKeyGuard` renders its full-screen loading/key-selection UI (`min-h-screen flex items-center justify-center`), the `py-12` creates double padding around the centered card, making the vertical centering noticeably off-center toward the bottom on tall screens.
**Impact**: Visual polish issue on first entry to the app (ApiKeyGuard and initial load spinner are the first things users see).
**Remediation**:
```jsx
// App.tsx — conditionally apply padding only when children are rendered
<div className="relative z-10 py-6 sm:py-12">
```
**Effort**: XS

---

#### `ApiKeyGuard` Loading State Has No Brand Identity (`ApiKeyGuard.tsx:57–61`)
**Description**: The initial key-checking state shows only a bare `Loader2` spinner on a `bg-slate-50` background with zero brand context — no logo, no app name, no status text. This is the very first thing users see before the key check resolves.
**Impact**: Blank/generic loading experience undermines trust at first impression.
**Remediation**:
```jsx
// ApiKeyGuard.tsx lines 57–62 — add brand context to initial load
return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
    <img src="/logo.svg" alt="ProPortrait AI" className="w-12 h-12 rounded-xl opacity-80" />
    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
    <p className="text-sm text-slate-400">Loading ProPortrait AI...</p>
  </div>
);
```
**Effort**: XS

---

#### `PrivacyNotice` Uses `emerald-*` Palette Isolated From Rest of App (`PrivacyNotice.tsx:9`)
**Description**: The privacy notice is styled with `emerald-*` classes while the rest of the app uses `green-*` for success/positive states. Both are green hues but visually distinct (emerald is more cyan-leaning). There is no design rationale for this split.
**Impact**: Minor visual inconsistency but noticeable on the first screen users see.
**Remediation**: Either adopt `emerald-*` consistently across all success/positive states app-wide, or change `PrivacyNotice.tsx` to use `green-*` to match the upload tips box at `PortraitGenerator.tsx:421`.
**Effort**: XS

---

#### `ComparisonSlider` Has No Touch-State Locking (`ComparisonSlider.tsx:44–45`)
**Description**: Touch events on `ComparisonSlider` only bind to `onTouchStart` and `onTouchMove` directly on the container element (`PortraitGenerator.tsx:43–45`). There is no `touch-action: none` CSS applied to the container, no `e.preventDefault()` on touch move, and no equivalent global touch listener setup like the mouse listener in `useEffect` (lines 27–37). On mobile, the browser's scroll behavior will compete with the horizontal drag, causing the slider to snap or scroll the page instead of moving the divider.
**Impact**: The comparison slider — a key Phase 3 feature — is unreliable on mobile devices.
**Remediation**:
```jsx
// ComparisonSlider.tsx — add touch-action and prevent default
<div
  ...
  style={{ touchAction: 'none' }}
  onTouchMove={(e) => { e.preventDefault(); updatePosition(e.touches[0].clientX); }}
>
```
Also, add a touch-equivalent of the global `mousemove` listener in `useEffect` so drag continues when finger leaves the element boundary.
**Effort**: S

---

#### Variations Thumbnails Have No `alt` Text (`PortraitGenerator.tsx:771, 786`)
**Description**: Generated portrait thumbnails in the Variations grid and Edit History strip render `<img src={img} className="...">` with no `alt` attribute. This produces accessibility warnings and provides no fallback text for screen reader users.
**Impact**: Accessibility failure; also causes visual broken-image icon if the base64 data truncates.
**Remediation**:
```jsx
// Line 771
<img src={img} alt={`Portrait variation ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
// Line 786
<img src={img} alt={`Edit history step ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
```
**Effort**: XS

---

#### Duplicate Class Assignment in Upload Zone (`PortraitGenerator.tsx:410`)
**Description**: Line 410 specifies both `w-18 h-18` (non-standard Tailwind sizes that will be ignored) and `w-20 h-20` (valid). This is a copy-paste error where the first pair has no effect but creates confusion and linting noise.
```
className="w-18 h-18 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform w-20 h-20"
```
**Impact**: Low — the `w-20 h-20` takes precedence, so the visual is unaffected. Maintenance confusion.
**Remediation**: Remove `w-18 h-18` from line 410.
**Effort**: XS

---

#### Pro Banner Introduces One-Off Purple Gradient (`PortraitGenerator.tsx:981`)
**Description**: `bg-gradient-to-r from-indigo-600 to-purple-600` introduces `purple-600` as the only purple value in the entire app. This creates a color system inconsistency — there is no other use of purple, no design rationale, and the banner is a high-visibility element on Step 4.
**Impact**: Minor but noticeable — the Pro banner looks like it belongs to a different product's palette.
**Remediation**: Replace with `from-indigo-600 to-violet-600` (violet is adjacent to indigo on the Tailwind palette, maintaining the brand color family) or use a solid `bg-indigo-700` if gradients are not part of the design language.
**Effort**: XS

---

#### `handleExport` Uses `alert()` for Error State (`PortraitGenerator.tsx:239`)
**Description**: When a non-Pro user tries to export PNG, the app calls `alert('PNG export is a Pro feature...')`. Native `alert()` is a system-level modal that breaks the visual design, freezes the browser, and provides no branded UI. It also cannot be styled, dismissed with animation, or shown contextually near the button.
**Impact**: Jarring UX break at a conversion-critical moment (user trying to get a file).
**Remediation**: Replace `alert()` with an inline error state or a toast notification. The `error` state variable already exists (`setError`) — use it here.
**Effort**: XS

---

#### Main Container Fixed `min-h-[600px]` Does Not Scale (`PortraitGenerator.tsx:394`)
**Description**: The main card container has `min-h-[600px]`. On Step 2 (Style & Settings), which is the longest step by far, this minimum height is far too short — the content easily overflows to 1400px+. On Step 1, it's too tall — creating excessive empty white space below the upload zone on desktop. The `min-h` value serves no useful constraint.
**Impact**: Inconsistent card height between steps creates layout shifts; the Step 1 card has excessive whitespace on large screens.
**Remediation**: Remove `min-h-[600px]` and let each step's motion wrapper size naturally via its own `min-h-[580px]` (Step 1 already has this, line 400). Or add step-specific heights via the step state.
**Effort**: XS

---

### LOW

#### `text-[10px]` Used for Critical UI Labels (`PortraitGenerator.tsx:513, 531, 567, 615`)
**Description**: Multiple labels use arbitrary `text-[10px]` which is below the 12px minimum recommended by WCAG 2.1 for body text. Affected locations: style card descriptions (line 513), expression descriptions (line 531), variations "BEST" badge (line 567), naturalness scale labels (line 615).
**Impact**: Legibility failure for users with reduced vision; WCAG 2.1 AA risk.
**Remediation**: Replace all `text-[10px]` with `text-xs` (12px Tailwind default). Accept that some cards will need slightly more space.
**Effort**: XS

---

#### "Copy Settings JSON" Is Secondary Feature Placed Before Primary CTA (`PortraitGenerator.tsx:659–666`)
**Description**: The "Copy Settings JSON" button (a power-user team sharing feature) is placed immediately above the primary "Generate Portraits" button. For first-time users, this is confusing — it looks like an alternative action to generate.
**Impact**: Decision paralysis at the critical CTA point; secondary action competes visually with primary action.
**Remediation**: Move "Copy Settings JSON" to the Advanced Settings panel interior (near the identity confidence score) or to a `...` overflow menu. The primary CTA should be uncontested.
**Effort**: XS

---

#### Step 4 Export Preview Has No Visible Crop Handle Feedback
**Description**: The crop position sliders (`PortraitGenerator.tsx:936–947`) update the preview image's `object-position` but the preview image at line 889 gives no visual indication of the crop region. Users have no spatial feedback about what they are adjusting.
**Impact**: Poor understanding of crop behavior leads to unexpected download results.
**Remediation**: Overlay a semi-transparent crop boundary indicator on the preview image that updates with the slider values. Even a simple crosshair overlay communicates the position.
**Effort**: M

---

#### No Favicon for Dark Browser Themes
**Description**: `index.html` links to `/favicon.svg` but there is no `<link rel="icon" media="(prefers-color-scheme: dark)">` variant. Most browsers (Chrome, Edge, Firefox) on dark mode systems will display the default favicon on dark tab backgrounds — if the SVG logo uses dark ink on a transparent background, it will be invisible.
**Impact**: Brand invisibility in browser tab on dark OS systems.
**Remediation**: Add a dark-mode favicon variant or ensure the logo SVG has a light version for dark context.
**Effort**: XS

---

## Mobile Responsiveness Gap Analysis

| Component | Issue | Breakpoint | Fix |
|---|---|---|---|
| Step 3 main layout (`PortraitGenerator.tsx:705`) | Hard flex-row with `flex-1` + `w-72` sidebar, no stacking | All < 768px | `flex-col lg:flex-row`; `w-full lg:w-72` |
| Step 4 main layout (`PortraitGenerator.tsx:886`) | Hard flex-row with `flex-1` + `w-80` sidebar, no stacking | All < 900px | `flex-col xl:flex-row`; `w-full xl:w-80` |
| Upload zone (`PortraitGenerator.tsx:408`) | Fixed `h-72` clips on short viewports | < 600px height | `min-h-[160px] h-48 sm:h-64 md:h-72` |
| Step stepper (`PortraitGenerator.tsx:377`) | 4-step label row overflows at 320px | < 480px | Hide labels: `hidden sm:inline`; add `overflow-x-auto` |
| Style grid (`PortraitGenerator.tsx:503`) | 2 columns = 8 rows of scroll burying settings | < 640px | Horizontal scroll carousel or progressive disclosure |
| ComparisonSlider drag (`ComparisonSlider.tsx:44`) | No `touch-action: none`; browser scroll competes | All touch devices | Add `style={{ touchAction: 'none' }}`; add global touch listeners |
| Undo/Redo toolbar (`PortraitGenerator.tsx:735`) | `opacity-0 group-hover:opacity-100` = invisible on touch | All touch devices | Show persistently when edits exist |
| Step 1 motion padding (`PortraitGenerator.tsx:400`) | `p-10` vs Step 2/3/4 `p-8` — inconsistent | Any width | Normalize to `p-8` throughout |
| Edit history thumbnails (`PortraitGenerator.tsx:784`) | `w-12` (48px) too small to distinguish on any screen | All | Increase to `w-20` minimum |
| App shell padding (`App.tsx:14`) | `py-12` always-on causes off-center ApiKeyGuard | Any height | `py-6 sm:py-12` |

---

## Design System Extraction Document

The following tokens are proposed based on patterns observed across the codebase. Implementing these as CSS custom properties or Tailwind config values would eliminate inline duplication and make dark mode trivial to add.

### Color Tokens
```css
/* Brand */
--color-brand-primary: theme('colors.indigo.600');        /* #4F46E5 */
--color-brand-primary-hover: theme('colors.indigo.700');  /* #4338CA */
--color-brand-primary-light: theme('colors.indigo.50');   /* #EEF2FF */

/* Semantic — unify green/emerald split */
--color-success-bg: theme('colors.emerald.50');           /* #ECFDF5 — adopt emerald, drop green-50 */
--color-success-border: theme('colors.emerald.200');      /* #A7F3D0 */
--color-success-text: theme('colors.emerald.700');        /* #065F46 */

--color-warning-bg: theme('colors.amber.50');             /* #FFFBEB */
--color-warning-border: theme('colors.amber.100');        /* #FEF3C7 */
--color-warning-text: theme('colors.amber.600');          /* #D97706 */

--color-error-bg: theme('colors.red.50');                 /* #FEF2F2 */
--color-error-text: theme('colors.red.600');              /* #DC2626 */

/* Surfaces */
--color-surface-page: theme('colors.slate.50');           /* #F8FAFC */
--color-surface-card: theme('colors.white');              /* #FFFFFF */
--color-surface-inset: theme('colors.slate.50');          /* #F8FAFC */

/* Borders */
--color-border-default: theme('colors.slate.200');        /* #E2E8F0 — standardize, remove slate.100/slate.300 variants */
--color-border-focus: theme('colors.indigo.500');         /* #6366F1 */

/* Text */
--color-text-primary: theme('colors.slate.900');          /* #0F172A */
--color-text-secondary: theme('colors.slate.600');        /* #475569 */
--color-text-muted: theme('colors.slate.400');            /* #94A3B8 */
```

### Spacing Tokens
```css
--spacing-card-padding: 2rem;           /* p-8 — standardize across all steps */
--spacing-section-gap: 1.5rem;          /* gap-6 between sections */
--spacing-element-gap: 1rem;            /* gap-4 between form elements */
```

### Typography Tokens
```css
--font-display: 'Inter Variable', system-ui, sans-serif;  /* Add to index.html */
--text-h1: 2.25rem / 700 / -0.025em;    /* text-4xl font-bold tracking-tight */
--text-h2: 1.5rem / 700 / -0.015em;     /* text-2xl font-bold */
--text-section: 0.875rem / 700 / 0;     /* text-sm font-bold — replace font-semibold mix */
--text-label: 0.875rem / 500 / 0;       /* text-sm font-medium */
--text-caption: 0.75rem / 400 / 0;      /* text-xs — replace all text-[10px] */
```

### Component Tokens
```css
/* Interactive states */
--radius-button: 0.75rem;       /* rounded-xl */
--radius-card: 1.5rem;          /* rounded-2xl / rounded-3xl — pick one */
--radius-input: 0.5rem;         /* rounded-lg */

/* Shadows */
--shadow-card: 0 20px 25px -5px rgb(0 0 0 / 0.1);   /* shadow-xl */
--shadow-button: 0 4px 6px -1px rgb(0 0 0 / 0.1);   /* shadow-md */
```

### Proposed Dark Mode Token Pairs
```css
/* Light → Dark */
--color-surface-page: slate-50 → slate-950;
--color-surface-card: white → slate-900;
--color-surface-inset: slate-50 → slate-800;
--color-border-default: slate-200 → slate-700;
--color-text-primary: slate-900 → slate-50;
--color-text-secondary: slate-600 → slate-400;
--color-text-muted: slate-400 → slate-500;
--color-brand-primary-light: indigo-50 → indigo-950;
```

---

## Interaction Quality Scorecard

| Interaction | Current Quality | Target | Issues |
|---|---|---|---|
| Photo upload (drag/click) | Good | Good | No drag-active visual state (border color change on `dragover`) |
| Step transitions (AnimatePresence) | Good | Good | Slide-in/out is smooth; `x: 20` offset is appropriate |
| Generate button → loading | Poor | Excellent | Only spinner + pulsing text; no progress, no skeleton, 20–40s void |
| Edit mode selection | Fair | Good | Active state clear; animations on expand are good |
| Edit application (isEditing overlay) | Fair | Good | Overlay blocks the image but sidebar edits still clickable |
| Comparison slider — desktop | Good | Good | Smooth; `cursor-col-resize` is correct |
| Comparison slider — mobile | Poor | Good | Browser scroll competes; no `touch-action: none` |
| Undo/Redo — desktop | Fair | Good | Hidden behind hover; discoverable with effort |
| Undo/Redo — mobile | Poor | Good | Permanently invisible (`group-hover` never fires) |
| Edit history navigation | Poor | Good | 48px thumbnails too small; no edit labels |
| Export crop sliders | Fair | Good | Functional but no spatial feedback on preview |
| Platform downloads (sequential) | Good | Good | Per-button loading spinner is good feedback |
| Download All (setTimeout cascade) | Fair | Good | No aggregate progress indicator; can appear frozen |
| Error display (generation) | Fair | Good | Correct placement; no icon, no dismiss |
| Error display (export PNG gate) | Poor | Good | `alert()` — system modal breaks UI |
| ApiKeyGuard — key check loading | Poor | Good | No brand, no context |
| ApiKeyGuard — key select loading | Good | Good | "Waiting for selection..." text is correct |
| Privacy notice dismiss | Good | Good | Clear X button, smooth removal |
| Style selection | Good | Good | 8-column grid is dense but responsive |
| Identity lock toggles | Excellent | Excellent | Filled/outlined state clear; lock icon appears on active |
| Identity confidence score | Good | Good | Live updating bar is a nice touch |

---

## Dark Mode Implementation Plan

The app uses only light-mode `bg-*` and `text-*` classes with no `dark:` variants. Implementing dark mode requires:

### Step 1 — Enable Tailwind Dark Mode
In `tailwind.config.js` (or `tailwind.config.ts`), set:
```js
darkMode: 'class',  // or 'media' for OS-level auto
```

### Step 2 — `index.html` Head
```html
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#4F46E5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1E1B4B" media="(prefers-color-scheme: dark)">
```

### Step 3 — `App.tsx` Shell
```jsx
// Line 12 — add dark surface
className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 ..."

// Line 14 — the noise overlay already uses opacity-20 which works on dark bg
```

### Step 4 — `ApiKeyGuard.tsx`
```jsx
// Line 58 — loading state
className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"

// Line 66 — key gate
className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4"

// Line 67 — card
className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-700"
```

### Step 5 — `PortraitGenerator.tsx` Main Card
```jsx
// Line 394
className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 ..."
```

### Step 6 — `PrivacyNotice.tsx`
```jsx
// Line 9
className="w-full max-w-xl mx-auto mb-6 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4"
```

### Key Surface Mappings Required
| Light class | Dark class |
|---|---|
| `bg-white` | `dark:bg-slate-900` |
| `bg-slate-50` | `dark:bg-slate-800` |
| `bg-slate-100` | `dark:bg-slate-700` |
| `text-slate-900` | `dark:text-slate-50` |
| `text-slate-600` | `dark:text-slate-400` |
| `text-slate-400` | `dark:text-slate-500` |
| `border-slate-200` | `dark:border-slate-700` |
| `bg-indigo-50` | `dark:bg-indigo-950` |
| `bg-amber-50` | `dark:bg-amber-950` |
| `bg-green-50` / `bg-emerald-50` | `dark:bg-emerald-950` |
| `bg-red-50` | `dark:bg-red-950` |

---

## Loading / Empty / Error States Audit

### What Exists

| State | Location | Quality |
|---|---|---|
| Initial key check | `ApiKeyGuard.tsx:57` | Bare spinner only — no brand |
| Key missing | `ApiKeyGuard.tsx:64` | Good card UI with clear CTA |
| Generation loading | `PortraitGenerator.tsx:672–683` | Spinner + pulsing text only — insufficient for 20–40s |
| Edit loading | `PortraitGenerator.tsx:751–758` | Overlay with spinner — appropriate for short edits |
| Platform download per-item | `PortraitGenerator.tsx:1031` | Spinner per button — good |
| Error (generation) | `PortraitGenerator.tsx:684` | Red box, correct placement |
| Error (edit) | `PortraitGenerator.tsx:867` | Red text only, no icon |
| Error (export PNG gate) | `PortraitGenerator.tsx:239` | `alert()` — must be replaced |

### What Is Missing

| Missing State | Location | Recommended Pattern |
|---|---|---|
| Drag-over visual state for upload zone | Step 1 upload div | Add `dragover`/`dragleave` handlers; toggle `border-indigo-500 bg-indigo-50` border on active drag |
| Generation progress (20–40s) | Step 2 | Multi-phase progress bar with step labels; skeleton grid for result preview |
| Empty state after generation (0 results) | Step 3 | If `generatedImages.length === 0` and `!isGenerating`, show a "No results — try again" state with retry button |
| No-image guard for Step 3 | Step 3 main area | If user lands on Step 3 with no `generatedImages` (direct URL navigation, refresh), show an empty state with "Go back to generate" |
| Edit history empty state | Step 3 sidebar | The history strip only appears when `length > 1`; first edit has no history strip at all, which means the undo control appears but the history strip doesn't — confusing |
| Export with no image | Step 4 | `getCurrentImage()` can return `undefined`; the download button should be disabled/show a tooltip if no image is present |
| Download All progress | Step 4 | The `handleDownloadAll` fires `setTimeout` cascades but shows no aggregate progress indicator |
| Network error (image load fail) | Steps 3/4 | `<img>` tags have no `onError` handler; a broken image shows system broken-image icon |

### Recommended Toast/Notification System
The current error handling is entirely inline (red boxes per section). A centralized notification system would allow:
- Non-blocking success toasts ("Edit applied", "Copied to clipboard")
- Dismissible error toasts to replace the inline error spans
- Replacing `alert()` for the PNG gate

A lightweight implementation using `AnimatePresence` (already imported) would add ~30 lines of code.

---

## Dependencies
- **Requires**: None (Tier 2 — reads source only, no changes needed from upstream agents)
- **Feeds into**:
  - **COMPASS**: All color contrast ratios found above (emerald vs green split, text-[10px] legibility, Pro banner gradient) need COMPASS validation against WCAG AA
  - **ATLAS**: Step 3/4 fixed-sidebar layout breakage and the generation wait state are user flow blockers — ATLAS needs these as critical path interruptions
  - **PRISM**: The design token extraction document (colors, spacing, typography) provides the component contract for PRISM to implement

---

## Prioritized Remediation Plan

### Tier 1 — Ship Blockers (do before any marketing/launch)

| # | Finding | File | Line | Effort |
|---|---|---|---|---|
| 1 | Step 3 sidebar `w-72` — mobile breakage | `PortraitGenerator.tsx` | 705, 762 | S |
| 2 | Step 4 sidebar `w-80` — mobile breakage | `PortraitGenerator.tsx` | 886, 901 | S |
| 3 | Generation wait: spinner only for 20–40s | `PortraitGenerator.tsx` | 672–683 | M |
| 4 | ComparisonSlider touch-action conflict | `ComparisonSlider.tsx` | 43–45 | S |
| 5 | Replace `alert()` for PNG export error | `PortraitGenerator.tsx` | 239 | XS |

### Tier 2 — Quality Bar (do in first sprint after launch)

| # | Finding | File | Line | Effort |
|---|---|---|---|---|
| 6 | Upload zone fixed `h-72` mobile clip | `PortraitGenerator.tsx` | 408 | XS |
| 7 | Undo/Redo invisible on touch | `PortraitGenerator.tsx` | 735 | XS |
| 8 | History thumbnails `w-12` too small | `PortraitGenerator.tsx` | 784 | S |
| 9 | Stepper overflow on 320px | `PortraitGenerator.tsx` | 377 | XS |
| 10 | `index.html` missing meta tags + invalid GSV | `index.html` | 14 | XS |
| 11 | External noise texture from Vercel | `App.tsx` | 13 | XS |
| 12 | `ApiKeyGuard` loading state has no brand | `ApiKeyGuard.tsx` | 57 | XS |
| 13 | Add drag-over state to upload zone | `PortraitGenerator.tsx` | 406–418 | XS |
| 14 | Missing `alt` text on generated image `<img>` | `PortraitGenerator.tsx` | 771, 786 | XS |

### Tier 3 — Design System Foundation (do as a dedicated design sprint)

| # | Finding | Scope | Effort |
|---|---|---|---|
| 15 | Unify `emerald-*` vs `green-*` split | All files | S |
| 16 | Standardize `font-bold` vs `font-semibold` section heads | `PortraitGenerator.tsx` | XS |
| 17 | Replace all `text-[10px]` with `text-xs` | `PortraitGenerator.tsx` | XS |
| 18 | Remove duplicate `w-18 h-18` classes | `PortraitGenerator.tsx` | 410 | XS |
| 19 | Replace Pro banner `purple-600` with `violet-600` | `PortraitGenerator.tsx` | 981 | XS |
| 20 | Normalize step padding `p-10` vs `p-8` | `PortraitGenerator.tsx` | 400 | XS |
| 21 | Add `prefers-color-scheme` dark mode (full pass) | All files | L |
| 22 | Move "Copy Settings JSON" out of CTA zone | `PortraitGenerator.tsx` | 659 | XS |
| 23 | Add centralized toast notification system | New component | M |
| 24 | Style grid: horizontal scroll on mobile | `PortraitGenerator.tsx` | 503 | M |
| 25 | Export crop: add visual position feedback | `PortraitGenerator.tsx` | 889 | M |
