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
              ├─→ Firestore           (user profiles, saved portraits, credits,
              │                        events, anonymous sessions, settings history)
              ├─→ Cloudflare R2       (portrait storage, signed URLs)
              ├─→ Stripe              (one-time checkout, webhooks)
              ├─→ PostHog             (client + server-side dual-fire analytics)
              └─→ Resend              (email capture)
```

### Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | User profiles, credits, onboarding preferences, admin flag |
| `portraits` | Saved portrait metadata + R2 keys |
| `events` | Full event log — all users and anonymous sessions |
| `anonymous_sessions` | Per-session aggregates for unauthenticated users (generations, exports, etc.) |
| `settings_history` | Style settings snapshots per generation (for analytics + abandoned-session recovery) |

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

On sign-in, any pre-login anonymous session is automatically linked to the new user account via `POST /api/auth/link-session` (fire-and-forget). This marks the `anonymous_sessions` document as converted so usage history is preserved.

---

## Pricing Model

**Generate and edit for free. Pay only when you download.**

| Add-on | Price | Credits granted |
|---|---|---|
| 1 HD Download | $4.99 one-time | +1 HD credit |
| 5 Platforms + 1 HD | $9.99 one-time | +1 HD credit + 5 platform credits |
| 1 Platform Export | $2.99 one-time | +1 platform credit |

**Credit rules:**
- HD credits: 1 credit per HD download (2048px)
- Platform credits: 1 credit per individual platform export; 5 credits for Download All Platforms (ZIP)
- Credits are tied to your account and never expire

---

## Features

### User Onboarding

New users complete a 2-step onboarding flow that personalizes their portrait settings:

1. **Purpose & Industry** — Select primary use (Job Search, Executive, Creative, Services, Arts) and field
2. **Vibe & Use Cases** — Choose desired aesthetic (Polished, Warm, Bold, Creative) and where photo will be used

Based on answers, the system automatically configures:
- **Style** — Editorial for corporate, Watercolor for creative, etc.
- **Expression** — Confident for executives, Warm Smile for services
- **Identity Locks** — Industry-appropriate defaults (e.g., glasses ON for legal)
- **Skin Smoothing** — Natural for artists, Polished for corporate
- **Background Preferences** — Premium darks for executives, warm neutrals for services

Users can retake the onboarding quiz anytime from Profile settings.

### Session Timeout

For security, users are automatically logged out after **15 minutes of inactivity**:
- Tracks mouse, keyboard, scroll, and touch events
- Warning modal appears at 14 minutes with 60-second countdown
- Works correctly when tab is in background (checks elapsed time on return)
- Disabled during portrait generation to avoid interrupting long processes

### Rate Limiting

Portrait generation is rate-limited to **20 requests per 15 minutes** per IP. When the limit is reached, the UI displays a clear message with the exact time remaining until the limit resets (e.g., "Generation limit reached. Try again in 8 minutes.").

### Quick / Advanced Mode

A persistent mode toggle at the top of the wizard keeps the default experience simple:

| Quick Mode (default) | Advanced Mode |
|---|---|
| Curated styles in a grid | All 7 styles |
| One-click Generate | Expression presets, identity locks, likeness/naturalness sliders, blemish toggle, group photo selector, variations picker, copy settings |
| "Edit Portrait" button reveals AI editor on demand | Full AI editor panel open by default |
| Aspect ratio + Download only | Full export options visible |
| "More Export Options" expands layout, format, platform presets | All export controls always visible |

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
- **Expression presets** — Confident, Warm Smile, Serious, Natural
- **Identity Locks** — per-feature toggles (eye color, skin tone, hair length ON by default; hair texture, glasses OFF)
- **Likeness strength** 0–100 (default 75)
- **Skin smoothness / Naturalness** 0–100 with presets: Natural (15), Polished (50), Studio (85)
- **Blemish removal** toggle (ON by default)
- **Variations** — 2 or 4 images per generation
- **Identity Confidence Score** — color-coded meter based on current settings
- **Copy Settings JSON** — clipboard preset for team sharing

### Step 3 — Editing Studio

- **Variation thumbnails** — click to switch between generated images
- **Before/After comparison slider** — drag to compare original vs. AI portrait
- **AI Editor** (expand via "Edit Portrait" in Quick mode):
  - **Clothes wizard** — 3-step (style → color → pattern) with visual swatches
  - **Background wizard** — 8 categories, 6–8 options each
  - **Color grading** — 7 presets (B&W, Warm, Cool, Cinematic, Sepia, Pastel, High Contrast)
  - **Regional edit** — lock edits to background / clothing / lighting / hair / color grading only
  - **Custom prompt** — free-text instruction input
  - **Prompt history** — last 15 prompts, click to reuse
- **Undo / Redo** with step counter (Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z)
- **Edit history strip** — thumbnail timeline; click any state to jump back
- **Save to Library** — save portrait to Firestore + R2
- **Feature Tour** — interactive guided tour for first-time users

### Step 4 — Export

- **Aspect ratio** — 1:1 (square) or 3:4 (portrait)
- **Layout mode** — Fill (crop) or Fit (letterbox with blurred background)
- **Crop position** — X/Y percentage sliders (Fill mode)
- **Format** — JPG or PNG
- **Platform presets** (contain scaling — full face always visible):

| Platform | Size |
|---|---|
| LinkedIn | 800×800 |
| GitHub | 500×500 |
| X / Twitter | 400×400 |
| Instagram | 320×320 |
| Resume / CV | 600×800 |

- **Download All Platforms** — ZIP of all five presets; requires 5 platform credits (JSZip, dynamic import)
- Credit balance displayed inline; "Buy credits" link opens purchase modal

### Admin Dashboard

Admin users (`/admin`) have access to user management features:

**User List:**
- Search users by name, email, or UID
- Stats cards: Total users, Daily generations

**User Detail Modal:**
- **Overview** — Profile info, onboarding answers, usage stats (generations, edits, exports), account timeline
- **Account** — Suspend/unsuspend user, delete user permanently
- **Activity** — Recent saved portraits

**Admin API Endpoints:**
- `GET /api/admin/users` — List all users
- `GET /api/admin/users/:uid` — Get detailed user info
- `DELETE /api/admin/users/:uid` — Delete user and all data
- `POST /api/admin/users/:uid/suspend` — Suspend/unsuspend user
- `GET /api/admin/stats` — Daily usage statistics

---

## Project Structure

```
src/
├── components/
│   ├── PortraitGenerator.tsx      # Main 4-step wizard
│   ├── BuyCreditsModal.tsx        # Credit purchase modal (Stripe redirect)
│   ├── OnboardingModal.tsx        # User onboarding flow (ICP-based defaults)
│   ├── AuthModal.tsx              # Sign in / create account (Google + email)
│   ├── UserMenu.tsx               # Avatar dropdown (Profile, Admin, Sign Out)
│   ├── UserProfileModal.tsx       # 4-tab: Profile, Preferences, Account, Billing
│   ├── AdminUserDetailModal.tsx   # Admin user management (view, edit, delete)
│   ├── SavedPortraitsModal.tsx    # Library of saved portraits
│   ├── SessionWarningModal.tsx    # Session timeout warning
│   ├── ComparisonSlider.tsx       # Before/after drag comparison
│   ├── GenerationProgress.tsx     # 5-phase animated progress bar
│   ├── FeatureTour.tsx            # Interactive feature tour
│   ├── EmailCapture.tsx           # Post-generation email capture modal
│   ├── LandingPage.tsx            # Public landing page (/)
│   ├── ContactPage.tsx            # Public contact page (/contact)
│   ├── CookieConsent.tsx          # GDPR cookie consent banner
│   ├── ThemeToggle.tsx            # Dark/light mode toggle
│   └── ErrorBoundary.tsx          # React class error boundary
├── pages/
│   └── AdminPage.tsx              # /admin dashboard (users, stats, management)
├── contexts/
│   └── AuthContext.tsx            # Global auth state via onAuthStateChanged
├── hooks/
│   ├── useAuth.ts                 # Firebase auth + profile fetch
│   ├── useFeatureFlag.ts          # PostHog feature flag hook
│   └── useInactivityTimeout.ts    # Session timeout tracking
├── types/
│   └── onboarding.ts              # Onboarding types and options
├── services/
│   ├── ai.ts                      # API calls → backend proxy (/api/portraits/*)
│   ├── auth.ts                    # Firebase client SDK (signIn, signOut, getIdToken)
│   ├── user.ts                    # User API with Bearer token (profile, billing portal)
│   ├── onboarding.ts              # Onboarding API (save preferences)
│   ├── portraits.ts               # Saved portraits API
│   └── analytics.ts               # Dual-fire analytics: PostHog + /api/events/track; step helpers
├── lib/
│   ├── platformPresets.ts         # Platform export configs
│   └── utils.ts                   # cn() Tailwind utility
├── App.tsx
└── main.tsx

server/
├── index.ts                       # Express app (port 3001 / 8080 in prod)
├── routes/
│   ├── portraits.ts               # POST /api/portraits/generate & /edit
│   ├── users.ts                   # GET|PATCH|DELETE /api/users/me + download credits
│   ├── payments.ts                # Stripe one-time checkout, webhook
│   ├── admin.ts                   # Admin endpoints (users, stats, suspend, delete)
│   ├── auth.ts                    # GET /api/auth/me; POST /api/auth/link-session
│   ├── events.ts                  # POST /api/events/track; POST|GET /api/settings/snapshot|last
│   ├── contact.ts                 # POST /api/contact
│   └── email.ts                   # POST /api/email/capture
├── middleware/
│   └── authMiddleware.ts          # Firebase JWT → Firestore; anonymous cookie fallback
├── lib/
│   ├── firebase.ts                # Admin SDK singleton (ADC)
│   ├── firestore.ts               # UserDoc CRUD, credits, generation limits, onboarding
│   ├── session.ts                 # In-memory session store + UUID cookie
│   └── storage.ts                 # Cloudflare R2 portrait storage
└── types.d.ts                     # req.auth type: { mode, uid?, email?, isAdmin, sessionId? }
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
| `STRIPE_HD_ADDON_PRICE_ID` | For payments | $4.99 — 1 HD download credit |
| `STRIPE_PLATFORM_SINGLE_PRICE_ID` | For payments | $2.99 — 1 platform export credit |
| `STRIPE_PLATFORM_BUNDLE_PRICE_ID` | For payments | $9.99 — 1 HD + 5 platform credits |
| `R2_ACCOUNT_ID` | For storage | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | For storage | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | For storage | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | For storage | Cloudflare R2 bucket name |
| `RESEND_API_KEY` | For email | Resend API key |
| `RESEND_FROM_EMAIL` | For email | Sender email address |
| `CORS_ORIGIN` | Prod | Allowed frontend origin(s), comma-separated |
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
| Payments | Stripe (one-time checkout, webhooks) |
| Email | Resend |
| Analytics | PostHog (client + server dual-fire; anonymous + registered) |
| Error tracking | Sentry |
| Image processing | Sharp (server-side compression) |
| Canvas export | Native browser Canvas API |
| Testing | Vitest + Playwright |
| Language | TypeScript 5.8 |

---

## Privacy

Photos are processed by Google Gemini via the backend. Portraits are stored in Cloudflare R2 with permanent signed URLs (access links regenerated on each request). Users see a dismissible privacy notice on the upload screen before any photo is submitted.

User data collected:
- Email, display name, profile photo (Firebase Auth)
- Usage statistics (generation count, style preferences, step navigation)
- Onboarding preferences (purpose, industry, vibe) — used to personalize portrait settings
- Saved portraits (stored permanently in Cloudflare R2)
- Style settings snapshots per generation (`settings_history` collection)

**Anonymous user tracking:** Unauthenticated visitors are tracked via a UUID session cookie (`pp_session`). Usage aggregates (generations, edits, uploads, exports, steps reached) are stored in the `anonymous_sessions` Firestore collection. Individual events go to the `events` collection. When an anonymous user signs up, their session is linked to their new account (`convertedToUser: true`).

Users can delete their account and all associated data from the Profile → Account settings.
