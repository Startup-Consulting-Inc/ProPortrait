# FORGE — Architecture & Scalability Audit Report

**Agent**: FORGE
**Role**: Systems architect, SaaS migration planner
**Date**: 2026-03-02
**Status**: Complete

---

## Executive Summary

ProPortrait AI is a fully client-side React SPA that calls the Gemini API directly from the browser, exposing the API key to every user. The entire application's state — upload flow, generation settings, image history, and export controls — is managed by 32 `useState` calls inside a single 1,057-line component (`PortraitGenerator.tsx`), with no routing, no error boundaries, no backend, and multi-megabyte base64 images held in React heap memory. The codebase is a functional MVP prototype, but has zero production-readiness: the API key model is a critical security blocker, the memory architecture will OOM on mobile devices, and the monolithic component structure makes feature development and testing progressively more expensive as complexity grows.

---

## Architecture Analysis

### Current State Diagram

```
┌────────────────────────────────────────────────────────┐
│                      BROWSER                           │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  App.tsx                                        │  │
│  │  └── ApiKeyGuard (reads process.env.GEMINI_API_KEY from Vite define) │
│  │      └── PortraitGenerator.tsx  [1,057 lines]   │  │
│  │          ├── 32 useState calls (all in one scope)│  │
│  │          ├── handleGenerate() ─────────────────────────────────────┐│
│  │          ├── handleEdit()    ─────────────────────────────────────┐││
│  │          ├── renderToCanvas() [synchronous, main thread]          │││
│  │          └── Base64 images in React state (2–8 MB each)           │││
│  └─────────────────────────────────────────────────┘  │         │││
│                                                        │         │││
└────────────────────────────────────────────────────────┘         │││
                                                                    │││
         GEMINI_API_KEY embedded in JS bundle at build time ────────┘││
                                                                     ││
         ┌───────────────────────────────────────────────────────────┘│
         ▼                                                             │
┌─────────────────────────┐                                           │
│  Google Gemini API      │◄─────────────────────────────────────────┘
│  gemini-3.1-flash-image │
│  (direct browser call)  │
└─────────────────────────┘

No backend. No auth. No database. No CDN. No rate limiting.
API key is visible in browser DevTools → Network tab for any user.
```

### Target Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER (SPA)                            │
│  React Router — URL-based step navigation (/upload, /style, ...) │
│  Zustand store — typed state slices per domain                   │
│  React Query — server state, caching, background refetch         │
│  Error Boundaries — per step/feature                             │
│  Image refs via signed URLs (not base64 in RAM)                  │
└───────────────────────┬──────────────────────────────────────────┘
                        │ HTTPS / JWT
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (e.g. AWS API GW / Nginx)         │
│  Rate limiting · JWT validation · CORS · Request logging         │
└───────┬───────────────────────┬──────────────────────────────────┘
        │                       │
        ▼                       ▼
┌───────────────┐     ┌─────────────────────────────────┐
│  Auth Service │     │  Portrait Service (Node/Express) │
│  (JWT + OAuth)│     │  POST /generate                  │
│  Supabase /   │     │  POST /edit                      │
│  Clerk        │     │  Gemini API key stays server-side│
└───────┬───────┘     └────────────┬────────────────────┘
        │                          │
        ▼                          ▼
┌───────────────┐     ┌────────────────────────────────────┐
│  User DB      │     │  Image Storage (S3 / Cloudflare R2)│
│  (Postgres /  │     │  Signed URLs · TTL expiry          │
│   SQLite)     │     │  CDN delivery                      │
└───────────────┘     └────────────────────────────────────┘
        │
        ▼
┌───────────────┐
│  Subscription │
│  (Stripe)     │
│  Usage metering│
└───────────────┘
```

---

## Component Decomposition Analysis

### PortraitGenerator.tsx State Domains

Exact `useState` call inventory (line numbers verified against 1,057-line file):

| # | Variable | Line | Type |
|---|----------|------|------|
| 1 | `step` | 27 | `Step` (1\|2\|3\|4) |
| 2 | `selectedImage` | 28 | `string \| null` (base64 data URL) |
| 3 | `generatedImages` | 29 | `string[]` (base64 array) |
| 4 | `selectedResultIndex` | 30 | `number` |
| 5 | `isGenerating` | 31 | `boolean` |
| 6 | `isEditing` | 32 | `boolean` |
| 7 | `error` | 33 | `string \| null` |
| 8 | `selectedStyle` | 34 | `StyleOption` |
| 9 | `editMode` | 35 | `EditMode` |
| 10 | `customEditPrompt` | 36 | `string` |
| 11 | `regionTarget` | 37 | `string \| null` |
| 12 | `history` | 40 | `Record<number, string[]>` (base64 per step) |
| 13 | `historyStep` | 41 | `Record<number, number>` |
| 14 | `identityLocks` | 44 | `IdentityLocks` |
| 15 | `naturalness` | 51 | `number` |
| 16 | `naturalnessPreset` | 52 | `NaturalnessPreset` |
| 17 | `removeBlemishes` | 53 | `boolean` |
| 18 | `expressionPreset` | 56 | `ExpressionPreset` |
| 19 | `likenessStrength` | 57 | `number` |
| 20 | `numVariations` | 58 | `number` |
| 21 | `selectedPersonHint` | 61 | `string \| null` |
| 22 | `customPersonDescription` | 62 | `string` |
| 23 | `compareMode` | 65 | `boolean` |
| 24 | `exportRatio` | 68 | `AspectRatio` |
| 25 | `exportFormat` | 69 | `FileFormat` |
| 26 | `exportMode` | 70 | `'fill' \| 'fit'` |
| 27 | `cropPosition` | 71 | `{ x: number; y: number }` |
| 28 | `isPro` | 72 | `boolean` (fake — not real auth) |
| 29 | `hasTransparentBackground` | 73 | `boolean` |
| 30 | `downloadingPlatform` | 74 | `string \| null` |
| 31 | `showPrivacyNotice` | 77 | `boolean` |
| 32 | `presetCopied` | 78 | `boolean` |

**Total confirmed**: 32 `useState` calls (not 42 as initially estimated, but still a severe concentration).

**Domain grouping**:

| Domain | useState Variables | Lines | Extraction Complexity |
|--------|-------------------|-------|-----------------------|
| **Navigation / Wizard** | `step` | 27 | S |
| **Upload / Source Image** | `selectedImage`, `selectedPersonHint`, `customPersonDescription`, `showPrivacyNotice` | 28, 61–62, 77 | S |
| **Generation / Async Status** | `isGenerating`, `isEditing`, `error`, `generatedImages`, `selectedResultIndex`, `numVariations`, `presetCopied` | 29–33, 58, 78 | M |
| **Style & Generation Settings** | `selectedStyle`, `identityLocks`, `naturalness`, `naturalnessPreset`, `removeBlemishes`, `expressionPreset`, `likenessStrength` | 34, 44–57 | S |
| **Edit Studio** | `editMode`, `customEditPrompt`, `regionTarget`, `history`, `historyStep`, `compareMode` | 35–41, 65 | L |
| **Export / Download** | `exportRatio`, `exportFormat`, `exportMode`, `cropPosition`, `hasTransparentBackground`, `downloadingPlatform`, `isPro` | 68–74 | M |

### Proposed Component Tree

```
src/
├── app/
│   ├── App.tsx                         (router shell, error boundaries)
│   └── routes/
│       ├── UploadRoute.tsx             (step 1)
│       ├── StyleRoute.tsx              (step 2)
│       ├── EditRoute.tsx               (step 3)
│       └── ExportRoute.tsx             (step 4)
│
├── components/
│   ├── wizard/
│   │   ├── WizardStepper.tsx           (step indicator)
│   │   └── WizardLayout.tsx            (header + stepper wrapper)
│   │
│   ├── upload/
│   │   ├── ImageUploadZone.tsx         (drag-drop + file input)
│   │   ├── PersonSelector.tsx          (group photo controls)
│   │   └── UploadTips.tsx              (best/avoid cards)
│   │
│   ├── style/
│   │   ├── StyleGrid.tsx               (16-style selector)
│   │   ├── ExpressionPicker.tsx        (5 expression presets)
│   │   ├── IdentityLockPanel.tsx       (eye/skin/hair/glasses toggles)
│   │   ├── SmoothnessControl.tsx       (naturalness slider + presets)
│   │   ├── AdvancedSettings.tsx        (likeness + variations + blemishes)
│   │   └── IdentityScoreBar.tsx        (confidence score display)
│   │
│   ├── edit/
│   │   ├── PortraitViewer.tsx          (main image + compare toggle)
│   │   ├── VariationGrid.tsx           (thumbnail strip)
│   │   ├── HistoryStrip.tsx            (undo/redo timeline)
│   │   ├── AIEditorPanel.tsx           (clothes/bg/color/region modes)
│   │   └── RegionSelector.tsx          (region lock controls)
│   │
│   ├── export/
│   │   ├── ExportPreview.tsx           (aspect ratio preview)
│   │   ├── ExportControls.tsx          (ratio / format / mode selectors)
│   │   ├── CropPositionSliders.tsx     (x/y position controls)
│   │   ├── PlatformExportList.tsx      (LinkedIn / GitHub / etc.)
│   │   └── ProUpgradeBanner.tsx        (upsell card)
│   │
│   ├── shared/
│   │   ├── ComparisonSlider.tsx        (already extracted — keep)
│   │   ├── PrivacyNotice.tsx           (already extracted — keep)
│   │   └── ApiKeyGuard.tsx             (already extracted — keep)
│   │
│   └── canvas/
│       └── CanvasRenderer.tsx          (isolated canvas worker integration)
│
├── store/
│   ├── useWizardStore.ts               (step, navigation)
│   ├── useUploadStore.ts               (selectedImage, personHint)
│   ├── useSettingsStore.ts             (style, identity, expression, naturalness)
│   ├── useGenerationStore.ts           (results, loading states, errors)
│   ├── useEditStore.ts                 (history, editMode, compareMode)
│   └── useExportStore.ts               (ratio, format, cropPosition, isPro)
│
├── services/
│   ├── ai.ts                           (keep, but proxy through backend)
│   ├── export.ts                       (canvas rendering, platform download)
│   └── storage.ts                      (future: signed URL fetching)
│
└── lib/
    ├── platformPresets.ts              (keep)
    └── utils.ts                        (keep)
```

---

## Findings

### CRITICAL

#### API Key Exposed to End Users (`vite.config.ts:11-13`)
**Description**: `GEMINI_API_KEY` is inlined into the JavaScript bundle at build time via `process.env.GEMINI_API_KEY` and `process.env.API_KEY` in the `define` block of `vite.config.ts`. Any user who opens browser DevTools → Sources or inspects the JS bundle can extract the key in full. The `ai.ts` service reads `process.env.API_KEY || process.env.GEMINI_API_KEY` directly, meaning the secret is shipped inside the client.
**Impact**: Unlimited API bill exposure. A single motivated attacker can scrape the key and run millions of Gemini calls. Google charges per image generation; leaked key = potentially unbounded financial damage. Key rotation is the only mitigation, and it only buys time.
**Remediation**:
1. Remove all `GEMINI_API_KEY` references from `vite.config.ts` `define` block.
2. Create a Node/Express backend (the `express` package is already in `package.json`).
3. Move `generateProfessionalPortrait` and `editProfessionalPortrait` to server-side endpoints (`POST /api/generate`, `POST /api/edit`).
4. Store `GEMINI_API_KEY` only in server-side `.env`; never define it for the Vite client build.
5. Add JWT auth middleware so only authenticated sessions can call the generation endpoints.
**Effort**: M

#### No Rate Limiting (`src/services/ai.ts:165-265`)
**Description**: There is zero rate limiting at any layer. `handleGenerate` fires up to 4 parallel Gemini image generation calls simultaneously (`Promise.all(Array(numImages).fill(null).map(...))`), then sends each result through a second retouch pass — up to 8 total API calls per button press. `handleDownloadAll` chains 5 canvas renders using `setTimeout` loops but does not gate on any API quota. Any user (or bot) can hammer the generate button repeatedly.
**Impact**: Gemini API quota exhaustion for all users, potential Google billing overage in the thousands of dollars per hour if abused. Double-pass retouch (`generateSingle` + `retouchPass` per image) doubles cost at 4 variations to 8 API calls per generation.
**Remediation**:
1. Add server-side rate limiting middleware (e.g. `express-rate-limit`) per user/IP: max 10 generations per hour on free tier.
2. Track usage per user in the database; reject requests that exceed the plan's monthly quota.
3. Add a debounce/cooldown UI on the Generate button (disable for 5 seconds after click).
4. Expose usage stats to users so they understand remaining quota.
**Effort**: M

#### Images Stored as Base64 Data URLs in React Heap (`src/components/PortraitGenerator.tsx:29, 40`)
**Description**: Every generated image is stored as a full base64-encoded data URL string in `useState<string[]>` (`generatedImages`) and `useState<Record<number, string[]>>` (`history`). A 1K image from Gemini (`imageSize: '1K'`) is approximately 1024×1024 px × 3 bytes per pixel × 4/3 base64 overhead ≈ 4 MB per image. With 4 variations plus a retouch pass each (8 images) plus up to N edit history states per variation stored in the `history` map, the heap can exceed 50–100 MB in a single session. On iOS Safari, which has a strict 30 MB heap limit for PWAs and tight per-tab memory budgets, this causes tab kills.
**Impact**: App crashes silently (tab killed by OS) on lower-end Android and all iOS devices after 2–3 generation cycles. No OOM error is shown — the page simply reloads, losing all state.
**Remediation**:
1. After generation, upload base64 images to a server-side blob store (S3/R2) and replace in-state with signed URLs. Only keep the active image's blob URL.
2. Use `URL.createObjectURL(blob)` for in-browser display and revoke old object URLs with `URL.revokeObjectURL` when the user navigates away from a result.
3. Limit history retention: keep max 5 history entries per variation, pruning oldest on overflow.
4. For the short term (before backend exists): compress images with `canvas.toBlob` at 0.7 quality before storing in state; this reduces per-image memory by ~70%.
**Effort**: L

#### No Error Boundaries — Full App Crash on Any Render Error (`src/App.tsx`)
**Description**: The entire application tree (`App → ApiKeyGuard → PortraitGenerator`) has no `React.ErrorBoundary` wrapping. Any unhandled exception in `PortraitGenerator.tsx` during rendering (e.g. a `null` dereference on `getCurrentImage()`, a malformed base64 string from the API, or a canvas context error) will unmount the entire component tree and display a blank white screen. The user loses all session state with no recovery path.
**Impact**: Any unexpected API response shape, network error propagated to render, or canvas failure crashes the entire app. With 1,057 lines of render logic and complex conditional rendering across 4 steps, the blast radius of render-time errors is the entire application.
**Remediation**:
1. Wrap each step's content in a per-step `ErrorBoundary` component that shows a friendly "Something went wrong — try refreshing this step" UI with a reset button.
2. Add a top-level `ErrorBoundary` in `App.tsx` as final fallback.
3. Guard `getCurrentImage()` and all canvas operations with explicit null checks and `try/catch`.
4. Add `window.onerror` and `window.onunhandledrejection` global handlers to capture and log errors to an observability service (e.g. Sentry).
**Effort**: S

---

### HIGH

#### Wizard State Not Persisted — Refresh Loses Everything (`src/components/PortraitGenerator.tsx:27`)
**Description**: The wizard step is managed by `useState<Step>(1)`. There is no routing library and no URL-based navigation. A browser refresh at step 3 resets the entire wizard to step 1, discarding the uploaded image, all generation results, all edit history, and all settings. There are no deep links — users cannot bookmark or share a session state. Back/Forward browser buttons do not navigate between wizard steps.
**Impact**: Any accidental refresh destroys a session that may have taken 40+ seconds of API generation time and cost the user money. This is a UX-breaking issue for production use.
**Remediation**:
1. Introduce React Router (`react-router-dom`). Map wizard steps to routes: `/upload`, `/style`, `/edit`, `/export`.
2. Persist generation settings (not images) to `sessionStorage` or `localStorage` via a Zustand persistence middleware so settings survive a refresh.
3. Persist generated image URLs (not base64) in `sessionStorage` so the result is recoverable after a refresh.
**Effort**: M

#### `isPro` is a Frontend Toggle — No Real Subscription Guard (`src/components/PortraitGenerator.tsx:72, 991`)
**Description**: The Pro/Free distinction is controlled by `const [isPro, setIsPro] = useState(false)`. The "Unlock for $9.99" button simply calls `setIsPro(true)`. There is no payment processing, no Stripe integration, no server-side subscription check, no JWT claim, and no persistence. The Pro gate is purely cosmetic — any user who opens the browser console and finds the React state can trivially bypass it. PNG export is "locked" to Pro users but the lock only works if JavaScript state stays `false`.
**Impact**: The monetization model has zero enforcement. If Stripe were added tomorrow, a user who paid would lose Pro status on refresh. A user who did not pay can unlock Pro in ~10 seconds via DevTools.
**Remediation**:
1. Implement Stripe Checkout or Stripe Customer Portal on the backend.
2. Store subscription tier in the user's JWT claims or in the database.
3. Enforce Pro-only features server-side (e.g. high-res export endpoint rejects non-Pro JWTs).
4. On the client, derive `isPro` from the authenticated user object, not from a local `useState`.
**Effort**: L

#### Synchronous Canvas Rendering Blocks the Main Thread (`src/components/PortraitGenerator.tsx:205-233`)
**Description**: `renderToCanvas()` is a synchronous function that runs on the main thread. It draws images using `ctx.drawImage`, applies `ctx.filter = 'blur(20px)'` for the "fit" mode blurred background, and calls `canvas.toDataURL()`. For 2048×2048 px Pro exports, `toDataURL` can take 500–2000 ms on mid-range mobile hardware. During this time, the entire UI is frozen — the user cannot interact with any element. `handleDownloadAll` calls `renderToCanvas` five times sequentially via `setTimeout` chains, blocking the thread for up to 10 seconds total.
**Impact**: UI janks and freezes during export, especially on mobile. On iOS, a >2 second main thread block can cause the browser to kill the tab.
**Remediation**:
1. Move canvas rendering to an `OffscreenCanvas` in a Web Worker. Post-message the image data URL back to the main thread.
2. Alternatively, use `createImageBitmap` + `drawImage` with `ImageBitmapRenderingContext` which is non-blocking.
3. Show a loading spinner during rendering and use `requestAnimationFrame` to schedule render work.
4. For the `handleDownloadAll` case, use a proper queue with `async`/`await` instead of nested `setTimeout`.
**Effort**: M

#### Direct Gemini API Calls from Browser with No Retry or Timeout Logic (`src/services/ai.ts:193-215, 289-310`)
**Description**: `generateSingle()`, `retouchPass()`, and `editProfessionalPortrait()` call `ai.models.generateContent()` with no timeout, no retry with exponential backoff, no circuit breaker, and no cancellation support. If Gemini returns a 429 (rate limit), 500 (server error), or times out after 60+ seconds, the error propagates to the `catch` block which sets a generic error string: `'Failed to generate portrait. Please try again.'`. There is no distinction between transient errors (retry) and permanent errors (user action required). The `Promise.all` pattern for parallel generation means one failed image kills the entire batch.
**Impact**: Intermittent Gemini API errors cause complete generation failure with no recovery. On mobile, a 60-second in-flight request keeps the browser connection open and often fails when the user locks their screen.
**Remediation**:
1. Add a per-request timeout using `AbortController` (e.g. 90 seconds).
2. Implement retry logic with exponential backoff (3 attempts, 1s/2s/4s delays) for 429 and 5xx responses.
3. Change `Promise.all` to `Promise.allSettled` so partial results are returned when only some images fail.
4. Add distinct error codes/messages: "Rate limit reached — please wait 60 seconds", "Service unavailable — check your API key", etc.
**Effort**: M

---

### MEDIUM

#### `express` and `better-sqlite3` in `package.json` But No Backend Exists
**Description**: `package.json` declares `express@^4.21.2`, `better-sqlite3@^12.4.1`, `dotenv@^17.2.3`, and `@types/express@^4.17.21` as dependencies. No backend source files exist anywhere in the project. These packages are included in the production bundle analysis and contribute to `node_modules` size, but they are dead code. More concerning, `better-sqlite3` is a native Node.js addon that Vite cannot bundle for the browser; if any code ever tries to import it on the client, the app will throw at runtime.
**Impact**: Confused developer experience — the project appears to have a backend but does not. `better-sqlite3` cannot run in a browser context; any accidental import from a client-side file would silently fail or crash.
**Remediation**:
1. Either scaffold the backend (recommended) in a `/server` or `/api` directory using the existing `express` + `better-sqlite3` dependencies.
2. Or remove the dead dependencies: `npm uninstall express better-sqlite3 dotenv @types/express tsx` until the backend is actually started.
3. Add a `server/` directory to the project structure plan and split the monorepo into `client/` and `server/` if using a monorepo approach.
**Effort**: S (removal) / L (scaffolding backend)

#### `handleImageUpload` Stores Full Base64 Data URL as Upload Source (`src/components/PortraitGenerator.tsx:90-108`)
**Description**: `FileReader.readAsDataURL()` converts the user's upload to a base64-encoded data URL stored in `setSelectedImage(...)`. For a 5 MB JPEG, this creates a ~6.7 MB string in JavaScript memory. This string is then passed directly to the AI service, split on the comma to extract raw base64. The original file object is discarded; there is no file size validation, no MIME type validation beyond the `accept="image/*"` attribute, and no dimension check.
**Impact**: Users can upload multi-megabyte TIFFs or 50 MB RAW camera files, immediately filling the JS heap. The `accept` attribute is easily bypassed. A 100 MB file would likely OOM the tab immediately.
**Remediation**:
1. Add client-side validation: enforce max 10 MB file size, validate MIME type from `file.type`, validate image dimensions after decode.
2. Use `canvas.drawImage` + `canvas.toBlob` to re-encode the upload at a normalized resolution (e.g. max 1024px on the long edge) before storing in state. This caps the in-memory upload at ~300 KB.
3. Long-term: upload the file to a server-side multipart endpoint and receive back a storage key/URL rather than holding the full file in browser memory.
**Effort**: S

#### Inline Constant Arrays in Render Function (`src/components/PortraitGenerator.tsx:326-359`)
**Description**: `STYLES` (16 elements), `EXPRESSIONS` (5 elements), and `IDENTITY_LOCK_ITEMS` (5 elements) are declared as `const` arrays inside the `PortraitGenerator` function body, causing them to be reconstructed on every render. While React's reconciler will not re-render child components unnecessarily, these array allocations occur on every state update — and with 32 `useState` calls in scope, any state change triggers a full re-render of the function and re-allocation of all three arrays.
**Impact**: Unnecessary garbage collection pressure on every keystroke, slider drag, and state change. Minor performance issue currently but will compound as the component grows.
**Remediation**: Move `STYLES`, `EXPRESSIONS`, and `IDENTITY_LOCK_ITEMS` to module-level constants (outside the component function). They are pure static data and do not depend on props or state.
**Effort**: XS

#### No TypeScript Strict Mode (`tsconfig.json`)
**Description**: The `tsconfig.json` does not enable `"strict": true` or any of its constituent flags (`noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, etc.). This means TypeScript's most valuable safety nets are inactive. For example, `getCurrentImage()` returns `string | undefined` but is used in JSX as `src={getCurrentImage()}` without null checks in several places — these would be compile errors under `strictNullChecks`.
**Impact**: Silent null/undefined runtime errors that would be caught at compile time under strict mode. As the codebase grows, the absence of strict mode allows increasingly unsafe patterns to accumulate.
**Remediation**:
1. Add `"strict": true` to `tsconfig.json` `compilerOptions`.
2. Fix resulting type errors (primarily null-check guards on `getCurrentImage()` and canvas context).
3. Enable `"noUncheckedIndexedAccess": true` to catch unsafe array index access.
**Effort**: S

#### Privacy Notice Dismissal Not Persisted (`src/components/PortraitGenerator.tsx:77`)
**Description**: `showPrivacyNotice` is `useState(true)`. When dismissed, the notice disappears for the current session, but on every refresh or revisit, it reappears. This is a minor UX annoyance but signals that no browser persistence layer (`localStorage`/`sessionStorage`) is used anywhere in the application.
**Impact**: Low severity UX friction; signals absence of any persistence strategy.
**Remediation**: Write dismissal to `localStorage`: `localStorage.setItem('privacy_notice_dismissed', 'true')` and initialize state with `useState(() => !localStorage.getItem('privacy_notice_dismissed'))`.
**Effort**: XS

---

### LOW

#### Hardcoded `$9.99` Price in JSX (`src/components/PortraitGenerator.tsx:991`)
**Description**: The Pro upgrade price is hardcoded as `"Unlock for $9.99"` directly in JSX. This is not driven by a config, a Stripe price object, or a feature flag. Changing the price requires a code change and redeployment.
**Impact**: Inflexible pricing; cannot A/B test prices or run promotions without code changes.
**Remediation**: Extract pricing to a `src/config/pricing.ts` constants file. Long-term, fetch active prices from the Stripe API at runtime.
**Effort**: XS

#### `handleDownloadAll` Uses `setTimeout` Stagger Without Promise Tracking (`src/components/PortraitGenerator.tsx:281-285`)
**Description**: `handleDownloadAll` calls `PLATFORM_PRESETS.forEach((preset, i) => setTimeout(() => handlePlatformDownload(preset.id), i * 400))`. There is no coordination — if an earlier download is still rendering when the next one fires, two canvas operations can race on `canvasRef.current`. The `downloadingPlatform` state only tracks one platform at a time.
**Impact**: On slow devices, canvas renders may interleave and produce corrupted downloads. The user has no feedback that all downloads have completed.
**Remediation**: Convert to an `async` loop with `await` on each render, or use a proper download queue. Show a progress indicator (e.g. "2/5 downloaded").
**Effort**: S

#### `console.log` Statements in Production Code (`src/services/ai.ts:191, 219, 258`)
**Description**: `ai.ts` has 4 `console.log` calls that print the full AI prompt and generation status to the browser console. The prompt content could be considered a trade secret (proprietary prompt engineering). In production, these statements are visible to any developer who opens DevTools.
**Impact**: Intellectual property exposure (prompt leakage), unnecessary console noise, potential confusion for end users who open DevTools.
**Remediation**: Replace with a conditional logger: `if (process.env.NODE_ENV === 'development') console.log(...)`. Use a structured logging library (e.g. `pino-browser`) for production-safe logging.
**Effort**: XS

#### No Accessibility (ARIA) Attributes on Interactive Controls (`src/components/PortraitGenerator.tsx`, multiple)
**Description**: The style selector buttons, expression presets, identity lock toggles, and export controls have no `aria-label`, `aria-pressed`, `aria-selected`, or `role` attributes. The slider inputs (`<input type="range">`) have no associated `<label>` elements (the label is a sibling `<div>`, not associated via `htmlFor`/`id`). The `ComparisonSlider` has no keyboard interaction — it only responds to mouse events (`onMouseDown`, `onTouchStart`).
**Impact**: The application is inaccessible to screen reader users and keyboard-only users, violating WCAG 2.1 AA. This is a legal liability in jurisdictions with accessibility requirements (ADA, EU EAA).
**Remediation**: Add `aria-pressed` to toggle buttons, `aria-label` to icon-only buttons, `htmlFor`/`id` associations to range inputs, and keyboard event handlers to `ComparisonSlider`.
**Effort**: M

---

## Backend API Design

The API key exposure issue is the highest-priority architectural change. The backend requires these endpoints at minimum:

```
POST   /api/auth/session          → Issue JWT (Supabase/Clerk handles this)
GET    /api/auth/me               → Current user + subscription tier

POST   /api/portraits/generate    → Generate portrait (proxies Gemini, rate-limited)
       Body: { imageKey, style, likenessStrength, numVariations, identityLocks,
               naturalness, expressionPreset, selectedPersonHint, removeBlemishes }
       Returns: { portraitKeys: string[] }   ← S3/R2 keys, not base64

POST   /api/portraits/edit        → Edit portrait (proxies Gemini)
       Body: { portraitKey, instruction, regionOnly? }
       Returns: { portraitKey: string }

GET    /api/portraits/:key/url    → Return signed CDN URL (TTL: 1 hour)

POST   /api/uploads/presign       → S3 presigned PUT URL for direct browser upload
       Returns: { uploadUrl, key }

GET    /api/users/usage           → Current period generation count + limit

POST   /api/subscriptions/create-session → Stripe Checkout session
POST   /api/subscriptions/portal         → Stripe Customer Portal
POST   /api/webhooks/stripe              → Stripe webhook handler (plan sync)
```

**Rate Limiting Strategy**:
- Free tier: 10 generate calls / hour / user, 50 / month
- Pro tier: 100 generate calls / hour / user, 500 / month
- API Gateway level: 100 requests / minute / IP (bot protection)

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  plan          TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'pro'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
);

-- Portraits (metadata only — images live in S3/R2)
CREATE TABLE portraits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_key   TEXT NOT NULL,           -- S3/R2 object key
  style         TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  expires_at    TIMESTAMPTZ,             -- NULL = keep; set for free tier auto-deletion
  is_original   BOOLEAN DEFAULT FALSE,  -- TRUE for user upload source
  parent_id     UUID REFERENCES portraits(id)  -- edit history chain
);

-- Usage tracking
CREATE TABLE usage_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  event_type    TEXT NOT NULL,  -- 'generate' | 'edit' | 'export'
  api_calls     INT NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions (synced from Stripe webhooks)
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES users(id),
  stripe_sub_id         TEXT UNIQUE NOT NULL,
  status                TEXT NOT NULL,  -- 'active' | 'past_due' | 'canceled'
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  plan                  TEXT NOT NULL
);

-- Indexes
CREATE INDEX idx_portraits_user_id ON portraits(user_id);
CREATE INDEX idx_usage_events_user_period ON usage_events(user_id, created_at);
```

---

## Infrastructure Cost Model

All estimates assume Gemini `gemini-3.1-flash-image-preview` pricing at ~$0.04 per image generation (estimate; verify against Google AI pricing).

| Tier | Users/Month | Generations | Gemini Cost | Hosting | Storage | Total/Month |
|------|-------------|-------------|-------------|---------|---------|-------------|
| Seed | 100 | ~500 (5/user avg) | $20 | $20 (Railway/Render) | $2 (10 GB R2) | ~$42 |
| Growth | 1,000 | ~8,000 | $320 | $50 (dedicated dyno) | $15 (100 GB R2) | ~$385 |
| Scale | 10,000 | ~60,000 | $2,400 | $200 (ECS/k8s) | $100 (1 TB R2) | ~$2,700 |

**Revenue model to cover costs**:
- Free tier: 5 generations/month (subsidized by Pro)
- Pro at $9.99/month: break-even at ~39 Pro users per 1,000 total users (4% conversion)
- Industry SaaS conversion benchmark: 2–5% — this is viable

**Key cost drivers**:
- Gemini API: dominant cost. The double-pass retouch (8 API calls at 4 variations) doubles this. Evaluate whether the retouch pass is worth 2x cost.
- Storage: base64-to-URL migration eliminates browser memory issues and reduces storage cost via CDN caching.

---

## State Management Migration Plan

**Recommended library**: Zustand (lightweight, TypeScript-first, no boilerplate, supports persistence middleware)

### Phase 1: Extract to Zustand Stores (2–3 days)
Create 6 stores matching the identified state domains without changing the component structure:

```typescript
// src/store/useWizardStore.ts
interface WizardStore {
  step: Step;
  setStep: (step: Step) => void;
}

// src/store/useUploadStore.ts
interface UploadStore {
  selectedImage: string | null;
  selectedPersonHint: string | null;
  customPersonDescription: string;
  showPrivacyNotice: boolean;
  setSelectedImage: (img: string | null) => void;
  setSelectedPersonHint: (hint: string | null) => void;
  setCustomPersonDescription: (desc: string) => void;
  dismissPrivacyNotice: () => void;
  reset: () => void;
}

// src/store/useSettingsStore.ts
interface SettingsStore {
  selectedStyle: StyleOption;
  identityLocks: IdentityLocks;
  naturalness: number;
  naturalnessPreset: NaturalnessPreset;
  removeBlemishes: boolean;
  expressionPreset: ExpressionPreset;
  likenessStrength: number;
  numVariations: number;
  // setters...
}

// src/store/useGenerationStore.ts
interface GenerationStore {
  generatedImages: string[];      // → future: string[] of signed URLs
  selectedResultIndex: number;
  isGenerating: boolean;
  isEditing: boolean;
  error: string | null;
  presetCopied: boolean;
  // setters + reset...
}

// src/store/useEditStore.ts
interface EditStore {
  editMode: EditMode;
  customEditPrompt: string;
  regionTarget: string | null;
  history: Record<number, string[]>;
  historyStep: Record<number, number>;
  compareMode: boolean;
  // setters + undo/redo actions...
}

// src/store/useExportStore.ts
interface ExportStore {
  exportRatio: AspectRatio;
  exportFormat: FileFormat;
  exportMode: 'fill' | 'fit';
  cropPosition: { x: number; y: number };
  isPro: boolean;
  hasTransparentBackground: boolean;
  downloadingPlatform: string | null;
  // setters...
}
```

### Phase 2: Add React Router (1 day)
- Install `react-router-dom`
- Replace `useState<Step>` navigation with `useNavigate`/route params
- Map `/upload`, `/style`, `/edit/:index`, `/export` routes

### Phase 3: Add Zustand Persist Middleware (0.5 days)
- Persist `useSettingsStore` to `localStorage` (settings survive refresh)
- Persist `useWizardStore` step to `sessionStorage`
- Do NOT persist base64 image data — use `partialize` to exclude image arrays

### Phase 4: Migrate to React Query (2–3 days, requires backend)
- Replace `handleGenerate`/`handleEdit` async logic with `useMutation` hooks
- Automatic retry, loading states, and error handling via React Query
- Cache generation results by session key

---

## Component Extraction Roadmap

Prioritized by impact and independence (lowest coupling extracted first):

| Priority | Component | Extract From (Lines) | Why Now |
|----------|-----------|----------------------|---------|
| 1 | `WizardStepper` | 319–392 | Pure display, zero state dependency |
| 2 | `IdentityScoreBar` | 312–317, 639–656 | Pure computed display, extract with `identityScore` calc |
| 3 | `IdentityLockPanel` | 353–359, 574–593 | Self-contained toggle group |
| 4 | `SmoothnessControl` | 307–310, 595–618 | Slider + preset buttons, clear boundary |
| 5 | `ExpressionPicker` | 345–351, 518–535 | Read-only button grid |
| 6 | `StyleGrid` | 326–343, 502–516 | Read-only selection grid |
| 7 | `PersonSelector` | 466–499 | Step 2 sub-section, minimal state |
| 8 | `AdvancedSettings` | 537–657 | Wrapper for sliders 15–20 |
| 9 | `VariationGrid` | 764–775 | Thumbnail strip, well-bounded |
| 10 | `HistoryStrip` | 777–791 | Phase 3 history, clear interface |
| 11 | `AIEditorPanel` | 793–865 | Largest sub-section in Step 3 |
| 12 | `PortraitViewer` | 706–759 | Main image + compare/undo overlay |
| 13 | `ExportControls` | 900–976 | Step 4 right panel |
| 14 | `PlatformExportList` | 1008–1044 | Self-contained platform buttons |
| 15 | `CanvasRenderer` | 205–285 | Move to Web Worker + service |

After extraction, `PortraitGenerator.tsx` becomes a thin route-level composition file (~100 lines), coordinating extracted components and Zustand stores.

---

## Dependencies on Other Agents

- **Requires input from**: SENTINEL (security constraints — auth model, JWT scope, API key storage policy — must be defined before backend API design is finalized)
- **Feeds into**: VAULT (data model alignment — the database schema above must be validated against VAULT's storage design); PRISM (component decomposition — extraction roadmap is the handoff to PRISM for implementation); GUARDIAN (infrastructure design — cost model and backend topology inform GUARDIAN's deployment strategy)

---

## Prioritized Remediation Plan

1. **Move API key to server-side backend** — Eliminates the critical security exposure. Use existing `express` + `dotenv` in `package.json`. Create `POST /api/generate` and `POST /api/edit` endpoints. This is the single highest-leverage change; nothing else matters if the API key is leaked.

2. **Add React Error Boundaries** — Low effort, immediate stability improvement. Wrap each step in an `ErrorBoundary`. Prevents blank-screen crashes from taking down the entire session.

3. **Validate and normalize uploads client-side** — Add 10 MB file size limit, MIME validation, and canvas-based resolution normalization to prevent OOM on large uploads. Can be done in `handleImageUpload` in ~30 lines.

4. **Extract state into Zustand stores** — Directly enables all subsequent refactoring. Without this, every component extraction carries the risk of prop-drilling complexity. This unblocks steps 5–8.

5. **Add React Router for step navigation** — URL-based navigation prevents refresh data loss, enables deep links, and makes the wizard state predictable and testable. Pairs with Zustand persist middleware.

6. **Replace base64 image storage with object URLs** — Use `URL.createObjectURL` + `URL.revokeObjectURL` to reduce heap pressure immediately. Full server-side storage (S3/R2) is the long-term solution but this interim step unblocks mobile stability.

7. **Extract top 5 components from PortraitGenerator.tsx** — Begin with `WizardStepper`, `StyleGrid`, `ExpressionPicker`, `IdentityLockPanel`, `SmoothnessControl` — all pure/low-coupling. Each extraction reduces the file size by 30–80 lines and adds a testable unit.

8. **Move canvas rendering to a Web Worker** — Eliminates main thread blocking on export. Use `OffscreenCanvas` API. Required before Pro export (2048px) can be marketed as a feature without causing tab kills.

9. **Implement real subscription enforcement** — Wire Stripe. Store plan in JWT. Enforce Pro features server-side. The current `useState(false)` gate is not monetization — it is a placeholder.

10. **Add server-side rate limiting and usage metering** — Once the backend exists, add `express-rate-limit` and record all generation events in the `usage_events` table. Required for any public launch.
