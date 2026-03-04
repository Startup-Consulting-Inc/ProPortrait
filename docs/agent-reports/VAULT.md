# VAULT — Monetization & Pricing Audit Report

**Agent**: VAULT
**Role**: Revenue strategist, pricing psychologist
**Date**: 2026-03-02
**Status**: Complete

---

## Executive Summary

ProPortrait AI has a complete, sophisticated feature set (16 styles, 5 expression presets, granular identity locks, editing studio, platform exports, before/after comparison) but effectively has **zero monetization**. The "Pro" gate is a single `useState(false)` toggled by a button that calls `setIsPro(true)` — no payment, no Stripe, no server-side enforcement. Any user who clicks "Unlock for $9.99" gets Pro access without paying. Any user who refreshes loses it.

The two features gated behind Pro — PNG export and 2048px resolution — are both paper-thin differentiators. The resolution "upgrade" is exposed as a fraud: `imageSize: '1K'` is hardcoded in `ai.ts` for all users and never varies with Pro status; the 2048px "Pro" export is simply canvas upscaling of the same 1K AI-generated image. A Pro user gets an upscaled JPEG, not a higher-quality AI output.

Free users receive unlimited generations with no usage cap, no rate limit, and no cost tracking. The API key is exposed in the browser bundle, meaning any visitor can extract it and run unlimited Gemini generations at the operator's expense. The current state represents a product that charges no one while accumulating unbounded API costs.

**Revenue at risk**: $0 collected. **Cost exposure**: Unbounded.

**Three actions that must happen before any public launch**:
1. Move the API key to a backend server with auth-gated endpoints.
2. Implement a real credit or generation limit for free users.
3. Wire Stripe with server-side subscription enforcement.

---

## Competitive Pricing Analysis

All prices are verified as of March 2026. All competitors use one-time per-session pricing, not monthly subscriptions — this is the dominant model in the AI headshot market.

| Tool | Price | Model | Free Tier | Key Differentiator |
|------|-------|-------|-----------|-------------------|
| **ProPortrait (current)** | $9.99 | ??? (no billing) | Unlimited, unmetered | Full feature set, real-time browser app |
| **Aragon AI** | $35–$75 one-time | Per-session batch | No | 40–120 headshots, 45-min turnaround, 20+ styles |
| **HeadshotPro** | $29–$59 one-time | Per-session batch | No | 40–200 headshots, 1–3 hr delivery, high realism |
| **Secta Labs** | $49 one-time | Per-session batch | No | 300 headshots, unlimited editing |
| **BetterPic** | $35–$79 one-time | Per-session batch | No | 4K resolution, 20–120 headshots, 1.5–2 hr |
| **Try It On AI** | $21 one-time | Per-session batch | No | 100–200 headshots, budget tier |
| **StudioShot** | $29–$39 per person | Per-session batch | No | Human retouch included on higher tiers |
| **ProfilePicture.ai** | $32–$99 one-time | Per-session batch | Limited | 96–900 images per session |
| **Remini** | $6.99/week | Subscription | Yes (limited) | Mobile-first, enhancement focus, large install base |
| **Midjourney** | $10–$60/month | Subscription (GPU hours) | No (free tier ended) | Creative/artistic, not headshot-specific |
| **Runway ML** | $12–$76/month | Credit subscription | Yes (limited) | Video + image, professional creative tool |

### Key Market Observations

**1. The market is one-time, not subscription.** Every dedicated AI headshot tool charges per session (one photo upload → N headshots). None of the major players charge $9.99/month for unlimited generations. ProPortrait's pricing direction is misaligned with market expectations. A first-time user who compares ProPortrait to Aragon ($35 one-time for 40 headshots) will perceive ProPortrait's "$9.99" (ambiguous period) as either a subscription or a trivially cheap one-time charge — neither reads as premium.

**2. Volume is the primary value signal.** Competitors lead with headshot count (40, 100, 200, 300 images). Users shopping for professional headshots are comparing output volume and quality per dollar. ProPortrait generates 2–4 images per session, which is appropriate for a real-time interactive product, but this must be positioned as an *interactive studio* rather than a batch headshot generator.

**3. ProPortrait has a genuine feature moat.** No competitor offers a real-time editing studio, before/after comparison, per-region edits, or granular identity locks (eye color, skin tone, hair length, glasses individually toggled). This is the correct axis of differentiation — but it is currently unmonetized and unmarketed.

**4. The real-time vs. batch dichotomy is the pricing pivot.** Batch services deliver many images hours later. ProPortrait is the only tool in this category that lets users iteratively refine a single portrait in real time, control expression precisely, and edit specific regions (background only, clothing only). This experience justifies a higher per-session price than batch tools — if the value is communicated clearly.

**5. $9.99 positions ProPortrait as the cheapest option in the market.** HeadshotPro's lowest tier is $29. BetterPic starts at $35. Aragon starts at $35. A $9.99 price point signals low quality to professional users, who are the target customer. Professional headshots from a photographer cost $150–$500. The correct pricing ceiling for ProPortrait's interactive quality tier is $19–$29 per session.

---

## Current Monetization Findings

### CRITICAL

#### Fake Payment — `onClick={() => setIsPro(true)}` With No Transaction (`src/components/PortraitGenerator.tsx:991`)
**Description**: The "Unlock for $9.99" button's entire implementation is `onClick={() => setIsPro(true)}`. There is no Stripe, no PayPal, no redirect, no webhook, no receipt, and no server-side record of the "purchase." Pro status is stored only in `useState(false)` which resets to `false` on every page refresh. Any user can open DevTools and manually trigger `setIsPro(true)` in the React state, or simply click the button. There is zero friction between "free user" and "Pro user" states.

**Impact**: The product collects $0 in revenue while appearing to have a paywall. Users who find the button and click it get "Pro" for free. Users who pay nothing get "Pro" for free. Users who refresh lose Pro. This is not a soft paywall — it is a UI label with no commercial backing whatsoever.

**Remediation**:
1. Integrate Stripe Checkout. Create a `POST /api/subscriptions/create-checkout-session` endpoint on the backend (Express already in `package.json`). The client redirects to `stripe.com/checkout`; Stripe webhooks update the database; the client derives `isPro` from the authenticated user record, not local state.
2. Alternatively, for a one-time payment model (aligned with the market), use Stripe Payment Links — the fastest path to real revenue with zero custom backend code for the payment flow itself.
3. Server-side enforcement: Pro-only API features (higher resolution Gemini calls, PNG export endpoint) must be gated server-side on the subscription status JWT claim.

**Effort**: M (Stripe Payment Links shortcut) / L (full subscription backend)

---

#### Free Tier Has No Generation Limit — Unlimited Unmetered API Calls (`src/components/PortraitGenerator.tsx:127–137`, `src/services/ai.ts:252–260`)
**Description**: Free users can generate portraits indefinitely. `handleGenerate` calls `generateProfessionalPortrait` with no usage counter, no quota check, and no throttle. With `numVariations = 4` and `removeBlemishes = true`, a single "Generate" click triggers 8 parallel Gemini API calls (4 `generateSingle` + 4 `retouchPass` via `Promise.all`). There is no server-side gate, no session limit, no IP throttle, no daily cap, and no cost tracking.

**Impact**: A free user can generate hundreds of portraits per hour at zero cost to them and full cost to the operator. At $0.067 per 1K image (Gemini 2.5 Flash pricing), 8 API calls per generation = $0.54 per generation event. 1,000 free generations = $540 in API costs with $0 in revenue. At scale, this is fatal to unit economics before the product has a single paying customer.

**Remediation**:
1. Free tier: 3 generations per day (or 10 per month) enforced server-side by authenticated user ID.
2. Implement the `usage_events` table (already designed in FORGE's database schema) and increment on every generation call.
3. Return a 429 with a clear upgrade prompt when the limit is hit. This is the single highest-converting paywall moment: the user has already seen results and wants more.
4. Short-term (before backend exists): at minimum, track `generationCount` in `localStorage` and show a hard gate after 3 free uses — imperfect but better than nothing.

**Effort**: S (localStorage gate) / M (server-side with FORGE backend)

---

#### Pro Resolution Is Canvas Upscaling, Not Higher AI Quality (`src/services/ai.ts:203`, `src/components/PortraitGenerator.tsx:240`)
**Description**: The Pro upgrade's primary value claim is "High Resolution (2048px)." In reality, `ai.ts` calls `imageConfig: { imageSize: '1K' }` for all users — free and Pro alike. The Gemini API always returns a 1024px image. The "2048px Pro" export is `canvas.drawImage` on a 1K source scaled to 2048×2048, which is algorithmic upscaling, not a higher-resolution AI generation. A user who pays for "High Resolution" receives an upscaled JPEG indistinguishable in quality from the free 1024px export (browsers apply bilinear interpolation automatically when displaying the same image larger).

**Impact**: The primary Pro value proposition is provably false. If a paying user discovers this (DevTools → Network → image dimensions, or pixel-peeping at 100% zoom), it constitutes a misrepresentation. Beyond legal risk, it means the two Pro features (2048px + PNG) offer no meaningful quality difference — making the upgrade economically irrational for any informed user.

**Remediation**:
1. For legitimate resolution tiering, `ai.ts` must pass `imageSize: '2K'` (Gemini 2.5 Flash: 2048px, ~$0.101/image) for Pro users and `imageSize: '1K'` for free users. This requires the `isPro` flag to be read server-side at the generation endpoint, not client-side at the export step.
2. Immediately update the UI copy to not claim "High Resolution (2048px)" until the API call actually requests 2K output.
3. Short-term accurate alternative: market the Pro tier as "PNG Lossless Export + Unlimited Platform Exports + Priority Queue" while fixing the resolution issue.

**Effort**: S (copy fix) / M (genuine API resolution tiering)

---

#### "$9.99" Has No Time Qualifier and No Stripe Price Object (`src/components/PortraitGenerator.tsx:992`)
**Description**: The button text "Unlock for $9.99" does not specify whether this is a monthly subscription, annual subscription, one-time payment, or per-session fee. No `data-price-id` Stripe attribute. No Stripe.js loaded. The price is a hardcoded JSX string, meaning A/B testing, promotions, regional pricing, and Stripe dynamic pricing are all impossible without a code change and redeploy.

**Impact**: Ambiguous pricing signals undermine conversion. User research consistently shows that undefined billing periods (monthly vs. one-time) reduce click-through by 15–25% compared to explicit labeling. "Unlock for $9.99/month" converts differently than "One-time: $9.99" — and neither is the current display. Additionally, with no Stripe price object, there is no way to know which price to charge even if payment were wired tomorrow.

**Remediation**:
1. Decide the pricing model first (recommendation below). Then create Stripe products and price objects.
2. Update JSX to use a `PRICING_CONFIG` constant imported from `src/config/pricing.ts`: `{ amount: 1999, currency: 'usd', interval: 'month', displayLabel: '$19.99/month' }`.
3. Long-term: fetch active prices from the Stripe API on app load so price changes deploy without code changes.

**Effort**: XS (copy fix + constant extraction)

---

### HIGH

#### No API Cost Tracking — Unit Economics Are Unknown (`src/services/ai.ts`, `src/components/PortraitGenerator.tsx`)
**Description**: There is zero instrumentation on API spend. The app does not log: how many generations occur per session, how many API calls each generation triggers, which styles are most used, how many edits follow each generation, or what the total Gemini API spend is per user. The `console.log` statements in `ai.ts` are development-only and print to the browser, not to any analytics or monitoring system.

**Impact**: Without cost tracking, the operator cannot calculate: cost per portrait generated, average API spend per user per month, API cost as a percentage of revenue, or the margin impact of the double-pass retouch (which doubles API cost). It is impossible to price correctly or optimize costs without this data. The double-pass retouch alone (enabled by default for all users) doubles per-generation cost: at 4 variations with retouch, that is 8 API calls × $0.067 = $0.54/generation for a service charging $0.

**Remediation**:
1. Instrument every `generateSingle` and `retouchPass` call with a server-side usage event: `{ userId, event: 'generate', model: GEMINI_MODEL, imageSize: '1K', cost_usd: 0.067, timestamp }`.
2. Build a simple admin dashboard (even a read-only SQLite query) showing: daily API spend, cost per user, and top-consuming users.
3. Evaluate whether the retouch pass delivers sufficient quality improvement to justify 2× API cost. Consider making it Pro-only.

**Effort**: M

---

#### Upgrade Banner Appears Only at Step 4 — After Maximum User Investment (`src/components/PortraitGenerator.tsx:979–994`)
**Description**: The only paywall touchpoint in the entire user journey is the Pro banner on Step 4 (Export). Users reach Step 4 only after: uploading a photo (Step 1), configuring 7+ settings (Step 2), waiting 20–40 seconds for generation (Step 3), and navigating to export (Step 4). By this point, users have invested 2–4 minutes and received the primary value (the generated portrait). The upgrade prompt appears *after* value delivery, when the user's desire to convert is lowest (they already have the image they wanted).

**Impact**: Showing the paywall after value delivery is the lowest-converting paywall placement. Industry data shows paywalls placed before value delivery (pre-generation) convert at 3–8×, while post-delivery paywalls convert at 0.5–2%. The current placement maximizes user satisfaction (they always get to see results) but minimizes revenue capture.

**Remediation**: See Paywall Placement Strategy section below for the full multi-touchpoint architecture.

**Effort**: S

---

#### Platform Exports Are Fully Free — Highest-Value Feature Ungated (`src/components/PortraitGenerator.tsx:1008–1045`)
**Description**: The platform export section (LinkedIn 800×800, GitHub 500×500, Twitter 400×400, Instagram 320×320, Resume 600×800, "Download All Platforms") is completely free and ungated. The Pro upgrade banner falsely claims "All platform exports" as a Pro feature (`<li className="flex items-center gap-1"><Check className="w-3 h-3" /> All platform exports</li>`), but `handlePlatformDownload` and `handleDownloadAll` have no `isPro` check. Every user, regardless of status, can download all platform formats with no restriction.

**Impact**: Platform-optimized exports are the most concrete, workflow-specific value the product delivers. LinkedIn profile photos and resume portraits are exactly the deliverable that professional users will pay for. Giving this away unconditionally removes the strongest reason to upgrade.

**Remediation**:
1. Gate "Download All Platforms" behind Pro.
2. Free users can download one platform format (their choice), Pro users get all five + batch download.
3. Add an inline gate on `handleDownloadAll` and `handlePlatformDownload` for the 2nd–5th platform: `if (!isPro) { showUpgradeModal(); return; }`.

**Effort**: XS (UI gate) / M (server-side enforcement)

---

#### No Watermark on Free Downloads — No Virality or Upgrade Friction (`src/components/PortraitGenerator.tsx:236–258`)
**Description**: Free tier downloads are clean, unwatermarked, full-resolution JPEGs. There is no visible watermark, no subtle metadata tag, no "Made with ProPortrait AI" attribution, and no incentive for the user to mention the product when sharing their headshot. The free download is product-complete: users get the same output quality as the Pro tier (since the resolution "difference" is fake canvas scaling).

**Impact**: Missing two revenue levers simultaneously. First, watermarks create upgrade motivation: "Remove watermark → go Pro." Second, watermarks are a word-of-mouth channel — every headshot shared online with a subtle "ProPortrait.ai" badge in the corner is a free impression. Competitors like Remini historically used this to drive viral growth before removing watermarks at paid tiers.

**Remediation**:
1. Add a subtle corner watermark (8px "ProPortrait.ai" text, 30% opacity) to free tier downloads via canvas compositing before the `a.click()` call.
2. Pro downloads are clean.
3. Include a `metadata: { software: 'ProPortrait AI — proportrait.ai' }` EXIF tag (via `piexifjs` or server-side) on free downloads.

**Effort**: S

---

### MEDIUM

#### No Usage-Based Urgency Signals for Conversion (`src/components/PortraitGenerator.tsx`)
**Description**: There is no "You've used X of Y free generations" counter displayed anywhere in the UI. Free users have no awareness that they are consuming a limited resource (even if they are not, currently). Without scarcity signals, there is no urgency to upgrade. Freemium conversion psychology depends on users feeling the approaching limit: "2 free generations remaining this month."

**Impact**: Urgency is one of the top 3 conversion drivers for freemium products. Without it, conversion rates on free-to-paid transitions typically run 1–2% vs. 4–8% with visible usage meters.

**Remediation**:
1. Display a usage counter in the Step 2 header: "3 free generations remaining this month."
2. After the last free generation, show an interstitial upgrade modal before Step 3 loads.
3. Send an in-app notification (or email, once auth exists) when the user is at 1 remaining generation.

**Effort**: S (UI counter) / M (server-side enforcement + email)

---

#### No Annual Pricing Option — Leaving 30–40% Revenue on the Table
**Description**: If a subscription model is adopted, there is no annual billing option. SaaS industry data shows 30–40% of monthly subscribers will convert to annual when offered at a 20–25% discount. Annual plans dramatically improve cash flow (upfront payment), reduce churn (customers who paid annually are 4–6× less likely to cancel), and improve LTV.

**Remediation**:
1. Offer: Monthly at $19.99/month, Annual at $159/year ($13.25/month equivalent, 34% savings).
2. Default the pricing toggle to "Annual" — this is a standard dark pattern but one users have come to expect and that converts well.
3. Stripe `subscription_data.billing_cycle_anchor` handles pro-rated switching between plans.

**Effort**: XS (config) / S (Stripe setup)

---

#### No Team/Business Pricing Tier
**Description**: There is no plan for teams, agencies, or companies that need multiple headshots for their employees. Competitors (Aragon, HeadshotPro) all offer team/enterprise pricing at a per-seat or per-session discount. Companies buying headshots for 10–50 employees represent 5–10× the LTV of individual consumers.

**Remediation**:
1. Add a "Teams" tier: $149/month for up to 10 users, each with their own generation quota. $299/month for up to 25 users.
2. Offer volume discounts on one-time session packs: $99 for a 5-session pack, $179 for a 10-session pack.
3. This requires multi-user auth (FORGE dependency), but the pricing tier can be announced on the landing page before the backend supports it, collecting email leads.

**Effort**: L

---

#### Copy Settings JSON Is a Free Team Feature (`src/components/PortraitGenerator.tsx:287–300`)
**Description**: "Copy Settings JSON" allows users to export and share their generation presets. This is exactly the kind of workflow integration that team users pay for — standardizing a company's headshot style across all employees. It is currently free and ungated with no framing around its value.

**Remediation**:
1. Gate "Copy Settings JSON" as a Pro feature (or include it in a Team tier as a "Company Preset" feature).
2. Rename to "Copy Company Preset" in the Pro/Team context and add a "Load Preset" import feature (paste JSON → auto-apply settings) as a paired Pro feature.

**Effort**: XS

---

### LOW

#### No Referral / Affiliate Program
**Description**: There is no referral program, no affiliate link system, and no in-app social sharing incentive. AI headshot tools spread virally through professional networks (LinkedIn is literally a target platform for the output). A referral credit system ("Give 1 free generation, get 1 free generation") can drive acquisition at near-zero cost.

**Remediation**:
1. Implement a referral link on the Step 4 "Share" section: "Love your headshot? Share ProPortrait AI and both of you get a free generation."
2. Track referrals by URL parameter (`?ref=USER_ID`), credit both users on successful sign-up.
3. Consider an affiliate program for LinkedIn influencers and career coaches (10–20% commission on referred subscriptions).

**Effort**: M

---

#### No Pricing Page / Landing Page Exists
**Description**: The application is a single-page SPA with no marketing landing page, no pricing page, no comparison page, and no testimonials. All users arrive directly at the upload step with no context about pricing tiers. Prospects cannot evaluate the product without starting the wizard.

**Remediation**:
1. Create a static landing page at `/` with: headline, before/after comparison, pricing table, and social proof.
2. Route the app to `/app` or `/studio`.
3. The landing page is the primary SEO surface and the first conversion funnel entry point.

**Effort**: M

---

## Pricing Model Recommendation

### Recommended Architecture: Hybrid (One-Time Sessions + Optional Monthly Subscription)

**Rationale**: The AI headshot market is dominated by one-time purchase behavior. Users want headshots, not a long-term relationship with a headshot app. However, ProPortrait's real-time editing studio — the unique differentiator — creates a reason for monthly engagement that batch tools cannot replicate. The optimal model captures both buying behaviors.

---

### Tier 1: Free (Freemium Acquisition)
- **3 generations per month** (enforced server-side)
- Resolution: 1024px (genuine Gemini `imageSize: '1K'`)
- Format: JPG only
- Variations: 2 per generation
- Platform exports: 1 platform per result
- Watermark on downloads
- All 16 styles available (do not gate creative features — gate volume)
- Edit studio: 1 edit after generation

**Psychology**: Give users the full experience but limit the number of times they can use it. The goal is to hook them on the quality, then monetize the desire to use it again.

---

### Tier 2: Session Pass — $14.99 one-time
- **10 generations** (never expire)
- Resolution: 2K (genuine Gemini `imageSize: '2K'`)
- Format: JPG + PNG
- Variations: 4 per generation
- All 5 platform exports + "Download All"
- No watermark
- Unlimited edits after each generation
- Copy/Load Settings Preset

**Psychology**: This captures the customer who wants professional headshots once (the majority of the market). One-time purchase removes subscription anxiety. $14.99 is psychologically "only $15" and well below competitor one-time prices ($29–$79), while being 50% above the current confused $9.99. The word "Session" implies it's for a single use occasion — accurate and fair.

---

### Tier 3: Pro Studio — $19.99/month (or $159/year)
- **Unlimited generations**
- Resolution: 4K (Gemini `imageSize: '4K'` when available)
- Format: JPG + PNG + WebP
- Variations: 4 per generation
- All platform exports + future platforms
- No watermark
- Priority queue (ahead of free users)
- Unlimited edits
- Copy/Load Settings Preset
- Portrait history (30 days cloud storage)
- Early access to new styles and features

**Psychology**: Monthly subscribers are professionals who update their headshot quarterly, career coaches, photographers using AI as a tool, and social media managers. $19.99/month is below Remini ($28/month) and well below Midjourney ($30/month) while offering a more specific professional value proposition. Annual at $159 ($13.25/month) is the default display.

---

### Tier 4: Teams — $99/month (up to 5 seats)
- All Pro Studio features × 5 users
- Shared Company Preset (import/export JSON settings as "brand standard")
- Admin dashboard: usage per team member, cost reporting
- Bulk download (all team member portraits in one ZIP)
- Priority support

**Expansion pricing**: $149/month (10 seats), $249/month (25 seats), custom enterprise.

---

## Feature Gating Matrix

| Feature | Free | Session Pass ($14.99) | Pro Studio ($19.99/mo) | Teams ($99/mo) |
|---------|------|-----------------------|------------------------|----------------|
| Generations per month | 3 | 10 (never expire) | Unlimited | Unlimited × seats |
| AI resolution | 1024px (1K) | 2048px (2K actual) | 4096px (4K) | 4096px |
| Image format | JPG only | JPG + PNG | JPG + PNG + WebP | All formats |
| Variations per gen | 2 | 4 | 4 | 4 |
| Edit studio | 1 edit | Unlimited | Unlimited | Unlimited |
| Platform exports | 1 platform | All 5 platforms | All 5 + future | All + bulk ZIP |
| "Download All Platforms" | No | Yes | Yes | Yes + team ZIP |
| Watermark | Yes | No | No | No |
| Copy/Load Settings Preset | No | Yes | Yes | Yes + shared team preset |
| Portrait history (cloud) | No | No | 30 days | 90 days |
| Priority generation queue | No | No | Yes | Yes |
| New style early access | No | No | Yes | Yes |
| Admin usage dashboard | No | No | No | Yes |
| Styles available | 16 | 16 | 16 + future | 16 + future |
| Expression presets | 5 | 5 | 5 | 5 |
| Identity locks | All | All | All | All |

**Gating philosophy**: Never gate identity or quality features (locks, expression, naturalness). Gate volume, resolution, format, and workflow features. Users who feel the app is holding back quality will distrust it; users who see they've used their free quota will pay to continue.

---

## Stripe / Paddle Integration Spec

### Recommended Payment Processor: Stripe

Stripe is preferred over Paddle for this use case. Paddle adds a 5% + $0.50 fee as a Merchant of Record; Stripe is 2.9% + $0.30 and gives direct control over the transaction. The backend Express server is already in `package.json`; Stripe's Node.js SDK integrates in ~50 lines.

### Integration Steps

**Step 1: Stripe Account Setup (Day 1)**
1. Create Stripe account at `dashboard.stripe.com`.
2. Create Products and Prices in Stripe dashboard:
   - Product: "Session Pass" → Price: `price_session_1499` ($14.99 one-time)
   - Product: "Pro Studio Monthly" → Price: `price_pro_monthly_1999` ($19.99/month)
   - Product: "Pro Studio Annual" → Price: `price_pro_annual_15900` ($159/year)
   - Product: "Teams Monthly" → Price: `price_teams_monthly_9900` ($99/month)
3. Note all Price IDs for use in server code.
4. Enable Stripe webhooks endpoint: `POST /api/webhooks/stripe`.

**Step 2: Backend Checkout Session Endpoint (Day 2)**
```
POST /api/subscriptions/create-checkout-session
Body: { priceId: string, userId: string }
Response: { checkoutUrl: string }

Logic:
1. Authenticate user via JWT
2. Look up or create Stripe Customer for userId
3. Create Stripe Checkout Session with success_url and cancel_url
4. Return session.url to client
5. Client redirects to Stripe-hosted checkout page
```

**Step 3: Stripe Webhook Handler (Day 3)**
```
POST /api/webhooks/stripe
Events to handle:
- checkout.session.completed → create subscription record, set user.plan = 'session' | 'pro' | 'team'
- customer.subscription.updated → update subscription status
- customer.subscription.deleted → downgrade user to free tier
- invoice.payment_failed → set subscription status to 'past_due', notify user
```

**Step 4: Auth + JWT Plan Claims (Day 4)**
```
GET /api/auth/me
Response: { userId, email, plan: 'free' | 'session' | 'pro' | 'team', generationsRemaining: number }

- JWT claims include: { sub: userId, plan: 'pro', exp: ... }
- Client derives isPro from JWT, NOT from useState
- All generation endpoints validate JWT and check plan before proceeding
```

**Step 5: Client Integration (Day 5)**
```
Replace: onClick={() => setIsPro(true)}
With: onClick={() => redirectToCheckout('price_session_1499')}

Add: useAuthStore hook that reads user.plan from JWT
Replace: const [isPro, setIsPro] = useState(false)
With: const { isPro, plan, generationsRemaining } = useAuthStore()
```

**Step 6: Customer Portal (Day 6)**
```
POST /api/subscriptions/portal
Response: { portalUrl: string }

Stripe Customer Portal handles:
- Plan upgrades / downgrades
- Payment method updates
- Invoice history
- Subscription cancellation
```

**Fastest Path to Real Revenue (3-Day Shortcut)**:

Use Stripe Payment Links — no backend code required for the payment flow itself:
1. Create a Payment Link in the Stripe dashboard for each price tier.
2. Replace `onClick={() => setIsPro(true)}` with `window.open('https://buy.stripe.com/LINK_ID', '_blank')`.
3. Stripe sends a webhook on successful payment.
4. Backend webhook handler sets `user.plan` in the database.
5. App checks `user.plan` on next load.

This collects real money within 24 hours of implementation, before a full auth/JWT system exists.

---

## Unit Economics Model

### API Cost Per Generation Event

The generation model calls Gemini `gemini-3.1-flash-image-preview` (equivalent to Gemini 2.5 Flash for pricing purposes). Pricing: $0.067 per 1K image, $0.101 per 2K image, $0.151 per 4K image.

| Scenario | API Calls | Cost Per Call | Cost Per Generation |
|----------|-----------|---------------|---------------------|
| Free user, 2 variations, with retouch | 4 (2 gen + 2 retouch) | $0.067 | $0.27 |
| Free user, 4 variations, with retouch | 8 (4 gen + 4 retouch) | $0.067 | $0.54 |
| Session Pass user, 4 variations, 2K | 8 (4 gen + 4 retouch) | $0.101 | $0.81 |
| Pro user, 4 variations, 4K | 8 (4 gen + 4 retouch) | $0.151 | $1.21 |
| Edit (any user) | 1 | $0.067 | $0.07 |

### Margin Analysis By Tier

**Session Pass ($14.99 one-time, 10 generations)**:
- Revenue: $14.99
- API cost (10 generations × $0.81 avg): $8.10
- Gross margin: $6.89 (46%)
- Hosting cost (amortized): ~$0.50
- Net margin: ~$6.39 (43%)

Note: If a Session Pass user uses only 5 of 10 generations (typical behavior based on SaaS usage curves where 40–60% of capacity is used), margin improves to ~$10.29 (69%).

**Pro Studio ($19.99/month)**:
- Revenue: $19.99/month
- API cost (assume 15 generations/month average × $0.81): $12.15
- Gross margin: $7.84 (39%)
- Note: Heavy Pro users generating 30+/month compress margins to near zero.
- **Mitigation**: Cap retouch pass at Pro-only with a toggle; make it opt-in rather than default. Removing the default retouch pass cuts per-generation API cost by 50% immediately.

**Free Tier (subsidized)**:
- Revenue: $0
- API cost (3 generations/month × $0.54): $1.62/free user/month
- Break-even: Every 12.3 free users require 1 Pro Studio subscriber to cover their API costs.
- **Target conversion rate**: 5% free-to-paid → 1 in 20 free users converts → each Pro subscriber subsidizes 19 free users × $1.62 = $30.78 in free tier API costs. Pro revenue is $19.99. This is a deficit.
- **Fix**: Either raise Pro price to $29.99 or reduce free tier to 2 generations/month.

### Break-Even Model

| Users | Free % | Session % | Pro % | Monthly Revenue | Monthly API Cost | Net |
|-------|--------|-----------|-------|-----------------|------------------|-----|
| 500 | 90% (450) | 5% (25) | 5% (25) | $375 + $500 = $875 | $729 + $202 + $304 = $1,235 | -$360 |
| 1,000 | 85% (850) | 8% (80) | 7% (70) | $1,199 + $1,399 = $2,598 | $1,377 + $648 + $849 = $2,874 | -$276 |
| 2,000 | 80% (1,600) | 10% (200) | 10% (200) | $2,998 + $3,998 = $6,996 | $2,592 + $1,620 + $2,420 = $6,632 | +$364 |

**Profitable at ~2,000 active users with 10%/10% paid conversion.** This assumes the retouch pass is made Pro-only (halving free tier API costs). With the current architecture (unlimited free, no retouch gate), there is no user count at which the product is profitable.

**Single highest-impact economic action**: Make the automatic retouch pass a Pro-only feature. This halves free tier API costs and provides a genuine quality differentiation (Pro portraits are smoother and more polished) without restricting generation count.

---

## Paywall Placement Strategy

The goal is a multi-touchpoint paywall that captures users at peak desire, not at minimum investment.

### Touchpoint 1: Pre-Generation Gate (Highest converting)
**When**: User clicks "Generate Portraits" button (Step 2)
**What**: After free quota is exhausted, show a modal before the API call fires
**Copy**: "You've used your 3 free portraits this month. Upgrade to keep generating."
**CTA**: "Get Session Pass ($14.99)" | "Start Pro Studio ($19.99/mo)"
**Why**: User is at maximum desire — they have configured all settings and are primed to see results. The next click converts at 3–8× higher than post-delivery paywalls.

### Touchpoint 2: Post-Generation Quality Gate (Medium converting)
**When**: Results are displayed (Step 3 entry)
**What**: Gentle banner: "These are 1K quality. Pro Studio generates at 2K for sharper detail."
**CTA**: "See the difference → Upgrade"
**Why**: The user has seen results and wants to believe they could be even better. Creates aspiration without blocking.

### Touchpoint 3: Platform Export Gate (High intent signal)
**When**: User attempts "Download All Platforms" or 2nd+ platform export
**What**: Hard gate modal — user must upgrade to download to multiple platforms
**Copy**: "LinkedIn. GitHub. Resume. Twitter. Instagram. Get all 5 perfectly sized."
**CTA**: "Unlock All Platforms — Session Pass ($14.99)"
**Why**: Attempting multi-platform download is a strong professional intent signal. This user is preparing a full profile refresh, which is exactly the Session Pass use case.

### Touchpoint 4: PNG Format Gate (Low friction)
**When**: User clicks PNG format toggle
**What**: Inline gate with tooltip: "PNG lossless format is available with Session Pass or Pro Studio."
**CTA**: Inline "Upgrade" link that opens the pricing modal
**Why**: PNG selection indicates a user who cares about quality — higher willingness to pay.

### Touchpoint 5: Edit-After-Edit Gate (Subscription trigger)
**When**: Free user attempts their 2nd edit after a generation
**What**: Modal: "Free tier includes 1 edit per portrait. Pro Studio gives you unlimited iterations."
**CTA**: "Get Pro Studio ($19.99/mo)" — emphasize the subscription value for iterative users

### Urgency Architecture
- Display generation counter in the Step 2 header: "2 of 3 free portraits remaining this month"
- When at 1 remaining: banner turns amber. When at 0: banner turns red with inline upgrade CTA.
- Last generation triggers a "You've used your last free portrait" interstitial with a 10-second countdown before the modal can be dismissed — creates urgency without being hostile.

### What NOT to Do
- Do not block access to the app entirely (hard paywall at login) — this kills trial conversion.
- Do not show the upgrade prompt on Step 1 (upload) — users have not received value yet.
- Do not gate style selection or identity lock features — these create distrust, not desire.
- Do not use the word "upgrade" for the Session Pass (implies ongoing cost). Use "unlock" or "get access."

---

## Dependencies on Other Agents

- **Requires**: FORGE (database schema for `users`, `subscriptions`, `usage_events` tables — already designed in FORGE report; backend Express endpoints for generation quota enforcement and Stripe webhook handling)
- **Requires**: SENTINEL (auth JWT claims must include `plan` field; server-side generation endpoint must validate plan before calling Gemini API)
- **Feeds into**: SCOUT (feature flag system needs to read `user.plan` from the auth context to enforce UI gates consistently across components)
- **Feeds into**: ORACLE (unit economics tracking requires the `usage_events` instrumentation described above; the admin cost dashboard is an ORACLE deliverable built on this data)
- **Feeds into**: ATLAS (paywall modal design and placement implementation; the ProUpgradeBanner component in `src/components/PortraitGenerator.tsx:979–994` should be replaced with an ATLAS-designed multi-tier pricing modal)

---

## Prioritized Remediation Plan

**Priority 1 — Stop the Bleeding (Day 1–2)**
Wire a real payment before doing anything else. Use Stripe Payment Links (zero backend required) and replace `onClick={() => setIsPro(true)}` with `window.open(STRIPE_PAYMENT_LINK_URL)`. This takes the product from $0 revenue to collecting real payments in under 4 hours of work. Set the Session Pass at $14.99 one-time. Simultaneously, gate the free tier to 3 generations via `localStorage` as a temporary (imperfect) throttle until the backend is ready.

**Priority 2 — Fix the Resolution Lie (Day 2–3)**
Update `ai.ts` to pass `imageSize: '2K'` when the authenticated user has a paid plan. Until server-side auth exists, pass `imageSize: '2K'` client-side based on the Stripe Payment Link success URL parameter (`?session_id=...`) as a temporary gate. Remove the claim "High Resolution (2048px)" from the Pro banner until genuine 2K API generation is implemented. Update copy to accurately describe what users receive.

**Priority 3 — Gate Platform Exports (Day 3)**
Add `if (!isPro) { showUpgradeModal(); return; }` to `handleDownloadAll` and to `handlePlatformDownload` for the 2nd–5th platform. Free users can download one platform. This is the single feature most likely to drive Session Pass conversions because multi-platform export is the most concrete professional workflow outcome.

**Priority 4 — Make Retouch Pass Pro-Only (Day 4)**
Change `removeBlemishes` default to `false` for free users. Show retouch as a toggleable Pro feature in the Step 2 UI: "Pro: AI Skin Retouching." This halves free tier API costs immediately, creates a visible quality difference between free and Pro outputs, and provides a legitimate differentiation that is true (the Pro portrait genuinely looks more polished).

**Priority 5 — Add Usage Counter UI (Day 4–5)**
Display "X of 3 free portraits remaining" in the Step 2 header. Tie this to `localStorage` generation count (temporary) or the server-side `usage_events` table (permanent). This is the single highest-ROI psychological conversion lever: visible scarcity drives urgency.

**Priority 6 — Add Watermark to Free Downloads (Day 5)**
Composite "ProPortrait.ai" text onto the canvas before download for free users. Remove it for paid users. This creates a visible quality difference in the downloaded file and drives word-of-mouth. Implementation: 10 lines of canvas 2D context text rendering.

**Priority 7 — Implement Real Stripe + Backend Auth (Week 2)**
Follow the Stripe Integration Spec above. This replaces the Payment Links shortcut with a full checkout flow, persistent plan state, JWT claims, and server-side generation quota enforcement. Coordinate with FORGE on the database schema and SENTINEL on the JWT auth model.

**Priority 8 — Add Pre-Generation Paywall Modal (Week 2)**
Move the paywall from Step 4 to Step 2 (before generation fires). When `generationsRemaining === 0`, intercept the Generate button click and show the pricing modal before any API call is made. This is the highest-converting paywall placement and requires the usage tracking from Priority 5 to function correctly.

**Priority 9 — Launch Landing Page with Pricing Table (Week 3)**
Create a `/` landing page with before/after comparisons, pricing tiers displayed in a clear table, and social proof. Route the current app to `/studio`. The landing page is the SEO surface and the top of the conversion funnel.

**Priority 10 — Evaluate Annual Billing + Teams Tier (Month 2)**
Once monthly subscriptions are running and conversion rates are measured, add the annual billing option ($159/year) and the Teams tier ($99/month for 5 seats). Annual billing improves cash flow and reduces churn. Teams tier unlocks a B2B acquisition channel with 5–10× the LTV of individual consumers.

---

*Sources used for competitive research: [Secta Labs comparison](https://secta.ai/blog/p/best-ai-headshot-generator-comparison), [Pixelbin AI headshot generators 2026](https://www.pixelbin.io/blog/best-ai-headshot-generator), [HeadshotPro pricing](https://www.headshotpro.com/pricing), [BetterPic pricing](https://www.betterpic.io/pricing), [Aragon AI pricing](https://www.aragon.ai/pricing), [StudioShot cost analysis](https://www.studioshot.ai/blog/headshot-cost-in-2025), [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [SaaS freemium conversion benchmarks](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/), [Paywall strategy guide](https://www.getmonetizely.com/articles/mastering-freemium-paywalls-strategic-timing-for-saas-success), [AI pricing playbook — Bessemer](https://www.bvp.com/atlas/the-ai-pricing-and-monetization-playbook)*
