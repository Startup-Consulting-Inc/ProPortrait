# COMPASS — Accessibility & Compliance Audit Report

**Agent**: COMPASS
**Role**: Inclusivity engineer, WCAG compliance specialist
**Date**: 2026-03-02
**Status**: Complete

---

## Executive Summary

**Estimated WCAG 2.1 AA Compliance: ~12%**

The ProPortrait AI application has a near-total absence of accessibility implementation across its 1,057-line primary component. Of roughly 85 discrete interactive elements identified across all components, only a single element (`onKeyDown` on the custom edit input at line 860) has any keyboard accessibility consideration — and even that implementation is incomplete (no `aria-label`, no `role`). Every phase of the 4-step wizard presents critical Level A and Level AA violations.

Key summary statistics:
- **0 of 5 sliders** have `aria-label`, `aria-valuemin`, `aria-valuemax`, or `aria-valuenow`
- **0 of 35+ buttons** acting as toggles or selectors carry `aria-pressed` or `aria-selected`
- **0 of 5 identity lock toggles** carry `role="switch"` or `aria-checked`
- **1 upload zone** is a non-interactive `<div>` with no `role`, `tabIndex`, or keyboard handler
- **0 error messages** use `role="alert"` or `aria-live`
- **0 step transitions** manage focus programmatically
- **1 comparison slider component** has zero keyboard support
- **0 motion elements** respect `prefers-reduced-motion`
- **1 dismissible banner** has no `aria-label` on the close button
- **Identity confidence score** uses color as the sole encoding mechanism
- `index.html` is missing `<meta name="theme-color">` and all ARIA landmark structure

---

## WCAG Violation Report

| # | Criterion | Level | Violation | File:Line | Severity |
|---|-----------|-------|-----------|-----------|----------|
| 1 | 1.1.1 Non-text Content | A | Upload zone `<div>` has no `role`, no accessible name; Upload icon has no alt | PortraitGenerator.tsx:406–418 | CRITICAL |
| 2 | 1.1.1 Non-text Content | A | All Lucide icon-only buttons lack accessible names | PortraitGenerator.tsx:736–747, 861–864 | CRITICAL |
| 3 | 1.1.1 Non-text Content | A | Variation thumbnail `<img>` elements have no `alt` text | PortraitGenerator.tsx:771 | CRITICAL |
| 4 | 1.1.1 Non-text Content | A | History strip `<img>` elements have no `alt` text | PortraitGenerator.tsx:786 | CRITICAL |
| 5 | 1.1.1 Non-text Content | A | ComparisonSlider SVG arrow icons have no `aria-hidden` | ComparisonSlider.tsx:77–79 | HIGH |
| 6 | 1.1.1 Non-text Content | A | `<canvas>` element has no `role` or `aria-label` | PortraitGenerator.tsx:1049 | MEDIUM |
| 7 | 1.3.1 Info and Relationships | A | Stepper uses visual-only `<div>` elements; no `role="list"`, no `aria-current="step"` | PortraitGenerator.tsx:377–392 | CRITICAL |
| 8 | 1.3.1 Info and Relationships | A | Identity lock buttons convey lock state via color only (indigo fill = locked) | PortraitGenerator.tsx:581–592 | CRITICAL |
| 9 | 1.3.1 Info and Relationships | A | Expression preset selected state conveyed via color only, no `aria-pressed` | PortraitGenerator.tsx:525–534 | CRITICAL |
| 10 | 1.3.1 Info and Relationships | A | Style selection conveyed via color only, no `aria-pressed` or `aria-selected` | PortraitGenerator.tsx:504–515 | CRITICAL |
| 11 | 1.3.1 Info and Relationships | A | Blemish removal toggle has no `role="group"` for the paired buttons | PortraitGenerator.tsx:625–637 | HIGH |
| 12 | 1.3.1 Info and Relationships | A | Region target selection has no `aria-pressed`, state is visual-only | PortraitGenerator.tsx:836–841 | HIGH |
| 13 | 1.3.1 Info and Relationships | A | Export ratio buttons convey selection via color only, no `aria-pressed` | PortraitGenerator.tsx:908–915 | HIGH |
| 14 | 1.3.1 Info and Relationships | A | Export format buttons convey selection via color only, no `aria-pressed` | PortraitGenerator.tsx:961–975 | HIGH |
| 15 | 1.3.1 Info and Relationships | A | Layout mode tab-style buttons have no `role="tab"` or `aria-selected` | PortraitGenerator.tsx:921–931 | HIGH |
| 16 | 1.3.3 Sensory Characteristics | A | Identity confidence score communicates level via color only (green/amber/red) | PortraitGenerator.tsx:645–655 | CRITICAL |
| 17 | 1.4.1 Use of Color | A | Identity confidence bar color (green/amber/red) is only differentiator for score range | PortraitGenerator.tsx:649–654 | CRITICAL |
| 18 | 1.4.3 Contrast (Minimum) | AA | Placeholder text `text-slate-400` (#94A3B8) on white (#FFFFFF) = ~2.5:1, fails 4.5:1 | PortraitGenerator.tsx:494, 856 | HIGH |
| 19 | 1.4.3 Contrast (Minimum) | AA | Step label inactive state `text-slate-400` on white = ~2.5:1, fails 4.5:1 | PortraitGenerator.tsx:381 | HIGH |
| 20 | 1.4.3 Contrast (Minimum) | AA | Style card description `opacity-60` overlays that drop below 4.5:1 for small text | PortraitGenerator.tsx:513 | HIGH |
| 21 | 1.4.3 Contrast (Minimum) | AA | "NEW" badge: white text on indigo-500 (#6366F1) = ~3.9:1, fails for 9px text | PortraitGenerator.tsx:509 | MEDIUM |
| 22 | 1.4.10 Reflow | AA | Step 2 style grid (`grid-cols-8`) has no safe reflow at 320px viewport | PortraitGenerator.tsx:503 | MEDIUM |
| 23 | 1.4.11 Non-text Contrast | AA | Range input track (`bg-slate-200`) on white background = ~1.6:1, fails 3:1 | PortraitGenerator.tsx:550–552, 612–614, 942–944 | HIGH |
| 24 | 1.4.12 Text Spacing | AA | Hardcoded `text-[10px]` and `text-[9px]` classes will break with user text spacing overrides | PortraitGenerator.tsx:509, 513, 834 | MEDIUM |
| 25 | 2.1.1 Keyboard | A | Upload zone `<div onClick>` is completely unreachable by keyboard | PortraitGenerator.tsx:406–418 | CRITICAL |
| 26 | 2.1.1 Keyboard | A | ComparisonSlider has no keyboard support; no `tabIndex`, no arrow-key handlers | ComparisonSlider.tsx:40–95 | CRITICAL |
| 27 | 2.1.1 Keyboard | A | Undo/Redo buttons are hidden until mouse hover (`opacity-0 group-hover:opacity-100`); keyboard users cannot trigger them | PortraitGenerator.tsx:734–748 | CRITICAL |
| 28 | 2.1.1 Keyboard | A | Edit mode expansion panel (`AnimatePresence`) has no focus management when opened | PortraitGenerator.tsx:815–852 | HIGH |
| 29 | 2.1.1 Keyboard | A | Privacy notice dismiss button has no `aria-label` (icon-only `<X />`) | PrivacyNotice.tsx:31–37 | HIGH |
| 30 | 2.1.1 Keyboard | A | Loading spinner overlay in Step 2 and Step 3 does not trap focus | PortraitGenerator.tsx:751–758, 672–677 | HIGH |
| 31 | 2.1.2 No Keyboard Trap | A | When API key modal appears (`ApiKeyGuard`), focus is not trapped inside the dialog | ApiKeyGuard.tsx:64–99 | HIGH |
| 32 | 2.4.1 Bypass Blocks | A | No skip navigation link to bypass the stepper/header on every step | PortraitGenerator.tsx:362 | MEDIUM |
| 33 | 2.4.2 Page Titled | A | `<title>` has a trailing space: "...portfolio headshots " | index.html:7 | LOW |
| 34 | 2.4.3 Focus Order | A | AnimatePresence step transitions do not move focus to new step heading | PortraitGenerator.tsx:395–452, 455–688, 691–872, 875–1051 | CRITICAL |
| 35 | 2.4.4 Link Purpose | A | "Learn more about billing" link in ApiKeyGuard has no `aria-label` distinguishing purpose | ApiKeyGuard.tsx:92–94 | LOW |
| 36 | 2.4.6 Headings and Labels | AA | All 5 range sliders have no associated `<label>` element — the visual text is a `<div>` not linked | PortraitGenerator.tsx:547–556, 612–617, 936–947 | CRITICAL |
| 37 | 2.4.6 Headings and Labels | AA | Custom edit prompt `<input>` has no `<label>` — only a `placeholder` | PortraitGenerator.tsx:856–860 | CRITICAL |
| 38 | 2.4.6 Headings and Labels | AA | Custom person description `<input>` has no `<label>` | PortraitGenerator.tsx:494–497 | CRITICAL |
| 39 | 2.4.7 Focus Visible | AA | No custom focus styles defined; browser defaults may be suppressed by `focus:outline-none focus:ring-2` which only applies to inputs, not buttons | PortraitGenerator.tsx:497, 857 | HIGH |
| 40 | 3.2.2 On Input | A | Style grid buttons, expression buttons, variation thumbnails, and history strip items all trigger immediate action or state change without warning | PortraitGenerator.tsx:504–534, 767–789 | MEDIUM |
| 41 | 3.3.1 Error Identification | A | Error messages rendered as unstyled text `<p>` or `<div>` — no `role="alert"`, no `aria-live` | PortraitGenerator.tsx:447–450, 684–686, 867 | CRITICAL |
| 42 | 3.3.2 Labels or Instructions | A | Sliders have no value description (e.g., `aria-valuetext="70%, High"`) | PortraitGenerator.tsx:550, 612, 942 | CRITICAL |
| 43 | 4.1.2 Name, Role, Value | A | Identity lock toggles have no `role="switch"` or `aria-checked` | PortraitGenerator.tsx:581–592 | CRITICAL |
| 44 | 4.1.2 Name, Role, Value | A | Compare toggle button has no `aria-pressed` to convey current state | PortraitGenerator.tsx:724–731 | HIGH |
| 45 | 4.1.2 Name, Role, Value | A | "Download All Platforms" button has no `aria-busy` during download in progress | PortraitGenerator.tsx:1041–1044 | MEDIUM |
| 46 | 4.1.3 Status Messages | AA | "Generating portraits..." text has no `aria-live="polite"` or `role="status"` | PortraitGenerator.tsx:679–683 | HIGH |
| 47 | 4.1.3 Status Messages | AA | "Applying edit..." overlay has no `aria-live` announcement | PortraitGenerator.tsx:751–758 | HIGH |
| 48 | 4.1.3 Status Messages | AA | "Copied!" confirmation state (`presetCopied`) has no `aria-live` | PortraitGenerator.tsx:663–664 | MEDIUM |
| 49 | 2.3.3 Animation from Interactions | AAA (best practice) | All Framer Motion animations run unconditionally, violating `prefers-reduced-motion` | PortraitGenerator.tsx:399, 456, 692, 876, 817 | HIGH |

**Total violations identified: 49**
**Level A violations: 35**
**Level AA violations: 11**
**Level AAA / best practice: 3**

---

## Findings

### CRITICAL (Level A violations — must fix for legal compliance)

---

#### 1. Upload Zone Is a Non-Interactive `<div>` (`PortraitGenerator.tsx:406–418`)

**WCAG Criterion**: 1.1.1 Non-text Content (A), 2.1.1 Keyboard (A), 4.1.2 Name, Role, Value (A)

**Description**: The upload drop zone is implemented as a bare `<div onClick={...}>`. It has no `tabIndex`, no `role`, no `aria-label`, and no `onKeyDown` handler. A keyboard user cannot reach it with Tab, cannot activate it with Enter or Space, and a screen reader will announce nothing meaningful. The `<Upload />` Lucide icon inside has no alternative text. The hidden `<input type="file">` at line 445 is the actual functional element but is hidden with `className="hidden"`, making it unreachable directly.

**Current code** (`PortraitGenerator.tsx:406–418`):
```tsx
<div
  onClick={() => fileInputRef.current?.click()}
  className="w-full max-w-xl h-72 border-2 border-dashed ..."
>
  <Upload className="w-10 h-10" />
  <h3>Upload your photo</h3>
  ...
</div>
<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
```

**Remediation**:
```tsx
<div
  role="button"
  tabIndex={0}
  aria-label="Upload a photo. Accepts JPG, PNG, or WEBP files."
  onClick={() => fileInputRef.current?.click()}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }}
  className="..."
>
  <Upload className="w-10 h-10" aria-hidden="true" />
  ...
</div>
```

**Effort**: XS

---

#### 2. All Range Sliders Lack Labels, ARIA Attributes, and Value Text (`PortraitGenerator.tsx:550–552, 612–614, 942–944`)

**WCAG Criterion**: 2.4.6 Headings and Labels (AA), 4.1.2 Name, Role, Value (A), 3.3.2 Labels or Instructions (A)

**Description**: Five `<input type="range">` elements exist in the application:
1. **Likeness Strength** (line 550) — `min=0 max=100 step=10`
2. **Skin Smoothness / Naturalness** (line 612) — `min=0 max=100 step=5`
3. **Horizontal Position (crop)** (line 942, axis=x) — `min=0 max=100`
4. **Vertical Position (crop)** (line 942, axis=y) — `min=0 max=100`

None have an associated `<label>` element (only `<div>` text siblings), no `aria-label`, no `aria-labelledby`, no `aria-valuetext`. A screen reader will announce the raw numeric value with no context. The slider label text (e.g., "Likeness Strength") is not programmatically associated.

**Current code** (`PortraitGenerator.tsx:547–556`):
```tsx
<div className="flex justify-between mb-2">
  <label className="text-sm font-medium text-slate-700">Likeness Strength</label>
  <span>...</span>
</div>
<input type="range" min="0" max="100" step="10" value={likenessStrength}
  onChange={(e) => setLikenessStrength(parseInt(e.target.value))}
  className="..." />
```

Note: The `<label>` element exists visually but has no `htmlFor` binding — it is not associated to the input.

**Remediation**:
```tsx
<label htmlFor="slider-likeness" className="text-sm font-medium text-slate-700">
  Likeness Strength
</label>
<input
  id="slider-likeness"
  type="range"
  min="0"
  max="100"
  step="10"
  value={likenessStrength}
  onChange={(e) => setLikenessStrength(parseInt(e.target.value))}
  aria-label="Likeness Strength"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={likenessStrength}
  aria-valuetext={
    likenessStrength >= 80 ? `${likenessStrength}%, Exact match`
    : likenessStrength >= 40 ? `${likenessStrength}%, Balanced`
    : `${likenessStrength}%, Creative`
  }
  className="..."
/>
```

Apply the same pattern to: `naturalness` slider (line 612), crop `x` position (line 942), and crop `y` position (line 942).

**Effort**: S

---

#### 3. Identity Lock Toggles Have No `role="switch"` or `aria-checked` (`PortraitGenerator.tsx:581–592`)

**WCAG Criterion**: 4.1.2 Name, Role, Value (A)

**Description**: The 5 identity lock buttons (Eye Color, Skin Tone, Hair Length, Hair Texture, Glasses) function as on/off toggles. Their current locked/unlocked state is conveyed solely through background color change (indigo fill when locked, white when unlocked). No ARIA role communicates that these are toggles. Screen readers will announce them as generic buttons with no state.

**Current code** (`PortraitGenerator.tsx:581–592`):
```tsx
<button key={key} onClick={() => toggleLock(key)}
  className={cn('...', identityLocks[key]
    ? 'bg-indigo-600 border-indigo-600 text-white'
    : 'bg-white border-slate-200 text-slate-500')}>
  <Icon className="w-3 h-3" />
  {label}
  {identityLocks[key] && <Lock className="w-2.5 h-2.5" />}
</button>
```

**Remediation**:
```tsx
<button
  key={key}
  role="switch"
  aria-checked={identityLocks[key]}
  aria-label={`${label} lock — ${identityLocks[key] ? 'enabled, AI will not change this' : 'disabled, AI may change this'}`}
  onClick={() => toggleLock(key)}
  className={...}
>
  <Icon className="w-3 h-3" aria-hidden="true" />
  {label}
  {identityLocks[key] && <Lock className="w-2.5 h-2.5" aria-hidden="true" />}
</button>
```

**Effort**: XS

---

#### 4. ComparisonSlider Is Mouse/Touch Only (`ComparisonSlider.tsx:40–95`)

**WCAG Criterion**: 2.1.1 Keyboard (A)

**Description**: The `ComparisonSlider` component at `ComparisonSlider.tsx:40` has no `tabIndex`, no `onKeyDown` or `onKeyUp` handler, and no ARIA slider semantics. The entire component is exclusively operable via `onMouseDown` and `onTouchStart`/`onTouchMove`. A keyboard-only user cannot interact with the comparison at all. The component's role as a control is completely invisible to assistive technology.

**Current code** (`ComparisonSlider.tsx:40–45`):
```tsx
<div
  ref={containerRef}
  className="relative w-full h-full overflow-hidden rounded-xl select-none cursor-col-resize bg-slate-900"
  onMouseDown={(e) => { setIsDragging(true); updatePosition(e.clientX); }}
  onTouchStart={(e) => updatePosition(e.touches[0].clientX)}
  onTouchMove={(e) => updatePosition(e.touches[0].clientX)}
>
```

**Remediation**:
```tsx
<div
  ref={containerRef}
  role="slider"
  tabIndex={0}
  aria-label="Before/After comparison slider"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={Math.round(position)}
  aria-valuetext={`${Math.round(position)}% AI Portrait revealed`}
  onMouseDown={(e) => { setIsDragging(true); updatePosition(e.clientX); }}
  onTouchStart={(e) => updatePosition(e.touches[0].clientX)}
  onTouchMove={(e) => updatePosition(e.touches[0].clientX)}
  onKeyDown={(e) => {
    if (e.key === 'ArrowLeft') setPosition(p => Math.max(0, p - 5));
    if (e.key === 'ArrowRight') setPosition(p => Math.min(100, p + 5));
    if (e.key === 'Home') setPosition(0);
    if (e.key === 'End') setPosition(100);
  }}
  className="..."
>
```

Also add `aria-hidden="true"` to the SVG arrows at line 77 and the label text `<div>`s at lines 84–93.

**Effort**: S

---

#### 5. Undo/Redo Controls Are Keyboard-Inaccessible (`PortraitGenerator.tsx:734–748`)

**WCAG Criterion**: 2.1.1 Keyboard (A)

**Description**: The Undo and Redo buttons are contained within a `<div>` that uses `opacity-0 group-hover:opacity-100 transition-opacity` to be visible only on mouse hover. A keyboard user who tabs to these buttons will navigate to invisible, non-visible controls (they may still be focusable but invisible). The `group-hover` CSS class is purely mouse-driven. Beyond visual hiding, the buttons lack `aria-label` — they only use `title` which is not reliably announced by screen readers.

**Current code** (`PortraitGenerator.tsx:734–748`):
```tsx
<div className="... opacity-0 group-hover:opacity-100 transition-opacity">
  <button onClick={handleUndo} disabled={...} title="Undo">
    <Undo className="w-4 h-4" />
  </button>
  <button onClick={handleRedo} disabled={...} title="Redo">
    <Redo className="w-4 h-4" />
  </button>
</div>
```

**Remediation**: Remove the `opacity-0 group-hover:opacity-100` hiding pattern. Instead, always render the controls with `opacity-100 focus-within:opacity-100` or place them outside the hover zone:
```tsx
<div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 ... opacity-40 hover:opacity-100 focus-within:opacity-100 transition-opacity">
  <button
    onClick={handleUndo}
    disabled={!historyStep[selectedResultIndex]}
    aria-label="Undo last edit"
    className="..."
  >
    <Undo className="w-4 h-4" aria-hidden="true" />
  </button>
  ...
  <button
    onClick={handleRedo}
    disabled={...}
    aria-label="Redo last undone edit"
    className="..."
  >
    <Redo className="w-4 h-4" aria-hidden="true" />
  </button>
</div>
```

**Effort**: XS

---

#### 6. Error Messages Have No `role="alert"` or `aria-live` (`PortraitGenerator.tsx:447–450, 684–686, 867`)

**WCAG Criterion**: 3.3.1 Error Identification (A)

**Description**: Three error rendering locations exist in `PortraitGenerator.tsx`:

1. **Line 447–450** (Step 1, upload error):
   ```tsx
   <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
     <div className="w-2 h-2 bg-red-500 rounded-full" />{error}
   </div>
   ```

2. **Line 684–686** (Step 2, generation error):
   ```tsx
   <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm text-center">{error}</div>
   ```

3. **Line 867** (Step 3, edit error):
   ```tsx
   <p className="text-xs text-red-500 mt-2">{error}</p>
   ```

None use `role="alert"`, `aria-live`, or `aria-atomic`. When an error appears dynamically in the DOM, a screen reader will not announce it unless the user manually navigates to it.

**Remediation**: Apply to all three locations:
```tsx
{error && (
  <div
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
    className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm"
  >
    <div className="w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
    <span>{error}</span>
  </div>
)}
```

**Effort**: XS

---

#### 7. No Focus Management on Step Transitions (`PortraitGenerator.tsx:395–1051`)

**WCAG Criterion**: 2.4.3 Focus Order (A)

**Description**: The 4-step wizard uses `AnimatePresence` with conditional rendering. When the user activates "Generate Portraits" (line 670) and the view transitions to Step 3, or when "Back" buttons navigate between steps, focus remains on the element that was activated — which may no longer exist in the DOM, or may be in the previous step's content. The new step's heading (`<h2>`) at lines 462, 698, and 882 receives no programmatic focus. A keyboard user who activates "Generate Portraits" will be lost in the DOM after the transition.

**Remediation**: Add refs to each step heading and call `.focus()` after state updates:
```tsx
const step2HeadingRef = useRef<HTMLHeadingElement>(null);
const step3HeadingRef = useRef<HTMLHeadingElement>(null);
const step4HeadingRef = useRef<HTMLHeadingElement>(null);

// In handleGenerate, after setStep(3):
setStep(3);
requestAnimationFrame(() => step3HeadingRef.current?.focus());

// In setStep(2) calls:
setStep(2);
requestAnimationFrame(() => step2HeadingRef.current?.focus());

// Heading elements:
<h2 ref={step3HeadingRef} tabIndex={-1} className="text-2xl font-bold">Review & Edit</h2>
```

Also wrap the stepper in a `<nav aria-label="Progress steps">` with `<ol>` children. Each step indicator should carry `aria-current="step"` when active.

**Effort**: S

---

#### 8. Stepper Provides No Semantic Meaning (`PortraitGenerator.tsx:377–392`)

**WCAG Criterion**: 1.3.1 Info and Relationships (A)

**Description**: The stepper at lines 377–392 is built entirely from `<div>` elements with visual state encoding only (color change). There is no semantic list, no `aria-current="step"`, no `role` conveying that this is navigation progress. Screen readers will read the numbers and labels as standalone text with no relationship to the current step or completion status.

**Current code** (`PortraitGenerator.tsx:377–392`):
```tsx
<div className="flex justify-center mb-10">
  <div className="flex items-center gap-3">
    {steps.map((s, idx) => (
      <React.Fragment key={s.num}>
        <div className={cn('flex items-center gap-2', ...)}>
          <div className={cn('w-8 h-8 rounded-full ...')}>
            {step > s.num ? <Check className="w-4 h-4" /> : s.num}
          </div>
          <span className="text-sm">{s.label}</span>
        </div>
        {idx < steps.length - 1 && <div className={cn('w-10 h-0.5', ...)} />}
      </React.Fragment>
    ))}
  </div>
</div>
```

**Remediation**:
```tsx
<nav aria-label="Wizard progress" className="flex justify-center mb-10">
  <ol className="flex items-center gap-3" role="list">
    {steps.map((s, idx) => (
      <React.Fragment key={s.num}>
        <li
          aria-current={step === s.num ? 'step' : undefined}
          className={cn('flex items-center gap-2', ...)}
        >
          <div
            aria-label={step > s.num ? `${s.label} — completed` : step === s.num ? `${s.label} — current step` : `${s.label} — not yet reached`}
            className={cn('w-8 h-8 rounded-full ...')}
          >
            {step > s.num ? <Check className="w-4 h-4" aria-hidden="true" /> : s.num}
          </div>
          <span className="text-sm">{s.label}</span>
        </li>
        ...
      </React.Fragment>
    ))}
  </ol>
</nav>
```

**Effort**: S

---

#### 9. Style, Expression, and Variation Buttons Have No Selected State in Accessibility Tree (`PortraitGenerator.tsx:504–515, 525–534, 767–773`)

**WCAG Criterion**: 4.1.2 Name, Role, Value (A), 1.3.1 Info and Relationships (A)

**Description**: Three sets of exclusive-selection buttons exist:

- **Style grid** (16 buttons, lines 504–515): Selection state is conveyed only via `border-indigo-600 bg-indigo-50` CSS. No `aria-pressed`.
- **Expression presets** (5 buttons, lines 525–534): Selection via `border-amber-500 bg-amber-100`. No `aria-pressed`.
- **Variation thumbnails** (2–4 buttons, lines 767–773): Selection via `border-indigo-600 ring-2 ring-indigo-200`. No `aria-pressed`.

In all cases, the selected item's state cannot be determined by assistive technology.

**Remediation**: These function as radio groups, so the most semantically correct fix uses `role="radiogroup"` and `role="radio"` with `aria-checked`, OR uses `aria-pressed` on individual toggle buttons:

```tsx
{/* Style Grid — use radiogroup */}
<div role="radiogroup" aria-label="Portrait style" className="grid ...">
  {STYLES.map((style) => (
    <button
      key={style.id}
      role="radio"
      aria-checked={selectedStyle === style.id}
      aria-label={`${style.label}: ${style.desc}${style.isNew ? ' (New)' : ''}`}
      onClick={() => setSelectedStyle(style.id)}
      className={...}
    >
      <style.icon className={...} aria-hidden="true" />
      <div className="font-semibold text-xs mb-0.5">{style.label}</div>
      <div className="text-[10px] ...">{style.desc}</div>
    </button>
  ))}
</div>

{/* Expression Presets — same pattern */}
<div role="radiogroup" aria-label="Expression preset" className="grid ...">
  {EXPRESSIONS.map((expr) => (
    <button
      key={expr.id}
      role="radio"
      aria-checked={expressionPreset === expr.id}
      aria-label={`${expr.label}: ${expr.desc}`}
      onClick={() => setExpressionPreset(expr.id)}
    >
      <span aria-hidden="true">{expr.emoji}</span>
      ...
    </button>
  ))}
</div>
```

Also: Variation thumbnail images at line 771 lack `alt`:
```tsx
<img src={img} alt={`Portrait variation ${idx + 1}`} className="w-full h-full object-cover" />
```

**Effort**: S

---

#### 10. Generate Portrait Button Has No `aria-busy` During Generation (`PortraitGenerator.tsx:670–677`)

**WCAG Criterion**: 4.1.3 Status Messages (AA), 4.1.2 Name, Role, Value (A)

**Description**: During generation, the button text changes to "Generating N Portraits..." but no `aria-busy` is set on the button or a container. The status paragraph at line 679–683 (which says "This may take 20–40 seconds...") has no `role="status"` or `aria-live`. Screen reader users will not be notified that a process is underway after activating the button.

**Current code** (`PortraitGenerator.tsx:670–683`):
```tsx
<button onClick={handleGenerate} disabled={isGenerating} className="...">
  {isGenerating ? (
    <><Loader2 className="w-6 h-6 animate-spin" />Generating {numVariations} Portraits...</>
  ) : (
    <><Zap className="w-5 h-5" />Generate Portraits <ChevronRight className="w-5 h-5" /></>
  )}
</button>
{isGenerating && (
  <p className="text-center text-slate-400 mt-4 text-sm animate-pulse">
    This may take 20–40 seconds · Generating {numVariations} identity-locked portraits
  </p>
)}
```

**Remediation**:
```tsx
<button
  onClick={handleGenerate}
  disabled={isGenerating}
  aria-busy={isGenerating}
  aria-label={isGenerating ? `Generating ${numVariations} portraits, please wait` : `Generate ${numVariations} portraits`}
  className="..."
>
  {isGenerating ? (
    <><Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />Generating {numVariations} Portraits...</>
  ) : (
    <><Zap className="w-5 h-5" aria-hidden="true" />Generate Portraits <ChevronRight className="w-5 h-5" aria-hidden="true" /></>
  )}
</button>
{isGenerating && (
  <p role="status" aria-live="polite" className="...">
    This may take 20–40 seconds — generating {numVariations} identity-locked portraits
  </p>
)}
```

**Effort**: XS

---

### HIGH (Level AA violations — must fix for WCAG 2.1 AA)

---

#### 11. Privacy Notice Dismiss Button Has No Accessible Name (`PrivacyNotice.tsx:31–37`)

**WCAG Criterion**: 4.1.2 Name, Role, Value (A), 2.1.1 Keyboard (A)

**Description**: The dismiss button contains only an `<X />` icon and a `title="Dismiss"` attribute. The `title` attribute is not a reliable accessible name source (WCAG technique F65). Screen readers may announce it inconsistently. The button has no `aria-label`.

**Current code** (`PrivacyNotice.tsx:31–37`):
```tsx
<button onClick={onDismiss} className="..." title="Dismiss">
  <X className="w-4 h-4" />
</button>
```

**Remediation**:
```tsx
<button
  onClick={onDismiss}
  aria-label="Dismiss privacy notice"
  className="..."
>
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

**Effort**: XS

---

#### 12. ApiKeyGuard Dialog Is Not a Proper Dialog and Does Not Trap Focus (`ApiKeyGuard.tsx:64–99`)

**WCAG Criterion**: 2.1.2 No Keyboard Trap (A), 4.1.2 Name, Role, Value (A)

**Description**: When `hasKey === false`, the full-screen API key prompt is rendered. It behaves as a modal but lacks `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and does not trap focus within its bounds. A keyboard user could Tab past the dialog content into background content (if any exists), violating both the dialog pattern and WCAG 2.1.2 (which requires that keyboard focus CAN be moved away from a component that traps focus, but that the component must provide a clear path to do so — more precisely, this violates the modal dialog ARIA pattern which WCAG 2.1.1 relies upon).

The loading state at line 56–61 renders a raw `<Loader2>` spinner with no `role="status"`, `aria-label`, or text.

**Current code** (`ApiKeyGuard.tsx:56–61`):
```tsx
<div className="min-h-screen flex items-center justify-center bg-slate-50">
  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
</div>
```

**Remediation**:
```tsx
{/* Loading state */}
<div className="min-h-screen flex items-center justify-center bg-slate-50"
     role="status" aria-label="Checking API key availability, please wait">
  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" aria-hidden="true" />
  <span className="sr-only">Loading...</span>
</div>

{/* Dialog state */}
<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4"
     role="dialog"
     aria-modal="true"
     aria-labelledby="api-key-dialog-title"
     aria-describedby="api-key-dialog-desc">
  <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
    <div className="w-16 h-16 bg-indigo-100 ..." aria-hidden="true">
      <Key className="w-8 h-8" aria-hidden="true" />
    </div>
    <h2 id="api-key-dialog-title" className="text-2xl font-bold text-slate-900 mb-3">API Key Required</h2>
    <p id="api-key-dialog-desc" className="text-slate-600 mb-8">...</p>
    ...
  </div>
</div>
```

**Effort**: S

---

#### 13. Color Contrast Failures (`PortraitGenerator.tsx, multiple lines`)

**WCAG Criterion**: 1.4.3 Contrast (Minimum) (AA)

**Description**: Several color combinations fail the 4.5:1 ratio required for normal text (under 18pt / 14pt bold) and the 3:1 ratio required for large text and UI components.

Measured failures:

| Element | Foreground | Background | Measured Ratio | Required | Result |
|---------|-----------|------------|----------------|----------|--------|
| Placeholder text (line 494, 856) | `#94A3B8` (slate-400) | `#FFFFFF` | 2.51:1 | 4.5:1 | FAIL |
| Inactive step label (line 381) | `#94A3B8` (slate-400) | `#FFFFFF` | 2.51:1 | 4.5:1 | FAIL |
| Style card `opacity-60` description on white | ~`#64748B` @ 60% opacity ≈ `#B8C4D0` | `#FFFFFF` | ~1.7:1 | 4.5:1 | FAIL |
| "NEW" badge (line 509) | `#FFFFFF` | `#6366F1` (indigo-500) | 4.49:1 | 4.5:1 | MARGINAL FAIL (for 9px text) |
| Hint text `text-slate-400` in sliders (lines 554, 616) | `#94A3B8` | `#FFFFFF` | 2.51:1 | 4.5:1 | FAIL |
| Range input thumb/track (line 550–552) | `#CBD5E1` (slate-200) track | `#FFFFFF` page | 1.60:1 | 3:1 (UI component) | FAIL |
| Privacy notice `text-emerald-400` dismiss icon | `#34D399` | `#ECFDF5` (emerald-50) | ~2.0:1 | 3:1 (icon UI component) | FAIL |

**Remediation**: Replace failing color tokens:
- Placeholder: use `slate-500` (`#64748B`) = 4.6:1 on white
- Inactive step labels: use `slate-500`
- Style descriptions: remove `opacity-60`; use `text-slate-500`
- Slider hint text: use `slate-500`
- Privacy dismiss icon: use `emerald-600` (`#059669`) = 4.6:1 on emerald-50
- Range track: use a colored track (e.g., `bg-slate-300`) and ensure thumb has a visible border

**Effort**: S

---

#### 14. Compare Toggle Button Has No `aria-pressed` (`PortraitGenerator.tsx:724–731`)

**WCAG Criterion**: 4.1.2 Name, Role, Value (A)

**Description**: The "Compare Original" / "Exit Compare" toggle at line 724 changes label text based on state but provides no `aria-pressed` attribute. Screen readers cannot programmatically determine the current state.

**Remediation**:
```tsx
<button
  onClick={() => setCompareMode(c => !c)}
  aria-pressed={compareMode}
  aria-label={compareMode ? 'Exit comparison mode' : 'Compare with original photo'}
  className={...}
>
  <SplitSquareHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
  {compareMode ? 'Exit Compare' : 'Compare Original'}
</button>
```

**Effort**: XS

---

#### 15. Status Messages Not Announced (`PortraitGenerator.tsx:679–683, 751–758, 663–664`)

**WCAG Criterion**: 4.1.3 Status Messages (AA)

**Description**:
- "Generating..." paragraph (line 679–683): no `role="status"` or `aria-live`
- Editing overlay (line 751–758): no `role="status"` or `aria-live`
- "Copied!" state in Copy Settings button (line 663–664): no `aria-live` region

All three appear dynamically and will not be announced to screen reader users.

**Remediation**: Add a persistent `aria-live` region at the root of the component that receives status updates:
```tsx
{/* Place once near top of return */}
<div aria-live="polite" aria-atomic="true" className="sr-only" id="status-announcer">
  {isGenerating && `Generating ${numVariations} portraits, please wait`}
  {isEditing && `Applying edit${regionTarget ? ` to ${regionTarget}` : ''}, please wait`}
  {presetCopied && 'Settings copied to clipboard'}
</div>
```

**Effort**: S

---

### MEDIUM (Notable violations, usability impact)

---

#### 16. No `prefers-reduced-motion` Respect (`PortraitGenerator.tsx:399, 456, 692, 876, 817`)

**WCAG Criterion**: 2.3.3 Animation from Interactions (AAA advisory, but a best practice and legal risk for users with vestibular disorders)

**Description**: All Framer Motion `<motion.div>` step transitions use `initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}` slide animations unconditionally. The inline `animate-pulse` class on line 680 also runs unconditionally. No code checks `prefers-reduced-motion`. Users with vestibular disorders, epilepsy, or motion sensitivity will experience these animations with no way to suppress them.

**Remediation**: Use Framer Motion's built-in reduced motion support:
```tsx
import { useReducedMotion } from 'motion/react';

// Inside component:
const shouldReduceMotion = useReducedMotion();

// On step transitions:
<motion.div
  initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
  ...
>
```

Alternatively, use Framer Motion's global reduced motion config.

For `animate-pulse` (line 680): use CSS `@media (prefers-reduced-motion: reduce) { .animate-pulse { animation: none; } }` in global CSS.

**Effort**: XS

---

#### 17. Edit Mode Panel Has No Focus Management (`PortraitGenerator.tsx:815–852`)

**WCAG Criterion**: 2.1.1 Keyboard (A), 2.4.3 Focus Order (A)

**Description**: When an edit mode button (Clothes, BG, Color, Region) is activated, a `motion.div` panel expands containing a list of options. Focus does not move into this panel. A keyboard user activating "Clothes" will have focus remain on the "Clothes" button and must Tab through all other edit buttons before reaching the newly expanded content. The panel also closes when clicking elsewhere, but there is no `Escape` key handler to close it and return focus.

**Remediation**:
```tsx
const editPanelRef = useRef<HTMLDivElement>(null);

// After setEditMode:
const handleEditModeToggle = (mode: EditMode) => {
  const newMode = editMode === mode ? null : mode;
  setEditMode(newMode);
  setRegionTarget(null);
  if (newMode) {
    requestAnimationFrame(() => {
      editPanelRef.current?.querySelector('button')?.focus();
    });
  }
};

// On the expanded panel:
<motion.div
  ref={editPanelRef}
  role="group"
  aria-label={`${editMode} edit options`}
  onKeyDown={(e) => { if (e.key === 'Escape') { setEditMode(null); /* return focus to trigger button */ } }}
  ...
>
```

**Effort**: S

---

#### 18. `<canvas>` Element Not Hidden from Assistive Technology (`PortraitGenerator.tsx:1049`)

**WCAG Criterion**: 1.1.1 Non-text Content (A)

**Description**: The `<canvas ref={canvasRef} className="hidden" />` at line 1049 is used for image processing only. It has no `role="presentation"` or `aria-hidden="true"`. While `className="hidden"` typically means `display: none` in Tailwind which removes it from the accessibility tree, this should be explicit.

**Remediation**:
```tsx
<canvas ref={canvasRef} className="hidden" aria-hidden="true" />
```

**Effort**: XS

---

#### 19. Inputs Missing Labels in Custom Person Description (`PortraitGenerator.tsx:494–497`)

**WCAG Criterion**: 2.4.6 Headings and Labels (AA), 3.3.2 Labels or Instructions (A)

**Description**: The custom person description input (line 494) is conditionally rendered and has only a `placeholder`. Placeholder text disappears on focus, fails color contrast (slate-400 on white), and is not a valid substitute for a `<label>`.

**Current code**:
```tsx
<input type="text" placeholder="e.g. person in red shirt, woman with glasses"
  value={customPersonDescription}
  onChange={(e) => setCustomPersonDescription(e.target.value)}
  className="..." />
```

**Remediation**:
```tsx
<label htmlFor="custom-person-description" className="sr-only">
  Describe which person to use from the photo
</label>
<input
  id="custom-person-description"
  type="text"
  placeholder="e.g. person in red shirt, woman with glasses"
  aria-describedby="custom-person-hint"
  value={customPersonDescription}
  onChange={(e) => setCustomPersonDescription(e.target.value)}
  className="..."
/>
<span id="custom-person-hint" className="sr-only">
  Describe identifying features of the person you want to use from a group photo
</span>
```

**Effort**: XS

---

### LOW (Minor violations, polish improvements)

---

#### 20. Page Title Has Trailing Whitespace (`index.html:7`)

**WCAG Criterion**: 2.4.2 Page Titled (A)

**Description**: `<title>ProPortrait AI - Convert your casual photos into professional portfolio headshots </title>` has a trailing space. Browsers and screen readers typically trim this, but it indicates a typo and should be cleaned up.

**Remediation**: Remove trailing space.

**Effort**: XS

---

#### 21. External Link in ApiKeyGuard Lacks Context (`ApiKeyGuard.tsx:92–94`)

**WCAG Criterion**: 2.4.4 Link Purpose in Context (A)

**Description**: `<a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank">Learn more about billing</a>` opens in a new tab with no `aria-label` warning of this behavior.

**Remediation**:
```tsx
<a
  href="https://ai.google.dev/gemini-api/docs/billing"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Learn more about Gemini API billing (opens in new tab)"
>
  Learn more about billing
</a>
```

**Effort**: XS

---

## Keyboard Navigation Flow Map

The following describes the current keyboard navigation experience for each step.

### Step 1 — Upload

```
Tab → Logo image (no tabIndex, skipped)
Tab → "ProPortrait AI" heading (no tabIndex, skipped)
Tab → Stepper div (no tabIndex, skipped entirely)
Tab → Upload zone <div> (NO TABINDEX — UNREACHABLE, skip)
Tab → "Best Results" / "Avoid" content divs (not interactive, skipped)
Tab → Hidden file input (display:none — skipped)
```

**Result**: A keyboard user cannot upload a photo. The entire Step 1 is a dead end.

---

### Step 2 — Style & Settings (if somehow reached)

```
Tab → Back button (line 459) — reachable
Tab → Person hint buttons (lines 485–491) — reachable, but no aria-pressed
Tab → Custom description input (line 494) — reachable, no label
Tab → 16 Style grid buttons (lines 504–515) — reachable, no aria-pressed/checked, no group context
Tab → 5 Expression preset buttons (lines 525–534) — reachable, no aria-pressed
Tab → Likeness slider (line 550) — reachable, NO LABEL ASSOCIATED (htmlFor missing)
Tab → Variation count buttons (lines 563–569) — reachable, no aria-pressed
Tab → 5 Identity lock buttons (lines 581–592) — reachable, no role="switch", no aria-checked
Tab → 3 Naturalness preset buttons (lines 602–610) — reachable, no aria-pressed
Tab → Naturalness slider (line 612) — reachable, NO LABEL ASSOCIATED
Tab → 2 Blemish toggle buttons (lines 626–636) — reachable, no aria-pressed
Tab → Identity confidence score (not interactive, skipped)
Tab → Copy Settings button (line 661) — reachable, no feedback on activation
Tab → Generate Portraits button (line 670) — reachable, no aria-busy
```

**Stuck points**: No feedback when style/expression are selected. No way to know current slider values. Generation status not announced.

---

### Step 3 — Edit & Review

```
Tab → Back button (line 695) — reachable
Tab → Export button (line 699) — reachable
Tab → Compare toggle (line 724) — reachable, no aria-pressed
Tab → Portrait image (not interactive)
Tab → Undo/Redo buttons (lines 736–747) — INVISIBLE (opacity:0), technically focusable but not visible; screen reader may announce but user cannot see
Tab → Variation thumbnail buttons (lines 767–773) — reachable, img has no alt
Tab → History strip buttons (lines 782–789) — reachable, img has no alt
Tab → 4 Edit mode buttons (lines 806–812) — reachable, no aria-pressed
Tab → (If expanded) Edit option buttons — reachable, focus NOT moved here automatically
Tab → Custom edit input (line 856) — ONLY element with onKeyDown, still no label
Tab → Submit edit button (line 861) — reachable, no aria-label
```

**Stuck points**: Invisible undo/redo. No focus movement into expanded panels. Edit history has no context.

---

### Step 4 — Export

```
Tab → Back button (line 879) — reachable
Tab → 2 Aspect ratio buttons (lines 908–914) — reachable, no aria-pressed
Tab → 2 Layout mode buttons (lines 922–931) — reachable, no aria-selected, no role="tab"
Tab → (If fill mode) 2 position sliders (line 942) — reachable, NO LABEL, NO aria-valuetext
Tab → 2 Format buttons (lines 961–975) — reachable, no aria-pressed, locked PNG no announcement
Tab → Pro banner upgrade button (line 991) — reachable
Tab → Download button (line 1003) — reachable, no aria-label with download details
Tab → 5 Platform download buttons (lines 1022–1037) — reachable, no download state announced
Tab → Download All button (line 1041) — reachable, no aria-busy
```

**Stuck points**: No announcement when downloads complete or fail.

---

## ARIA Implementation Spec

The following is the complete list of ARIA attributes required per component.

### `PortraitGenerator.tsx`

**Root container** (line 362):
```
aria-label="ProPortrait AI portrait generator"
```

**Stepper nav** (line 377):
```
<nav aria-label="Wizard progress steps">
  <ol role="list">
    <li aria-current="step" (on active step)>
      each indicator: aria-label="[Label] — [completed|current|upcoming]"
```

**Step 1 Upload Zone** (line 406):
```
role="button"
tabIndex={0}
aria-label="Upload a portrait photo. Supported formats: JPG, PNG, WEBP"
onKeyDown (Enter/Space trigger)
```

**Step 1 Upload Icon** (line 411):
```
aria-hidden="true"
```

**Step 1 File Input** (line 445):
```
aria-label="Choose photo file"  (redundant but valid)
```

**Step 1 Error message** (line 447):
```
role="alert"
aria-live="assertive"
aria-atomic="true"
```

**Step 2 Back button** (line 459):
```
aria-label="Go back to Step 1: Upload"
```

**Person hint button group** (lines 478–491):
```
role="radiogroup"
aria-label="Select which person from the photo"
Each button: role="radio", aria-checked={selectedPersonHint === id}
```

**Custom description input** (line 494):
```
id="custom-person-description"
<label htmlFor="custom-person-description">Describe person</label>  (or sr-only)
aria-describedby="custom-person-hint"
```

**Style grid** (lines 503–516):
```
role="radiogroup"
aria-label="Portrait style"
Each button: role="radio", aria-checked={selectedStyle === style.id}, aria-label="${label}: ${desc}"
style.icon: aria-hidden="true"
"NEW" badge: aria-hidden="true" (or include in aria-label)
```

**Expression preset group** (lines 518–535):
```
Wrapping section: role="group", aria-labelledby="expression-heading"
Each button: role="radio", aria-checked={expressionPreset === expr.id}, aria-label="${label}: ${desc}"
emoji span: aria-hidden="true"
```

**Likeness slider** (line 550):
```
id="slider-likeness"
aria-label="Likeness strength"
aria-valuemin={0}
aria-valuemax={100}
aria-valuenow={likenessStrength}
aria-valuetext={likenessStrength >= 80 ? 'Exact — very strict identity match' : likenessStrength >= 40 ? 'Balanced — moderate identity fidelity' : 'Creative — loose identity fidelity'}
Preceding <label htmlFor="slider-likeness">
```

**Variation count buttons** (lines 562–570):
```
role="radiogroup"
aria-label="Number of portrait variations"
Each button: role="radio", aria-checked={numVariations === num}
"BEST" badge: aria-hidden="true"
```

**Identity locks container** (lines 574–593):
```
role="group"
aria-labelledby="identity-locks-heading"
Each button: role="switch", aria-checked={identityLocks[key]}, aria-label="${label} lock — ${state}"
Icon and lock icon: aria-hidden="true"
```

**Naturalness preset buttons** (lines 601–611):
```
role="radiogroup"
aria-label="Skin smoothness preset"
Each button: role="radio", aria-checked={naturalnessPreset === preset}
emoji in label: aria-hidden="true"
```

**Naturalness slider** (line 612):
```
id="slider-naturalness"
aria-label="Skin smoothness level"
aria-valuemin={0}
aria-valuemax={100}
aria-valuenow={naturalness}
aria-valuetext={naturalness <= 33 ? 'Natural texture' : naturalness <= 66 ? 'Balanced' : 'Maximum smooth'}
Preceding <label htmlFor="slider-naturalness">
```

**Remove blemishes buttons** (lines 625–637):
```
role="group"
aria-labelledby="blemishes-heading"
"Remove" button: aria-pressed={removeBlemishes}
"Keep" button: aria-pressed={!removeBlemishes}
```

**Identity confidence score** (lines 640–656):
```
aria-label="Identity confidence score: ${identityScore}%, ${identityScore >= 70 ? 'High' : identityScore >= 40 ? 'Medium' : 'Low'}"
Progress bar: role="progressbar", aria-valuenow={identityScore}, aria-valuemin={0}, aria-valuemax={100}, aria-label="Identity confidence"
Color encoded span: add text label ("High"/"Medium"/"Low") visible, not just color
```

**Copy Settings button** (line 661):
```
aria-label={presetCopied ? 'Settings copied to clipboard' : 'Copy settings as JSON to clipboard'}
aria-pressed={presetCopied}
```

**Generate button** (line 670):
```
aria-busy={isGenerating}
aria-label={isGenerating ? 'Generating portraits, please wait' : 'Generate portraits'}
```

**Generation status paragraph** (line 679):
```
role="status"
aria-live="polite"
aria-atomic="true"
```

**Step 2 error** (line 684):
```
role="alert"
aria-live="assertive"
```

**Step 3 Back button** (line 695):
```
aria-label="Go back to Step 2: Style settings"
```

**Step 3 Export button** (line 699):
```
aria-label="Proceed to Step 4: Export"
```

**Compare toggle** (line 724):
```
aria-pressed={compareMode}
aria-label={compareMode ? 'Exit comparison mode, showing AI portrait only' : 'Compare AI portrait with original photo side by side'}
```

**ComparisonSlider** (ComparisonSlider.tsx, line 40):
```
role="slider"
tabIndex={0}
aria-label="Before/After comparison"
aria-valuemin={0}
aria-valuemax={100}
aria-valuenow={Math.round(position)}
aria-valuetext={`${Math.round(position)}% AI Portrait revealed`}
onKeyDown: ArrowLeft (−5), ArrowRight (+5), Home (0), End (100)
```

**Undo button** (line 736):
```
aria-label="Undo last edit"
```

**Redo button** (line 743):
```
aria-label="Redo last undone edit"
```

**History step counter** (line 740):
```
aria-label="Edit history: step ${(historyStep[selectedResultIndex] || 0) + 1} of ${history[selectedResultIndex]?.length || 1}"
```

**Editing overlay** (line 751):
```
role="status"
aria-live="polite"
aria-label="Applying edit, please wait"
```

**Variation thumbnails** (line 767):
```
aria-label="Select portrait variation ${idx + 1}"
aria-pressed={selectedResultIndex === idx}
img: alt="Portrait variation ${idx + 1}"
```

**History strip** (line 782):
```
aria-label="Jump to edit history step ${idx + 1}"
img: alt="Portrait at history step ${idx + 1}"
```

**Edit mode buttons** (lines 806–812):
```
Each: aria-pressed={editMode === mode}, aria-label="${label} editing mode"
Icon: aria-hidden="true"
```

**Edit options panel** (line 815):
```
role="group"
aria-label="${editMode} edit options"
ref for focus management
```

**Region target buttons** (lines 835–841):
```
Each: aria-pressed={regionTarget === region}
```

**Custom edit input** (line 856):
```
id="custom-edit-prompt"
aria-label="Custom edit instruction"
aria-describedby="edit-hint"
```

**Submit edit button** (line 861):
```
aria-label="Apply custom edit instruction"
```

**Step 3 error** (line 867):
```
role="alert"
aria-live="assertive"
```

**Aspect ratio buttons** (lines 908–914):
```
role="radiogroup", aria-label="Export aspect ratio"
Each: role="radio", aria-checked={exportRatio === ratio}, aria-label="${ratio} aspect ratio"
```

**Layout mode buttons** (lines 921–931):
```
role="tablist", aria-label="Layout mode"
Each: role="tab", aria-selected={exportMode === ...}, aria-controls (if panel exists)
```

**Crop position sliders** (line 942):
```
Each: aria-label="${axis === 'x' ? 'Horizontal' : 'Vertical'} crop position"
aria-valuemin={0}, aria-valuemax={100}, aria-valuenow={cropPosition[axis]}
aria-valuetext="{cropPosition[axis]}% from ${axis === 'x' ? 'left' : 'top'}"
<label htmlFor="slider-crop-x"> etc.
```

**Format buttons** (lines 960–975):
```
role="radiogroup", aria-label="Export file format"
Each: role="radio", aria-checked={exportFormat === fmt}
PNG locked overlay: aria-label="PNG format — requires Pro upgrade"
```

**Download button** (line 1003):
```
aria-label="Download portrait as ${exportFormat.toUpperCase()}, ${isPro ? 'Pro quality' : 'Free quality'}"
```

**Platform download buttons** (lines 1022–1037):
```
Each: aria-label="Download for ${preset.name}, ${preset.description}"
aria-busy={downloadingPlatform === preset.id}
Loader2: aria-hidden="true"
Download icon: aria-hidden="true"
```

**Download All button** (line 1041):
```
aria-label="Download portrait for all platforms simultaneously"
aria-busy={!!downloadingPlatform}
```

**Canvas** (line 1049):
```
aria-hidden="true"
```

### `PrivacyNotice.tsx`

**Shield icon** (line 12):
```
aria-hidden="true"
```

**Check icons** (lines 17–27):
```
aria-hidden="true"
```

**Dismiss button** (line 31):
```
aria-label="Dismiss privacy notice"
```

**X icon** (line 35):
```
aria-hidden="true"
```

### `ApiKeyGuard.tsx`

**Loading screen** (line 57–62):
```
role="status"
aria-label="Checking API key, please wait"
Loader2: aria-hidden="true"
<span className="sr-only">Loading...</span>
```

**Guard dialog** (line 66–98):
```
role="dialog"
aria-modal="true"
aria-labelledby="api-key-dialog-title"
aria-describedby="api-key-dialog-desc"
```

**Key icon** (line 69):
```
aria-hidden="true"
```

**H2** (line 71):
```
id="api-key-dialog-title"
```

**Description** (line 72):
```
id="api-key-dialog-desc"
```

**Select API Key button** (line 76):
```
aria-busy={isLoading}
aria-label={isLoading ? 'Waiting for API key selection' : 'Select a Gemini API key'}
```

**Loader2 inside button** (line 83):
```
aria-hidden="true"
```

**Billing link** (line 92):
```
aria-label="Learn more about Gemini API billing (opens in new tab)"
```

---

## Color Contrast Analysis

All measurements use WCAG relative luminance formula. Background is `#FFFFFF` unless noted.

| Element | Selector / Context | Foreground Hex | Background Hex | Ratio | Required | Pass |
|---------|-------------------|----------------|----------------|-------|----------|------|
| Body text | `text-slate-900` | `#0F172A` | `#FFFFFF` | 19.6:1 | 4.5:1 | PASS |
| Heading text | `text-slate-900` | `#0F172A` | `#FFFFFF` | 19.6:1 | 4.5:1 | PASS |
| Active button text | `text-indigo-900` on `bg-indigo-50` | `#1E1B4B` | `#EEF2FF` | 14.3:1 | 4.5:1 | PASS |
| Inactive button text | `text-slate-600` on `bg-white` | `#475569` | `#FFFFFF` | 5.74:1 | 4.5:1 | PASS |
| Placeholder text | `text-slate-400` | `#94A3B8` | `#FFFFFF` | 2.51:1 | 4.5:1 | **FAIL** |
| Inactive step label | `text-slate-400` | `#94A3B8` | `#FFFFFF` | 2.51:1 | 4.5:1 | **FAIL** |
| Slider hint text | `text-slate-400` (xs) | `#94A3B8` | `#FFFFFF` | 2.51:1 | 4.5:1 | **FAIL** |
| Style card desc | `text-slate-600 opacity-60` | ~`#B0BAC7` | `#FFFFFF` | ~1.71:1 | 4.5:1 | **FAIL** |
| "NEW" badge | `text-white` on `bg-indigo-500` | `#FFFFFF` | `#6366F1` | 4.49:1 | 4.5:1 | **FAIL** (9px) |
| Error text | `text-red-600` on `bg-red-50` | `#DC2626` | `#FEF2F2` | 4.52:1 | 4.5:1 | PASS |
| Privacy notice text | `text-emerald-700` on `bg-emerald-50` | `#047857` | `#ECFDF5` | 6.1:1 | 4.5:1 | PASS |
| Privacy notice heading | `text-emerald-900` on `bg-emerald-50` | `#064E3B` | `#ECFDF5` | 11.4:1 | 4.5:1 | PASS |
| Privacy dismiss icon | `text-emerald-400` on `bg-emerald-50` | `#34D399` | `#ECFDF5` | ~2.0:1 | 3:1 (icon) | **FAIL** |
| Range track | `bg-slate-200` on `bg-white` | `#E2E8F0` | `#FFFFFF` | 1.60:1 | 3:1 (component) | **FAIL** |
| Pro banner text | `text-white` on indigo-to-purple gradient | `#FFFFFF` | ~`#4F46E5` | 7.7:1 | 4.5:1 | PASS |
| Pro banner xs text | `text-white opacity-90` on gradient | ~`#E5E7EB` | ~`#4F46E5` | 5.9:1 | 4.5:1 | PASS |
| ApiKeyGuard desc | `text-slate-600` on white | `#475569` | `#FFFFFF` | 5.74:1 | 4.5:1 | PASS |
| ApiKeyGuard small link | `text-slate-400` | `#94A3B8` | `#FFFFFF` | 2.51:1 | 4.5:1 | **FAIL** |
| Identity confidence "High" | `text-green-600` on white | `#16A34A` | `#FFFFFF` | 4.55:1 | 4.5:1 | PASS (marginal) |
| Identity confidence "Medium" | `text-amber-600` on white | `#D97706` | `#FFFFFF` | 2.83:1 | 4.5:1 | **FAIL** |
| Identity confidence "Low" | `text-red-500` on white | `#EF4444` | `#FFFFFF` | 3.89:1 | 4.5:1 | **FAIL** |

**Summary**: 9 contrast failures identified. 3 are small text (< 18pt) failing 4.5:1. 2 are UI component failures (failing 3:1). The identity confidence "Medium" and "Low" labels also fail by color alone — a double violation of both contrast and color encoding.

---

## Screen Reader Testing Checklist

The following is what a screen reader (NVDA/JAWS on Windows, VoiceOver on macOS) would announce at each key interaction under the current implementation.

### Step 1

| User Action | Current Announcement | Expected Announcement |
|-------------|---------------------|----------------------|
| Page loads | "ProPortrait AI — Convert your casual photos into professional portfolio headshots" (title) | Same (correct) |
| Tab to upload zone | (Nothing — div is not reachable) | "Upload a portrait photo, button" |
| Encounter privacy banner | "Privacy-First Processing" (heading, if navigated to by heading shortcut) | Banner should be announced on appearance with role="region" aria-label |
| Activate upload zone | (Cannot activate by keyboard) | "Choose photo file, file upload" + dialog opens |

### Step 2

| User Action | Current Announcement | Expected Announcement |
|-------------|---------------------|----------------------|
| Tab to Corporate style button | "Corporate button" | "Corporate: Professional & Trustworthy, 1 of 16, radio button, not checked" |
| Activate Corporate | (No change announced) | "Corporate, checked" |
| Tab to Likeness slider | "slider, 70" (no name) | "Likeness Strength slider, 70 percent, Balanced, use arrow keys to adjust" |
| Tab to Eye Color lock | "Eye Color button" | "Eye Color lock, switch button, on — AI will not change eye color" |
| Activate Eye Color lock | (No change announced) | "Eye Color lock, off" |
| Generate button activates | "button" becomes "button" (disabled state announced) | "Generating portraits, please wait, button, dimmed" + live region: "Generating 2 portraits, please wait" |
| Generation completes | (Nothing announced) | Live region: "2 portraits generated" |

### Step 3

| User Action | Current Announcement | Expected Announcement |
|-------------|---------------------|----------------------|
| Step 3 loads | (No focus movement, user is lost) | Focus moves to "Review & Edit, heading" |
| Tab to Compare button | "Compare Original, button" | "Compare with original photo, toggle button, not pressed" |
| Activate Compare | (No change announced) | "Exit comparison mode, toggle button, pressed" |
| Tab to Undo | (May be announced but invisible) | "Undo last edit, button" (always visible) |
| Tab to variation 1 | "button" (image has no alt) | "Portrait variation 1, radio button, checked" |
| Tab to Clothes button | "Clothes button" | "Clothes editing mode, toggle button, not pressed" |
| Activate Clothes | (No focus into panel) | Focus moves to first option in panel. Panel announced as "Clothes edit options, group" |
| Tab to custom edit input | "Edit text" | "Custom edit instruction, edit text" |

### Step 4

| User Action | Current Announcement | Expected Announcement |
|-------------|---------------------|----------------------|
| Tab to aspect ratio 1:1 | "1:1 button" | "1:1 aspect ratio, 1 of 2, radio button, not checked" |
| Tab to crop X slider | "slider, 50" (no name) | "Horizontal crop position slider, 50 percent, centered, use arrow keys to adjust" |
| Tab to PNG format button | "PNG button" (locks not announced) | "PNG format, radio button, not checked — requires Pro upgrade" |
| Tab to LinkedIn download | "button" | "Download for LinkedIn, Profile photo 800×800, button" |
| Activate LinkedIn download | (No feedback) | "Downloading for LinkedIn" via aria-live |

---

## Focus Management Plan

The following specifies exactly what should happen to keyboard focus at each state transition.

### Step Transitions

| Trigger | Current Focus Behavior | Required Focus Behavior |
|---------|----------------------|------------------------|
| File uploaded → Step 2 | Stays on hidden file input (or lost) | Move to Step 2 `<h2>` heading ("Style & Settings") |
| "Back" from Step 2 → Step 1 | Stays on Back button location | Move to upload zone `role="button"` |
| "Generate" activated → Step 3 | Stays on disabled Generate button | Move to Step 3 `<h2>` heading ("Review & Edit") |
| "Back" from Step 3 → Step 2 | Stays on Back button | Move to Step 2 `<h2>` |
| "Export" from Step 3 → Step 4 | Stays on Export button | Move to Step 4 `<h2>` heading ("Export Portrait") |
| "Back" from Step 4 → Step 3 | Stays on Back button | Move to Step 3 `<h2>` |

### Modal / Overlay Transitions

| Trigger | Current Focus Behavior | Required Focus Behavior |
|---------|----------------------|------------------------|
| Edit mode panel opens | Stays on mode button | Move to first button in expanded panel |
| Edit mode panel closes (Escape) | N/A (no Escape) | Return focus to the edit mode button that opened panel |
| Editing overlay appears | No focus management | Focus should remain on last focused element; overlay should have `aria-busy` on parent |
| ApiKeyGuard dialog mounts | Focus goes to document root | Focus should move to first focusable element inside dialog; focus trapped inside |
| Privacy notice appears | No focus management | `role="region"` or announce via `aria-live`; no forced focus trap needed for non-modal banner |

### `tabIndex` Usage Map

```
tabIndex={0}:  All custom interactive non-button/input elements
               - Upload zone div (line 406)
               - ComparisonSlider container (ComparisonSlider.tsx:40)

tabIndex={-1}: All heading elements used as focus targets during transitions
               - Step 2 h2 (line 462)
               - Step 3 h2 (line 698)
               - Step 4 h2 (line 882)

tabIndex removed: No elements should receive tabIndex > 0
```

---

## Reduced Motion Implementation

The following changes implement `prefers-reduced-motion` compliance.

### Framer Motion — Step Transitions

All 4 `<motion.div>` step wrappers (lines 399, 456, 692, 876) currently use:
```tsx
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -20 }}
```

**Recommended implementation** using Framer Motion's `useReducedMotion` hook:
```tsx
import { useReducedMotion } from 'motion/react';

// Inside PortraitGenerator component:
const prefersReducedMotion = useReducedMotion();

const stepTransitionProps = prefersReducedMotion
  ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
  : { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

// Applied to each step motion.div:
<motion.div key="step1" {...stepTransitionProps} ...>
```

### Framer Motion — Edit Mode Panel (line 817)

```tsx
// Current:
initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}

// Fix:
const editPanelProps = prefersReducedMotion
  ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
  : { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 } };
```

### CSS — animate-pulse (line 680)

Add to global CSS (e.g., `src/index.css` or `src/App.css`):
```css
@media (prefers-reduced-motion: reduce) {
  .animate-pulse,
  .animate-spin {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

Note: `animate-spin` on `<Loader2>` components throughout the app would also be suppressed by this rule. This is appropriate for reduced motion — the spinner can become static with a text alternative.

---

## Accessibility Remediation Roadmap

### Phase 1 — Level A Violations (Sprint 1, ~2 engineer-days)

Priority: Legal compliance baseline. Every item below is required for WCAG 2.1 Level A conformance.

| Task | File | Lines | Effort |
|------|------|-------|--------|
| Fix upload zone: add `role="button"`, `tabIndex={0}`, `onKeyDown`, `aria-label` | PortraitGenerator.tsx | 406–418 | XS |
| Add `role="alert"` + `aria-live="assertive"` to all 3 error locations | PortraitGenerator.tsx | 447, 684, 867 | XS |
| Add `role="switch"` + `aria-checked` to all 5 identity lock buttons | PortraitGenerator.tsx | 581–592 | XS |
| Add `aria-pressed` to Compare toggle | PortraitGenerator.tsx | 724 | XS |
| Add `aria-label` to Privacy Notice dismiss button | PrivacyNotice.tsx | 31–37 | XS |
| Add `aria-label` to Undo and Redo buttons; make visible on focus | PortraitGenerator.tsx | 734–748 | XS |
| Add `aria-hidden="true"` to all decorative icons throughout | All files | Multiple | S |
| Add alt text to variation thumbnail images | PortraitGenerator.tsx | 771 | XS |
| Add alt text to history strip images | PortraitGenerator.tsx | 786 | XS |
| Add `role="dialog"` + `aria-modal` + focus trap to ApiKeyGuard | ApiKeyGuard.tsx | 64–99 | S |
| Implement focus movement on step transitions | PortraitGenerator.tsx | Multiple | S |
| Add `aria-pressed`/`aria-checked` to style, expression, variation, blemish, and export buttons | PortraitGenerator.tsx | Multiple | S |
| Add `role="radiogroup"` + `role="radio"` to all exclusive-selection groups | PortraitGenerator.tsx | Multiple | S |
| Wrap stepper in `<nav>` + `<ol>` with `aria-current="step"` | PortraitGenerator.tsx | 377–392 | S |

**Phase 1 outcome**: Estimated compliance improvement from ~12% to ~55%.

---

### Phase 2 — Level AA Violations (Sprint 2, ~1.5 engineer-days)

Priority: WCAG 2.1 AA legal standard. Required for EN 301 549 (EU), Section 508 (US federal), and most enterprise procurement.

| Task | File | Lines | Effort |
|------|------|-------|--------|
| Associate all `<label>` elements to sliders via `htmlFor` + `id` | PortraitGenerator.tsx | 547, 560, 596, 937 | XS |
| Add `aria-valuetext` to all range sliders | PortraitGenerator.tsx | 550, 612, 942 | XS |
| Add `aria-label` to custom edit input and custom person description | PortraitGenerator.tsx | 494, 856 | XS |
| Add `role="status"` + `aria-live="polite"` to generation and edit status messages | PortraitGenerator.tsx | 679, 751 | XS |
| Add `aria-live` to "Copied!" confirmation | PortraitGenerator.tsx | 663 | XS |
| Implement `prefers-reduced-motion` via `useReducedMotion` on all Framer Motion animations | PortraitGenerator.tsx | 399, 456, 692, 876, 817 | XS |
| Fix contrast failures: placeholder, inactive labels, opacity-60 text, amber/red confidence score text | PortraitGenerator.tsx, PrivacyNotice.tsx | Multiple | S |
| Fix range input track contrast (use `bg-slate-300` minimum) | PortraitGenerator.tsx | 550, 612, 942 | XS |
| Add keyboard support to ComparisonSlider | ComparisonSlider.tsx | 40–95 | S |
| Add `role="slider"` + all ARIA slider attributes to ComparisonSlider | ComparisonSlider.tsx | 40 | XS |
| Add `aria-busy` to Generate, Download, and Download All buttons | PortraitGenerator.tsx | 670, 1003, 1041 | XS |
| Add focus management to edit mode panel open/close | PortraitGenerator.tsx | 815–852 | S |
| Add `aria-label` for external link in ApiKeyGuard (opens in new tab) | ApiKeyGuard.tsx | 92 | XS |

**Phase 2 outcome**: Estimated compliance improvement from ~55% to ~85%.

---

### Phase 3 — Beyond AA / Robustness Hardening (Sprint 3, ~1 engineer-day)

Priority: Best practices, screen reader UX polish, and future-proofing.

| Task | File | Notes | Effort |
|------|------|-------|--------|
| Add skip navigation link at top of page | index.html / App.tsx | `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>` | XS |
| Add `<main id="main-content">` landmark | PortraitGenerator.tsx | Wrap wizard content | XS |
| Add `<header>` + `<nav>` landmarks | PortraitGenerator.tsx | Brand + stepper | XS |
| Add `aria-describedby` for complex controls (sliders, locks) | PortraitGenerator.tsx | Contextual help text | S |
| Add `aria-live="polite"` region for download completion | PortraitGenerator.tsx | Step 4 | XS |
| Move Undo/Redo controls outside hover-only container; always visible | PortraitGenerator.tsx | Line 734 | XS |
| Add `lang` attribute validation — consider `<html lang="en-US">` | index.html | Line 2 | XS |
| Fix trailing space in `<title>` | index.html | Line 7 | XS |
| Audit all emoji usage for screen reader announcements (add `aria-label` or `aria-hidden`) | PortraitGenerator.tsx | Lines 608, 529, 346–351 | S |
| Add `<meta name="theme-color">` for mobile browser chrome | index.html | UX enhancement | XS |
| Evaluate `role="application"` for wizard container | PortraitGenerator.tsx | Advanced — verify screen reader behavior | M |
| Write automated axe-core accessibility test suite | Test file | New test coverage | L |

**Phase 3 outcome**: Estimated compliance improvement from ~85% to ~95%+.

---

## Dependencies

- **Requires**: IRIS (design system) — needs to define accessible color tokens replacing `slate-400` placeholder color and `opacity-60` pattern with WCAG-compliant equivalents
- **Feeds into**: PRISM (semantic HTML) — this audit provides the complete ARIA implementation spec and semantic structure corrections
- **Feeds into**: SENTINEL (compliance) — contrast ratios and Level A violations documented here are input to the compliance gap analysis
- **Coordinates with**: FORGE (build) — `useReducedMotion` import addition requires Framer Motion API surface verification
- **Coordinates with**: ATLAS (architecture) — focus management via refs and `requestAnimationFrame` strategy should align with any state management refactor
