<div align="center">
<img alt="ProPortrait AI" src="public/banner.png" />
</div>

# ProPortrait AI

AI-powered professional portrait generator built with React 19, Vite, Tailwind CSS 4, and Google Gemini.

Upload a photo and get studio-quality professional headshots in seconds — identity-locked, skin-tone guaranteed, platform-ready.

---

## Quick Start

### Prerequisites

- Node.js 22+
- Google Gemini API key (`gemini-3.1-flash-image-preview` model access)
- Firebase project (for auth + Firestore)

### Setup

```bash
# Install dependencies
npm install

# Create env file for the backend
cp .env.example .env.local
# Fill in GEMINI_API_KEY, FIREBASE_PROJECT_ID, and VITE_FIREBASE_* keys

# Authenticate Firebase Admin SDK locally
gcloud auth application-default login

# Start full stack (frontend :3000 + backend :3001)
npm run dev:all
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev:all` | Start frontend (port 3000) + backend (port 3001) together |
| `npm run dev` | Frontend only (requires backend running separately) |
| `npm run dev:server` | Backend only |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | TypeScript type-check (no emit) |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run clean` | Remove `dist/` |

---

## Architecture

```
Browser (React SPA) → Firebase Hosting
     │
     └─→ Express Backend → Cloud Run (GCP)
              │
              ├─→ Google Gemini API   (image generation & editing)
              ├─→ Firebase Auth       (email/password + Google OAuth)
              ├─→ Firestore           (user profiles, tier, saved portraits)
              ├─→ Cloudflare R2       (portrait storage, 24h signed URLs)
              ├─→ Stripe              (checkout, webhooks, billing portal)
              └─→ Resend              (email capture)
```

In dev, Vite proxies `/api/*` to `localhost:3001`. In production, the frontend calls `VITE_API_URL` (Cloud Run) directly.

---

## Auth & Routing

| Route | Access |
|---|---|
| `/` | Public (landing page) |
| `/contact` | Public |
| `/app` | Requires Firebase login |
| `/admin` | Requires Firebase login + `isAdmin: true` |
| `/privacy`, `/terms` | Public |

Unauthenticated users hitting `/app` or `/admin` are shown the **AuthModal** (Google OAuth or email/password). The admin account (`jsong@koreatous.com`) is seeded as `isAdmin: true` on first login server-side.

---

## Membership Tiers

| Feature | Free | Creator | Pro | Max |
|---|---|---|---|---|
| Portrait generation | 3 total | 30 total | 100/month | 500/month |
| Export resolution | 1024px | 2048px | 2048px | 2048px |
| JPG export | ✅ | ✅ | ✅ | ✅ |
| PNG / lossless export | — | ✅ | ✅ | ✅ |
| Transparent background | — | ✅ | ✅ | ✅ |
| Studio skin smoothing | — | ✅ | ✅ | ✅ |
| Save to Library | — | ✅ | ✅ | ✅ |
| Platform batch download | ✅ | ✅ | ✅ | ✅ |

| Plan | Price | Type |
|---|---|---|
| Creator | $24.99 | One-time |
| Pro | $29.99/month | Subscription |
| Max | $49.99/month | Subscription |

---

## Features

### Quick / Advanced Mode

A persistent mode toggle at the top of the wizard keeps the default experience simple:

| Quick Mode (default) | Advanced Mode |
|---|---|
| Curated styles in a grid | All 7 styles |
| One-click Generate | Expression presets, identity locks, likeness/naturalness sliders, blemish toggle, group photo selector, variations picker, copy settings |
| "Edit Portrait" button reveals AI editor on demand | Full AI editor panel open by default |
| Aspect ratio + Download only | Full export options visible |
| "More Export Options" expands layout, format, platform presets, share | All export controls always visible |

### Step 1 — Upload

- Upload JPG, PNG, or WEBP (max 10 MB; auto-compressed before AI call)
- Drag-and-drop or click-to-browse
- Dismissible privacy notice explaining data handling
- Tips panel showing ideal vs. avoid photo conditions

### Step 2 — Style & Settings

**7 portrait styles:**

| Style | Description |
|---|---|
| Editorial | High-fashion editorial, bold lighting |
| Environmental | Environmental portrait, natural setting |
| Candid | Warm, natural candid look |
| Vintage | 1950s–60s Kodachrome film look |
| B&W | Fine-art black and white, rich tonal range |
| Cyberpunk | Neon-lit futuristic portrait |
| Watercolor | Soft painterly watercolor style |

**Advanced controls:**

- **Group photo support** — select which person: Single person, Left, Center, Right, or custom free-text
- **Expression presets** — Confident Neutral (default), Warm Smile, Authority, Approachable Expert, Natural
- **Identity Locks** — per-feature toggles (eye color, skin tone, hair length ON by default; hair texture, glasses OFF)
- **Likeness strength** 0–100 (default 70)
- **Skin smoothness / Naturalness** 0–100 with presets: Natural (15), Polished (50), Studio (85 — paid)
- **Blemish removal** toggle (ON by default)
- **Variations** — 2 or 4 images per generation
- **Identity Confidence Score** — color-coded meter based on current settings
- **Copy Settings JSON** — clipboard preset for team sharing

### Step 3 — Editing Studio

- **Variation thumbnails** — click to switch between generated images
- **Before/After comparison slider** — drag to compare original vs. AI portrait
- **AI Editor** (expand via "Edit Portrait" in Quick mode):
  - **Clothes wizard** — 3-step (style → color → pattern) with visual swatches
  - **Background wizard** — 8 categories, 6–8 options each; Transparent requires paid tier
  - **Color grading** — 7 presets (B&W, Warm, Cool, Cinematic, Sepia, Pastel, High Contrast)
  - **Regional edit** — lock edits to background / clothing / lighting / hair / color grading only
  - **Custom prompt** — free-text instruction input
  - **Prompt history** — last 15 prompts, click to reuse
- **Undo / Redo** with step counter (Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z)
- **Edit history strip** — thumbnail timeline; click any state to jump back
- **Save to Library** — save portrait to Firestore + R2 (paid tiers)

### Step 4 — Export

- **Aspect ratio** — 1:1 (square) or 3:4 (portrait)
- **Layout mode** — Fill (crop) or Fit (letterbox with blurred background)
- **Crop position** — X/Y percentage sliders (Fill mode)
- **Format** — JPG (free) or PNG (paid; required for transparent background)
- **Platform presets:**

| Platform | Size |
|---|---|
| LinkedIn | 800×800 |
| GitHub | 500×500 |
| X / Twitter | 400×400 |
| Instagram | 320×320 |
| Resume / CV | 600×800 |

- **Download All Platforms** — ZIP of all five presets (JSZip, dynamic import)
- **Share** — LinkedIn / Twitter / copy link

---

## Project Structure

```
src/
├── components/
│   ├── PortraitGenerator.tsx   # Main 4-step wizard
│   ├── AuthModal.tsx           # Sign in / create account (Google + email)
│   ├── UserMenu.tsx            # Avatar dropdown (Profile, Admin, Sign Out)
│   ├── UserProfileModal.tsx    # 4-tab: Profile, Preferences, Account, Billing
│   ├── PricingModal.tsx        # 4-tier pricing modal + Stripe redirect
│   ├── SavedPortraitsModal.tsx # Library of saved portraits
│   ├── ComparisonSlider.tsx    # Before/after drag comparison
│   ├── GenerationProgress.tsx  # 5-phase animated progress bar
│   ├── EmailCapture.tsx        # Post-generation email capture modal
│   ├── LandingPage.tsx         # Public landing page (/)
│   ├── ContactPage.tsx         # Public contact page (/contact)
│   ├── PrivacyNotice.tsx       # Dismissible privacy banner
│   └── ErrorBoundary.tsx       # React class error boundary
├── pages/
│   └── AdminPage.tsx           # /admin dashboard (user table, stats, pro toggle)
├── contexts/
│   └── AuthContext.tsx         # Global auth state via onAuthStateChanged
├── hooks/
│   ├── useAuth.ts              # Firebase auth + profile fetch
│   └── useFeatureFlag.ts       # PostHog feature flag hook
├── services/
│   ├── ai.ts                   # API calls → backend proxy (/api/portraits/*)
│   ├── auth.ts                 # Firebase client SDK (signIn, signOut, getIdToken)
│   └── user.ts                 # User API with Bearer token (profile, billing portal)
├── lib/
│   ├── platformPresets.ts      # Platform export configs
│   └── utils.ts                # cn() Tailwind utility
├── App.tsx
└── main.tsx

server/
├── index.ts                    # Express app (port 3001 / 8080 in prod)
├── routes/
│   ├── portraits.ts            # POST /api/portraits/generate & /edit
│   ├── users.ts                # GET|PATCH|DELETE /api/users/me
│   ├── payments.ts             # Stripe checkout, webhook, billing portal
│   ├── admin.ts                # GET /api/admin/users, POST /api/admin/users/:uid/pro
│   ├── auth.ts                 # GET /api/auth/me
│   ├── contact.ts              # POST /api/contact
│   └── email.ts                # POST /api/email/capture
├── middleware/
│   └── authMiddleware.ts       # Firebase JWT → Firestore; anonymous cookie fallback
├── lib/
│   ├── firebase.ts             # Admin SDK singleton (ADC)
│   ├── firestore.ts            # UserDoc CRUD, tier/pro status, generation limits
│   ├── session.ts              # In-memory session store + UUID cookie
│   └── storage.ts              # Cloudflare R2 portrait storage
└── types.d.ts                  # req.auth type: { mode, uid?, email?, isPro, isAdmin }
```

---

## Environment Variables

### Backend (`server/`)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google AI API key |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `APP_URL` | Yes | Base app URL (for Stripe redirects) |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe webhook signing secret |
| `STRIPE_CREATOR_PRICE_ID` | For payments | $24.99 one-time Creator Pass price ID |
| `STRIPE_PRO_PRICE_ID` | For payments | $29.99/month Pro price ID |
| `STRIPE_MAX_PRICE_ID` | For payments | $49.99/month Max price ID |
| `R2_ACCOUNT_ID` | For storage | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | For storage | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | For storage | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | For storage | Cloudflare R2 bucket name |
| `RESEND_API_KEY` | For email | Resend API key |
| `RESEND_FROM_EMAIL` | For email | Sender email address |
| `CORS_ORIGIN` | Prod | Allowed frontend origin |
| `PORT` | Prod | Server port (default: 3001; Cloud Run: 8080) |

### Frontend (Vite build-time)

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `VITE_API_URL` | Prod | Cloud Run backend URL (unset in dev → Vite proxy) |
| `VITE_POSTHOG_KEY` | Optional | PostHog project API key |
| `VITE_POSTHOG_HOST` | Optional | PostHog host (default: eu.i.posthog.com) |
| `VITE_SENTRY_DSN` | Optional | Sentry DSN for frontend error tracking |

---

## Deployment

| Layer | Target |
|---|---|
| Frontend | Firebase Hosting (`portrait-7b01d`) |
| Backend | Google Cloud Run (`proportrait-api`, region: us-central1) |
| Container registry | Google Artifact Registry (`us-central1-docker.pkg.dev/ai-biz-6b7ec/proportrait/api`) |
| Secrets | Google Secret Manager |
| Auth + DB | Firebase Auth + Firestore |
| Storage | Cloudflare R2 |

CI/CD runs on push to `main` via `.github/workflows/deploy.yml`:
1. **Lint** — `tsc --noEmit` + `npm audit`
2. **Deploy backend** — Cloud Build → Artifact Registry → Cloud Run
3. **Deploy frontend** — `npm run build` (with `VITE_*` env vars) → Firebase Hosting

Firebase client env vars (`VITE_FIREBASE_*`) are stored as GitHub secrets and injected at build time.

For local Firebase Admin SDK: run `gcloud auth application-default login` (ADC). Cloud Run uses the attached service account automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Animation | Motion (Framer Motion v12) |
| Icons | Lucide React |
| AI | Google Gemini (`gemini-3.1-flash-image-preview`) |
| Backend | Express + tsx (Node 22) |
| Auth | Firebase Auth (email/password + Google OAuth) |
| Database | Firestore |
| Storage | Cloudflare R2 (S3-compatible) |
| Payments | Stripe (checkout, webhooks, billing portal) |
| Email | Resend |
| Analytics | PostHog |
| Error tracking | Sentry |
| Image processing | Sharp (server-side compression) |
| Canvas export | Native browser Canvas API |
| Testing | Vitest + Playwright |
| Language | TypeScript 5.8 |

---

## Privacy

Photos are processed by Google Gemini via the backend. Portraits are stored temporarily in Cloudflare R2 as 24-hour signed URLs and are not retained beyond that window. No images are stored permanently. Users see a dismissible privacy notice on the upload screen before any photo is submitted.
