# ProPortrait AI — SEO Implementation Plan

> Based on SEO & AI Bot Optimization Audit Report (March 2026)

---

## Current State Summary

| Category | Status | Notes |
|----------|--------|-------|
| **Google Indexation** | ❌ Not Indexed | Zero organic visibility — CRITICAL |
| **AI Bot Access** | ✅ Excellent | All major AI crawlers allowed |
| **Structured Data** | ✅ Good | WebSite, Organization, SoftwareApplication present |
| **Meta Tags** | ✅ Good | Title, description, OG tags present |
| **Content Depth** | ⚠️ Poor | Single-page, limited keyword coverage |
| **Sitemap** | ✅ Present | Basic sitemap with 4 URLs |
| **Platform** | React SPA (Vite) | Requires prerendering/SSR for SEO |

### Key Challenges
- **SPA Architecture**: React single-page app — content rendered client-side, not crawlable by search engines
- **Zero Indexation**: `site:portrait.ai-biz.app` returns 0 results
- **Competitor Confusion**: `ProPortrait.ai` (no hyphen) is indexed and ranking — splits potential traffic
- **Limited Content**: Single landing page vs. competitors with blogs, comparison pages, thousands of backlinks

---

## Phase 1: Critical — Fix Indexation (Week 1-2)

**Goal**: Make the site crawlable and indexable by Google.

| Task | Action | Owner | Deliverable | Est. Time |
|------|--------|-------|-------------|-----------|
| 1.1 | Implement prerendering/SSR for SPA | Dev | prerender.io integration or Vite SSG build | 4-6 hrs |
| 1.2 | Submit site to Google Search Console | Marketing | GSC property verified + sitemap submitted | 30 min |
| 1.3 | Request manual indexing for homepage | Marketing | Indexation status confirmed | 15 min |
| 1.4 | Create `llms.txt` for AI bot context | Content | `/llms.txt` live with product description | 1 hr |
| 1.5 | Create `robots.txt` audit | Dev | Verify all AI crawlers explicitly allowed | 30 min |
| 1.6 | Add entity listings (Product Hunt, AlternativeTo, Crunchbase) | Marketing | 3 directory profiles created/submitted | 4 hrs |

### 1.1 Prerendering Implementation Details

**Options**:
1. **prerender.io** (Recommended for SPA): Middleware that serves static HTML to crawlers
2. **Vite SSG**: Static site generation at build time
3. **Puppeteer prerender**: Custom prerender script

**Implementation**:
```bash
# Option 1: prerender.io middleware
npm install prerender-node
```

```javascript
// server middleware
const prerender = require('prerender-node');
app.use(prerender.set('prerenderToken', 'YOUR_TOKEN'));
```

### 1.4 llms.txt Specification

Create `/public/llms.txt`:

```
# ProPortrait AI

> AI-powered professional headshot generator. Free to try; pay only when you download.

## What We Do

ProPortrait AI transforms any photo into a studio-quality professional portrait using identity-locked AI. 
We preserve your natural features — eye color, skin tone, facial structure, and hair — while upgrading 
the quality to professional standards.

## Key Differentiators

- **Free to generate**: Try before you buy — no upfront payment
- **No subscription**: Pay per download, no recurring fees
- **Identity preservation**: AI locks your core features, only enhances quality
- **Platform exports**: LinkedIn, GitHub, resume-optimized formats
- **Privacy-first**: Photos deleted after processing, no data retention

## Target Use Cases

- LinkedIn profile photos
- Corporate team headshots
- GitHub/social media avatars
- Resume and portfolio portraits
- Dating app photos

## Styles Available

1. Editorial Professional — LinkedIn, corporate bios, executive headshots
2. Environmental Portrait — Tech founders, startup culture, creatives
3. Candid & Real — Dating apps, social media, authentic feel
4. Vintage 35mm — Creative portfolios, emotional storytelling
5. Black & White — Timeless, authoritative presence
6. Cyberpunk Neon — Gamers, Web3, tech-forward branding
7. Watercolor — Wellness brands, soft personal avatars

## Pricing

- Free to generate and preview
- Pay only when downloading: $X.XX per image
- No subscription required

## Website

https://portrait.ai-biz.app
```

---

## Phase 2: High Priority — Content Foundation (Week 2-4)

**Goal**: Build content hub for SEO keywords and long-tail traffic.

| Task | Action | Owner | Deliverable | Est. Time |
|------|--------|-------|-------------|-----------|
| 2.1 | Create blog section infrastructure | Dev | `/blog` route + blog index + post template | 4 hrs |
| 2.2 | Publish Blog Post #1: "AI Headshot vs Traditional Photography" | Content | 1,500+ word comparison post | 4 hrs |
| 2.3 | Publish Blog Post #2: "LinkedIn Photo Best Practices 2026" | Content | LinkedIn-targeted guide (1,500+ words) | 4 hrs |
| 2.4 | Publish Blog Post #3: "Free AI Headshot Generator: No Subscription Required" | Content | Target "free AI headshot" keywords | 3 hrs |
| 2.5 | Build individual style landing pages (7 pages) | Dev/Content | `/styles/[style-id]` for each style | 8 hrs |
| 2.6 | Add FAQ section with FAQPage schema | Dev/Content | Expandable FAQ + structured data | 3 hrs |
| 2.7 | Update sitemap with new pages | Dev | Expanded sitemap.xml | 1 hr |

### 2.5 Style Landing Pages Structure

Each style page (`/styles/editorial`, `/styles/cyberpunk`, etc.):

```
/styles/[style-id]
├── Hero with style-specific headline
├── Description with use cases
├── Example gallery (before/after)
├── SEO-optimized content (500+ words)
├── Related styles
└── CTA to try the generator
```

**Content Template for Style Pages**:
- Headline: "[Style Name] AI Headshots — [Primary Use Case]"
- Meta description: 155 chars with primary keyword
- Body: What this style is, who it's for, why it works, platform recommendations
- Internal links: Link to other styles, blog posts

### Target Keywords for Style Pages

| Style Page | Primary Keyword | Secondary Keywords |
|------------|-----------------|-------------------|
| Editorial | professional headshots for LinkedIn | corporate headshots, executive portraits |
| Environmental | tech founder headshots | startup headshots, creative professional photos |
| Candid | natural AI headshots | authentic profile photos, casual portraits |
| Vintage | vintage style AI portraits | retro headshots, film aesthetic portraits |
| Black & White | black and white headshots | monochrome portraits, classic headshots |
| Cyberpunk | cyberpunk AI portraits | neon portraits, gaming avatars |
| Watercolor | watercolor AI portraits | artistic avatars, illustrated portraits |

---

## Phase 3: Medium Priority — Conversion & Trust (Week 4-6)

**Goal**: Improve conversion rates and add social proof.

| Task | Action | Owner | Deliverable | Est. Time |
|------|--------|-------|-------------|-----------|
| 3.1 | Add testimonials section with Review schema | Dev/Content | 6-10 testimonials + JSON-LD markup | 4 hrs |
| 3.2 | Create pricing page with Offer schema | Dev/Content | `/pricing` page with clear value props | 4 hrs |
| 3.3 | Add HowTo schema for 3-step process | Dev | Structured data for onboarding steps | 2 hrs |
| 3.4 | Create comparison page: "AI Headshot vs Photographer" | Content | Detailed comparison with cost breakdown | 4 hrs |
| 3.5 | Add BreadcrumbList schema to all pages | Dev | JSON-LD breadcrumbs | 2 hrs |
| 3.6 | Implement dynamic meta tags for all pages | Dev | React Helmet or equivalent | 3 hrs |

### 3.1 Testimonials with Review Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Review",
  "itemReviewed": {
    "@type": "SoftwareApplication",
    "name": "ProPortrait AI"
  },
  "author": {
    "@type": "Person",
    "name": "Customer Name"
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5"
  },
  "reviewBody": "Testimonial text here..."
}
```

---

## Phase 4: Brand Differentiation — Ongoing

**Goal**: Distinguish from ProPortrait.ai competitor and build authority.

| Task | Action | Owner | Deliverable | Timeline |
|------|--------|-------|-------------|----------|
| 4.1 | Clarify brand name in meta | Content | Update title tags: "ProPortrait AI (ai-biz.app)" | Week 1 |
| 4.2 | Create "Why Choose Us" comparison section | Content | Differentiation content block | Week 3 |
| 4.3 | Monitor competitor rankings | Marketing | Monthly competitive tracking report | Ongoing |
| 4.4 | Guest post on relevant blogs | Marketing | 1-2 backlinks/month | Ongoing |
| 4.5 | Build linkable assets (free tools, calculators) | Dev/Content | ROI calculator or style picker quiz | Month 2-3 |

---

## Content Roadmap (12-Week Plan)

### Blog Posts

| Week | Topic | Target Keyword | Word Count |
|------|-------|----------------|------------|
| 2 | AI Headshot vs Traditional Photography | ai headshot vs photographer | 1,500 |
| 3 | LinkedIn Photo Best Practices 2026 | linkedin profile photo tips | 1,500 |
| 4 | Free AI Headshot Generator (No Subscription) | free ai headshot generator | 1,200 |
| 5 | How to Take a Good Headshot at Home | diy professional headshots | 1,500 |
| 6 | AI Headshot Privacy: Is Your Data Safe? | ai headshot privacy | 1,200 |
| 7 | Corporate Headshots for Remote Teams | corporate headshots remote | 1,500 |
| 8 | GitHub Profile Photo Best Practices | github profile picture | 1,200 |
| 9 | Dating App Photo Tips That Work | dating app photos | 1,500 |
| 10 | Resume Photo Guide: Do's and Don'ts | resume photo guide | 1,200 |
| 11 | AI Portrait Styles Explained | ai portrait styles | 1,500 |
| 12 | How AI Headshots Preserve Your Identity | ai identity preservation | 1,200 |

### Landing Pages

| Week | Page | Purpose |
|------|------|---------|
| 2-3 | /styles/editorial | LinkedIn/corporate traffic |
| 3 | /styles/environmental | Startup/tech audience |
| 4 | /styles/candid | Social media/dating audience |
| 5 | /styles/vintage | Creative professionals |
| 5 | /styles/black-white | Portfolio/classic audience |
| 6 | /styles/cyberpunk | Gaming/Web3 audience |
| 6 | /styles/watercolor | Wellness/artistic audience |
| 4 | /pricing | Conversion optimization |
| 5 | /comparison | Competitive positioning |
| 6 | /use-cases/linkedin | Use-case specific |

---

## Technical Implementation Details

### Dynamic Meta Tags (React Helmet Async)

```bash
npm install react-helmet-async
```

```typescript
// Example for style pages
import { Helmet } from 'react-helmet-async';

const StylePage = ({ style }) => (
  <>
    <Helmet>
      <title>{`${style.name} AI Headshots — ${style.useCase} | ProPortrait AI`}</title>
      <meta name="description" content={style.seoDescription} />
      <link rel="canonical" href={`https://portrait.ai-biz.app/styles/${style.id}`} />
      
      {/* Open Graph */}
      <meta property="og:title" content={`${style.name} AI Headshots`} />
      <meta property="og:description" content={style.seoDescription} />
      <meta property="og:image" content={style.ogImage} />
      
      {/* Twitter */}
      <meta name="twitter:title" content={`${style.name} AI Headshots`} />
      <meta name="twitter:description" content={style.seoDescription} />
      <meta name="twitter:image" content={style.ogImage} />
    </Helmet>
    {/* ... */}
  </>
);
```

### Sitemap Generation

```typescript
// scripts/generate-sitemap.ts
const routes = [
  '/',
  '/blog',
  '/pricing',
  '/comparison',
  '/faq',
  ...blogPosts.map(p => `/blog/${p.slug}`),
  ...styles.map(s => `/styles/${s.id}`),
];

// Generate sitemap.xml
```

### Additional Schema Markup to Add

1. **FAQPage Schema** (for FAQ section)
2. **HowTo Schema** (for 3-step generation process)
3. **Review Schema** (for testimonials)
4. **BreadcrumbList Schema** (for navigation)
5. **Article Schema** (for blog posts)
6. **Offer Schema** (for pricing details)

---

## Directory Listings Priority

| Directory | Priority | Status | URL |
|-----------|----------|--------|-----|
| Product Hunt | P0 | Pending | producthunt.com |
| AlternativeTo | P0 | Pending | alternativeto.net |
| Crunchbase | P1 | Pending | crunchbase.com |
| G2 | P1 | Pending | g2.com |
| Capterra | P2 | Pending | capterra.com |
| TrustRadius | P2 | Pending | trustradius.com |
| Indie Hackers | P2 | Pending | indiehackers.com |

---

## Success Metrics & KPIs

### Month 1 Targets

| Metric | Baseline | Target |
|--------|----------|--------|
| Google Indexed Pages | 0 | 1 (homepage) |
| GSC Impressions | 0 | 100+ |
| Organic Sessions | 0 | 50+ |
| Directory Listings | 0 | 3 live |
| llms.txt Live | No | Yes |

### Month 3 Targets

| Metric | Target |
|--------|--------|
| Google Indexed Pages | 15+ |
| Organic Sessions | 500+/month |
| Avg. Position (target KWs) | Top 30 |
| Blog Posts Published | 6+ |
| Style Landing Pages | 7 live |
| AI Bot Citations | 3+ (ChatGPT, Perplexity, Claude) |
| Backlinks Acquired | 5+ |

### Month 6 Targets

| Metric | Target |
|--------|--------|
| Organic Sessions | 2,000+/month |
| Avg. Position (target KWs) | Top 10-20 |
| Blog Posts Published | 12+ |
| Domain Authority | 20+ |
| Conversions from Organic | 50+/month |

---

## Tools & Resources

### SEO Tools
- **Google Search Console**: Indexation monitoring
- **Google Analytics 4**: Traffic tracking
- **Ahrefs/SEMrush**: Keyword research and backlink tracking
- **Screaming Frog**: Technical SEO audits
- **PageSpeed Insights**: Core Web Vitals monitoring

### AI Bot Optimization
- **Perplexity**: Check citations
- **ChatGPT (Browse)**: Verify visibility
- **Claude**: Test knowledge retrieval
- **llmstxt.org**: llms.txt validation

### Development
- **prerender.io**: SPA prerendering
- **react-helmet-async**: Dynamic meta tags
- **schema.org**: Structured data reference

---

## Immediate Next Steps (This Week)

1. [ ] **Dev**: Set up prerender.io account and integrate middleware
2. [ ] **Marketing**: Create Google Search Console property and verify ownership
3. [ ] **Content**: Write and publish `/public/llms.txt`
4. [ ] **Marketing**: Draft Product Hunt listing
5. [ ] **Dev**: Audit current structured data for completeness

---

## Notes

- **AI Bot Optimization**: This is a first-mover opportunity. Most competitors haven't implemented `llms.txt` or optimized for LLM citations.
- **Long-tail Strategy**: Competing on "AI headshot generator" is impossible against HeadshotPro and Aragon. Focus on "free AI headshot no subscription," "LinkedIn headshot AI free," etc.
- **Privacy as Differentiator**: Privacy-first messaging is barely in current copy — this should be front-and-center for converting privacy-conscious users.

---

*Plan created: March 2026*
*Last updated: March 2026*
