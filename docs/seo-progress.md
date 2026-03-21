# ProPortrait AI — SEO Implementation Progress

> Last updated: March 2026

---

## What Was Implemented (Code)

### Phase 1 — Indexation & AI Citation

#### ✅ `public/llms.txt`
A plain-text file that tells AI crawlers (Perplexity, ChatGPT-browse, Claude web, Google AI Overviews) exactly what ProPortrait AI is, what it does, and how to cite it when someone asks "what's a good free AI headshot tool?"

Accessible at: `https://portrait.ai-biz.app/llms.txt`

#### ✅ FAQPage JSON-LD schema (`index.html`)
Six question/answer pairs added as structured data targeting high-intent queries:
- "Is ProPortrait AI free?"
- "Does it require a subscription?"
- "Will AI change my eye color or skin tone?"
- "How long are photos stored?"
- "What formats are supported?"
- "Can I use it for LinkedIn?"

Eligible for Google FAQ rich results (expandable Q&A in search results).

#### ✅ HowTo JSON-LD schema (`index.html`)
3-step "How to Create an AI Professional Headshot" structured data. Eligible for HowTo rich results with step-by-step cards in Google.

#### ✅ OG image corrected (`index.html`)
`og:image` and `twitter:image` updated from `logo-v1.jpg` → `og-image.jpg` (the purpose-built social sharing image). Affects how the URL looks when shared on LinkedIn, Twitter/X, Slack, iMessage.

#### ✅ Sitemap expanded (`public/sitemap.xml`)
Updated from 4 URLs → 27 URLs with correct `lastmod` dates:
- Core pages: `/`, `/pricing`, `/comparison`, `/blog`
- 7 blog posts
- 7 style landing pages
- `/contact`, `/privacy`, `/terms`

#### ✅ Prerender pipeline (`scripts/prerender.ts` + CI)
Playwright-based static prerender that runs in CI after every build. Generates `dist/<route>/index.html` for 17 public routes so Firebase Hosting serves real HTML to Googlebot instead of an empty JavaScript shell.

Without this, Google sees `<div id="root"></div>` — no content to index.

---

### Phase 2 — Content Foundation

#### ✅ `react-helmet-async` — Per-page meta tags
Every page now has unique `<title>`, `<meta name="description">`, and `<link rel="canonical">` tags. Previously all pages shared the homepage title.

| Page | Title |
|------|-------|
| `/contact` | Contact Us — ProPortrait AI |
| `/privacy` | Privacy Policy — ProPortrait AI |
| `/terms` | Terms of Service — ProPortrait AI |
| `/blog` | Blog — AI Headshot Tips, Guides & LinkedIn Photo Advice |
| `/pricing` | Pricing — No Subscription AI Headshots |
| `/comparison` | AI Headshots vs Traditional Photography |
| `/styles/editorial` | Editorial Professional Headshots — Free AI Headshots |
| *(+ 6 more style pages)* | |

#### ✅ Blog infrastructure + 3 full posts
- `/blog` — listing page
- `/blog/:slug` — post template with Article JSON-LD schema

**Published posts:**

| Slug | Target Keyword | Length |
|------|---------------|--------|
| `free-ai-headshot-no-subscription` | "free ai headshot no subscription" | ~1,200 words |
| `ai-headshot-vs-photographer` | "ai headshot vs photographer" | ~1,500 words |
| `linkedin-profile-photo-tips-2026` | "linkedin profile photo tips" | ~1,400 words |

**Additional full posts (published March 2026):**

| Slug | Target Keyword | Length |
|------|---------------|--------|
| `github-profile-photo-guide` | "github profile picture" | ~1,200 words |
| `ai-headshot-privacy` | "ai headshot privacy" | ~1,400 words |
| `corporate-headshots-remote-teams` | "corporate headshots remote" | ~1,500 words |
| `ai-portrait-styles-explained` | "ai portrait styles" | ~1,600 words |

#### ✅ 7 Style landing pages
Each with 500–700 words of SEO content targeting long-tail keywords:

| URL | Target Keyword |
|-----|---------------|
| `/styles/editorial` | professional headshots for LinkedIn |
| `/styles/environmental` | tech founder headshots |
| `/styles/candid` | natural AI headshots |
| `/styles/vintage` | vintage style AI portraits |
| `/styles/black-white` | black and white professional headshots |
| `/styles/cyberpunk` | cyberpunk AI portrait |
| `/styles/watercolor` | watercolor AI portrait |

#### ✅ Pricing page (`/pricing`)
- Offer schema (3 tiers) for Google Shopping/rich results
- Competitor comparison table (vs HeadshotPro, Aragon)
- Pricing FAQ section

#### ✅ Comparison page (`/comparison`)
- "AI headshots vs traditional photography" — targets "ai headshot vs photographer cost"
- 10-row feature comparison table
- Decision framework (scenario → recommendation)
- BreadcrumbList JSON-LD

#### ✅ Testimonials section (`LandingPage.tsx`)
6 user testimonials added before the FAQ section with star ratings. Provides social proof and supports conversion from organic traffic.

---

## What Still Needs to Be Done

### Off-Code Tasks (Marketing)

See the detailed guide below.

### Dev Tasks Remaining

#### ✅ Write the 4 stub blog posts — DONE (March 2026)
All 4 stubs replaced with full 1,200–1,600 word articles:

| Slug | Target Keyword | Words |
|------|---------------|-------|
| `github-profile-photo-guide` | "github profile picture" | ~1,200 |
| `ai-headshot-privacy` | "ai headshot privacy" | ~1,400 |
| `corporate-headshots-remote-teams` | "corporate headshots remote" | ~1,500 |
| `ai-portrait-styles-explained` | "ai portrait styles" | ~1,600 |

All 4 slugs also added to `scripts/prerender.ts` ROUTES so CI generates static HTML for Googlebot.

#### 🔲 Review schema for testimonials
Add `Review` JSON-LD blocks to the testimonials in `LandingPage.tsx`. This makes them eligible for star ratings in Google search results.

#### 🔲 Internal linking
Style pages and blog posts don't link to each other yet. Add:
- Blog post on LinkedIn tips → links to `/styles/editorial`
- Blog post on AI vs photographer → links to `/comparison` and `/pricing`
- Style pages → link to related blog posts

---

## Manual / Marketing Tasks — Detailed Guide

These have zero code involved but are **the highest-leverage SEO actions remaining**. AI citation engines (Perplexity, ChatGPT, Google AI Overviews) build their knowledge of tools from these exact sources.

---

### 1. Google Search Console Setup
**Priority: P0 — Do this first.**

Without GSC, you can't know whether Google is indexing the site, what queries you're appearing for, or whether there are crawl errors.

**Steps:**
1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Click **Add property** → choose **URL prefix** → enter `https://portrait.ai-biz.app`
3. Choose verification method: **HTML tag** (easiest)
   - Copy the `<meta name="google-site-verification" content="..." />` tag
   - Add it to `index.html` inside `<head>` (or use `react-helmet-async` on the homepage)
   - Deploy, then click **Verify** in GSC
4. Once verified, go to **Sitemaps** → enter `https://portrait.ai-biz.app/sitemap.xml` → Submit
5. Go to **URL Inspection** → paste `https://portrait.ai-biz.app/` → click **Request Indexing**

**What to check weekly after setup:**
- Coverage report (are pages indexed or erroring?)
- Performance report (which queries show impressions?)
- Core Web Vitals report

---

### 2. Product Hunt Launch
**Priority: P0**

Product Hunt is one of the primary sources AI citation engines use when building their knowledge of tools. A listing here + upvotes = Perplexity and ChatGPT become aware ProPortrait AI exists.

**How to submit:**

1. Create an account at [producthunt.com](https://www.producthunt.com) (use the founder's personal account, not a company account — PH community responds better to founders)
2. Go to **Submit a product** → **Submit your product**
3. Fill in:
   - **Name:** ProPortrait AI
   - **Tagline:** AI professional headshots — free to generate, pay only to download
   - **URL:** `https://portrait.ai-biz.app`
   - **Description (copy this):**
     > ProPortrait AI generates studio-quality professional headshots from any photo. Unlike subscription tools, it's completely free to generate and preview — you only pay ($4.99–$9.99) when you're ready to download. Identity locks preserve your eye color, skin tone, and hair. Platform-sized exports for LinkedIn, GitHub, resume, and more. Privacy-first: photos are deleted after processing.
   - **Topics:** Artificial Intelligence, Productivity, Design Tools, Photography
   - **Makers:** Add yourself
4. Upload a gallery (use `/og-image.jpg` as the main image; add screenshots of the generator UI)
5. **Scheduling:** Launch on a Tuesday or Wednesday between 12:01 AM PST–3 AM PST for maximum visibility (launches reset at midnight PST)
6. **Before launching:** Post in relevant Slack groups, Twitter, LinkedIn to drive early upvotes in the first 2 hours — ranking is heavily influenced by early momentum

**What to prepare before launch day:**
- A first comment from the maker explaining the story ("I built this because...")
- Responses drafted for likely questions ("How is this different from HeadshotPro?", "Is it really free?")
- 10–15 people ready to upvote and comment in the first hour

---

### 3. AlternativeTo Listing
**Priority: P0**

AlternativeTo is heavily indexed by Google and cited by AI answer engines when users ask "what are alternatives to HeadshotPro?" or "best AI headshot tool." This is a direct AI citation opportunity.

**Steps:**

1. Go to [alternativeto.net](https://alternativeto.net)
2. Search for "HeadshotPro" → open the HeadshotPro page
3. Click **Suggest an alternative** → search for "ProPortrait AI" → if not found, click **Add new software**
4. To add ProPortrait AI as its own listing:
   - Go to [alternativeto.net/software/add](https://alternativeto.net/software/add)
   - **Name:** ProPortrait AI
   - **URL:** `https://portrait.ai-biz.app`
   - **Short description:** AI professional headshot generator — free to generate, no subscription
   - **Long description (copy this):**
     > ProPortrait AI turns any photo into a studio-quality professional portrait using identity-locked AI. Unlike subscription-based headshot tools, generation and preview are completely free. Pay only when you download ($4.99 for single HD, $9.99 for all platform sizes). Identity locks preserve your eye color, skin tone, hair length, and facial structure. Platform-sized exports for LinkedIn (800×800), GitHub (500×500), Resume (600×800), and more. Privacy-first: photos are deleted after processing.
   - **Platform:** Web
   - **License:** Freemium
   - **Tags:** AI, Photography, Headshots, Portrait, LinkedIn, Professional
5. After your listing is live, go back to HeadshotPro and Aragon pages and **suggest ProPortrait AI as an alternative** to each

---

### 4. Crunchbase Organization Entry
**Priority: P1**

Crunchbase is one of the authoritative sources AI language models use to verify that a company is real. Without a Crunchbase entry, there's no "entity record" for ProPortrait AI in the knowledge graph.

**Steps:**

1. Go to [crunchbase.com](https://www.crunchbase.com) → sign up for a free account
2. Click **Add to Crunchbase** → **Add an Organization**
3. Fill in:
   - **Organization name:** ProPortrait AI
   - **Website:** `https://portrait.ai-biz.app`
   - **Short description:** AI-powered professional headshot generator with identity preservation and privacy-first architecture
   - **Long description:** Same as AlternativeTo description above
   - **Founded date:** 2025 (or actual date)
   - **Location:** (your location)
   - **Categories:** Artificial Intelligence, Photography, SaaS, Developer Tools
   - **Operating status:** Active
4. Skip the funding section (optional)
5. Submit for review — Crunchbase reviews new entries, can take 1–3 days

---

### 5. G2 Software Listing
**Priority: P1**

G2 is heavily indexed by Google and is increasingly cited by AI search engines as a source for software reviews.

**Steps:**

1. Go to [g2.com](https://www.g2.com) → click **For Vendors** or go to [sell.g2.com](https://sell.g2.com)
2. Claim or add your product: **Get Listed Free**
3. Fill in the product profile:
   - **Category:** AI Image Generation, Photo Editing Software
   - **Description:** Use the same description as above
   - **Key features:** List identity locks, naturalness slider, platform exports, privacy-first
   - **Pricing model:** Freemium (free to generate, paid download)
4. After listing, ask early users to leave reviews — G2 requires verified reviews to rank. Even 3–5 reviews dramatically improves visibility.

---

### 6. Indie Hackers Product Page
**Priority: P2**

Indie Hackers is read by founders and developers. It's also heavily indexed. A product page + a post about the build story drives developer audience traffic and builds brand awareness in the startup community.

**Steps:**

1. Create an account at [indiehackers.com](https://www.indiehackers.com)
2. Go to **Products** → **Add your product**
3. Fill in the product details (similar to above)
4. Write a brief "What I'm building" post explaining the product and the problem it solves — community engagement here builds backlinks and drives traffic
5. Link to the Product Hunt launch when it goes live

---

### 7. Content Publishing Schedule
**Status: ✅ All 7 blog posts published (March 2026)**

All posts are live with full content. No further blog writing is needed unless adding new posts.

| Post | Status | Published |
|------|--------|-----------|
| Free AI Headshot No Subscription | ✅ Full content | 2026-03-20 |
| AI Headshot vs Photographer | ✅ Full content | 2026-03-18 |
| LinkedIn Profile Photo Tips 2026 | ✅ Full content | 2026-03-15 |
| GitHub Profile Photo Guide | ✅ Full content | 2026-03-10 |
| AI Headshot Privacy | ✅ Full content | 2026-03-08 |
| Corporate Headshots for Remote Teams | ✅ Full content | 2026-03-05 |
| AI Portrait Styles Explained | ✅ Full content | 2026-03-03 |

**Next content actions (optional growth):**
- Add internal links between posts and style pages (see Dev Tasks above)
- Publish new posts targeting remaining keywords from the 12-week roadmap (dating app photos, resume photo guide, etc.)

---

## Success Metrics to Track

| Metric | Where to check | Target (Month 1) | Target (Month 3) |
|--------|---------------|-----------------|-----------------|
| Google indexed pages | Google Search Console → Coverage | 1 | 15+ |
| GSC impressions | GSC → Performance | 100+ | 2,000+ |
| Organic sessions | GA4 → Acquisition | 50+ | 500+ |
| Directory listings live | Manual check | 3 | 5 |
| llms.txt accessible | `curl https://portrait.ai-biz.app/llms.txt` | ✅ | ✅ |
| AI citations | Search ChatGPT/Perplexity for "free ai headshot" | 0 | 1+ |
| Blog posts published | Count in `/blog` | 7 ✅ | 7+ |

---

## Quick Reference: New URLs Added

```
https://portrait.ai-biz.app/pricing
https://portrait.ai-biz.app/comparison
https://portrait.ai-biz.app/blog
https://portrait.ai-biz.app/blog/free-ai-headshot-no-subscription
https://portrait.ai-biz.app/blog/ai-headshot-vs-photographer
https://portrait.ai-biz.app/blog/linkedin-profile-photo-tips-2026
https://portrait.ai-biz.app/blog/github-profile-photo-guide          ← stub
https://portrait.ai-biz.app/blog/ai-headshot-privacy                  ← stub
https://portrait.ai-biz.app/blog/corporate-headshots-remote-teams     ← stub
https://portrait.ai-biz.app/blog/ai-portrait-styles-explained         ← stub
https://portrait.ai-biz.app/styles/editorial
https://portrait.ai-biz.app/styles/environmental
https://portrait.ai-biz.app/styles/candid
https://portrait.ai-biz.app/styles/vintage
https://portrait.ai-biz.app/styles/black-white
https://portrait.ai-biz.app/styles/cyberpunk
https://portrait.ai-biz.app/styles/watercolor
https://portrait.ai-biz.app/llms.txt
```
