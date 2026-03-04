# MERCURY — Performance & Core Web Vitals Audit Report
**Agent**: MERCURY
**Role**: Speed engineer, Core Web Vitals optimizer
**Date**: 2026-03-02
**Status**: Complete

---

## Executive Summary

ProPortrait AI has a deeply problematic performance profile driven by three compounding issues: (1) a monolithic 1,057-line component that cannot be code-split, (2) unbounded base64 image accumulation in React state that can easily reach 8–20MB per session, and (3) synchronous canvas operations on the main thread that block UI for 100–500ms. On top of these, two server-side packages — `better-sqlite3` (native C++ addon) and `express` — sit in `dependencies`, threatening to land in the client bundle, and the application has zero resource hints for its critical external dependencies.

The combination of a likely 800KB–1.2MB initial JS bundle, no lazy-loading, and 5–10MB base64 uploads sent over the wire to the Gemini API without compression means this application will fail Core Web Vitals on any sub-Wifi connection.

---

## Bundle Analysis Report

### Declared Dependencies (all in `dependencies`, not `devDependencies`)

| Package | Estimated Gzipped Size | Should Be in Bundle? | Risk |
|---|---|---|---|
| `react` + `react-dom` ^19 | ~45KB | Yes | None |
| `@google/genai` ^1.29.0 | ~120–150KB | Yes (API calls) | Large, but necessary |
| `motion` ^12.23.24 (Framer Motion v12) | ~35–50KB | Yes | Acceptable if tree-shaken |
| `lucide-react` ^0.546.0 | **~180–250KB** | Partially | CRITICAL — imports ~30 icons, all shipped eagerly |
| `tailwind-merge` ^3.5.0 | ~8KB | Yes | None |
| `clsx` ^2.1.1 | ~1KB | Yes | None |
| `@tailwindcss/vite` + `tailwindcss` | Build only | No | Acceptable |
| `better-sqlite3` ^12.4.1 | **~2.5MB native** | **NO** | CRITICAL — native C++ addon, will break browser build |
| `express` ^4.21.2 | **~250KB** | **NO** | HIGH — server framework has no place in client bundle |
| `dotenv` ^17.2.3 | ~12KB | No (Vite handles env) | Wasted bytes |
| `vite` ^6.2.0 | Build tool | **Duplicated** | Listed in BOTH `dependencies` AND `devDependencies` |
| `@vitejs/plugin-react` ^5.0.4 | Build tool | No | Should be devDependency |
| `@tailwindcss/vite` ^4.1.14 | Build tool | No | Should be devDependency |

### Estimated Total Initial Bundle

- **Optimistic (tree-shaking works perfectly)**: ~450–550KB gzipped
- **Realistic (no manual splitting, lucide full load)**: ~700–900KB gzipped
- **Worst case (express/better-sqlite3 bypass tree-shaking)**: 1.2MB+ gzipped

### Critical Bundle Observations

1. **`better-sqlite3`** is a native Node.js addon (C++ `.node` file). It **cannot run in a browser**. If Vite attempts to bundle it, the build will either fail outright or produce a broken runtime. It should be removed from `dependencies` entirely — it has no client-side use case.

2. **`express`** has `@types/express` in `devDependencies`, confirming it was intended for a server component that no longer exists in the codebase (no server files found). It adds ~250KB of dead code to `dependencies`.

3. **`vite` is duplicated** — listed at `^6.2.0` in both `dependencies` (line 26) and `devDependencies` (line 35). This causes npm/pnpm to potentially install two copies and signals that the `package.json` was written hastily.

4. **`lucide-react`** at version ^0.546.0 imports 30+ named icons in `/src/components/PortraitGenerator.tsx` lines 2–9. Without explicit tree-shaking (which Vite/Rollup should handle for ESM), this is manageable, but the sheer number of icons (30 individual symbols) increases parse cost.

5. **`dotenv`** in `dependencies` is redundant. Vite already handles `.env` files natively via `loadEnv()` (already used in `vite.config.ts` line 7). The package serves no client-side purpose.

---

## Core Web Vitals Assessment

| Metric | Estimated Current | Target | Blocking Issues |
|--------|------------------|--------|----------------|
| LCP | **4–8s** on 3G / 2–3s on WiFi | <2.5s | Monolithic JS bundle (~800KB), external `noise.svg` blocking paint, no preconnect to Gemini, no resource hints |
| INP | **150–600ms** during interactions | <200ms | `canvas.toDataURL()` at 2048px blocks main thread 100–500ms, `FileReader.readAsDataURL()` is synchronous in callback, `handleDownloadAll` fires 5 sequential canvas operations with `setTimeout` |
| CLS | **Low risk (~0.05–0.15)** | <0.1 | `AnimatePresence` step transitions with `x: 20` offset could cause brief layout shift; background image load (`noise.svg`) could cause opacity flicker |
| TTFB | **Depends on hosting** | <600ms | No server-side concerns; purely static SPA. Likely fine if deployed on CDN. Risk: external `noise.svg` fetch adds a network round-trip before paint. |

---

## Findings

### CRITICAL

#### 1. `better-sqlite3` Native Addon in Client Bundle (`package.json:17`)
**Description**: `better-sqlite3` is declared in `dependencies`, meaning Vite will attempt to resolve and bundle it for the browser. It is a native C++ Node.js addon (`.node` file) that requires Node.js's `napi` runtime. It cannot execute in a browser. There are no server files, no API routes, and no backend entry point in this codebase that would use it.
**Impact**: Build failure or runtime crash. If Vite somehow excludes it via dead-code elimination, it still inflates `node_modules` and causes confusion. If it leaks into the bundle (e.g., through a dynamic import path), it produces a ~2.5MB corrupt chunk.
**Remediation**: `npm uninstall better-sqlite3 && npm uninstall @types/better-sqlite3` (if present). Remove from `package.json` entirely.
**Effort**: XS

---

#### 2. `express` Server Framework in Client Bundle (`package.json:20`)
**Description**: `express` ^4.21.2 is in `dependencies` with `@types/express` in `devDependencies`. No Express server file exists in the repository. This is dead code in `dependencies` that Vite may attempt to traverse.
**Impact**: ~250KB dead code in dependency graph. Vite's tree-shaking applies to ESM modules; Express uses CommonJS, making dead-code elimination unreliable. Realistic risk of 50–150KB leaking into the client bundle.
**Remediation**: `npm uninstall express` and remove `@types/express` from `devDependencies`.
**Effort**: XS

---

#### 3. Unbounded Base64 Image Accumulation in React State (`PortraitGenerator.tsx:28-42`)
**Description**: Every generated and edited image is stored as a complete base64 data URI string in React state:
```typescript
// Line 28
const [selectedImage, setSelectedImage] = useState<string | null>(null);
// Line 29
const [generatedImages, setGeneratedImages] = useState<string[]>([]);
// Line 40
const [history, setHistory] = useState<Record<number, string[]>>({});
```
A single generated image at Gemini's `imageSize: '1K'` (~1024px) is approximately 200–400KB as base64. With `numVariations` of 4 (selectable in UI, line 563) and `removeBlemishes: true` (default), every generation run produces **8 API responses** (4 initial + 4 retouch), each stored in state. The edit history strip (line 782) stores every intermediate state indefinitely. At maximum use:
- `generatedImages`: 4 images × ~350KB = ~1.4MB
- `history` per image: up to 10+ edits × ~350KB = ~3.5MB per variation
- `selectedImage` (user upload): up to 5–10MB for an uncompressed 12MP smartphone JPEG
- **Total potential in-memory React state**: 15–25MB

**Impact**: Memory pressure causes GC pauses (50–300ms jank), slow React reconciliation on every re-render, and potential tab crashes on low-memory mobile devices.
**Remediation**: Replace base64 state with `Blob` + `URL.createObjectURL()`. Store `{ url: string, blob: Blob }` pairs. Call `URL.revokeObjectURL()` when evicting from history. Cap history depth at 5–8 entries per variation.
**Effort**: M

---

#### 4. No Image Compression Before API Submission (`PortraitGenerator.tsx:90-108`)
**Description**: `handleImageUpload` reads the file directly with `FileReader.readAsDataURL()` (line 107) and stores the raw base64 string with no resize or quality reduction:
```typescript
// Line 93-107
const reader = new FileReader();
reader.onload = (e) => {
  setSelectedImage(e.target?.result as string);  // raw, uncompressed
  // ...
};
reader.readAsDataURL(file);
```
A 12-megapixel smartphone photo (e.g., iPhone 16 default) is 4032×3024px and 4–8MB as JPEG. When `handleGenerate` sends it to Gemini (line 121), it transmits the full base64 string over the network. At 5MB × 1.33 (base64 overhead) = ~6.7MB per API call.
**Impact**: +2–8 seconds added to API call time on typical broadband (50Mbps). On mobile (10Mbps), +6–16 seconds. The Gemini model does not need a 12MP source — 1024px on the long edge is sufficient.
**Remediation**: Before storing, draw the image to a canvas, resize to max 1024px on long edge, and export at JPEG quality 0.85. This reduces upload payload from ~5MB to ~150KB — a 33x reduction.
**Effort**: S

---

#### 5. Synchronous `canvas.toDataURL()` on Main Thread (`PortraitGenerator.tsx:233`)
**Description**: `renderToCanvas()` calls `canvas.toDataURL()` synchronously on the main thread:
```typescript
// Line 233
return canvas.toDataURL(exportFormat === 'png' ? 'image/png' : 'image/jpeg', 0.95);
```
For a Pro user (2048px canvas, line 240), PNG encoding at 2048×2048 is a CPU-intensive synchronous operation. Benchmarks show this blocks the main thread for:
- JPEG at 2048px: ~100–200ms
- PNG at 2048px: ~300–600ms

This runs on the UI thread, causing visible frame drops during the "Download" click interaction.
Additionally, `handleDownloadAll()` at line 281 fires 5 of these operations (via `handlePlatformDownload`) staggered only 400ms apart:
```typescript
// Line 282-284
PLATFORM_PRESETS.forEach((preset, i) => {
  setTimeout(() => handlePlatformDownload(preset.id), i * 400);
});
```
Five canvas encodes in 2-second window = sustained main thread blockage.
**Impact**: INP degradation of 200–600ms per download interaction. Noticeable jank.
**Remediation**: Use `canvas.toBlob()` (async callback-based) instead of `toDataURL()`. For Pro PNG encoding, move to `OffscreenCanvas` with a Web Worker to keep the main thread free.
**Effort**: M

---

### HIGH

#### 6. External `noise.svg` from Vercel CDN on Critical Rendering Path (`App.tsx:13`)
**Description**: The full-viewport background texture is fetched from an external CDN at render time:
```typescript
// App.tsx:13
<div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none">
```
This creates a render-blocking external resource request. The browser must:
1. Resolve DNS for `grainy-gradients.vercel.app` (50–200ms)
2. TLS handshake (100–200ms)
3. Download the SVG (varies)

This happens on every page load with no caching headers the application controls. If the external CDN is slow or unavailable, the background either flickers in late (CLS risk) or never loads.
**Impact**: +150–400ms to LCP. CLS risk if SVG loads after first paint. External service dependency creates availability risk.
**Remediation**: Download `noise.svg` once, place it in `/public/noise.svg`, and reference it as a local asset. Or generate the noise pattern with CSS `filter: url()` and a local inline SVG filter in `index.html`.
**Effort**: XS

---

#### 7. No `<link rel="preconnect">` for Gemini API (`index.html`)
**Description**: `index.html` has zero resource hints (no `preconnect`, `dns-prefetch`, `preload`):
```html
<!-- Current index.html: no hints at all -->
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  ...
</head>
```
The application's primary network dependency is `generativelanguage.googleapis.com` (Gemini API). Every time a user clicks "Generate", the browser must cold-start a TLS connection to Google's API servers.
**Impact**: First API call is 200–500ms slower than it needs to be due to missing DNS pre-resolution and TLS pre-warming.
**Remediation**: Add to `index.html`:
```html
<link rel="preconnect" href="https://generativelanguage.googleapis.com" crossorigin>
<link rel="dns-prefetch" href="https://generativelanguage.googleapis.com">
```
**Effort**: XS

---

#### 8. `vite` Duplicated in Both `dependencies` and `devDependencies` (`package.json:26,35`)
**Description**: `vite` is declared at `^6.2.0` in both dependency sections. This is a tool that should only appear in `devDependencies`. Having it in `dependencies` can cause production deployment systems (Heroku, Railway, Render, Docker with `--production` flag) to install it into the production layer unnecessarily, and in some bundler analysis tools it gets counted as a runtime dependency.
**Impact**: Confusing to automated tooling; ~3MB unnecessary install in some deployment pipelines.
**Remediation**: Remove `vite` from `dependencies`. Keep only in `devDependencies`. Same for `@vitejs/plugin-react` and `@tailwindcss/vite`.
**Effort**: XS

---

#### 9. No Code Splitting — Entire App in a Single Chunk (`vite.config.ts`)
**Description**: `vite.config.ts` has no `build.rollupOptions.output.manualChunks` configuration, no dynamic `import()` calls anywhere in the codebase, and no `React.lazy()` usage. The entire application — `PortraitGenerator.tsx` (1,057 lines), all 30+ lucide icons, `@google/genai`, and `motion` — loads as a single bundle.
**Impact**: First Contentful Paint is blocked until the entire ~800KB bundle parses. On a mid-tier mobile device (4× CPU slowdown), JS parse + eval of ~800KB takes 3–6 seconds. This directly causes LCP to fail the 2.5s threshold on mobile.
**Remediation**: See Code Splitting Plan below.
**Effort**: M

---

#### 10. `GoogleGenAI` Client Instantiated on Every API Call (`ai.ts:180, 275`)
**Description**: A new `GoogleGenAI` instance is created on every invocation of `generateProfessionalPortrait` and `editProfessionalPortrait`:
```typescript
// ai.ts:180
const ai = new GoogleGenAI({ apiKey });
// ...
// ai.ts:275
const ai = new GoogleGenAI({ apiKey });
```
The `@google/genai` SDK likely initializes HTTP connection pool, auth headers, and retry logic on each construction. With `numVariations=4` and `removeBlemishes=true`, a single "Generate" click creates **8+ sequential `GoogleGenAI` instances** (line 252: `Promise.all` for generate, then `Promise.all` for retouch).
**Impact**: Unnecessary object creation overhead; potential HTTP connection pool fragmentation; prevents keep-alive connection reuse across calls.
**Remediation**: Create a module-level singleton: `const ai = new GoogleGenAI({ apiKey: ... })` initialized once at module load, or use a lazy-init singleton pattern with memoization.
**Effort**: XS

---

### MEDIUM

#### 11. `FileReader.readAsDataURL()` Blocks Perceived Responsiveness (`PortraitGenerator.tsx:107`)
**Description**: `reader.readAsDataURL(file)` on line 107 runs on the main thread. For a 5–10MB file, this can take 50–200ms synchronously before the `onload` callback fires, during which no UI updates occur.
**Impact**: Upload button appears unresponsive for 50–200ms after file selection.
**Remediation**: Replace with `URL.createObjectURL(file)` for the preview (instant, zero-copy), and use a Web Worker or chunked `FileReader.readAsArrayBuffer()` for the base64 extraction needed by the API.
**Effort**: S

---

#### 12. `motion/react` `AnimatePresence` on Every Step Transition (`PortraitGenerator.tsx:395, 456, 692, 876`)
**Description**: Every step uses `AnimatePresence` with enter/exit animations (`x: 20` translate). While `motion` (Framer Motion v12) is generally well-optimized, the `AnimatePresence mode="wait"` on line 395 means the exit animation must complete before the enter animation begins — adding 200–400ms of perceived latency to every step transition. During this window, the new step content is mounted but invisible, holding memory for both old and new step simultaneously.
**Impact**: 200–400ms added to every step navigation interaction. Minor but measurable INP degradation.
**Remediation**: Reduce animation duration from default (likely 300ms) to 150ms via `transition={{ duration: 0.15 }}`. Consider using `mode="sync"` instead of `mode="wait"` for faster transitions.
**Effort**: XS

---

#### 13. History State Object Uses Per-Image Nested Arrays (`PortraitGenerator.tsx:40-41`)
**Description**: The history system stores full base64 strings in nested state objects:
```typescript
// Line 40-41
const [history, setHistory] = useState<Record<number, string[]>>({});
const [historyStep, setHistoryStep] = useState<Record<number, number>>({});
```
React's state reconciliation performs a shallow equality check; every `setHistory` call on line 172 spreads the entire `prev` object (`{ ...prev, [selectedResultIndex]: newHist }`), triggering a full re-render of the parent component. With 4 variations and multi-step edits, this state object can hold 20+ base64 strings (8MB+) that get spread-copied on every state update.
**Impact**: Each edit triggers spread-copy of 8MB+ state object + React reconciliation over 1,057-line component tree.
**Remediation**: Move to `useReducer` with a normalized structure. Replace base64 values with Object URLs (see finding #3).
**Effort**: M

---

#### 14. `dotenv` in `dependencies` Is Redundant (`package.json:19`)
**Description**: `dotenv` ^17.2.3 is listed as a runtime dependency. Vite already calls `loadEnv(mode, '.')` in `vite.config.ts` (line 7) and inlines the values at build time via `define`. The `dotenv` package has no effect in the browser.
**Impact**: ~12KB dead code in `dependencies`. Minor, but signals `package.json` hygiene issues.
**Remediation**: `npm uninstall dotenv`.
**Effort**: XS

---

### LOW

#### 15. Missing `loading="lazy"` on Variation Thumbnails (`PortraitGenerator.tsx:771`)
**Description**: The variation thumbnail grid and history strip both render `<img>` elements without `loading="lazy"`:
```typescript
// Line 771
<img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
// Line 785
<img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
```
Since these are base64 data URIs, lazy loading won't help with network requests, but it defers browser decode work. However, the more impactful issue is that these thumbnails display full-resolution base64 images (200–400KB each) in 48×64px containers.
**Impact**: Browser decodes full-size images to render thumbnail previews, wasting decode cycles.
**Remediation**: Generate dedicated thumbnails during the API response phase at ~100×133px, stored separately from the full-res images.
**Effort**: M

---

#### 16. No `fetchpriority="high"` on Logo (`PortraitGenerator.tsx:366`)
**Description**: The app logo at the top of the page:
```typescript
// Line 366
<img src="/logo.svg" alt="ProPortrait AI" className="w-11 h-11 rounded-xl shadow-md" />
```
The logo is LCP-candidate if it renders above the fold, but has no fetch priority hint. Combined with no `<link rel="preload">` for it in `index.html`, it loads in the default queue.
**Impact**: Minor. SVGs are small. Low priority.
**Remediation**: Add `<link rel="preload" as="image" href="/logo.svg">` to `index.html`.
**Effort**: XS

---

#### 17. API Key Exposed in Client Bundle (`vite.config.ts:11-13`)
**Description**: The Vite config inlines `GEMINI_API_KEY` directly into the client bundle:
```typescript
// vite.config.ts:11-13
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.API_KEY': JSON.stringify(env.API_KEY),
},
```
This is a security concern, not a performance concern per se, but it impacts performance architecture: the current design requires users to supply their own key, which is why it's client-side. If this ever changes to a shared key model, this would be a critical security vulnerability. Noted here for GUARDIAN (build agent) follow-up.
**Impact**: None to performance directly. Architectural risk.
**Effort**: XL (requires server-side proxy)

---

## Image Optimization Strategy

### Upload Phase (Before API Submission)

**Current**: Raw `FileReader.readAsDataURL()` → store full base64 in state → send full base64 to Gemini
**Target**: Resize to max 1024px → canvas encode at JPEG 85% → ~150KB payload

```
User uploads 12MP JPEG (5MB)
  → Draw to OffscreenCanvas at max(1024, 1024) preserving aspect ratio
  → canvas.toBlob('image/jpeg', 0.85)  [async, non-blocking]
  → Create Object URL for preview display
  → Store ArrayBuffer for API transmission
  → Convert to base64 only at API call time
```

**Size reduction**: 5MB → ~150KB (33x). API latency reduction: ~6s → ~0.2s on 50Mbps.

### Generated Images (API Responses)

**Current**: Store full base64 data URI in React state array
**Target**: Convert to Blob + Object URL immediately on receipt

```
API response base64 string
  → atob() → Uint8Array → Blob({ type: 'image/png' })
  → URL.createObjectURL(blob) → store URL string in state
  → Revoke URL on history eviction or component unmount
```

**Memory reduction**: 8 images × 350KB = 2.8MB → 8 Object URL strings = ~800 bytes in state (blobs stored in browser memory heap, but freed on revoke)

### Thumbnail Generation

For the variation grid and history strip (48×64px displays), generate dedicated thumbnails:
```
Full image Blob
  → OffscreenCanvas(100, 133)
  → drawImage at thumbnail size
  → toBlob('image/jpeg', 0.7)
  → createObjectURL for thumbnail src
```
**Memory savings per thumbnail**: 350KB → ~4KB (87x reduction for thumbnails)

### History Depth Cap

Cap history at 6 entries per variation. On push-to-full, revoke the oldest Object URL and splice the array. Current implementation has no cap (lines 175–178).

---

## Code Splitting Plan

### Phase 1: Dynamic Import for Non-Critical Steps (Effort: M)

The application has 4 clear steps that load sequentially. Steps 3 and 4 are never needed until the user has generated an image:

```typescript
// App.tsx or lazy wrapper
const ComparisonSlider = React.lazy(() => import('./components/ComparisonSlider'));
const PrivacyNotice = React.lazy(() => import('./components/PrivacyNotice'));
```

`ComparisonSlider.tsx` and `PrivacyNotice.tsx` are small but importing them eagerly forces all their CSS and JS into the initial chunk.

### Phase 2: Manual Chunk Splitting via Vite Config (Effort: S)

Add to `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-motion': ['motion'],
        'vendor-genai': ['@google/genai'],
        'vendor-icons': ['lucide-react'],
      },
    },
  },
},
```

This enables:
- Browser cache reuse of unchanged vendor chunks across deploys
- Parallel chunk loading
- Estimated savings: 200–300ms on repeat visits via cache hits

### Phase 3: Split PortraitGenerator by Step (Effort: L)

The 1,057-line `PortraitGenerator.tsx` should be decomposed into per-step components:
```
src/components/
  steps/
    Step1Upload.tsx       (~100 lines)
    Step2Style.tsx        (~300 lines)
    Step3Edit.tsx         (~250 lines)
    Step4Export.tsx       (~250 lines)
  PortraitGenerator.tsx   (~157 lines, state + orchestration only)
```

Each step component can be `React.lazy()`-loaded:
```typescript
const Step3Edit = React.lazy(() => import('./steps/Step3Edit'));
const Step4Export = React.lazy(() => import('./steps/Step4Export'));
```

Steps 3 and 4 (~500 lines + their sub-components) would be deferred until needed, reducing initial bundle by an estimated ~150–200KB.

---

## Memory Management Audit

### Memory Accumulation Points

| Location | Data Stored | Max Size | Freed When? |
|---|---|---|---|
| `selectedImage` state (line 28) | User upload base64 | 5–10MB | Next upload |
| `generatedImages[]` state (line 29) | AI output base64 × N | 1.4MB (2 imgs) – 2.8MB (4 imgs) | Next generation |
| `history` state (line 40) | All edit states × N variations | 3–15MB+ | Next generation |
| `handleExport` img (line 246) | HTMLImageElement decoded bitmap | ~50MB for 2048×2048 RGBA | GC after onload |
| `renderToCanvas` canvas (line 206) | Raw pixel buffer | ~16MB for 2048×2048 | GC, but canvas held by `canvasRef` permanently |
| Comparison slider `img` elements (ComparisonSlider.tsx:48,61) | Two decoded bitmaps simultaneously | ~8MB per image pair | Component unmount |

### Most Dangerous Leak: Export Canvas

The canvas element at line 1049 (`<canvas ref={canvasRef} className="hidden" />`) is rendered permanently in the DOM with no cleanup. When `renderToCanvas` sets `canvas.width = 2048; canvas.height = 2048` (for Pro users), the browser allocates a ~16.8MB pixel buffer (2048×2048×4 bytes). This buffer persists for the entire session because the canvas is never resized down or removed.

**Fix**: After completing `toDataURL`/`toBlob`, reset canvas dimensions to 1×1 to free the pixel buffer:
```typescript
img.onload = () => {
  const dataUrl = renderToCanvas(img, width, height);
  canvas.width = 1;  // free the pixel buffer
  canvas.height = 1;
  // ... trigger download
};
```

### History Depth — No Eviction Policy

Lines 172–178 show that `history[idx]` grows indefinitely with each edit. There is no maximum depth. A user who runs 10 edits on 4 variations accumulates 40 full-size images (40 × ~350KB = ~14MB) in a plain JavaScript object. Since React state is in-memory, this holds 14MB in the JS heap with no way to free it short of refreshing the page.

---

## Network Waterfall Analysis

### Current Loading Sequence

```
0ms     → HTML document (index.html, ~1KB)
10ms    → main.tsx bundle request begins
10ms    → /favicon.svg
10ms    → [DNS lookup: grainy-gradients.vercel.app] ← external, blocking background
50ms    → /logo.svg (not preloaded)
300ms   → main bundle arrives (~800KB gzipped), parse begins
600ms   → React hydration complete, app interactive
700ms+  → noise.svg arrives from Vercel CDN (if slow)
         → Background texture flickers in (CLS risk)
```

### Optimized Loading Sequence

```
0ms     → HTML document with resource hints:
          <link rel="preconnect" href="https://generativelanguage.googleapis.com">
          <link rel="preload" as="image" href="/logo.svg">
          <link rel="preload" as="image" href="/noise.svg">  ← local copy
10ms    → main-react chunk (~45KB) — critical path
10ms    → /logo.svg (preloaded, ready immediately)
10ms    → /noise.svg (local, no DNS lookup)
50ms    → main-genai chunk (~150KB) — parallel
50ms    → main-app chunk (~300KB) — parallel
200ms   → React hydration complete
200ms   → Gemini DNS already resolved (preconnect)
```

**Estimated improvement**: LCP reduced from 4–8s to 1.5–2.5s on 3G; INP for first generate reduced by 200–500ms.

---

## Main Thread Blocking Analysis

| Operation | Location | Duration Estimate | Frequency |
|---|---|---|---|
| `FileReader.readAsDataURL(file)` | `PortraitGenerator.tsx:107` | 50–200ms | Once per upload |
| `canvas.toDataURL('image/jpeg', 0.95)` at 1024px | `renderToCanvas` line 233 | 80–200ms | Per export |
| `canvas.toDataURL('image/png', 0.95)` at 2048px | `renderToCanvas` line 233 | 300–600ms | Per Pro PNG export |
| `handleDownloadAll` 5× canvas encodes | `PortraitGenerator.tsx:282-284` | 400–1000ms total | Once per "Download All" |
| `atob(base64)` for each history image | Implicit via img.src assignment | ~10–30ms per 350KB image | On every step navigation |
| `JSON.stringify(preset)` | `handleCopyPreset` line 298 | <1ms | Negligible |
| `identityScore` recalculation | `PortraitGenerator.tsx:313-317` | <1ms on every render | Every state change — inline computation |

### Worst-Case INP Scenario

User clicks "Download All Platforms":
1. `handleDownloadAll()` fires at t=0
2. `handlePlatformDownload('linkedin')` → canvas 800×800 JPEG → `toDataURL` → **~100ms block**
3. t=400ms: `handlePlatformDownload('github')` → canvas 500×500 → `toDataURL` → **~60ms block**
4. t=800ms: `handlePlatformDownload('twitter')` → canvas 400×400 → `toDataURL` → **~40ms block**
5. t=1200ms: `handlePlatformDownload('instagram')` → canvas 320×320 → `toDataURL` → **~30ms block**
6. t=1600ms: `handlePlatformDownload('resume')` → canvas 600×800 → `toDataURL` → **~80ms block**

Total main thread blocked time: **~310ms across 2 seconds**. INP impact: **HIGH** — exceeds the 200ms "Needs Improvement" threshold.

---

## Dependencies

- **Requires**: FORGE (architecture) — for component decomposition plan validation and state management refactor
- **Feeds into**: GUARDIAN (build optimization) — for `vite.config.ts` chunk splitting implementation, `package.json` cleanup, and tree-shaking validation

---

## Prioritized Remediation Plan

### Sprint 0: Zero-Effort Quick Wins (< 1 day)

| # | Fix | File | Impact | Effort |
|---|---|---|---|---|
| 0.1 | Remove `better-sqlite3` from dependencies | `package.json:17` | Prevents build corruption | XS |
| 0.2 | Remove `express` from dependencies | `package.json:20` | -250KB bundle risk | XS |
| 0.3 | Remove `dotenv` from dependencies | `package.json:19` | -12KB | XS |
| 0.4 | Remove `vite` from `dependencies` (keep in devDeps) | `package.json:26` | Tooling hygiene | XS |
| 0.5 | Download `noise.svg` to `/public/noise.svg`, update `App.tsx:13` | `App.tsx:13` | -150–400ms LCP, removes CLS risk | XS |
| 0.6 | Add `<link rel="preconnect">` for Gemini API | `index.html` | -200–500ms first API call | XS |
| 0.7 | Create `GoogleGenAI` singleton in `ai.ts` | `ai.ts:180,275` | Removes redundant init overhead | XS |
| 0.8 | Reduce `AnimatePresence` animation duration to 150ms | `PortraitGenerator.tsx:399,456` | -100–250ms per step transition | XS |
| 0.9 | Reset canvas to 1×1 after encode in `renderToCanvas` | `PortraitGenerator.tsx:233` | Free 16MB pixel buffer | XS |

**Estimated combined impact**: LCP -0.5–1s, INP -100–200ms, Memory -16MB persistent leak

---

### Sprint 1: Image Pipeline Overhaul (2–3 days)

| # | Fix | File | Impact | Effort |
|---|---|---|---|---|
| 1.1 | Compress uploads to max 1024px / JPEG 85% before state + API | `PortraitGenerator.tsx:90-108` | API payload -33x, upload UX instant | S |
| 1.2 | Convert API base64 responses to Object URLs | `PortraitGenerator.tsx:140-145` | -2.8MB React state, -50ms reconciliation | M |
| 1.3 | Replace `canvas.toDataURL()` with `canvas.toBlob()` (async) | `PortraitGenerator.tsx:233` | INP -200–600ms during export | M |
| 1.4 | Cap history depth at 6 entries with Object URL revocation | `PortraitGenerator.tsx:172-178` | Memory ceiling: ~2MB instead of unbounded | M |

**Estimated combined impact**: Memory reduction 15–25MB → 2–4MB; INP for export: 300–600ms → <50ms

---

### Sprint 2: Bundle and Code Splitting (2–3 days)

| # | Fix | File | Impact | Effort |
|---|---|---|---|---|
| 2.1 | Add `manualChunks` to `vite.config.ts` | `vite.config.ts` | Cache efficiency, parallel loading | S |
| 2.2 | `React.lazy()` for `ComparisonSlider`, `PrivacyNotice` | `PortraitGenerator.tsx:14-15` | Minor initial bundle reduction | S |
| 2.3 | Split `PortraitGenerator` into 4 step components | `PortraitGenerator.tsx` | -150–200KB initial bundle, maintainability | L |
| 2.4 | Add `<link rel="preload">` for `/logo.svg` | `index.html` | Minor LCP improvement | XS |

**Estimated combined impact**: Initial bundle -200–300KB gzipped; LCP -0.5–1s on mobile

---

### Sprint 3: Advanced Optimizations (1 week)

| # | Fix | File | Impact | Effort |
|---|---|---|---|---|
| 3.1 | Move canvas encoding to Web Worker via `OffscreenCanvas` | `PortraitGenerator.tsx:205-234` | Main thread fully unblocked during export | L |
| 3.2 | Generate 100×133px thumbnails for history/variations | `PortraitGenerator.tsx:766-791` | -87% decode cost for thumbnail displays | M |
| 3.3 | Replace `FileReader` with `URL.createObjectURL` + Worker | `PortraitGenerator.tsx:90-108` | Upload response instant; base64 extraction off-thread | M |
| 3.4 | Migrate history to `useReducer` with normalized state | `PortraitGenerator.tsx:40-41` | Eliminates spread-copy of 8MB+ state | M |

**Estimated combined impact**: INP fully below 100ms target for all interactions; memory stable at <4MB

---

### Target Post-Remediation Core Web Vitals

| Metric | Current Estimate | Post-Sprint-1 | Post-Sprint-2 | Post-Sprint-3 |
|--------|-----------------|---------------|---------------|---------------|
| LCP | 4–8s (3G) | 3–5s | 1.5–2.5s | 1.2–2s |
| INP | 150–600ms | 100–300ms | 100–250ms | <100ms |
| CLS | ~0.05–0.15 | ~0.02 | ~0.02 | ~0.01 |
| TTFB | <600ms | <600ms | <600ms | <600ms |
| JS Bundle | ~800KB gzipped | ~650KB | ~450KB | ~400KB |
| Session Memory | 15–25MB | 4–8MB | 3–6MB | 2–4MB |
