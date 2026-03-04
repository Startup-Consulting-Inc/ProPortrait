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
- Google Gemini API key (`gemini-2.0-flash-preview-image-generation` model access)

### Setup

```bash
# Install dependencies
npm install

# Create env file for the backend
cp .env.example .env.local
# Add your key: GEMINI_API_KEY=your_key_here

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
| `npm run clean` | Remove `dist/` |

---

## Architecture

```
Browser (React SPA) → Firebase Hosting
     │
     └─→ Express Backend → Cloud Run (GCP)
              │
              ├─→ Google Gemini API  (image generation & editing)
              ├─→ Cloudflare R2     (portrait storage, 24h signed URLs)
              ├─→ Resend            (email capture)
              └─→ Stripe            (Pro subscription — scaffold)
```

In dev, Vite proxies `/api/*` to `localhost:3001`. In production, the frontend calls `VITE_API_URL` (Cloud Run) directly.

---

## Features

### Quick / Advanced Mode

A persistent mode toggle at the top of the wizard keeps the default experience simple:

| Quick Mode (default) | Advanced Mode |
|---|---|
| 8 curated styles in a 4-column grid | All 16 styles |
| One-click Generate | Expression presets, identity locks, likeness/naturalness sliders, blemish toggle, group photo selector, variations picker, copy settings |
| "Edit Portrait" button reveals AI editor on demand | Full AI editor panel open by default |
| Aspect ratio + Download only | Full export options visible |
| "More Export Options" expands layout, format, platform presets, share | All export controls always visible |

### Step 1 — Upload

- Upload JPG, PNG, or WEBP (max 10 MB)
- Drag-and-drop or click-to-browse
- Dismissible privacy notice explaining data handling
- Tips panel showing ideal vs. avoid photo conditions

### Step 2 — Style & Settings

**16 portrait styles:**

| Style | Description |
|---|---|
| Corporate | Executive headshot, tailored suit, office background |
| LinkedIn | Optimized profile headshot, neutral background |
| Studio | Classic Rembrandt lighting, gray canvas |
| Tech | Modern tech leader, blazer + tee, bright office |
| Creative | Personal brand, smart-casual, artistic backdrop |
| B&W | Fine-art black and white, rich tonal range |
| Vintage | 1950s–60s Kodachrome film look |
| Cinematic | Movie-quality close-up, teal/orange grade |
| Outdoor | Environmental portrait, urban park, warm daylight |
| Cartoon | Pixar/Disney 3D animated character style |
| Art Deco | 1920s glamour, geometric gold patterns |
| Resume | Conservative CV headshot, clean white/gray |
| Speaker | Conference keynote presenter, high-impact |
| Dating | Warm, candid dating profile portrait |
| Academic | Faculty/researcher, scholarly backdrop |
| Creative Pro | Editorial portfolio, distinctive personal style |

**Advanced controls:**

- **Group photo support** — select which person: Single person, Left, Center, Right, or custom free-text description
- **Expression presets** — Confident Neutral (default), Warm Smile, Authority, Approachable Expert, Natural
- **Identity Locks** — per-feature toggles (eye color, skin tone, hair length ON by default; hair texture, glasses OFF)
- **Likeness strength** 0–100 (default 70) — controls facial replication fidelity
- **Skin smoothness / Naturalness** 0–100 with presets: Natural (15), Polished (50), Studio (85 — Pro)
- **Blemish removal** toggle — removes spots/acne without altering identity (ON by default)
- **Variations** — 2 or 4 images per generation
- **Identity Confidence Score** — color-coded meter (green/amber/red) based on current settings
- **Copy Settings JSON** — clipboard preset for team sharing

### Step 3 — Editing Studio

- **Variation thumbnails** — click to switch between generated images
- **Before/After comparison slider** — drag to compare original vs. AI portrait
- **AI Editor** (expand via "Edit Portrait" in Quick mode):
  - **Clothes wizard** — 3-step (style → color → pattern) with visual swatches
  - **Background wizard** — 8 categories, 6–8 options each; Transparent requires Pro
  - **Color grading** — 7 presets (B&W, Warm, Cool, Cinematic, Sepia, Pastel, High Contrast)
  - **Regional edit** — lock edits to background / clothing / lighting / hair / color grading only
  - **Custom prompt** — free-text instruction input (Enter or wand button)
  - **Prompt history** — last 15 prompts, click to reuse
- **Undo / Redo** with step counter (Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z)
- **Edit history strip** — thumbnail timeline; click any state to jump back

### Step 4 — Export

- **Aspect ratio** — 1:1 (square) or 3:4 (portrait)
- **Layout mode** — Fill (crop) or Fit (letterbox with blurred background)
- **Crop position** — X/Y percentage sliders for precise framing (Fill mode)
- **Format** — JPG (free) or PNG (Pro; required for transparent background)
- **Platform presets** — one-click download at exact platform dimensions:

| Platform | Size |
|---|---|
| LinkedIn | 800×800 |
| GitHub | 500×500 |
| X / Twitter | 400×400 |
| Instagram | 320×320 |
| Resume / CV | 600×800 |

- **Download All Platforms** — ZIP of all five presets (JSZip, dynamic import)
- **Share** — LinkedIn / Twitter / copy link

### Pro Tier

| Feature | Free | Pro |
|---|---|---|
| Portrait generation | ✅ | ✅ |
| JPG export | ✅ | ✅ |
| PNG / lossless export | — | ✅ |
| Export resolution | 1024px | 2048px |
| Transparent background | — | ✅ |
| Studio skin smoothing | — | ✅ |
| Platform batch download | ✅ | ✅ |

---

## Project Structure

```
src/
├── components/
│   ├── PortraitGenerator.tsx   # Main 4-step wizard (~1480 lines)
│   ├── ComparisonSlider.tsx    # Before/after drag comparison
│   ├── GenerationProgress.tsx  # 5-phase animated progress bar
│   ├── PricingModal.tsx        # 3-tier pricing modal + Stripe redirect
│   ├── EmailCapture.tsx        # Post-generation email capture modal
│   ├── FeatureTour.tsx         # First-run feature walkthrough
│   ├── PrivacyNotice.tsx       # Dismissible privacy banner
│   └── ErrorBoundary.tsx       # React class error boundary
├── services/
│   ├── ai.ts                   # API calls → backend proxy (/api/portraits/*)
│   ├── session.ts              # Session fetch + isPro cache
│   └── analytics.ts            # PostHog event capture
├── hooks/
│   └── useFeatureFlag.ts       # PostHog feature flag hook
├── lib/
│   ├── platformPresets.ts      # Platform export configs
│   └── utils.ts                # cn() Tailwind utility
├── App.tsx
└── main.tsx

server/
├── index.ts                    # Express app (port 3001 / 8080 in prod)
├── routes/
│   ├── portraits.ts            # POST /api/portraits/generate & /edit
│   ├── auth.ts                 # GET /api/auth/me
│   ├── payments.ts             # Stripe checkout + webhook
│   └── email.ts                # POST /api/email/capture
└── lib/
    ├── session.ts              # In-memory session store + UUID cookie
    └── storage.ts              # Cloudflare R2 portrait storage
```

---

## Environment Variables

### Backend (`server/`)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google AI API key |
| `R2_ACCOUNT_ID` | For storage | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | For storage | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | For storage | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | For storage | Cloudflare R2 bucket name |
| `RESEND_API_KEY` | For email | Resend API key |
| `RESEND_FROM_EMAIL` | For email | Sender email address |
| `ADMIN_EMAIL` | For email | Admin notification recipient |
| `CORS_ORIGIN` | Prod | Allowed frontend origin |
| `PORT` | Prod | Server port (default: 3001; Cloud Run: 8080) |

### Frontend (Vite build-time)

| Variable | Required | Description |
|---|---|---|
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

CI/CD runs on push to `main` via `.github/workflows/deploy.yml`:
1. **Lint** — `tsc --noEmit` + `npm audit`
2. **Deploy backend** — Cloud Build → Artifact Registry → Cloud Run
3. **Deploy frontend** — `npm run build` (with `VITE_API_URL`) → Firebase Hosting

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Animation | Motion (Framer Motion v12) |
| Icons | Lucide React |
| AI | Google Gemini (`gemini-2.0-flash-preview-image-generation`) |
| Backend | Express + tsx (Node 22) |
| Storage | Cloudflare R2 (S3-compatible) |
| Payments | Stripe (scaffold) |
| Email | Resend |
| Analytics | PostHog |
| Error tracking | Sentry |
| Canvas export | Native browser Canvas API |
| Language | TypeScript 5.8 |

---

## Privacy

Photos are processed by Google Gemini via the backend. Portraits are stored temporarily in Cloudflare R2 as 24-hour signed URLs and are not retained beyond that window. No images are stored permanently. Users see a dismissible privacy notice on the upload screen before any photo is submitted.
