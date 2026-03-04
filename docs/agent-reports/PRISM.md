# PRISM — Code Quality & Maintainability Audit Report

**Agent**: PRISM
**Role**: Clean code advocate, tech debt manager
**Date**: 2026-03-02
**Status**: Complete

---

## Executive Summary

The ProPortrait AI codebase is functional and ships a rich feature set across 5 phases, but it carries significant structural debt that will compound rapidly as the product grows. The core issues are:

1. **Zero test coverage** — no test framework, no test files, no CI gate.
2. **TypeScript is not strict** — `strict: true`, `noImplicitAny`, `strictNullChecks`, and `noUncheckedIndexedAccess` are all absent, making the type system advisory rather than protective.
3. **One monolithic 1,057-line component** — `PortraitGenerator.tsx` handles upload, style selection, identity controls, editing, export, history management, and download logic in a single component with 22 `useState` calls and 2 refs.
4. **Response-parsing logic is copy-pasted three times** in `ai.ts`.
5. **Static data arrays defined inside the component body** — four arrays (`STYLES`, `EXPRESSIONS`, `IDENTITY_LOCK_ITEMS`, `steps`) are recreated on every render.
6. **Non-null assertions on canvas refs** without guards at the call site.
7. **No ESLint or Prettier** — the `lint` script runs `tsc --noEmit` only, providing no style, rule, or format enforcement.
8. **`package.json` name is `"react-example"`** — a placeholder that was never updated.
9. **`better-sqlite3` and `express` are listed as runtime `dependencies`** but appear to be unused in any source file under `src/`.

Severity distribution: **2 Critical / 7 High / 8 Medium / 4 Low**.

---

## Code Complexity Report

| File | Lines | Cyclomatic Complexity (est.) | useState Count | Top Issues |
|------|-------|------------------------------|----------------|------------|
| `src/components/PortraitGenerator.tsx` | 1,057 | ~38 | 22 | God component, inline static arrays, non-null assertions, alert(), stale closure risk |
| `src/services/ai.ts` | 315 | ~12 | 0 (service) | Response-parsing duplication x3, `GoogleGenAI` instantiated per-call, debug `console.log` left in |
| `src/components/ComparisonSlider.tsx` | 97 | ~4 | 2 | No touch-end event handler (drag can get stuck), no onerror on images |
| `src/components/ApiKeyGuard.tsx` | 102 | ~5 | 2 | `setHasKey(true)` hardcoded after key selection without re-verification |
| `src/lib/platformPresets.ts` | 63 | 1 | 0 | Clean |
| `src/lib/utils.ts` | 6 | 1 | 0 | Clean |

**Cyclomatic complexity estimate for `PortraitGenerator`** is derived by counting all `if`, `&&` short-circuits, ternary operators, `||`, `switch`, and loop branches within the component body and its handlers (~38). Industry threshold for refactoring is typically 10 per function/component.

---

## Findings

### CRITICAL

---

#### C-1: Zero Test Infrastructure (`/`)

**Description**: There is no test framework, no test runner, no test files, and no CI step that could prevent a broken build or regression from being shipped. The `package.json` scripts object contains only `dev`, `build`, `preview`, `clean`, and `lint` (which is just `tsc --noEmit`). There are no `@testing-library/*`, `vitest`, `jest`, or `playwright` packages anywhere in `package.json`.

**Impact**: Every code change is unverified. Any refactoring of the monolithic `PortraitGenerator.tsx` — which is urgently needed — carries unquantifiable regression risk. The AI service functions in `ai.ts` have no unit tests for prompt construction, response parsing, or error cases.

**Remediation**: Install Vitest + React Testing Library for unit/component tests; add Playwright for E2E. See the Test Infrastructure Setup section below for exact configuration.

**Effort**: M (setup is small; writing meaningful coverage is ongoing)

---

#### C-2: TypeScript Strict Mode Disabled (`tsconfig.json`)

**Description**: The `tsconfig.json` has no `strict` flag and does not individually enable `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, or `noUncheckedIndexedAccess`. The `allowJs: true` flag broadens the surface further. This means TypeScript provides almost no protection against null dereferences, implicit `any` parameters, or unsafe index access — the very categories of bugs that appear elsewhere in this codebase.

**Impact**: The non-null assertions documented in H-1 would be caught by the type checker under strict mode. Array index access like `generatedImages[index]` and `history[selectedResultIndex]` returning `undefined` would produce type errors, not silent runtime bugs.

**Remediation**: Follow the TypeScript Strict Mode Migration Plan section below.

**Effort**: M

---

### HIGH

---

#### H-1: Non-Null Assertions Without Call-Site Guards (`src/components/PortraitGenerator.tsx:206,209,713`)

**Description**: Three non-null assertions (`!`) are used on values that can legitimately be `null` or `undefined`:

- Line 206: `const canvas = canvasRef.current!;` — `canvasRef.current` is `null` until the canvas mounts. `renderToCanvas` is called from `handleExport` and `handlePlatformDownload`, both of which have an outer guard checking `canvasRef.current` (lines 238, 263), but `renderToCanvas` itself is not guarded — if ever called directly, it will throw at runtime.
- Line 209: `const ctx = canvas.getContext('2d')!;` — `getContext('2d')` returns `null` in certain headless or offscreen contexts. The assertion silences this, making debugging harder.
- Line 713: `afterSrc={getCurrentImage()!}` — `getCurrentImage()` returns `string | undefined`. The non-null assertion is used inline in JSX. If the history state is malformed, this silently passes `undefined` to `ComparisonSlider`, which will render a broken image with no error boundary or fallback.

**Impact**: Potential runtime `TypeError: Cannot read properties of null` exceptions that are invisible to TypeScript and have no user-facing error handling.

**Remediation**: Replace each assertion with an explicit guard:
```typescript
// Line 206-209: Replace with:
const canvas = canvasRef.current;
if (!canvas) return '';
const ctx = canvas.getContext('2d');
if (!ctx) return '';

// Line 713: Replace with:
afterSrc={getCurrentImage() ?? ''}
// or conditionally render the ComparisonSlider only when afterSrc is defined
```

**Effort**: XS

---

#### H-2: `img.onload` With No `img.onerror` Fallback (`PortraitGenerator.tsx:249,269`)

**Description**: Both `handleExport` (line 246-257) and `handlePlatformDownload` (line 266-278) create `new Image()`, assign `img.onload`, but never assign `img.onerror`. If the base64 data URL is malformed or the browser cannot decode the image (e.g., the canvas rendered an incomplete retouch pass), the download silently never fires. For `handlePlatformDownload` specifically, `downloadingPlatform` is set to a truthy value before `img.onload` is reached and is only reset inside `onload` at line 277 — meaning if the image fails to load, the platform download buttons are permanently disabled for the session.

**Impact**: Silent download failures. Permanent UI freeze on the platform export buttons if any image fails to load.

**Remediation**:
```typescript
img.onerror = () => {
  setError('Failed to prepare image for download. Please try again.');
  setDownloadingPlatform(null); // Unfreeze the UI
};
```

**Effort**: XS

---

#### H-3: Response Parsing Logic Duplicated 3x in `ai.ts` (`src/services/ai.ts:207-213, 241-247, 303-309`)

**Description**: The same 4-line loop that extracts an image from a Gemini response appears identically in three places:

```typescript
// Appears at lines 207-213, 241-247, and 303-309
for (const candidate of response.candidates || []) {
  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
}
throw new Error("No image generated in the response.");
```

The only variation is the error message text. Any change to the extraction logic (e.g., handling `functionCall` parts, switching the fallback MIME type, adding telemetry) must be applied to all three copies, and the current state already shows minor divergence in error message wording ("No image generated in the response." vs "No image generated in retouch pass.").

**Impact**: DRY violation. Bugs fixed in one copy will not propagate. Adding logging or error telemetry requires three edits.

**Remediation**: Extract to a shared helper:
```typescript
function extractImageFromResponse(response: GenerateContentResponse, context: string): string {
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error(`No image generated: ${context}`);
}
```

**Effort**: XS

---

#### H-4: `GoogleGenAI` Client Instantiated Per Call (`ai.ts:180, 275`)

**Description**: A `new GoogleGenAI({ apiKey })` client is constructed on every call to `generateProfessionalPortrait` and `editProfessionalPortrait`. This means a new HTTP client, connection pool, and any internal SDK state is created for every portrait generation. For a single "generate 4 portraits with retouch" operation, this means 8 client instantiations (4 generate + 4 retouch) before the edit call.

**Impact**: Unnecessary object allocation and potential connection overhead. Under high-frequency usage or stress testing, this pattern fragments memory and delays garbage collection.

**Remediation**: Instantiate the client once as a module-level singleton (after validating the API key), or use a module-level lazy initializer.

**Effort**: XS

---

#### H-5: `package.json` Name is `"react-example"` (`package.json:2`)

**Description**: The `name` field in `package.json` reads `"react-example"`. This is the scaffolding placeholder and was never updated to reflect the actual product.

**Impact**: npm scripts, error reporting, and any tooling that reads `process.env.npm_package_name` will identify this application as `react-example`. This creates confusion in logs, CI outputs, and any future publishing or versioning.

**Remediation**: Change to `"proportrait-ai"` or `"proportrait"`.

**Effort**: XS

---

#### H-6: Unused Runtime Dependencies (`package.json:21-22`)

**Description**: `better-sqlite3` (^12.4.1) and `express` (^4.21.2) are listed in `dependencies` (not `devDependencies`). Neither is imported in any file under `src/`. They may be remnants of a server-side plan that was not implemented, or intended for a backend that does not exist in the current repo.

**Impact**: These packages add ~15MB to the install footprint, increase attack surface (each is a supply chain dependency), and are bundled into the production build unless treeshaking eliminates them. The TypeScript type for `express` (`@types/express`) is already in `devDependencies`, suggesting this was a development artifact.

**Remediation**: Remove `better-sqlite3` and `express` from `dependencies`. Move `@types/express` removal from `devDependencies` if no server files exist. Also: `vite` is listed in both `dependencies` and `devDependencies` — remove from `dependencies`.

**Effort**: XS

---

#### H-7: `alert()` Used for a User-Facing Error (`PortraitGenerator.tsx:239`)

**Description**: Line 239 uses a blocking browser `alert()` to notify the user that PNG export requires Pro:
```typescript
if (exportFormat === 'png' && !isPro) { alert('PNG export is a Pro feature. Please upgrade or select JPG.'); return; }
```
`alert()` is a blocking, non-styleable OS-native dialog that breaks the UI flow, is inconsistent with the rest of the app's error presentation pattern (which uses inline `<div>` error states), and cannot be tested.

**Impact**: Poor UX inconsistency. Untestable. Blocks the main thread.

**Remediation**: Replace with `setError(...)` and render inline, consistent with other error displays in the component.

**Effort**: XS

---

### MEDIUM

---

#### M-1: Four Static Arrays Defined Inside Component Body (`PortraitGenerator.tsx:319,326,345,353`)

**Description**: The following four arrays are declared inside the `PortraitGenerator` function body with `const`, meaning they are allocated as new objects on every render:

| Variable | Line | Items | Size |
|----------|------|-------|------|
| `steps` | 319 | 4 | small |
| `STYLES` | 326 | 16 | large (icons, labels, descs) |
| `EXPRESSIONS` | 345 | 5 | medium (emojis, descriptions) |
| `IDENTITY_LOCK_ITEMS` | 353 | 5 | medium (icon refs, labels) |

`STYLES` in particular holds 16 objects each containing a React component reference, a label string, a description string, and an optional boolean — this is not trivial allocation. React does not memoize these arrays automatically; they are fully rebuilt every render cycle regardless of whether any input that they depend on changed.

Additionally, within the JSX render there are **4 more inline anonymous arrays** that are also recreated per render:
- Line 479: `[{ id: null, label: 'Single person / Just me' }, ...]` (5 items for person selection)
- Line 562: `[2, 4]` (variation count options)
- Line 820: `['Dark Business Suit', 'Tuxedo', 'Casual T-Shirt', ...]` (8 clothing items)
- Line 824: `['Solid White', 'Solid Grey', ...]` (10 background items)
- Line 828: `['Black and White', 'Warm Golden Tones', ...]` (7 color grading items)
- Line 835: `['background only', 'clothing only', ...]` (5 region options)

That is **10 total static arrays** defined inside the render path.

**Impact**: Unnecessary garbage collection pressure. React's reconciler cannot use referential equality to bail out of re-renders for child components that receive these arrays as props, even if the data never changes.

**Remediation**: Move all static arrays to module-level constants (outside the component function). For arrays that depend on component state, use `useMemo`. The 6 inline JSX arrays should become named module-level constants.

**Effort**: S

---

#### M-2: 22 `useState` Calls — God State in One Component (`PortraitGenerator.tsx:27-78`)

**Description**: The component maintains 22 `useState` declarations covering: navigation step, file upload, generation results, editing states, error handling, style/expression/identity/naturalness controls, group photo selection, compare mode, export configuration, pro status, download state, privacy notice, and preset copy feedback. This is effectively the entire application state tree in one component.

**Impact**: Any state update (even `setPresetCopied(true)` from clicking a button) triggers a reconciliation pass over all 1,057 lines of JSX. State that belongs to step 4 (export) is allocated from the very first render (step 1). Related state is not co-located with the sub-component that uses it.

**Remediation**: Per the Component Extraction Roadmap below, splitting into sub-components will naturally distribute state. For the interim, group related state into objects using `useReducer` for edit history, or extract custom hooks:
- `useEditHistory(generatedImages)` → manages `history`, `historyStep`
- `useExportSettings()` → manages `exportRatio`, `exportFormat`, `exportMode`, `cropPosition`, `isPro`, `hasTransparentBackground`, `downloadingPlatform`
- `usePortraitSettings()` → manages `identityLocks`, `naturalness`, `naturalnessPreset`, `removeBlemishes`, `expressionPreset`, `likenessStrength`, `numVariations`

**Effort**: M

---

#### M-3: `navigator.clipboard.writeText` Without Error Handling (`PortraitGenerator.tsx:298`)

**Description**: The `handleCopyPreset` function calls `navigator.clipboard.writeText(...)` without `await` and without a `.catch()`. The Clipboard API is asynchronous and will reject if the page does not have focus, if the user denies permission, or in non-secure contexts. The current code silently fails — `presetCopied` will be set to `true` and show "Copied!" even when the clipboard write failed.

**Impact**: Users think their settings were copied when they were not.

**Remediation**: `await navigator.clipboard.writeText(...).catch(() => setError('Failed to copy settings.'));`

**Effort**: XS

---

#### M-4: `handleDownloadAll` Uses Cascading `setTimeout` (`PortraitGenerator.tsx:282-285`)

**Description**:
```typescript
const handleDownloadAll = () => {
  PLATFORM_PRESETS.forEach((preset, i) => {
    setTimeout(() => handlePlatformDownload(preset.id), i * 400);
  });
};
```
This fires 5 staggered downloads using arbitrary 400ms intervals. There is no tracking of whether each download completed before the next fires, no error handling, and `downloadingPlatform` state will be set and cleared in an uncoordinated overlapping sequence (each `handlePlatformDownload` resets `downloadingPlatform` independently inside `img.onload`).

**Impact**: Race conditions between download state updates. If a download takes longer than 400ms, the UI will show a spinner for a different platform than the one currently downloading.

**Remediation**: Replace with a sequential async approach that awaits each download or uses a proper queue.

**Effort**: S

---

#### M-5: No ESLint or Prettier Configuration (`/`)

**Description**: There is no `.eslintrc`, `eslint.config.*`, `.prettierrc`, or `prettier.config.*` file in the project root. The `package.json` does not list `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, or `prettier` in any dependencies. The only code quality automation is `tsc --noEmit` run via `npm run lint`.

**Impact**: No enforcement of: unused variables, missing `key` props, `useEffect` dependency arrays, `exhaustive-deps`, accessibility rules, import ordering, consistent quote style, or trailing commas. Style drifts freely. Code review bears 100% of the quality burden.

**Remediation**: See the ESLint + Prettier Configuration section below.

**Effort**: S

---

#### M-6: Debug `console.log` Statements Left in Production Service (`ai.ts:191,219,226,258`)

**Description**: Four `console.log` calls are present in `ai.ts` that output the full AI prompt text and status messages to the browser console in production:
- Line 191: Logs the complete `finalPrompt` string (multi-line, ~30 lines of text)
- Line 219: Logs "Running retouch pass..."
- Line 226: Logs the complete `retouchPrompt`
- Line 258: Logs number of images being retouched

**Impact**: The complete prompt engineering strategy — including identity instruction phrasing, skin tone rules, and style map strings — is visible to any user with browser DevTools open. This is intellectual property disclosure. It also adds noise to production logs.

**Remediation**: Remove or gate behind a `DEBUG` flag: `if (import.meta.env.DEV) console.log(...)`.

**Effort**: XS

---

#### M-7: `isGenerating` and `isEditing` Are Separate Booleans, Not a Loading State Enum

**Description**: Two independent booleans (`isGenerating` and `isEditing`) control loading states. There is no mutual exclusion enforced between them — both could theoretically be `true` simultaneously. The `handleEdit` button is not disabled during `isGenerating`, and vice versa.

**Impact**: A fast user who clicks "Generate" and immediately navigates to step 3 to click edit could trigger `isEditing=true` while `isGenerating=true`, resulting in concurrent API calls that race to update the same history state.

**Remediation**: Replace with a loading state discriminated union: `type LoadingState = 'idle' | 'generating' | 'editing'` and a single `const [loadingState, setLoadingState] = useState<LoadingState>('idle')`.

**Effort**: S

---

#### M-8: `FileReader.onload` Uses Unsafe Type Cast (`PortraitGenerator.tsx:95`)

**Description**:
```typescript
reader.onload = (e) => {
  setSelectedImage(e.target?.result as string);
```
`FileReader.result` is typed as `string | ArrayBuffer | null`. The `as string` cast asserts it is always a string without checking. If `readAsDataURL` ever completes with an `ArrayBuffer` (which cannot happen with this specific read method, but the type system cannot statically prevent misuse), the cast would be wrong. More importantly, this pattern suppresses the type error rather than narrowing properly.

**Remediation**: `if (typeof e.target?.result === 'string') setSelectedImage(e.target.result);`

**Effort**: XS

---

### LOW

---

#### L-1: Hardcoded UI Strings — No i18n Foundation (`PortraitGenerator.tsx`)

A full count of unique hardcoded user-visible strings in `PortraitGenerator.tsx` yields approximately **87 distinct string literals** used in labels, tooltips, descriptions, button text, error messages, and hints. No i18n library or string catalog exists. Key samples:

| Line | String |
|------|--------|
| 367 | `"ProPortrait AI"` |
| 372 | `"The only AI portrait tool that actually looks like you..."` |
| 413 | `"Upload your photo"` |
| 414 | `"Drag & drop or click to browse"` |
| 462 | `"Style & Settings"` |
| 547 | `"Likeness Strength"` |
| 560 | `"Number of Variations"` |
| 664 | `"Copy Settings JSON"` / `"Copied!"` |
| 681 | `"This may take 20–40 seconds · Generating {n} identity-locked portraits"` |
| 698 | `"Review & Edit"` |
| 882 | `"Export Portrait"` |
| 984 | `"Upgrade to Pro"` |
| 993 | `"Unlock for $9.99"` |
| 239 | `"PNG export is a Pro feature. Please upgrade or select JPG."` |
| 150 | `"Failed to generate portrait. Please try again."` |
| 188 | `"Failed to edit portrait. Please try again."` |

**Impact**: Full i18n support will require a codebase-wide find-and-replace operation. The longer the delay, the more hardcoded strings accumulate.

**Remediation**: Introduce `react-i18next` or equivalent. Extract strings to a `src/i18n/en.json` catalog. See the i18n String Catalog section below.

**Effort**: L

---

#### L-2: `ComparisonSlider` Has No `onTouchEnd` Handler (`ComparisonSlider.tsx:44-45`)

**Description**: The touch handlers set `onTouchStart` and `onTouchMove` but not `onTouchEnd`. The mouse equivalent sets `isDragging = false` in a `mouseup` listener added to `window` (lines 30-31). For touch, there is no equivalent — if a touch drag ends while outside the container boundary, the slider does not stop tracking. On subsequent touch interaction, the last touch position is immediately applied without a drag start.

**Impact**: On mobile (the primary platform for viewing professional portraits on the go), the comparison slider can behave erratically.

**Remediation**: Add `onTouchEnd` to reset any tracking state, or add a `window` `touchend` listener symmetrically with the `mouseup` listener inside the `isDragging` effect.

**Effort**: XS

---

#### L-3: Inline `icons` Object Recreated on Every Render (`PortraitGenerator.tsx:1016-1019`)

**Description**: Inside the Step 4 JSX, the platform icon lookup table is defined inline inside a `.map()` callback:
```typescript
{PLATFORM_PRESETS.map((preset) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    linkedin: Linkedin, github: Github, twitter: Twitter,
    instagram: Globe, resume: FileText,
  };
```
This object is rebuilt on every render, and on every iteration of the `PLATFORM_PRESETS.map()`.

**Remediation**: Move to a module-level constant.

**Effort**: XS

---

#### L-4: `vite` Listed in Both `dependencies` and `devDependencies` (`package.json`)

**Description**: `vite` appears twice in `package.json` — once in `dependencies` (line 26: `"vite": "^6.2.0"`) and once in `devDependencies` (line 34: `"vite": "^6.2.0"`). It is a build tool and should only be in `devDependencies`.

**Remediation**: Remove from `dependencies`.

**Effort**: XS

---

## TypeScript Strict Mode Migration Plan

Enabling `strict: true` all at once on this codebase will produce hundreds of type errors. The recommended incremental path:

**Phase 1 — Safe additions (zero breaking errors expected)**
```json
{
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "useUnknownInCatchVariables": true
}
```
These flags primarily affect function signature compatibility and catch variable typing. They will not break existing code but will catch new errors going forward.

**Phase 2 — Enable `noImplicitAny`**
Run `tsc --noEmit` and fix all `any` errors. Expected sources:
- `e.target?.result as string` (FileReader, line 95) — narrow to `typeof result === 'string'`
- Event handler parameters with implicit `any`
- `catch (error)` blocks — type as `unknown` and narrow before use

Estimated errors: 5-15.

**Phase 3 — Enable `strictNullChecks`**
This is the most impactful step. Expected breaking patterns:
- `getCurrentImage()` returning `string | undefined` — propagate nullability to call sites
- `canvasRef.current!` and `canvasRef.current` usages — add explicit null checks
- `history[index]` and `generatedImages[index]` — these are array index accesses that can return `undefined`
- `e.target?.result as string` — resolved in Phase 2

Estimated errors: 20-40. Address by adding proper guards (see H-1 remediation).

**Phase 4 — Enable `noUncheckedIndexedAccess`**
This makes `array[n]` return `T | undefined`. The history and generatedImages access patterns will all produce type errors. Resolve by using `.at(n) ?? fallback` or adding null checks.

Estimated errors: 10-20 new after Phase 3 fixes.

**Phase 5 — Enable full `strict: true`**
By this point, the remaining `strict` sub-flags (`strictPropertyInitialization`, `alwaysStrict`) will produce few or zero additional errors.

**Final `tsconfig.json` additions:**
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true
}
```

---

## Test Infrastructure Setup

**Recommended stack**: Vitest + React Testing Library + Playwright

### Step 1: Install dependencies
```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
npm install -D @playwright/test
```

### Step 2: `vite.config.ts` additions
```typescript
export default defineConfig({
  // ... existing config ...
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      thresholds: { lines: 70, functions: 70, branches: 60 },
    },
  },
});
```

### Step 3: Test setup file (`src/test/setup.ts`)
```typescript
import '@testing-library/jest-dom';
```

### Step 4: Add scripts to `package.json`
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test"
}
```

### Priority test cases to write first

**`src/services/ai.ts` (unit tests)**
- `buildCorePrompt()` — verify prompt sections are assembled correctly for each style
- `buildIdentityLockInstruction()` — verify lock phrases appear when enabled/disabled
- `buildSkinDescription()` — verify correct smoothness description at 0, 50, 100
- `extractImageFromResponse()` (after H-3 refactoring) — verify base64 extraction and error throw

**`src/components/ComparisonSlider.tsx` (component tests)**
- Renders before/after images with correct `alt` text
- Drag interaction updates clip path position
- Labels are visible

**`src/components/PortraitGenerator.tsx` (integration tests)**
- File upload renders preview and advances to step 2
- "Back" navigation returns to previous step
- Error state renders when `generateProfessionalPortrait` rejects
- Undo/Redo button states reflect history correctly

### Playwright E2E (after unit coverage is established)
- Upload → generate (mocked) → download flow completes without errors
- Platform export buttons trigger downloads with correct filenames
- Compare slider is draggable

---

## ESLint + Prettier Configuration

### Install
```bash
npm install -D eslint @eslint/js typescript-eslint \
  eslint-plugin-react eslint-plugin-react-hooks \
  eslint-plugin-jsx-a11y eslint-plugin-import \
  prettier eslint-config-prettier eslint-plugin-prettier
```

### `eslint.config.mjs`
```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { project: './tsconfig.json' },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/interactive-supports-focus': 'warn',
    },
  },
  prettier,
);
```

### `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100,
  "arrowParens": "always"
}
```

### Add to `package.json` scripts
```json
{
  "lint": "eslint src --max-warnings 0",
  "lint:fix": "eslint src --fix",
  "format": "prettier --write src",
  "format:check": "prettier --check src",
  "typecheck": "tsc --noEmit"
}
```

The `react-hooks/exhaustive-deps` rule alone will surface missing dependencies in `useEffect` calls that currently exist in the codebase.

---

## Component Extraction Roadmap

`PortraitGenerator.tsx` at 1,057 lines with 22 state variables is the single highest-priority structural issue. The recommended extraction sequence, ordered by isolation ease and impact:

| Priority | New Component | Extracted From Lines | State Moved | Est. LOC Reduction |
|----------|--------------|---------------------|-------------|---------------------|
| 1 | `StepNavigation` | 377-392 | `step`, `steps` array | ~15 lines |
| 2 | `UploadStep` | 397-452 | `selectedImage`, `error`, `fileInputRef`, `showPrivacyNotice` | ~55 lines |
| 3 | `ExportStep` | 875-1051 | `exportRatio`, `exportFormat`, `exportMode`, `cropPosition`, `isPro`, `hasTransparentBackground`, `downloadingPlatform`, `canvasRef` | ~175 lines |
| 4 | `StyleStep` | 454-688 | `selectedStyle`, `expressionPreset`, `identityLocks`, `naturalness`, `naturalnessPreset`, `removeBlemishes`, `likenessStrength`, `numVariations`, `selectedPersonHint`, `customPersonDescription`, `presetCopied` | ~235 lines |
| 5 | `EditStep` | 690-872 | `editMode`, `regionTarget`, `customEditPrompt`, `compareMode`, `history`, `historyStep`, `selectedResultIndex`, `isEditing` | ~185 lines |
| 6 | `IdentityLocksPanel` | 575-593 | `identityLocks`, `toggleLock` | ~20 lines |
| 7 | `EditModePanel` | 798-865 | `editMode`, `regionTarget`, `customEditPrompt`, `isEditing` | ~70 lines |
| 8 | `PlatformExportList` | 1008-1045 | `downloadingPlatform`, `handlePlatformDownload`, `handleDownloadAll` | ~40 lines |

**Total estimated LOC reduction in `PortraitGenerator.tsx`**: from 1,057 to approximately **200-250 lines** of orchestration logic after all 8 extractions.

**Extraction order rationale**: Start with `ExportStep` (Priority 3) first after the trivial ones, because it has the most self-contained state and the canvas ref, making it the safest first large extraction. `StyleStep` and `EditStep` come later because they share callbacks with the generation flow.

---

## i18n String Catalog

**Total hardcoded user-visible strings in `src/`**: approximately **113** across all components.

Distribution:
- `PortraitGenerator.tsx`: ~87 strings
- `ComparisonSlider.tsx`: 3 strings (`'Original'`, `'AI Portrait'`, `'Drag to compare'`)
- `ApiKeyGuard.tsx`: ~8 strings
- `PrivacyNotice.tsx` (not audited in detail, estimated): ~15 strings

**Sample catalog entries for `src/i18n/en.json`**:
```json
{
  "upload.title": "Upload your photo",
  "upload.subtitle": "Drag & drop or click to browse",
  "upload.accepted_formats": "JPG, PNG, WEBP",
  "upload.best_results.title": "Best Results",
  "upload.avoid.title": "Avoid",
  "style.title": "Style & Settings",
  "style.generate_button": "Generate Portraits",
  "style.generating": "Generating {{count}} Portraits...",
  "style.wait_message": "This may take 20–40 seconds · Generating {{count}} identity-locked portraits",
  "style.likeness_strength": "Likeness Strength",
  "style.variations": "Number of Variations",
  "style.identity_locks": "Identity Locks",
  "style.identity_locks.hint": "Lock features so AI never changes them",
  "style.copy_preset": "Copy Settings JSON",
  "style.copied": "Copied!",
  "edit.title": "Review & Edit",
  "edit.compare": "Compare Original",
  "edit.exit_compare": "Exit Compare",
  "export.title": "Export Portrait",
  "export.pro.title": "Upgrade to Pro",
  "export.pro.price": "Unlock for $9.99",
  "export.pro.active": "Pro Active",
  "export.download": "Download {{tier}}",
  "errors.generate": "Failed to generate portrait. Please try again.",
  "errors.edit": "Failed to edit portrait. Please try again.",
  "errors.png_pro": "PNG export is a Pro feature. Please upgrade or select JPG.",
  "comparison.before_label": "Original",
  "comparison.after_label": "AI Portrait",
  "comparison.hint": "Drag to compare"
}
```

---

## Duplication Analysis

### 1. Response Parsing Loop — `ai.ts` (3 occurrences)

Identical block at lines 207-213, 241-247, 303-309. See H-3 for full analysis and refactoring plan.

### 2. `base64Data` Extraction Pattern (3 occurrences)

The pattern `someUrl.split(',')[1]` to extract base64 from a data URL appears at:
- `ai.ts:218` — `generatedDataUrl.split(',')[1]`
- `PortraitGenerator.tsx:121` — `selectedImage.split(',')` (destructured as `[header, base64Data]`)
- `PortraitGenerator.tsx:165` — `currentImage.split(',')[1]`

This should be a shared utility:
```typescript
// src/lib/utils.ts
export function extractBase64(dataUrl: string): string {
  const parts = dataUrl.split(',');
  if (parts.length < 2) throw new Error('Invalid data URL format');
  return parts[1];
}
export function extractMimeType(dataUrl: string): string {
  return dataUrl.split(',')[0].split(':')[1].split(';')[0];
}
```

### 3. Download Link Creation Pattern (2 occurrences)

The `document.createElement('a') / body.appendChild / click / removeChild` download pattern appears identically at lines 251-256 and 271-276. Should be extracted to:
```typescript
function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
```

### 4. API Key Retrieval (2 occurrences)

```typescript
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("API Key not found. Please select an API key.");
```
This block appears identically at `ai.ts:177-178` and `ai.ts:272-273`. Extract to a module-level function:
```typescript
function getApiKey(): string {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found. Please select an API key.");
  return apiKey;
}
```

### 5. Step Back Button Pattern (3 occurrences)

The back navigation button (`<button onClick={() => setStep(N)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm"><ArrowLeft .../>Back</button>`) appears at lines 459, 695, and 879. A `<StepBackButton>` component would eliminate this repetition.

---

## Dependencies

- **Requires**: FORGE (decomposition plan — component extraction order and interface contracts)
- **Feeds into**: GUARDIAN (test pipeline must know which components exist and their contracts before writing tests)
- **Feeds into**: All agents — code quality and strict-mode changes affect every file in the codebase

---

## Prioritized Remediation Plan

Ordered by impact-to-effort ratio. Items marked XS can be done in a single session.

| Priority | ID | Title | Effort | Impact |
|----------|----|-------|--------|--------|
| 1 | H-3 | Extract response-parsing helper in `ai.ts` | XS | High — eliminates 3x duplication |
| 2 | H-5 | Fix `package.json` name from `"react-example"` | XS | Medium — correctness |
| 3 | H-6 | Remove unused `better-sqlite3`, `express`, deduplicate `vite` | XS | Medium — security surface, install size |
| 4 | H-1 | Replace non-null assertions with guards | XS | High — prevents silent runtime crashes |
| 5 | H-2 | Add `img.onerror` to both download handlers | XS | High — prevents permanent UI freeze |
| 6 | M-6 | Remove or gate debug `console.log` calls in `ai.ts` | XS | Medium — IP protection |
| 7 | H-7 | Replace `alert()` with inline error state | XS | Medium — UX consistency |
| 8 | M-3 | Add error handling to `navigator.clipboard.writeText` | XS | Medium — correctness |
| 9 | L-4 | Remove `vite` from `dependencies` | XS | Low — housekeeping |
| 10 | H-4 | Singleton `GoogleGenAI` client | XS | Low-Medium — performance |
| 11 | M-1 | Move 10 inline static arrays to module level | S | High — render performance |
| 12 | M-5 | Add ESLint + Prettier | S | High — prevents future drift |
| 13 | C-2 | Begin TypeScript strict migration (Phase 1+2) | M | Critical — type safety |
| 14 | C-1 | Install Vitest + React Testing Library | M | Critical — regression prevention |
| 15 | M-7 | Replace dual booleans with `LoadingState` enum | S | Medium — prevents race condition |
| 16 | M-4 | Fix `handleDownloadAll` race condition | S | Medium — UX correctness |
| 17 | FORGE | Extract `ExportStep` component | M | High — LOC reduction |
| 18 | FORGE | Extract `StyleStep` component | M | High — LOC reduction |
| 19 | FORGE | Extract `EditStep` component | M | High — LOC reduction |
| 20 | M-2 | Introduce custom hooks for grouped state | M | High — maintainability |
| 21 | L-1 | i18n foundation + string extraction | L | Medium — future scalability |
| 22 | C-2 | TypeScript strict Phase 3+4 (`strictNullChecks`) | L | Critical — type safety |
| 23 | C-1 | Write test coverage to 70%+ | L | Critical — regression prevention |
