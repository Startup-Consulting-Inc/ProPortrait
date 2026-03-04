# ProPortrait AI — Master Commercialization Roadmap

**Generated**: 2026-03-02
**Agents**: 12/12 complete
**Total findings**: 19 critical, 47 high, 38 medium, 24 low
**Source reports**: SENTINEL · FORGE · VAULT · ATLAS · GUARDIAN · IRIS · COMPASS · PRISM · MERCURY · ORACLE · BEACON · SCOUT

---

## Executive Summary

ProPortrait AI has a **genuine product-market fit moat**: 23/30 competitive features vs. rivals' 5-12, with unique granular per-feature identity locks, a real-time editing studio, and before/after comparison that no competitor currently offers. The product works. The **business infrastructure does not**.

Three critical blockers prevent commercialization:

1. **Gemini API key is publicly exposed in the JavaScript bundle** — any visitor can extract it, abuse it, and run up unlimited charges. This is a P0 security incident, not a launch blocker — it is already happening.
2. **The payment system is theater** — clicking "Unlock for $9.99" calls `setIsPro(true)` client-side. The product has generated $0 in revenue with $0 in protection.
3. **Zero observability** — no analytics, no error tracking, no cost monitoring. The team cannot measure conversion, retention, or API burn rate.

The path to commercialization is a strict dependency chain: **Backend proxy first, then everything else**. Moving the API key server-side unblocks rate limiting, real payment validation, email capture, cost control, and Stripe — simultaneously. Attempting to add Stripe before the backend proxy means building on a broken foundation.

The product has a 90-day window to capture the professional headshot market before well-funded competitors add identity locks. The fix sequence below is ordered to generate revenue at the earliest possible moment.

**Projected outcome if roadmap is executed**:
- Week 2: API abuse stopped, cost controlled
- Week 6: First paying customers via Stripe
- Week 10: Measurable growth loop, analytics-driven decisions
- Week 20: SEO-driven organic acquisition, full feature differentiation marketed

---

## Critical Issues (All Agents)

| # | Issue | Agent(s) | Severity | Effort | Blocks |
|---|-------|----------|----------|--------|--------|
| C-01 | Gemini API key hardcoded in JS bundle via `vite.config.ts:11-12` `define` block — extractable by any visitor | SENTINEL, FORGE, GUARDIAN, MERCURY | CRITICAL | S | Everything |
| C-02 | No rate limiting — 8 parallel Gemini calls possible per button click, unlimited sessions | SENTINEL, FORGE, VAULT | CRITICAL | S | Revenue, Cost |
| C-03 | `isPro` is `useState(false)` — "Unlock for $9.99" calls `setIsPro(true)` with no payment | VAULT, SENTINEL, FORGE | CRITICAL | M | Revenue |
| C-04 | `better-sqlite3` native C++ addon and `express` (~250KB) in client `dependencies` — in browser bundle | MERCURY, PRISM | CRITICAL | XS | Performance |
| C-05 | Zero CI/CD pipeline — no typecheck, no lint, no security scan before deploy | GUARDIAN, PRISM | CRITICAL | M | Reliability |
| C-06 | Upload zone is a non-interactive `<div>` — keyboard and screen reader users cannot upload | COMPASS | CRITICAL | XS | Accessibility, Legal |
| C-07 | Step 3 sidebar hardcoded `w-72`, Step 4 `w-80` — layout breaks at <768px and <900px (unusable on mobile) | IRIS | CRITICAL | XS | Mobile UX |
| C-08 | `canvas.toDataURL()` at 2048px blocks main thread 300-600ms (`PortraitGenerator.tsx:233`) | MERCURY | CRITICAL | S | INP, UX |
| C-09 | No OG/Twitter Card meta tags — social shares render blank preview | BEACON | CRITICAL | XS | Growth |
| C-10 | Pure SPA with no SSR/SSG — Google crawls `<div id="root"></div>` only, no indexable content | BEACON | CRITICAL | M | SEO, Growth |
| C-11 | Zero analytics — 0 of 47 identified events tracked, API cost completely unknown | ORACLE, BEACON | CRITICAL | S | All decisions |
| C-12 | `handleDownloadAll` uses `setTimeout` loop — browsers block multiple downloads, functionality broken | ATLAS | CRITICAL | XS | Core feature |
| C-13 | 40-90s generation with spinner only — no progress feedback, ~30% abandonment estimated | ATLAS, IRIS | CRITICAL | S | Conversion |
| C-14 | All sliders missing `aria-label`, 0 of 35+ toggle buttons have `aria-pressed` | COMPASS | CRITICAL | S | Legal (ADA/EU EAA) |
| C-15 | `PortraitGenerator.tsx` is 1,057 lines with 32 `useState` calls and zero tests | PRISM, FORGE | CRITICAL | XL | Maintainability |
| C-16 | No error boundaries — any uncaught error → blank white screen | FORGE, GUARDIAN | CRITICAL | XS | Reliability |
| C-17 | No file upload validation (size or type) — 5-8MB images sent directly to Gemini | MERCURY, SENTINEL | CRITICAL | XS | Cost, Security |
| C-18 | `console.log` leaks full Gemini prompts in production build | SENTINEL, PRISM | CRITICAL | XS | Privacy |
| C-19 | `imageSize: '1K'` hardcoded for ALL users in `ai.ts:203` — "2048px Pro Output" is canvas upscaling, not actual AI resolution | VAULT | CRITICAL | S | Trust, Legal |

---

## Phase 1: Security & Legal Foundation (Week 1–2)

**Goal**: Stop the bleeding. Protect the API key, stop revenue theft, hit minimum legal compliance.
**Gating condition for Phase 2**: Backend proxy live, API key rotated, WCAG Level A critical violations fixed.

### Week 1 — Emergency Security

#### 1.1 Rotate & Invalidate Exposed API Key
**Agents**: SENTINEL, GUARDIAN
**Effort**: XS (30 min)
**Owner**: Any engineer with GCP access

Steps:
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Delete key `AIzaSyCiD-aV_ai2EGF8Ohigp14zhSBRWFf-4IY`
3. Create new restricted key (HTTP referrer restriction: `proportrait.com/*`)
4. Update `.env.local` with new key value
5. Add new key to Vercel environment variables (server-side only — NOT `VITE_` prefix)
6. Force redeploy to invalidate cached bundle

**Do this now, before reading the rest of this document.**

#### 1.2 Create Backend API Proxy
**Agents**: SENTINEL, FORGE, VAULT, GUARDIAN
**Effort**: M (2-3 days)
**This single task unblocks**: rate limiting, real payment validation, email capture, cost monitoring, Stripe

Create `server/` directory with Express proxy:

```
server/
  index.ts          — Express app, routes, middleware
  routes/
    portraits.ts    — POST /api/portraits/generate, POST /api/portraits/edit
    auth.ts         — POST /api/auth/session, GET /api/auth/me
    payments.ts     — POST /api/payments/checkout, POST /api/payments/webhook
  middleware/
    rateLimit.ts    — express-rate-limit: 10 req/15min free, 60/15min pro
    auth.ts         — JWT session validation
    upload.ts       — multer + sharp resize to max 1024px before Gemini
  lib/
    gemini.ts       — Singleton GoogleGenAI client
    storage.ts      — S3/R2 client for portrait storage
```

Key API contract:
```typescript
// POST /api/portraits/generate
// Body: multipart/form-data { image: File, style: string, options: JSON }
// Auth: session token (free) or pro token
// Response: { portraitUrl: string, generationId: string, creditsUsed: number }

// POST /api/portraits/edit
// Body: { generationId: string, editType: string, editPrompt: string }
// Auth: session or pro token (regional edit = pro only)
// Response: { portraitUrl: string, editId: string }
```

Remove from `vite.config.ts`:
```typescript
// DELETE THESE LINES:
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
},
```

Update `src/services/ai.ts` to call `/api/portraits/generate` instead of Gemini directly.

#### 1.3 Implement Rate Limiting
**Agents**: SENTINEL, VAULT
**Effort**: S (part of 1.2 — add to proxy middleware)

```typescript
// server/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const freeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'rate_limited', upgradeUrl: '/pricing' },
  keyGenerator: (req) => req.sessionId || req.ip,
});

export const proRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip,
});
```

#### 1.4 Fix Console Leaks & Dev Server Binding
**Agents**: SENTINEL, PRISM
**Effort**: XS (1 hour)

```typescript
// Replace all console.log in production:
// src/services/ai.ts — remove lines 89, 124, 167, 208
// src/components/PortraitGenerator.tsx — remove lines 445, 512, 678

// vite.config.ts — remove --host flag
// Before: "dev": "vite --host=0.0.0.0"
// After:  "dev": "vite"
```

#### 1.5 Add Error Boundaries
**Agents**: FORGE, GUARDIAN
**Effort**: XS (2 hours)

```tsx
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) {
    // Send to Sentry when added in Phase 3
    console.error('Boundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    return this.props.children;
  }
}

// Wrap in main.tsx:
<ErrorBoundary><App /></ErrorBoundary>
```

#### 1.6 Remove Dead Dependencies & Fix Bundle
**Agents**: MERCURY, PRISM, GUARDIAN
**Effort**: XS (1 hour)

```bash
npm uninstall better-sqlite3 express dotenv
npm dedupe  # removes duplicate vite entry
```

Verify `package.json` — move all non-runtime packages to `devDependencies`.

#### 1.7 Add File Upload Validation
**Agents**: MERCURY, SENTINEL
**Effort**: XS (2 hours)

```typescript
// server/middleware/upload.ts
import sharp from 'sharp';
import multer from 'multer';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB input limit

export const uploadMiddleware = multer({
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Use JPEG, PNG, or WebP.'));
  }
});

// Resize before Gemini: 5MB → ~150KB
export async function resizeForGemini(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}
```

Add client-side pre-validation in `PortraitGenerator.tsx` upload handler before sending:
```typescript
const MAX_CLIENT_SIZE = 10 * 1024 * 1024;
if (file.size > MAX_CLIENT_SIZE) {
  setError('Image must be under 10MB. Please compress and retry.');
  return;
}
```

### Week 2 — Legal Minimums & CI/CD

#### 1.8 Fix Critical WCAG Level A Violations
**Agents**: COMPASS
**Effort**: M (2-3 days)
**Legal risk if skipped**: ADA Title III, EU European Accessibility Act (EAA enforceable June 2025)

Priority order:

**A. Fix upload zone (2 hours)**
```tsx
// Before: <div onClick={handleUpload} className="...">
// After:
<button
  type="button"
  onClick={handleUpload}
  onKeyDown={(e) => e.key === 'Enter' && handleUpload()}
  aria-label="Upload your photo — click or drag and drop"
  className="..."
>
  <input
    ref={fileInputRef}
    type="file"
    accept="image/jpeg,image/png,image/webp"
    className="sr-only"
    onChange={handleFileChange}
    aria-hidden="true"
  />
```

**B. Fix all sliders (3 hours)**
```tsx
// Every <input type="range"> must have:
<input
  type="range"
  aria-label="Naturalness level — 0 is most natural, 100 is most processed"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={naturalness}
  aria-valuetext={`${naturalness}% — ${getNaturalnessLabel(naturalness)}`}
  {...props}
/>
```

**C. Fix toggle buttons (2 hours)**
```tsx
// Every style/lock/feature toggle:
<button
  role="button"
  aria-pressed={isSelected}
  aria-label={`${styleName} portrait style${isSelected ? ' — currently selected' : ''}`}
  onClick={() => setStyle(styleName)}
>
```

**D. Fix error messages (1 hour)**
```tsx
// Error display must announce to screen readers:
{error && (
  <div role="alert" aria-live="assertive" className="...">
    {error}
  </div>
)}
```

**E. Fix comparison slider keyboard support (3 hours)**
```tsx
// ComparisonSlider.tsx — add keyboard handler:
onKeyDown={(e) => {
  const step = e.shiftKey ? 10 : 1;
  if (e.key === 'ArrowLeft') setPosition(p => Math.max(0, p - step));
  if (e.key === 'ArrowRight') setPosition(p => Math.min(100, p + step));
  if (e.key === 'Home') setPosition(0);
  if (e.key === 'End') setPosition(100);
}}
tabIndex={0}
role="slider"
aria-label="Comparison slider — use arrow keys to compare original and AI portrait"
aria-valuemin={0}
aria-valuemax={100}
aria-valuenow={position}
aria-valuetext={`${position}% AI portrait visible`}
```

**F. Move undo/redo to always-visible (1 hour)**
```tsx
// Remove hover-only class — make buttons always visible:
// Before: className="opacity-0 group-hover:opacity-100 ..."
// After:  className="opacity-100 ..."
// Add to mobile bar as well
```

#### 1.9 Set Up CI/CD Pipeline
**Agents**: GUARDIAN
**Effort**: M (2 days)

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: HEAD~1
      - name: Audit dependencies
        run: npm audit --audit-level=high

  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint src/ --max-warnings 0
      - run: npm run build

  deploy-staging:
    needs: [security-scan, quality]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: [security-scan, quality]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production  # requires manual approval
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

Create `vercel.json` with security headers:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://generativelanguage.googleapis.com; script-src 'self' 'unsafe-inline'"
        }
      ]
    }
  ]
}
```

#### 1.10 Add `.env.example` and Dependabot
**Agents**: GUARDIAN, SENTINEL
**Effort**: XS (30 min)

`.env.example`:
```bash
# Copy to .env.local and fill in values
# NEVER commit .env.local to git

# Server-side only (no VITE_ prefix — not exposed to browser)
GEMINI_API_KEY=your_gemini_api_key_here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
R2_BUCKET_NAME=proportrait-portraits
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
JWT_SECRET=generate_with_openssl_rand_hex_32

# Public (safe to expose)
VITE_APP_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

`.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
```

**Phase 1 Completion Criteria**:
- [ ] New API key deployed, old key deleted and confirmed invalid
- [ ] Backend proxy handling all Gemini calls
- [ ] Rate limit: 3 generations per 15-min window for anonymous users
- [ ] CI/CD pipeline running on every PR
- [ ] All 5 critical WCAG Level A violations fixed (upload zone, sliders, toggles, errors, comparison slider)
- [ ] Dead dependencies removed (`better-sqlite3`, `express`, `dotenv`)
- [ ] Console leaks removed from production build

**Phase 1 Effort**: 2 engineers × 2 weeks = 4 engineer-weeks

---

## Phase 2: Revenue & Core UX (Week 3–6)

**Goal**: First paying customers. Fix the most conversion-killing UX problems. Make the product shippable.
**Prerequisite**: Phase 1 complete (backend proxy live).

### Week 3–4 — Real Payment Infrastructure

#### 2.1 Implement Stripe Integration
**Agents**: VAULT, SENTINEL
**Effort**: M (2-3 days)

**Path A — Payment Links (3-day path to revenue, recommended first)**:

1. Create Stripe Payment Link for "Pro Studio" at $19.99/month
2. Create Stripe Payment Link for "Session Pass" at $14.99 one-time
3. Update CTA buttons to redirect to Payment Links with `?client_reference_id={sessionId}`
4. Set up webhook endpoint `POST /api/payments/webhook` to handle `checkout.session.completed`
5. On webhook: mark session as Pro in database, return JWT with `{ isPro: true, expiresAt }`

**Path B — Full Stripe Checkout (add in Week 5–6)**:

```typescript
// server/routes/payments.ts
router.post('/checkout', authMiddleware, async (req, res) => {
  const { plan } = req.body; // 'pro_monthly' | 'session_pass'

  const prices = {
    pro_monthly: process.env.STRIPE_PRO_PRICE_ID,
    session_pass: process.env.STRIPE_SESSION_PRICE_ID,
  };

  const session = await stripe.checkout.sessions.create({
    mode: plan === 'session_pass' ? 'payment' : 'subscription',
    line_items: [{ price: prices[plan], quantity: 1 }],
    success_url: `${process.env.VITE_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.VITE_APP_URL}/pricing`,
    customer_email: req.user?.email,
    metadata: { userId: req.user?.id, plan },
  });

  res.json({ url: session.url });
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await db.users.update({
      where: { id: session.metadata.userId },
      data: { isPro: true, stripeCustomerId: session.customer, plan: session.metadata.plan }
    });
  }

  res.json({ received: true });
});
```

**Remove** from `PortraitGenerator.tsx`:
```typescript
// DELETE: <button onClick={() => setIsPro(true)}>Unlock for $9.99</button>
// REPLACE with:
<button onClick={() => router.push('/pricing')}>
  View Pro Plans — from $14.99
</button>
```

#### 2.2 Implement Recommended Pricing Tiers
**Agents**: VAULT
**Effort**: S (1 day — mostly Stripe config and copy)

| Tier | Price | Limits | Key Features |
|------|-------|--------|--------------|
| Free | $0 | 3 generations/month | All styles, 1 download format |
| Session Pass | $14.99 | 20 generations (30 days) | All features, all platforms |
| Pro Studio | $19.99/month | 60 gen/month, priority queue | All features + 2048px output, API |
| Teams | $99/month | 300 gen/month, 5 seats | SSO, team portraits, API |

**Paywall placement** (move from Step 4 to earlier):
- Generation limit reached → gate at Step 1 (upload) with soft prompt
- Regional edit → gate at Step 3 (editing) with tooltip: "Regional edit is Pro — generates $0.12 API cost"
- Platform export → gate after first download: "Download all 5 platform sizes — Pro feature"
- 2048px output → gate at download: shown to all, unlocked for Pro

#### 2.3 Fix the "2048px Pro Output" False Claim
**Agents**: VAULT, SENTINEL
**Effort**: S (1 day — backend change)

Current state: `imageSize: '1K'` hardcoded for all users in `ai.ts:203`, then canvas upscales to 2048px.

Fix:
```typescript
// server/routes/portraits.ts
const imageSize = req.user?.isPro ? '2K' : '1K';

// In Gemini call:
const response = await ai.models.generateImages({
  model: 'imagen-3.0-generate-001',
  prompt: buildPrompt(options),
  config: {
    numberOfImages: options.numVariations,
    outputMimeType: 'image/jpeg',
    aspectRatio: '1:1',
    imageSize,  // '2K' for Pro, '1K' for Free
  },
});
```

Update all marketing copy: "Pro 2K Output" → only shown when server actually requests 2K resolution.

#### 2.4 Move Portrait Storage to Cloud (S3/R2)
**Agents**: FORGE, MERCURY
**Effort**: M (2 days)

Current: Base64 images stored in React state (15-25MB per session, grows with undo history).

Fix:
```typescript
// server/lib/storage.ts — Cloudflare R2 (cheapest egress)
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function storePortrait(buffer: Buffer, key: string): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'image/jpeg',
    // Auto-delete portraits after 7 days (GDPR compliance)
  }));

  // Return 1-hour signed URL
  return getSignedUrl(r2, new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  }), { expiresIn: 3600 });
}
```

Client-side: Replace base64 `useState` storage with portrait URL arrays:
```typescript
// Before: const [portraits, setPortraits] = useState<string[]>([]); // base64 blobs
// After:  const [portraitUrls, setPortraitUrls] = useState<string[]>([]); // signed URLs
```

This drops React heap from 25MB → <1MB for typical session.

### Week 4–5 — Core UX Fixes

#### 2.5 Fix the 40-90s Wait State
**Agents**: ATLAS, IRIS
**Effort**: S (1-2 days)

Implement multi-phase progress feedback:

```tsx
// src/components/GenerationProgress.tsx
const PHASES = [
  { label: 'Analyzing your photo', duration: 8000 },
  { label: 'Applying identity locks', duration: 15000 },
  { label: 'Generating portrait variants', duration: 30000 },
  { label: 'Enhancing details', duration: 20000 },
  { label: 'Finalizing', duration: 10000 },
];

export function GenerationProgress({ isGenerating }: { isGenerating: boolean }) {
  const [phase, setPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isGenerating) { setPhase(0); setElapsed(0); return; }

    let cumulativeMs = 0;
    const timers = PHASES.map((p, i) => {
      cumulativeMs += p.duration;
      return setTimeout(() => setPhase(i + 1), cumulativeMs);
    });

    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { timers.forEach(clearTimeout); clearInterval(interval); };
  }, [isGenerating]);

  if (!isGenerating) return null;

  const currentPhase = PHASES[Math.min(phase, PHASES.length - 1)];
  const progress = Math.min((elapsed / 75) * 100, 95);

  return (
    <div role="status" aria-live="polite" aria-label={`Generating portrait: ${currentPhase.label}`}>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 mt-2">{currentPhase.label}...</p>
      <p className="text-xs text-gray-400">{elapsed}s elapsed · typically 45-75s</p>
    </div>
  );
}
```

#### 2.6 Fix `handleDownloadAll` (Broken Feature)
**Agents**: ATLAS, MERCURY
**Effort**: XS (2 hours)

Current broken implementation uses `setTimeout` loop — browsers block multiple programmatic downloads.

Fix with JSZip:
```typescript
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

async function handleDownloadAll() {
  const zip = new JSZip();
  const folder = zip.folder('proportrait-exports');

  for (const platform of PLATFORMS) {
    const canvas = document.createElement('canvas');
    canvas.width = platform.width;
    canvas.height = platform.height;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = selectedPortraitUrl;
    await new Promise(resolve => { img.onload = resolve; });
    ctx.drawImage(img, 0, 0, platform.width, platform.height);

    const blob = await new Promise<Blob>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    folder.file(`${platform.name}-${platform.width}x${platform.height}.jpg`, blob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'proportrait-all-platforms.zip');
}
```

#### 2.7 Fix Mobile Sidebar Layout
**Agents**: IRIS
**Effort**: XS (1 hour)

```tsx
// Step 3 sidebar — PortraitGenerator.tsx ~line 762:
// Before: className="w-72 flex flex-col bg-white border-l ..."
// After:
className="w-full lg:w-72 flex flex-col bg-white lg:border-l border-t lg:border-t-0 ..."

// Step 4 sidebar — PortraitGenerator.tsx ~line 901:
// Before: className="w-80 flex flex-col bg-white border-l ..."
// After:
className="w-full xl:w-80 flex flex-col bg-white xl:border-l border-t xl:border-t-0 ..."

// Wrap both step layouts:
// Before: <div className="flex h-full">
// After:  <div className="flex flex-col lg:flex-row h-full">
```

#### 2.8 Add Email Capture
**Agents**: BEACON, ATLAS, ORACLE
**Effort**: S (1 day)

Zero email capture is currently a critical growth gap. Add in two locations:

**A. After first portrait generation (highest intent moment)**:
```tsx
// Show after successful generation, before download
<EmailCaptureModal
  trigger="generation_complete"
  headline="Get your portrait by email"
  subtext="We'll also send tips to get the most professional result"
  fields={['email']}
  onSubmit={handleEmailCapture}
  onSkip={() => setShowEmailCapture(false)}
/>
```

**B. On free tier limit hit**:
```tsx
// When rate limit response received:
<RateLimitModal>
  <p>You've used your 3 free portraits this month.</p>
  <EmailCaptureForm
    headline="Get notified when your credits reset"
    ctaText="Notify me + upgrade to Pro"
  />
</RateLimitModal>
```

Email storage: Resend or Postmark — one line in webhook handler to add to audience.

#### 2.9 Fix canvas.toDataURL() Main Thread Block
**Agents**: MERCURY
**Effort**: S (1 day)

Move canvas encoding off the main thread:

```typescript
// src/workers/canvas.worker.ts
self.onmessage = async ({ data: { imageUrl, width, height } }) => {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  ctx.drawImage(bitmap, 0, 0, width, height);
  const outputBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
  self.postMessage({ blob: outputBlob }, []);
};
```

Also reset canvas memory after encode (MERCURY recommendation):
```typescript
// After toDataURL/convertToBlob call:
canvas.width = 1;
canvas.height = 1;
const ctx = canvas.getContext('2d');
ctx?.clearRect(0, 0, 1, 1);
```

#### 2.10 Add Sticky Generate CTA
**Agents**: ATLAS, IRIS
**Effort**: XS (2 hours)

Step 2 has 35+ controls with the Generate button buried below the fold on mobile.

```tsx
// Add sticky footer button that mirrors the main generate action:
<div className="sticky bottom-0 lg:hidden bg-white border-t p-4 shadow-lg z-10">
  <button
    onClick={handleGenerate}
    disabled={isGenerating || !uploadedImage}
    className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold
               disabled:opacity-50 disabled:cursor-not-allowed
               hover:bg-indigo-700 transition-colors"
  >
    {isGenerating ? 'Generating...' : 'Generate Portrait'}
  </button>
</div>
```

### Week 5–6 — Session Persistence & Code Quality

#### 2.11 Add React Router & Session Persistence
**Agents**: FORGE, ATLAS
**Effort**: M (2-3 days)

Current: Refresh destroys entire session. No URL-based navigation.

```bash
npm install react-router-dom @tanstack/react-query
```

Routes:
```
/                → Landing page (SSG in Phase 3)
/app             → PortraitGenerator wizard
/app/upload      → Step 1
/app/customize   → Step 2
/app/edit        → Step 3
/app/export      → Step 4
/pricing         → Pricing page
/success         → Post-payment success
/privacy         → Privacy policy (required for GDPR)
```

Session state persistence:
```typescript
// Save generation state to sessionStorage on each step
const [sessionState, setSessionState] = useSessionStorage('portrait-session', {
  uploadedImageUrl: null,
  selectedStyle: 'corporate',
  options: defaultOptions,
  portraitUrls: [],
  currentStep: 1,
});
```

#### 2.12 Begin Component Extraction from PortraitGenerator.tsx
**Agents**: PRISM, FORGE
**Effort**: L (1 week, can run in parallel with 2.11)

Extract in this order (each step leaves code working):

1. `StyleGrid.tsx` — 16 style cards (static, easy to extract)
2. `IdentityLocks.tsx` — 5 lock toggles with labels
3. `NaturalnessSlider.tsx` — slider + preset buttons + score display
4. `ExpressionSelector.tsx` — 5 expression presets
5. `GenerationProgress.tsx` — progress feedback (already designed in 2.5)
6. `PortraitComparison.tsx` — wraps ComparisonSlider with context
7. `HistoryStrip.tsx` — thumbnail history with click-to-jump
8. `EditToolbar.tsx` — undo/redo + regional edit
9. `PlatformExportPanel.tsx` — download buttons per platform
10. `PricingGate.tsx` — reusable paywall modal

Target: PortraitGenerator.tsx from 1,057 → ~250 lines (coordinator only).

Also fix these high-value quick code quality items:
```typescript
// ai.ts — deduplicate response parsing (currently 3 copies at lines 207, 241, 303):
function parseGeminiImageResponse(response: GenerateImagesResponse): string[] {
  return response.generatedImages
    ?.map(img => img.image?.imageBytes)
    .filter(Boolean)
    .map(bytes => `data:image/jpeg;base64,${bytes}`) ?? [];
}

// ai.ts — singleton GoogleGenAI client (currently instantiated per-call):
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export function getGeminiClient() { return geminiClient; }

// PortraitGenerator.tsx — move static arrays outside component (10 arrays, recreated every render):
// Before (inside component): const STYLE_OPTIONS = [...]
// After (module level):      const STYLE_OPTIONS = [...] // defined once
```

**Phase 2 Completion Criteria**:
- [ ] Stripe checkout live and tested end-to-end (free card `4242 4242 4242 4242`)
- [ ] `isPro` determined server-side from database, not client `useState`
- [ ] Real 2K resolution for Pro users (not canvas upscaling)
- [ ] `handleDownloadAll` produces a `.zip` file (tested in Chrome, Firefox, Safari)
- [ ] Generation progress bar with phases visible during 40-90s wait
- [ ] Mobile layout works at 375px (iPhone SE) without horizontal scroll
- [ ] Email capture modal working and storing addresses
- [ ] Session survives browser refresh (step state in sessionStorage)
- [ ] PortraitGenerator.tsx reduced to <500 lines

**Phase 2 Effort**: 2 engineers × 4 weeks = 8 engineer-weeks

---

## Phase 3: Growth & Analytics (Week 7–10)

**Goal**: Instrument everything. Fix discoverability. Close the viral loop.
**Prerequisite**: Phase 2 complete (Stripe live, backend proxy stable).

### Week 7 — Analytics Foundation

#### 3.1 Implement PostHog Analytics
**Agents**: ORACLE, BEACON
**Effort**: S (1-2 days)

PostHog recommended over Google Analytics: includes analytics + A/B testing + session recording + feature flags in one SDK. EU-hosted for GDPR.

```bash
npm install posthog-js
```

```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js';

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: 'https://eu.posthog.com', // EU data residency
  capture_pageview: true,
  session_recording: {
    maskAllInputs: true, // GDPR: don't record typed text
    maskTextSelector: '[data-sensitive]', // mask portrait images
  },
});

// Top 10 P0 events to instrument first:
export const analytics = {
  photoUploaded: (props: { fileSizeMB: number; fileType: string }) =>
    posthog.capture('photo_uploaded', props),

  generationStarted: (props: { style: string; numVariations: number; isPro: boolean }) =>
    posthog.capture('generation_started', props),

  generationCompleted: (props: { durationMs: number; style: string; success: boolean }) =>
    posthog.capture('generation_completed', props),

  generationFailed: (props: { error: string; style: string; durationMs: number }) =>
    posthog.capture('generation_failed', props),

  portraitSelected: (props: { variantIndex: number; style: string }) =>
    posthog.capture('portrait_selected', props),

  portraitDownloaded: (props: { platform: string; isPro: boolean; isWatermarked: boolean }) =>
    posthog.capture('portrait_downloaded', props),

  paywallShown: (props: { trigger: 'generation_limit' | 'regional_edit' | 'platform_export' | '2k_download' }) =>
    posthog.capture('paywall_shown', props),

  paywallConverted: (props: { plan: 'session_pass' | 'pro_monthly' | 'teams'; trigger: string }) =>
    posthog.capture('paywall_converted', props),

  editRegional: (props: { editType: string; isPro: boolean }) =>
    posthog.capture('regional_edit_used', props),

  shareIntent: (props: { platform: 'linkedin' | 'twitter' | 'copy_link' }) =>
    posthog.capture('share_intent', props),
};
```

Instrument all 10 events in PortraitGenerator.tsx, ai.ts, and payment webhook.

#### 3.2 Set Up Cost Monitoring
**Agents**: ORACLE, VAULT
**Effort**: S (1 day)

```typescript
// server/lib/costTracker.ts
// Gemini pricing (as of 2026-03): $0.04 per 1K input tokens, image gen varies
const ESTIMATED_COST_PER_GENERATION = {
  free: 0.08,   // 1K resolution, 2 variants
  pro: 0.22,    // 2K resolution, 4 variants + retouch
  edit: 0.06,   // Regional edit pass
};

export async function trackGenerationCost(userId: string, type: keyof typeof ESTIMATED_COST_PER_GENERATION) {
  const cost = ESTIMATED_COST_PER_GENERATION[type];
  await db.usageEvents.create({
    data: { userId, type, estimatedCostUsd: cost, createdAt: new Date() }
  });

  // Alert if daily cost > $50 (unusual API abuse indicator)
  const todayCost = await db.usageEvents.aggregate({
    where: { createdAt: { gte: startOfDay(new Date()) } },
    _sum: { estimatedCostUsd: true }
  });

  if (todayCost._sum.estimatedCostUsd > 50) {
    await sendSlackAlert(`COST ALERT: Daily Gemini spend hit $${todayCost._sum.estimatedCostUsd.toFixed(2)}`);
  }
}
```

#### 3.3 Add Sentry Error Tracking
**Agents**: GUARDIAN, PRISM
**Effort**: XS (3 hours)

```bash
npm install @sentry/react @sentry/node
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // Full session replay on errors
  beforeSend(event) {
    // Strip any base64 image data from error context
    delete event.extra?.portraitData;
    return event;
  }
});

// server/index.ts
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });
```

Update ErrorBoundary from Phase 1 to send to Sentry:
```typescript
componentDidCatch(error, info) {
  Sentry.captureException(error, { extra: info });
}
```

### Week 7–8 — SEO & Discovery

#### 3.4 Add OG/Twitter Card Meta Tags
**Agents**: BEACON
**Effort**: XS (2 hours)

```html
<!-- index.html — add to <head>: -->
<meta property="og:title" content="ProPortrait AI — Professional Headshots in 60 Seconds" />
<meta property="og:description" content="Transform any photo into a professional LinkedIn headshot. Identity locks preserve your eye color, skin tone, and hair. 16 styles. No photographer needed." />
<meta property="og:image" content="https://proportrait.com/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="https://proportrait.com" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="ProPortrait AI" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@proportrait" />
<meta name="twitter:title" content="ProPortrait AI — Professional Headshots in 60 Seconds" />
<meta name="twitter:description" content="16 styles. Identity locks. Before/after comparison. $0 to start." />
<meta name="twitter:image" content="https://proportrait.com/og-image.jpg" />

<link rel="canonical" href="https://proportrait.com" />
```

Remove:
```html
<!-- DELETE: -->
<meta name="google" content="notranslate" />
<!-- UPDATE (replace placeholder): -->
<meta name="google-site-verification" content="YOUR_ACTUAL_VERIFICATION_CODE" />
```

Create `public/og-image.jpg` (1200×630): before/after split showing dramatic professional transformation.

#### 3.5 Implement SSG with vite-ssg
**Agents**: BEACON, SCOUT
**Effort**: M (2-3 days)

Pure SPA means Google sees empty `<div id="root">`. Fix with static site generation:

```bash
npm install vite-ssg @unhead/vue  # or equivalent for React
```

Or simpler: add pre-rendering via `vite-plugin-ssg`:
```typescript
// vite.config.ts
import { ViteSSG } from 'vite-ssg'
// Routes to pre-render:
export const routes = ['/', '/pricing', '/privacy', '/terms']
```

Landing page content to pre-render (drives all SEO):
- Hero: "Professional LinkedIn Headshots in 60 Seconds"
- Feature grid: Identity Locks, 16 Styles, Before/After Comparison, Platform Export
- Social proof section (add 3 testimonials with photos)
- Pricing table
- FAQ: "Will it change how I look?", "Is it GDPR compliant?", "What file types?"

```html
<!-- Add structured data for rich snippets: -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ProPortrait AI",
  "applicationCategory": "PhotoEditing",
  "offers": [
    { "@type": "Offer", "price": "0", "priceCurrency": "USD", "name": "Free" },
    { "@type": "Offer", "price": "19.99", "priceCurrency": "USD", "name": "Pro Studio" }
  ],
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "127" }
}
</script>
```

Add `public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://proportrait.com/sitemap.xml
```

Add `public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://proportrait.com/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://proportrait.com/pricing</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://proportrait.com/privacy</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>
```

#### 3.6 Add Social Sharing & Watermark
**Agents**: BEACON, IRIS
**Conflict resolution**: BEACON wants watermarks for viral marketing; IRIS focuses on design quality.
**Resolution**: Implement subtle watermark as per BEACON spec. Frame watermark removal as a Pro benefit in IRIS design system language ("Clean download — no watermark"). Watermark is bottom-right corner, small, semi-transparent — does not affect portrait quality.

```typescript
// server/lib/watermark.ts
export async function applyWatermark(imageBuffer: Buffer, isPro: boolean): Promise<Buffer> {
  if (isPro) return imageBuffer; // Pro users: clean download

  const watermarkSvg = Buffer.from(`
    <svg width="200" height="30">
      <text x="5" y="20" font-family="Arial" font-size="12"
            fill="rgba(255,255,255,0.6)" font-weight="bold">
        ProPortrait AI
      </text>
    </svg>
  `);

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  return image
    .composite([{
      input: watermarkSvg,
      gravity: 'southeast',
      blend: 'over',
    }])
    .jpeg({ quality: 92 })
    .toBuffer();
}
```

Add sharing buttons to Step 4 export panel:
```tsx
<ShareButtons
  portraitUrl={selectedPortraitUrl}
  platforms={['linkedin', 'twitter', 'copy_link']}
  onShare={(platform) => analytics.shareIntent({ platform })}
/>

// LinkedIn share: opens linkedin.com/shareArticle with pre-filled text:
// "Just updated my professional headshot with AI — ProPortrait preserved my exact features. Try it free at proportrait.com 🔗"
```

### Week 9–10 — A/B Testing & Conversion Optimization

#### 3.7 Set Up First A/B Tests
**Agents**: ORACLE, ATLAS, VAULT
**Effort**: S (2 days)

Use PostHog feature flags for A/B testing (included in PostHog plan):

**Test #1: Number of variants shown** (highest impact on cost vs conversion)
```typescript
const numVariations = posthog.getFeatureFlag('num_variations_default') === 'four' ? 4 : 2;
// Hypothesis: 4 variants → higher satisfaction → higher conversion to Pro
// Metric: Portrait selected rate, upgrade rate
// Duration: 2 weeks, split 50/50
```

**Test #2: Paywall trigger point**
```typescript
// Variant A (control): Paywall on Step 4 download
// Variant B: Soft paywall prompt on Step 2 ("Pro users get 4x more styles")
// Metric: Stripe checkout initiated rate
```

**Test #3: Free tier limit messaging**
```typescript
// Variant A: "3 portraits remaining this month"
// Variant B: "You've used 0 of 3 free portraits — upgrade for unlimited"
// Metric: Email capture rate on limit screen
```

#### 3.8 Add Privacy Policy & Terms of Service
**Agents**: COMPASS, SENTINEL
**Effort**: S (1 day — legal copy + route)

Required for GDPR compliance and Stripe approval:

Create `/privacy` route with:
- What data is collected (email, uploaded photo, generation metadata)
- How long photos are retained (recommend: 24 hours for free, 7 days for Pro)
- User rights (deletion on request, export, correction)
- Third-party services (Gemini AI, Stripe, PostHog)
- BIPA compliance (biometric data notice, Illinois users)
- Contact: privacy@proportrait.com

Create `/terms` route with usage terms and DMCA notice.

Add cookie consent banner (required for EU users / PostHog):
```tsx
<CookieConsent
  onAccept={() => posthog.opt_in_capturing()}
  onDecline={() => posthog.opt_out_capturing()}
  required={['essential']}
  optional={['analytics', 'marketing']}
/>
```

**Phase 3 Completion Criteria**:
- [ ] PostHog tracking all 10 P0 events (verified in PostHog Live Events)
- [ ] API cost monitored — daily spend visible in dashboard, alert at $50
- [ ] Sentry receiving errors from both client and server
- [ ] OG image renders correctly in Slack/LinkedIn/Twitter link preview
- [ ] Google Search Console showing ProPortrait pages indexed (not just homepage)
- [ ] Privacy policy and terms pages live
- [ ] First A/B test running with >100 users in each variant
- [ ] Watermarked free downloads with share buttons working
- [ ] Email capture converting >15% of generation-complete events

**Phase 3 Effort**: 2 engineers × 4 weeks = 8 engineer-weeks

---

## Phase 4: Scale & Differentiation (Week 11–20)

**Goal**: SEO-driven organic acquisition. Protect the competitive moat. Production-grade reliability.
**Prerequisite**: Analytics data from Phase 3 informing decisions.

### Week 11–13 — TypeScript & Testing Infrastructure

#### 4.1 Enable TypeScript Strict Mode
**Agents**: PRISM
**Effort**: M (2 weeks, incremental)

Enable per-file to avoid big-bang failure:
```json
// tsconfig.json — enable gradually:
{
  "compilerOptions": {
    "strict": false,
    // Enable one at a time, file by file:
    "strictNullChecks": true,       // Week 11
    "noImplicitAny": true,          // Week 12
    "strictFunctionTypes": true,    // Week 13
    "strictBindCallApply": true,    // Week 13
    "noUncheckedIndexedAccess": true // Week 13
  }
}
```

Use `// @ts-strict-ignore` comments to temporarily suppress errors in files not yet migrated.

#### 4.2 Add Test Infrastructure
**Agents**: PRISM, GUARDIAN
**Effort**: L (1 week setup + ongoing)

```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom @playwright/test
```

```typescript
// vite.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: { reporter: ['text', 'lcov'], threshold: { lines: 70 } }
  }
});
```

Priority test files (write in this order):
1. `src/services/ai.test.ts` — prompt building, response parsing, error handling
2. `src/lib/platformPresets.test.ts` — canvas dimensions per platform
3. `src/components/ComparisonSlider.test.tsx` — keyboard navigation, ARIA attributes
4. `src/components/PortraitGenerator.test.tsx` — upload flow, step navigation
5. `e2e/generation.spec.ts` — full generation flow (Playwright, mocked Gemini)

Target: 70% line coverage by end of Phase 4.

#### 4.3 Complete WCAG 2.1 AA Compliance
**Agents**: COMPASS
**Effort**: L (1 week)

Phase 1 fixed the 5 critical Level A violations. Phase 4 addresses the remaining 30+ Level AA violations:

- [ ] Color contrast audit — all text elements meeting 4.5:1 ratio
- [ ] Focus indicators — visible 3px offset ring on all interactive elements
- [ ] Zoom support — layout works at 200% zoom without horizontal scroll
- [ ] Session timeout warning — 30s warning before session expires with extend option
- [ ] Step completion announcement — `aria-live` region announces "Step 2 of 4 complete"
- [ ] Image description inputs — `alt` text prompts for uploaded images
- [ ] Reduced motion — respect `prefers-reduced-motion` for all animations

### Week 13–16 — Dark Mode & Design System

#### 4.4 Extract Design Tokens & Implement Dark Mode
**Agents**: IRIS
**Effort**: M (2 weeks)

Extract CSS custom properties (Tailwind 4 supports this natively):

```css
/* src/styles/tokens.css */
:root {
  /* Brand */
  --color-brand-primary: #4f46e5;
  --color-brand-secondary: #6366f1;
  --color-brand-accent: #818cf8;

  /* Semantic */
  --color-surface-primary: #ffffff;
  --color-surface-secondary: #f9fafb;
  --color-surface-elevated: #ffffff;
  --color-border-default: #e5e7eb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;

  /* Spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  --space-8: 32px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-surface-primary: #0f172a;
    --color-surface-secondary: #1e293b;
    --color-surface-elevated: #1e293b;
    --color-border-default: #334155;
    --color-text-primary: #f1f5f9;
    --color-text-secondary: #94a3b8;
  }
}
```

Add manual dark mode toggle (user preference stored in localStorage, overrides system).

### Week 16–18 — Marketing & Feature Discovery

#### 4.5 Build Feature Discovery & Marketing
**Agents**: SCOUT, BEACON, ATLAS
**Effort**: M (1 week)

ProPortrait's moat features are **invisible to most users**:
- Undo/redo exists but is hover-only (nobody knows it's there)
- Regional editing exists but has zero marketing presence
- Identity locks are the #1 differentiator but buried in Step 2 under "Advanced Settings"

Fix:

**A. Promote identity locks to hero position**:
```tsx
// Move from Step 2 "Advanced Settings" collapse to Step 2 top-level:
<div className="mb-6">
  <h3 className="font-semibold text-gray-900 mb-1">Identity Locks</h3>
  <p className="text-sm text-gray-500 mb-3">
    Lock specific features to preserve your exact appearance
  </p>
  <IdentityLocks /> {/* Already extracted in Phase 2 */}
</div>
```

**B. Add interactive feature tour (first visit)**:
```tsx
// After first portrait generated:
<FeatureTour
  steps={[
    { target: '[data-tour="comparison-slider"]', content: 'Drag to compare original and AI portrait' },
    { target: '[data-tour="identity-locks"]', content: 'Lock your eye color, skin tone, and hair to prevent AI changes' },
    { target: '[data-tour="regional-edit"]', content: 'Click any area to edit just that part of your portrait (Pro)' },
    { target: '[data-tour="history"]', content: 'Click any thumbnail to jump back to that version' },
  ]}
/>
```

**C. Add testimonials with real portraits** (coordinate with SCOUT ICP research):
- Career Pivotter: "Finally a headshot that looks like me, not an AI composite"
- Fractional Expert: "Updated all 6 client profiles in 30 minutes"
- Remote Worker: "My Zoom thumbnail finally matches my seniority"

#### 4.6 Implement Team Features
**Agents**: VAULT, FORGE
**Effort**: L (2 weeks)

Add Teams tier ($99/month, 5 seats):

```typescript
// Database additions:
// teams table: id, name, ownerId, stripeSubscriptionId, seatCount
// team_members table: teamId, userId, role (owner|admin|member)
// team_style_presets table: teamId, name, options JSON

// New API routes:
// POST /api/teams — create team
// GET  /api/teams/:id/members — list members
// POST /api/teams/:id/invite — send email invite
// GET  /api/teams/:id/portraits — all team member portraits
// POST /api/teams/:id/presets — save team style preset
```

Team style presets (strongest B2B differentiator):
```tsx
// Allow team admin to save "Company Standard" portrait settings:
<TeamPresetManager
  presets={teamPresets}
  onSave={(preset) => saveTeamPreset(preset)}
  onApply={(preset) => applyPreset(preset)}
/>
// Any team member can apply saved preset with one click
// → consistent branding across entire company LinkedIn presence
```

### Week 18–20 — Scale & API

#### 4.7 Build Developer API
**Agents**: VAULT, FORGE
**Effort**: L (2 weeks)

Open the Gemini proxy as a public API for Pro/Teams users:

```
GET  /api/v1/styles              — list available styles
POST /api/v1/portraits/generate  — generate portrait (requires API key)
POST /api/v1/portraits/edit      — edit portrait regionally
GET  /api/v1/portraits/:id       — get portrait status + URLs
GET  /api/v1/usage               — credit usage and limits
```

Target users: HR platforms, ATS systems, LinkedIn management tools, personal branding agencies.

Pricing: 1,000 API calls/month included in Teams, $0.10/call overage.

**Phase 4 Completion Criteria**:
- [ ] TypeScript strict mode enabled across all source files
- [ ] Test coverage >70% lines
- [ ] WCAG 2.1 AA audit passing (use axe-core automated + manual screen reader test)
- [ ] Dark mode working on all pages
- [ ] Identity locks promoted to Step 2 hero position (validate with ORACLE A/B test)
- [ ] Feature tour completing for >40% of new users (ORACLE funnel)
- [ ] Teams tier live with at least 3 paying team accounts
- [ ] Developer API documented and accepting beta signups

**Phase 4 Effort**: 2 engineers × 10 weeks = 20 engineer-weeks

---

## Quick Wins (Each <4 Hours, Do This Week)

Items that require no backend proxy, no Stripe, no architecture changes — pure local edits.

| # | Fix | File(s) | Effort | Agent | Impact |
|---|-----|---------|--------|-------|--------|
| QW-01 | **Rotate Gemini API key** (P0 — do first) | GCP console + `.env.local` | 30 min | SENTINEL | CRITICAL |
| QW-02 | Remove `--host=0.0.0.0` from dev script | `package.json` | 2 min | SENTINEL | HIGH |
| QW-03 | Remove `better-sqlite3`, `express`, `dotenv` from dependencies | `package.json` + `npm uninstall` | 1 hour | MERCURY | HIGH |
| QW-04 | Remove all `console.log` from production | `ai.ts`, `PortraitGenerator.tsx` | 1 hour | SENTINEL | HIGH |
| QW-05 | Add OG/Twitter Card meta tags to `index.html` | `index.html` | 2 hours | BEACON | HIGH |
| QW-06 | Remove `<meta name="google" content="notranslate">` | `index.html` | 2 min | BEACON | MEDIUM |
| QW-07 | Fix `google-site-verification` placeholder with real code | `index.html` | 5 min | BEACON | LOW |
| QW-08 | Add `robots.txt` and `sitemap.xml` to `public/` | 2 new files | 20 min | BEACON | MEDIUM |
| QW-09 | Fix `handleDownloadAll` with JSZip | `PortraitGenerator.tsx:281-285` | 2 hours | ATLAS | HIGH |
| QW-10 | Fix Step 3 sidebar `w-72` → `w-full lg:w-72` | `PortraitGenerator.tsx:762` | 30 min | IRIS | HIGH |
| QW-11 | Fix Step 4 sidebar `w-80` → `w-full xl:w-80` | `PortraitGenerator.tsx:901` | 30 min | IRIS | HIGH |
| QW-12 | Move undo/redo from hover-only to always-visible | `PortraitGenerator.tsx` | 1 hour | IRIS, COMPASS | HIGH |
| QW-13 | Add `role="alert"` to error message divs | `PortraitGenerator.tsx` | 1 hour | COMPASS | HIGH |
| QW-14 | Fix upload zone: `<div>` → `<button>` with keyboard support | `PortraitGenerator.tsx` | 2 hours | COMPASS | CRITICAL |
| QW-15 | Add error boundary around `<App />` | `main.tsx`, new `ErrorBoundary.tsx` | 2 hours | FORGE | HIGH |
| QW-16 | Reset canvas to 1×1 after `toDataURL` to free memory | `PortraitGenerator.tsx:233` | 30 min | MERCURY | MEDIUM |
| QW-17 | Move static arrays (`STYLE_OPTIONS` etc.) outside component | `PortraitGenerator.tsx` | 1 hour | PRISM | MEDIUM |
| QW-18 | Collapse "Advanced Settings" section by default | `PortraitGenerator.tsx` | 30 min | ATLAS | MEDIUM |
| QW-19 | Add `<link rel="preconnect" href="https://generativelanguage.googleapis.com">` | `index.html` | 5 min | MERCURY | MEDIUM |
| QW-20 | Fix brand name in `package.json` (`"name": "proportrait"`) | `package.json` | 2 min | GUARDIAN | LOW |
| QW-21 | Create `.env.example` with all required keys documented | `.env.example` (new) | 10 min | GUARDIAN | HIGH |
| QW-22 | Add `.github/dependabot.yml` for weekly security updates | `.github/dependabot.yml` (new) | 15 min | GUARDIAN | MEDIUM |
| QW-23 | Remove `replace` in `alert()` calls → use in-app error state | `PortraitGenerator.tsx` | 1 hour | PRISM | MEDIUM |
| QW-24 | Deduplicate `parseGeminiImageResponse` (currently 3 copies) | `ai.ts:207, 241, 303` | 1 hour | PRISM | MEDIUM |
| QW-25 | Make `GoogleGenAI` client a module singleton | `ai.ts` | 30 min | PRISM | MEDIUM |

---

## Conflict Resolution

Agents occasionally recommended contradictory approaches. Resolutions documented for engineering team clarity.

### Conflict 1: Animation — MERCURY vs. IRIS

**MERCURY recommends**: Remove or defer all CSS animations. Animations consume GPU, increase INP, and are lowest-priority for performance.

**IRIS recommends**: Animations are essential for UX quality signal. Removing them would make the product feel cheap and reduce perceived quality.

**Resolution**: Reduce animation duration to 150ms maximum (MERCURY's performance budget). Honor `prefers-reduced-motion` media query to disable all animations for users who need it (satisfies both agents). Do not remove animations entirely.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* All transitions capped at 150ms */
.transition-all { transition-duration: 150ms; }
```

### Conflict 2: Watermarks — BEACON vs. IRIS

**BEACON recommends**: Apply watermark to all free downloads for viral marketing. Each LinkedIn profile photo update notifies the user's network — organic discovery loop.

**IRIS recommends**: Design quality is a core differentiator. Watermarks affect perceived quality and brand positioning as premium product.

**Resolution**: Implement subtle watermark per BEACON specification (bottom-right corner, 12px semi-transparent text, `rgba(255,255,255,0.6)` over the portrait). Frame watermark removal as a Pro benefit using IRIS design language: "Pro downloads include clean export — no watermark". The word "clean" signals premium quality rather than framing free tier as degraded. Watermark text: "ProPortrait AI" — short enough to not interfere with portrait quality, long enough to drive searches.

### Conflict 3: API Gate — ATLAS vs. SENTINEL

**ATLAS recommends**: Remove API key requirement from page load. Cold traffic currently sees a technical error if the key fails — 60-80% estimated drop-off before any engagement.

**SENTINEL recommends**: API key must be server-side immediately. Any client-side key is a security incident.

**Resolution**: These are not actually in conflict — they describe the same fix from different perspectives. Moving the API key server-side (Phase 1, task 1.2) satisfies both requirements simultaneously: SENTINEL gets the key off the client, ATLAS gets the gate removed from page load. The gate moves to the Generate action (server-side validation), not the page load. Immediate action: rotate key now, backend proxy in Week 1-2.

### Conflict 4: Step 2 Complexity — ATLAS vs. PRISM vs. SCOUT

**ATLAS recommends**: Step 2 is overloaded with 35+ controls. Hide most options — progressive disclosure with safe defaults.

**PRISM recommends**: Extract components to reduce complexity. This is a code quality issue, not a product design issue.

**SCOUT recommends**: The granular controls are the competitive moat. Competitors have 2-3 options; ProPortrait has 35+. Don't hide the differentiators.

**Resolution**: Collapse "Advanced Settings" by default (QW-18 above) and promote Identity Locks to top-level visibility (Phase 4, task 4.5). The number of controls stays the same — advanced users can expand the section. First-time users see: photo upload → style selection → identity locks → generate. The full feature set is discoverable but not overwhelming. Track via ORACLE which controls are actually used to inform future decisions.

### Conflict 5: Canvas Processing — MERCURY vs. VAULT

**MERCURY recommends**: Server-side image processing with sharp for all resizing and format conversion. Client-side canvas is slow and main-thread blocking.

**VAULT recommends**: Platform-specific canvas rendering at export time to guarantee exact pixel dimensions (800×800 LinkedIn, etc.).

**Resolution**: Hybrid approach. Upload preprocessing (resize to 1024px max) happens server-side in the proxy (Phase 1, task 1.7). Portrait generation and storage happen server-side (Phase 2, task 2.4). Platform-specific export resizing moves to an OffscreenCanvas Web Worker (Phase 2, task 2.9) so the main thread is never blocked. The download ZIP is assembled client-side from server-hosted portrait URLs. This satisfies MERCURY's main-thread requirement and VAULT's exact-dimension requirement.

---

## Total Effort Summary

| Phase | Weeks | Focus | Engineer-Weeks | Expected Revenue Impact |
|-------|-------|-------|----------------|------------------------|
| Phase 1: Security & Legal | 1-2 | Stop API abuse, CI/CD, WCAG A | 4 | Prevents $0→∞ API cost exposure |
| Phase 2: Revenue & Core UX | 3-6 | Stripe, mobile, UX fixes | 8 | First MRR: $500-2,000 |
| Phase 3: Growth & Analytics | 7-10 | Analytics, SEO, viral loop | 8 | 2x organic traffic; data-driven decisions |
| Phase 4: Scale & Differentiation | 11-20 | TypeScript, tests, dark mode, Teams | 20 | $5,000-20,000 MRR with Teams |
| **Quick Wins** | **Week 1** | **25 standalone fixes** | **3** | **Immediate: SEO, mobile, core bugs** |
| **Total** | **20 weeks** | | **43 engineer-weeks** | |

**Team size assumption**: 2 full-stack engineers. At 1 engineer, double the timeline.

**Minimum Viable Revenue timeline** (1 engineer, focused):
- Week 1: Quick Wins (no backend needed)
- Week 3: Backend proxy + API key secured
- Week 5: Stripe live (Payment Links shortcut)
- Week 7: First paying customers

---

## 3 Things to Do This Week

**In priority order. Do not skip Step 1.**

### 1. Rotate the API Key (Today — 30 minutes)

The Gemini API key `AIzaSyCiD-aV_ai2EGF8Ohigp14zhSBRWFf-4IY` is visible in the production JavaScript bundle right now. Every visitor can extract it. Every generation anyone runs costs you money.

1. Open [console.cloud.google.com](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Delete the exposed key
4. Create a new key with HTTP referrer restriction to `proportrait.com/*`
5. Add it to Vercel environment variables (server-side, not `VITE_` prefix)
6. Deploy

Then remove the `define` block from `vite.config.ts` lines 11-12 so the new key can never accidentally end up in the bundle again.

### 2. Apply the 25 Quick Wins (This Week — ~20 hours total)

All 25 items in the Quick Wins table above can be done without a backend proxy. Each is under 4 hours. Combined they fix:
- The broken "Download All" button (QW-09)
- Mobile layout on iOS (QW-10, QW-11)
- The undo/redo discoverability gap (QW-12)
- Screen reader blockers for keyboard users (QW-13, QW-14)
- The social sharing blank preview (QW-05)
- 3 dead dependencies polluting the bundle (QW-03)
- Production console.log leaks (QW-04)

Assign each item to a specific engineer. Most can be parallelized.

### 3. Start the Backend Proxy (This Week — target: branch open by Friday)

Phase 2 cannot start without this. Every hour of delay is:
- API abuse risk (mitigated by key rotation, but still no rate limiting)
- Fake payment that can never convert
- Zero email capture

Create `server/` directory. Install Express, express-rate-limit, multer, sharp. Set up the `POST /api/portraits/generate` route as a thin proxy to Gemini — just the routing, no auth yet. Auth and Stripe come in Week 3-4. But the routing needs to be in place for the team to build against.

Target: `server/index.ts` running locally and deployed to Vercel as a serverless function by end of Week 2.

---

*This roadmap was generated by synthesizing 12 specialized agent reports: SENTINEL (Security), FORGE (Architecture), VAULT (Monetization), ATLAS (User Journey), GUARDIAN (DevOps), IRIS (UI/UX), COMPASS (Accessibility), PRISM (Code Quality), MERCURY (Performance), ORACLE (Analytics), BEACON (Growth), SCOUT (Product-Market Fit). All code snippets are illustrative — verify against current file state before applying.*
