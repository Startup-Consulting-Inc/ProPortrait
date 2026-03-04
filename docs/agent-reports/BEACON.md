# BEACON — Growth & Retention Audit Report
**Agent**: BEACON
**Role**: Growth hacker, retention specialist
**Date**: 2026-03-02
**Status**: Complete

---

## Executive Summary

ProPortrait AI has a technically competent product with zero growth infrastructure. The app generates professional portraits and immediately loses every user to their downloads folder. There is no mechanism to bring users back, no way to capture intent, no organic amplification loop, and no discoverable presence for search engines. Every portrait that leaves this app is a dead-end marketing event.

The core viral surface — the generated portrait itself — is completely unmonetized. Users download a clean image with no attribution, no watermark, no "Made with ProPortrait AI" moment, and no prompt to share. LinkedIn is the #1 distribution channel for professional headshots and there is no share-to-LinkedIn button anywhere in the app.

Google crawls a blank `<div id="root">` with no OG tags, no structured data, and a placeholder `google-site-verification` value. Shared links render as empty previews on every major social platform.

The app is English-only with 150+ hardcoded strings, cutting out non-English professional markets (India, Brazil, Germany, Japan, South Korea) that represent tens of millions of LinkedIn users who pay for professional headshots.

**Verdict**: The product is feature-complete for Phase 1-5 but growth-ready for none of them. All critical gaps are implementation issues, not product gaps — the product quality is already sufficient to drive organic sharing if the loops are built.

---

## Findings

### CRITICAL

#### 1. No OG / Twitter Card meta tags — shared links render blank everywhere (`index.html:1-20`)
**File**: `/Users/jaeheesong/projects/node/proportrait/index.html`

The entire `<head>` contains zero Open Graph tags and zero Twitter Card tags. When any URL from this app is pasted into LinkedIn, Slack, Twitter/X, iMessage, WhatsApp, or Discord, the unfurl renders as a blank card with no image, no title, and no description. This is the single highest-leverage missing element because every user who discovers the app through word-of-mouth is currently sending a dead link.

Present tags (lines 3-14): `charset`, `viewport`, `title`, `description`, `keywords`, `author`, `robots`, `googlebot`, `google` (notranslate), `google-site-verification`.

Missing in full:
- `og:title`
- `og:description`
- `og:image`
- `og:url`
- `og:type`
- `og:site_name`
- `og:locale`
- `twitter:card`
- `twitter:site`
- `twitter:title`
- `twitter:description`
- `twitter:image`
- `twitter:image:alt`
- `theme-color`
- `apple-mobile-web-app-title`
- `application-name`

The `google-site-verification` value at line 14 is a literal placeholder string: `google-site-verification=google-site-verification`. This will cause Google Search Console to reject verification and may signal spam patterns to crawlers.

---

#### 2. SPA with no SSR — Google crawls an empty div (`src/main.tsx:6`, `index.html:17`)
**File**: `/Users/jaeheesong/projects/node/proportrait/src/main.tsx`

The app mounts entirely via `createRoot(document.getElementById('root')!)`. The `index.html` body at line 17 contains only `<div id="root"></div>`. Googlebot will index an empty page. No page content, no headings, no copy, no keywords exist in the crawled DOM.

The build system is Vite with `@vitejs/plugin-react` (client-side only). There is no `vite-plugin-ssr`, no `@vitejs/plugin-react-ssr`, no Next.js, no Astro, and no pre-rendering configuration. The `vite.config.ts` defines no `build.ssr` entry.

Organic search traffic is structurally impossible in the current architecture. Queries like "AI professional headshot generator", "LinkedIn profile photo AI", "professional portrait AI free" — all high-intent, high-volume queries — will never surface this app.

---

#### 3. Zero email capture anywhere in the entire app (`src/components/PortraitGenerator.tsx:1-1057`)
**File**: `/Users/jaeheesong/projects/node/proportrait/src/components/PortraitGenerator.tsx`

A full audit of all 1,057 lines of `PortraitGenerator.tsx` finds:
- Zero `<input type="email">` elements
- Zero email validation logic
- Zero subscription prompts
- Zero newsletter flows
- Zero waitlist forms
- Zero "save your results" prompts requiring email

The only input capture in the app is the file upload (`line 445`) and the custom edit prompt text field (`line 857`). Users arrive, generate portraits, download, and leave with no contact point created.

The Pro upgrade button at line 991 (`onClick={() => setIsPro(true)}`) sets a local React state variable and performs no actual payment processing, account creation, or email capture. There is no backend, no Stripe integration, and no user identity system.

---

#### 4. No sharing functionality anywhere — portrait lifecycle ends at download (`src/components/PortraitGenerator.tsx:1003-1044`)
**File**: `/Users/jaeheesong/projects/node/proportrait/src/components/PortraitGenerator.tsx`

The entire Step 4 (Export) UI (lines 874-1051) contains exclusively download buttons. A full scan of the component finds no:
- Share to LinkedIn button
- Share to Twitter/X button
- Copy image URL functionality
- "Share your result" prompt
- Web Share API call (`navigator.share`)
- Social sharing links of any kind

The `handleExport` function at line 236 and `handlePlatformDownload` at line 260 both use `document.createElement('a')` anchor-click download mechanics only. The generated portrait, which is the app's highest-value output and the most natural viral trigger, creates zero organic impressions after it leaves the browser.

---

#### 5. No social proof anywhere — zero trust signals beyond privacy notice (`src/components/PortraitGenerator.tsx:361-374`)
**File**: `/Users/jaeheesong/projects/node/proportrait/src/components/PortraitGenerator.tsx`

The header section (lines 361-374) contains only the logo, app name, and tagline. No user count ("50,000 portraits generated"), no testimonials, no star ratings, no "used by professionals at [Company]" logos, no before/after gallery of real results.

The only social proof element is the `PrivacyNotice` component (line 403) which is a dismissible banner that users close immediately — it communicates privacy, not quality. There is no evidence that the product works presented before the user invests effort uploading their photo.

---

### HIGH

#### 6. No watermark on free-tier downloads — zero passive organic marketing

The `handleExport` function at line 236 and `handlePlatformDownload` at line 260 produce clean images with no attribution. The `renderToCanvas` function at lines 205-233 performs no watermark composition. The `isPro` state at line 72 gates only resolution (1024px vs 2048px) and PNG format — not watermarking.

Every free-tier portrait that gets uploaded to LinkedIn, GitHub, Twitter, or a resume is a missed organic impression. A subtle "Made with ProPortrait AI" text in the corner or a small badge on the preview is standard viral mechanics for free-tier AI image tools (Canva, Remove.bg, Lensa all use this pattern). Removing the watermark is a natural Pro upgrade incentive.

---

#### 7. Pro upgrade is a fake toggle with no monetization backend (`src/components/PortraitGenerator.tsx:72`, `991-994`)

The "Upgrade to Pro" button at line 991 calls `onClick={() => setIsPro(true)}` which is a local React state toggle. There is no Stripe checkout, no payment flow, no account creation, no server-side entitlement check, and no persistence across sessions. Refreshing the page resets `isPro` to `false`.

The `package.json` contains no payment library (no `stripe`, no `@stripe/stripe-js`, no `paddle-js`, no `lemon-squeezy`). The `express` and `better-sqlite3` dependencies in `package.json` (lines 16, 21) suggest a backend was planned but there is no server route file, no API directory, and no database schema in the project.

---

#### 8. No referral or invite mechanism — no viral coefficient above 0

No referral link generation, no "invite a colleague" flow, no "share this tool" CTA, no affiliate program infrastructure. The viral coefficient is structurally 0: each user acquisition does not produce any new user acquisition. For a B2B-adjacent tool targeting LinkedIn professionals, a referral program ("Give 3 free portraits, get 3 free portraits") is the highest-ROI growth lever available.

---

#### 9. No analytics or event tracking — no behavioral data exists

The `package.json` contains no analytics library: no `@segment/analytics-next`, no `mixpanel-browser`, no `posthog-js`, no `@vercel/analytics`, no `gtag`. No analytics script tag in `index.html`. No `useEffect` tracking calls in `PortraitGenerator.tsx`.

ORACLE (the analytics agent) has no data source. Funnel drop-off between Step 1 (Upload) and Step 2 (Generate) is unknown. Whether users reach Step 4 (Export) is unknown. Feature usage (which styles are most popular, whether expression presets are used) is completely invisible. Growth decisions are being made blind.

---

#### 10. App name in `package.json` is `react-example` — not branded (`package.json:2`)
**File**: `/Users/jaeheesong/projects/node/proportrait/package.json`

The `"name"` field at line 2 is `"react-example"`. While this does not directly affect SEO, it signals the project is a scaffolded template and affects any tooling, npm scripts, or CI/CD metadata that reads the package name. The version is `"0.0.0"` and `"private": true`, suggesting no public package release intention, but the name should reflect the product.

---

#### 11. `google` meta tag set to `notranslate` — blocks browser translation for international users (`index.html:13`)

Line 13: `<meta name="google" content="notranslate">`. This instructs Google Translate and Chrome's built-in translation to not offer translation of the page. For an English-only app, this blocks the only accessible path for non-English speakers to use the tool. Combined with the 150+ hardcoded English strings in `PortraitGenerator.tsx`, this creates a complete barrier to international growth.

---

### MEDIUM

#### 12. Page `<title>` has a trailing space — minor SEO hygiene issue (`index.html:7`)

Line 7: `<title>ProPortrait AI - Convert your casual photos into professional portfolio headshots </title>`. There is a trailing space before the closing `</title>` tag. This is a minor issue but indicates the metadata was written without a QA pass.

---

#### 13. No canonical URL tag — duplicate content risk if app is served on multiple domains (`index.html`)

No `<link rel="canonical" href="...">` tag exists. If the app is deployed to multiple URLs (staging, production, custom domains), search engines may split ranking signals across duplicates.

---

#### 14. No structured data / JSON-LD — misses rich results eligibility (`index.html`)

No `<script type="application/ld+json">` block exists. Adding `WebApplication` or `SoftwareApplication` schema would make the app eligible for rich result features in Google Search (star ratings, pricing, app description). The `SoftwareApplication` type is directly applicable and requires minimal markup.

---

#### 15. No `robots.txt` or `sitemap.xml` — crawler guidance missing

No `robots.txt` in the project root or `public/` directory. No `sitemap.xml`. These are low-effort, high-signal items for establishing crawler expectations.

---

#### 16. Download filename is style-specific but not brand-attributed (`src/components/PortraitGenerator.tsx:253`)

Line 253: `a.download = \`portrait-${selectedStyle}.${exportFormat}\``. The file saves as e.g. `portrait-linkedin.jpg`. A user uploading this file to LinkedIn sees no brand attribution in the filename. Renaming to `proportrait-linkedin.jpg` or `ProPortrait-AI-linkedin.jpg` creates a subtle but persistent brand touchpoint in file systems and email attachments.

---

#### 17. Privacy notice is dismissible but has no "Learn More" link — trust opportunity missed (`src/components/PrivacyNotice.tsx`)

The `PrivacyNotice` component (lines 7-41 of `PrivacyNotice.tsx`) has an `onDismiss` callback but no link to a privacy policy page. "Your photos are sent directly to Google Gemini AI" (line 19) is a significant disclosure with no supporting documentation. A privacy policy URL, even a minimal one, would reduce conversion friction for privacy-conscious professional users (GDPR-aware EU users, enterprise prospects).

---

### LOW

#### 18. No `manifest.json` — app is not installable as PWA

No Web App Manifest. Professional users who want quick access to a headshot tool would benefit from a PWA install experience. This also affects branded appearance when added to home screens on mobile.

---

#### 19. No `preconnect` or `dns-prefetch` hints for Google AI API — first-generation latency is higher than necessary

No `<link rel="preconnect" href="https://generativelanguage.googleapis.com">` in `index.html`. The first API call to Gemini pays a DNS lookup + TLS handshake cost that could be eliminated with a preconnect hint.

---

#### 20. External texture image loaded from `grainy-gradients.vercel.app` — third-party dependency for cosmetic effect (`src/App.tsx:13`)

Line 13 of `App.tsx`: `bg-[url('https://grainy-gradients.vercel.app/noise.svg')]`. This loads a background texture from an external Vercel deployment. If that deployment goes down or rate-limits, the background texture disappears. This should be bundled locally. More relevantly, it is a third-party request that analytics tools may flag as a dependency.

---

## Viral Loop Design

### Target Loop: LinkedIn Headshot → Profile Update → Organic Discovery

The highest-value viral loop for a professional headshot tool is the profile photo update event. When a user uploads their new AI portrait to LinkedIn, it triggers a network notification to all connections ("X updated their profile photo") — this is free media impressions to exactly the right audience (professionals who need headshots).

**The Loop Mechanics**:

```
User generates portrait
        |
        v
Soft watermark on free download: "Made with ProPortrait AI · proportrait.ai"
        |
        v
User uploads to LinkedIn profile
        |
        v
LinkedIn notifies connections: "[Name] updated their profile photo"
        |
        v
Connection sees watermarked photo on profile page OR "share your result" post
        |
        v
Connection visits proportrait.ai
        |
        v
New user conversion
```

**Implementation Steps**:

1. **Watermark layer** (Step 4, `renderToCanvas`): Composite a small `"proportrait.ai"` text badge at the bottom-right of the canvas output for all free-tier downloads. Font: 11px, color: rgba(255,255,255,0.6), positioned 8px from bottom-right edges. Pro tier removes watermark. This is the primary organic loop trigger.

2. **Share to LinkedIn button** (Step 4 sidebar, after download): After the download fires, show a CTA: "Update your LinkedIn profile" with a link to `https://www.linkedin.com/profile/edit/` and a prominent "Share your result" button that calls `navigator.share({ title: 'My new AI professional portrait', url: 'https://proportrait.ai', files: [imageFile] })` (Web Share API Level 2). Fallback for desktop: copy a pre-written tweet "Just upgraded my LinkedIn headshot with @ProPortraitAI — took 30 seconds. [link]".

3. **Post-generation "share moment"** (Step 3, after portrait appears): Display a card: "Love it? Share your transformation" with a before/after composite image (original thumbnail → AI portrait thumbnail) designed for social sharing. This is the highest-engagement moment — users are most excited immediately after seeing the result.

4. **Referral link generation** (Step 4): "Give a colleague free portraits" — generate a referral link (e.g. `proportrait.ai?ref=ABC123`) that the sharer can copy. When visited, the referral code is stored and the new user gets 2 extra free portraits. Sharer gets credit toward Pro features.

---

## SEO Optimization Checklist

| Check | Status | Notes |
|-------|--------|-------|
| `<title>` tag present | PASS | Line 7, though trailing space present |
| `<meta name="description">` present | PASS | Line 8, good copy |
| `<meta name="keywords">` present | PASS | Line 9 (minor ranking factor) |
| `<meta name="robots">` present | PASS | Line 11: index, follow |
| `og:title` | FAIL | Missing entirely |
| `og:description` | FAIL | Missing entirely |
| `og:image` | FAIL | Missing entirely |
| `og:url` | FAIL | Missing entirely |
| `og:type` | FAIL | Missing entirely |
| `og:site_name` | FAIL | Missing entirely |
| `twitter:card` | FAIL | Missing entirely |
| `twitter:title` | FAIL | Missing entirely |
| `twitter:description` | FAIL | Missing entirely |
| `twitter:image` | FAIL | Missing entirely |
| `<link rel="canonical">` | FAIL | Missing entirely |
| JSON-LD structured data | FAIL | Missing entirely |
| `robots.txt` | FAIL | Not found in project |
| `sitemap.xml` | FAIL | Not found in project |
| `manifest.json` / PWA | FAIL | Missing entirely |
| SSR / pre-rendered HTML | FAIL | Pure SPA, `<div id="root">` only |
| Valid `google-site-verification` | FAIL | Placeholder value (line 14) |
| `notranslate` meta removed | FAIL | Line 13, blocking translation |
| Page speed / preconnect hints | FAIL | No preconnect for Gemini API |
| Favicon present | PASS | `/favicon.svg` referenced (line 5) |
| `lang` attribute on `<html>` | PASS | `lang="en"` (line 2) |
| Mobile viewport meta | PASS | Line 6 |

**Summary**: 6 pass / 17 fail. The technical SEO foundation is nearly absent.

---

## Email Capture Strategy

### Where to Add Capture Points

**Point 1 — Pre-generation (highest intent moment, Step 2)**
After the user configures their style settings and clicks "Generate Portraits", intercept with a lightweight modal or inline form: "Enter your email to receive your portraits + a link to regenerate anytime." This captures users at peak intent. Incentive: the generated portraits are automatically saved and emailed as a download link (requires a minimal backend endpoint).

**Point 2 — Post-generation (Step 3, high excitement moment)**
Immediately after portraits appear, display a dismissible banner: "Save these to your account — never lose your settings or portraits." Free account creation via email. This is the moment of highest product satisfaction.

**Point 3 — Pro upgrade flow (Step 4, conversion moment)**
The current `onClick={() => setIsPro(true)}` (line 991) needs to become an actual payment + account creation flow. Email capture is mandatory here. Even before payment processing is built, collect email with a "Join the Pro waitlist — $9.99/month, launching soon" form.

**Point 4 — Exit intent (passive, session end)**
Before session storage clears (on unload/visibility change), show: "Save your portrait settings? Enter your email and we'll send you a settings link."

### What to Offer

- **Primary incentive**: "Save and re-access your portraits for 7 days" (requires storage backend)
- **Secondary incentive**: "Get 2 extra free portrait variations" (generation credit)
- **Tertiary**: "Weekly headshot tips for LinkedIn professionals" (content hook)

### Tool Recommendations

- **Email infrastructure**: Resend (simple API, generous free tier, developer-friendly) or SendGrid
- **Forms**: Native React form (no library needed given existing stack)
- **CRM / list**: ConvertKit (creator-focused, automation-capable) or Loops (modern, SaaS-focused)
- **Capture widget**: No additional library needed — build inline with existing Tailwind patterns

---

## Referral Program Spec

### Mechanic: Give 2, Get 2

**Logic**:
- Free tier: 3 portrait generations per day (establish a generation limit to create referral value)
- Referral offer: "Share ProPortrait AI → you and your friend each get 2 bonus portrait generations"
- Referral link format: `proportrait.ai?ref={8-char-code}`
- Code generation: hash of user email or session ID, stored in `localStorage` and server-side
- Attribution window: 30 days (cookie + URL param persistence)
- Credit delivery: instant on referral's first portrait generation

### Implementation Flow

1. After Step 3 (portrait generated), show "Share with a colleague" CTA
2. Generate referral link via `localStorage.getItem('proportrait_ref')` or server-assigned code
3. Pre-compose share text: "I just got a professional LinkedIn headshot in 30 seconds — try ProPortrait AI: [link]"
4. Track via URL param `ref=` on landing, store in `localStorage` and pass with first generation request
5. Server-side: credit both accounts (sharer + referee) when referee completes first generation

### Pro Referral Tier (higher incentive)

- 3 successful referrals → 1 month Pro free
- Display referral count and progress toward Pro in account dashboard
- Email notification: "Your referral [Name] just created their first portrait. 2 more to unlock Pro."

---

## Social Proof Integration Plan

### Counter Implementation

**"X portraits generated" counter** (Header, `PortraitGenerator.tsx` line 364):
- Position: below the tagline "The only AI portrait tool that actually looks like you..."
- Display: `"Join 47,200 professionals who upgraded their headshot"` (update weekly from server)
- Technical: single `GET /api/stats` endpoint returning `{ total_generations: number }`, cached at CDN for 1 hour
- Fallback: hardcode an initial number and increment client-side during session for demo purposes before backend is live

**Real-time counter** (optional, high engagement):
- WebSocket or SSE stream showing `"14 portraits generated in the last hour"`
- Creates urgency and social validation simultaneously

### Testimonials

**Placement**: Step 1 (Upload screen), below the "Best Results / Avoid" cards (line 420).
**Format**: 3-card horizontal scroll, each card containing:
- Before/after portrait thumbnails (3:4 ratio, 80px wide each)
- Quote: "Finally a headshot tool that didn't make me look like a cartoon" — Sarah M., Product Manager
- LinkedIn profile link (with permission) or company logo
- Star rating (5/5)

**Content sourcing**: Initial testimonials can be manually curated from beta users. After email capture is live, automate a post-generation survey: "Rate your portrait (1-5 stars)" + "Would you recommend ProPortrait AI?" (NPS). High-NPS users get a follow-up asking for a quote.

### Before/After Gallery

**Placement**: Separate landing section above the fold (requires SSG/SSR to be indexable).
**Purpose**: The #1 conversion driver for image transformation tools. Users need to see that the output looks real and professional before investing effort.
**Technical**: Gallery of 6-8 curated before/after pairs, displayed using the existing `ComparisonSlider` component. Store images in `/public/gallery/` as static assets.

---

## Watermark Strategy for Free Tier

### Design Specification

**Free tier watermark** (applied in `renderToCanvas` before download):
- Text: `"proportrait.ai"`
- Font: 10px system-sans, weight 400
- Color: `rgba(255, 255, 255, 0.55)` (subtle on light backgrounds, visible on dark)
- Position: bottom-right corner, 10px padding from edges
- Optional: small logo mark (4px circle) preceding text for brand recognition

**Second option — badge style** (stronger brand signal, more Pro incentive):
- Small semi-transparent pill badge: `"⚡ ProPortrait AI"`
- Background: `rgba(0, 0, 0, 0.25)` with 4px border-radius
- Positioned bottom-center for maximum visibility on LinkedIn profile cards

### Pro Tier Toggle

- `isPro === true` → skip watermark composition in `renderToCanvas`
- Add to Pro feature list: "Watermark-free downloads" (currently the Pro banner at line 986 does not mention this)
- Frame as positive: "Clean downloads — no watermark, fully yours"

### Platform-Specific Watermark Placement

For platform exports in `handlePlatformDownload`:
- LinkedIn (800×800): badge bottom-center — most visible on profile grid
- Resume (600×800): badge bottom-right only — employment applications warrant subtlety
- GitHub/Twitter/Instagram (small sizes): text only, 8px, bottom-right — badge too large for small avatars

---

## OG Tag Implementation

The following block should be added to `index.html` inside `<head>`, replacing and augmenting the existing meta tags. The `og:image` requires a static 1200×630 social preview image to be created and hosted at `/og-image.png`.

```html
<!-- Open Graph / Facebook / LinkedIn -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://proportrait.ai/" />
<meta property="og:title" content="ProPortrait AI — Professional Headshots in 30 Seconds" />
<meta property="og:description" content="Convert any casual photo into a professional LinkedIn headshot using AI. Identity-locked, skin-tone guaranteed, platform-ready exports." />
<meta property="og:image" content="https://proportrait.ai/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="ProPortrait AI — before and after professional headshot transformation" />
<meta property="og:site_name" content="ProPortrait AI" />
<meta property="og:locale" content="en_US" />

<!-- Twitter / X Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@ProPortraitAI" />
<meta name="twitter:creator" content="@ProPortraitAI" />
<meta name="twitter:title" content="ProPortrait AI — Professional Headshots in 30 Seconds" />
<meta name="twitter:description" content="Upload a casual photo, get a professional LinkedIn headshot. Identity-locked AI — your face, just better." />
<meta name="twitter:image" content="https://proportrait.ai/og-image.png" />
<meta name="twitter:image:alt" content="AI professional portrait transformation example" />

<!-- Additional -->
<meta name="theme-color" content="#4f46e5" />
<meta name="application-name" content="ProPortrait AI" />
<meta name="apple-mobile-web-app-title" content="ProPortrait AI" />
<link rel="canonical" href="https://proportrait.ai/" />
```

**OG Image Spec** (`/og-image.png`, 1200×630px):
- Left half: casual selfie (blurred/placeholder for template)
- Right half: polished AI professional portrait
- Center: ProPortrait AI logo + "→" arrow between the two images
- Bottom: tagline "Professional headshots in 30 seconds"
- Background: indigo gradient matching app brand (`#4f46e5` to `#7c3aed`)

---

## SSR / SSG Strategy

### Recommended Approach: Vite SSG (Static Site Generation) via `vite-ssg`

The full application is a single-page tool with one functional route. True SSR (server-side rendering on every request) is unnecessary overhead. Static Site Generation (SSG) — pre-rendering the initial HTML at build time — solves the SEO problem completely with minimal architectural change.

**Option A: `vite-ssg` (lowest migration cost)**

`vite-ssg` is a Vite plugin that pre-renders React routes to static HTML at build time. For a single-route SPA, this is a one-hour migration:

1. Install: `npm install vite-ssg`
2. Change `src/main.tsx`: replace `createRoot(...).render(...)` with `ViteSSG(App, { routes }, ...)`
3. Update `vite.config.ts`: add `ssgOptions` configuration
4. Build produces pre-rendered `index.html` with full content in the DOM

The crawler will see the hero copy, the tagline, the feature descriptions, and the style names — all of which are currently invisible to Google.

**Option B: Astro with React Islands (medium migration cost)**

Migrate the landing/marketing content to Astro (fully static, excellent SEO) while keeping the PortraitGenerator as a React island (client-side only). This is the architecturally correct long-term solution as it separates marketing pages (SSG) from the app shell (CSR). Estimated migration: 1-2 days.

**Option C: Next.js App Router (highest migration cost, most scalable)**

Full migration to Next.js. Enables: static landing page, dynamic OG images via `next/og`, API routes for email capture and analytics, server-side generation credits. Estimated: 3-5 days. Recommended if the backend (Express + SQLite already in `package.json`) is being built out anyway.

**Immediate interim fix (today, no migration)**:

Add meaningful content to `index.html` inside `<div id="root">` as server-fallback content that React replaces on hydration. This is low-fidelity but ensures crawlers see something:

```html
<div id="root">
  <h1>ProPortrait AI — Professional Headshots in 30 Seconds</h1>
  <p>Convert your casual photos into professional LinkedIn headshots using AI.</p>
</div>
```

---

## i18n Prioritization

### Why i18n Matters for This Product

Professional headshots are a global need. LinkedIn has 1 billion members globally; the majority are not native English speakers. The professional headshot market is particularly large in markets where corporate photography studios are expensive or inaccessible. The `google: notranslate` meta tag (line 13 of `index.html`) currently blocks the only workaround for non-English users.

### Language Priority Stack

**Tier 1 — Add within 60 days** (highest user base + willingness to pay + professional culture):

1. **Portuguese (Brazilian)** — Brazil is the 3rd largest LinkedIn market globally (~65M users). Strong professional culture, high mobile-first usage, AI tools are popular.
2. **Spanish (Latin America)** — Combined LATAM market is massive. Mexico, Colombia, Argentina are high-LinkedIn-penetration markets.
3. **German** — Germany has a formal professional headshot culture. DACH region professionals actively purchase headshots. High willingness to pay.

**Tier 2 — Add within 90 days**:

4. **Japanese** — Japan has a formal profile photo culture (employees are often required to have professional headshots). High LTV market.
5. **Hindi** — India is the #1 fastest-growing LinkedIn market. Enormous base of tech professionals who need headshots for international applications.
6. **Korean** — South Korea has extremely high professional photo standards. K-Beauty-influenced aesthetics mean skin tone and appearance quality is valued highly.

**Tier 3 — Add within 180 days**:
French, Arabic, Mandarin (Traditional for Taiwan/HK, Simplified for enterprise), Dutch, Polish.

### Implementation Stack

- **i18n library**: `react-i18next` (most widely used, good TypeScript support, lazy loading)
- **String extraction**: 150+ hardcoded strings in `PortraitGenerator.tsx` need wrapping in `t()` calls
- **Namespace structure**: `common`, `upload`, `style`, `edit`, `export`, `errors`
- **URL strategy**: Subdirectory routing (`proportrait.ai/pt-BR/`, `proportrait.ai/de/`) for SEO benefit over `Accept-Language` header routing
- **First pass automation**: Use i18next-scanner to extract all strings, then DeepL API for initial machine translation, with native speaker review for Tier 1 languages

### Highest-Value String Count (PortraitGenerator.tsx)

Scanning `PortraitGenerator.tsx` for hardcoded user-facing English strings:
- Step labels: 4 strings (lines 320-323)
- Style labels + descriptions: 32 strings (lines 327-343)
- Expression labels + descriptions: 15 strings (lines 346-351)
- Identity lock labels: 5 strings (lines 353-358)
- Naturalness presets: 6 strings (lines 601-609)
- Edit mode labels: 8 strings (lines 801-812)
- Clothing options: 8 strings (line 820)
- Background options: 10 strings (line 824)
- Color options: 7 strings (line 828)
- Region options: 5 strings (lines 835-841)
- Pro features list: 3 strings (lines 987-989)
- Error messages: 2 strings (lines 150, 188)
- Guidance copy: ~20 strings (lines 413-443)

Estimated total: ~160 unique translatable strings in `PortraitGenerator.tsx` alone.

---

## Dependencies

- **Requires**: ATLAS (user journey mapping to identify drop-off points for email capture placement), ORACLE (analytics implementation to measure viral loop conversion rates)
- **Feeds into**: SCOUT (competitive positioning — the growth gaps identified here define differentiation opportunities vs Aragon AI, PhotoAI, HeadshotPro), FORGE (backend implementation for email capture API, referral link generation, generation counters, and payment processing)
- **Blocks**: Any paid acquisition strategy (no email capture = no retargeting audiences, no lookalike audiences, no conversion tracking)

---

## Prioritized Remediation Plan

### Week 1 — Zero-Code / Low-Code (do immediately, unblock sharing)

| Priority | Action | File | Effort | Impact |
|----------|--------|------|--------|--------|
| P0 | Add all OG and Twitter Card meta tags | `index.html` | 30 min | Shared links render properly on all platforms |
| P0 | Fix `google-site-verification` placeholder value | `index.html:14` | 5 min | Google Search Console registration unblocked |
| P0 | Remove `google: notranslate` meta tag | `index.html:13` | 2 min | Browser translation unblocked for international users |
| P1 | Add canonical URL tag | `index.html` | 5 min | Duplicate content protection |
| P1 | Create `robots.txt` and `sitemap.xml` | `/public/` | 20 min | Crawler guidance established |
| P1 | Fix download filename to include brand | `PortraitGenerator.tsx:253` | 5 min | Passive brand attribution in file systems |
| P1 | Rename `package.json` name from `react-example` | `package.json:2` | 2 min | Tooling consistency |

### Week 2 — Viral Loop Foundation

| Priority | Action | File | Effort | Impact |
|----------|--------|------|--------|--------|
| P0 | Implement watermark in `renderToCanvas` for free tier | `PortraitGenerator.tsx:205` | 2 hours | Passive organic impressions on every download |
| P0 | Add Web Share API button after download | `PortraitGenerator.tsx:1003` | 3 hours | Direct viral loop trigger |
| P0 | Add "Share your result" CTA on Step 3 after generation | `PortraitGenerator.tsx:690` | 2 hours | Peak excitement sharing moment captured |
| P1 | Add "Update your LinkedIn profile" CTA with link | `PortraitGenerator.tsx:1044` | 1 hour | LinkedIn notification loop activation |

### Week 3 — Email Capture and Analytics

| Priority | Action | File | Effort | Impact |
|----------|--------|------|--------|--------|
| P0 | Add email capture at Pro upgrade (replace fake toggle) | `PortraitGenerator.tsx:991` | 1 day | Payment + email captured simultaneously |
| P0 | Integrate PostHog or Mixpanel (event tracking) | `src/main.tsx`, all steps | 4 hours | Funnel visibility, ORACLE data source activated |
| P1 | Add pre-generation email capture with incentive | `PortraitGenerator.tsx:669` | 4 hours | High-intent list building |
| P1 | Add generation counter display in header | `PortraitGenerator.tsx:364` | 2 hours | Social proof, trust signal |

### Week 4 — SEO Foundation

| Priority | Action | Tech | Effort | Impact |
|----------|--------|------|--------|--------|
| P0 | Implement `vite-ssg` pre-rendering | `vite.config.ts`, `src/main.tsx` | 1 day | Google indexes real content |
| P0 | Add JSON-LD `SoftwareApplication` structured data | `index.html` | 1 hour | Rich result eligibility |
| P0 | Create OG image (`og-image.png`, 1200×630) | `/public/` | 2 hours | Social share cards render correctly |
| P1 | Add before/after gallery section (static, SSG-rendered) | New component | 1 day | Conversion-driving social proof above fold |

### Month 2 — Referral and i18n

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| P1 | Build referral link generation and tracking | 3 days | Viral coefficient > 0 |
| P1 | Implement `react-i18next`, extract all strings | 2 days | Foundation for all i18n |
| P1 | Translate to Portuguese (Brazilian) + Spanish | 1 day per language | 2 new major markets unlocked |
| P2 | Add testimonials section to Step 1 upload screen | 1 day | Conversion rate improvement |
| P2 | PWA manifest for installability | 2 hours | Mobile engagement improvement |

---

*Report generated by BEACON — Growth & Retention Agent*
*Codebase snapshot: 2026-03-02*
*Files audited: `index.html`, `src/components/PortraitGenerator.tsx`, `src/App.tsx`, `package.json`, `src/components/PrivacyNotice.tsx`, `src/components/ApiKeyGuard.tsx`, `src/lib/platformPresets.ts`, `src/services/ai.ts`, `src/main.tsx`, `vite.config.ts`*
