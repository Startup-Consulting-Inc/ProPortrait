# ProPortrait AI — Commercialization Agent Team

## Context

ProPortrait AI is a feature-complete prototype (1,711 LOC, 8 files) that converts casual photos into professional AI portraits using Google Gemini. It has excellent UX and prompt engineering, but zero infrastructure for commercialization: no tests, no CI/CD, no analytics, no real payments, no backend, no monitoring, and critical security vulnerabilities (API key baked into client bundle). This plan defines 12 specialized review agents to systematically take it from prototype to a paying SaaS product.

---

## The 12 Agents

### Tier 0 — Blockers (fix before launch)

#### 1. SENTINEL — Security & Privacy Agent
**Role**: Threat modeler, privacy compliance officer
**Reviews**: API key exposure, credential management, input validation, GDPR/CCPA/BIPA compliance for facial data, dependency vulnerabilities, CSP headers
**Delivers**:
- Threat model (STRIDE methodology)
- API key remediation plan (move to backend proxy)
- Privacy compliance gap analysis
- Content Security Policy spec
- Dependency vulnerability audit

**Critical findings for this codebase**:
- `vite.config.ts` embeds `GEMINI_API_KEY` into the JS bundle via `define` — extractable from DevTools
- All Gemini calls happen client-side — no backend proxy, no rate limiting
- No file size/type validation on upload beyond `accept="image/*"`
- `customEditPrompt` passed to Gemini unsanitized (prompt injection risk)
- `console.log` in `ai.ts` leaks full prompts to browser console
- Privacy Notice claims are partially inaccurate (images DO go to Google's servers)
- No GDPR consent capture for biometric (facial) data processing

#### 2. FORGE — Architecture & Scalability Agent
**Role**: Systems architect designing the path from monolith to production SaaS
**Reviews**: Component architecture, state management, API layer, data persistence, deployment topology, multi-tenancy
**Delivers**:
- Target architecture diagram (client → API gateway → services → storage)
- Component decomposition plan (breaking the 1,057-line `PortraitGenerator.tsx`)
- State management migration (42 `useState` → structured stores via Zustand/Redux)
- Backend API design (auth, rate limiting, image proxy, subscriptions)
- Database schema (users, portraits, subscriptions, usage)
- Infrastructure cost model

**Critical findings**:
- `PortraitGenerator.tsx` is 1,057 lines with 42 `useState` calls — 6 state domains crammed into one component
- No routing — wizard state lives in `useState<Step>(1)`, lost on refresh
- Images stored as base64 data URLs in React state (2-8MB per session, OOM risk on mobile)
- No backend despite `express` + `better-sqlite3` in `package.json`
- No error boundaries — any crash takes down the entire app
- Canvas rendering is synchronous and main-thread blocking

---

### Tier 1 — Revenue Enablement (required for first dollar)

#### 3. VAULT — Monetization & Pricing Agent
**Role**: Revenue strategist, pricing psychologist
**Reviews**: Feature gating logic, competitive pricing, payment infrastructure, value metrics, subscription model
**Delivers**:
- Competitive pricing analysis (10+ AI portrait tools)
- Pricing model recommendation (credits vs subscription vs one-time)
- Feature gating matrix (free vs pro vs team)
- Stripe/Paddle integration spec
- Unit economics model (cost per portrait, margin)

**Critical findings**:
- Payment is `onClick={() => setIsPro(true)}` — a local state toggle
- Pro only unlocks resolution (2048 vs 1024) and PNG format — too weak
- $9.99 with no time qualifier (monthly? yearly? one-time?)
- Free users get unlimited generations with no usage cap
- No API cost tracking — can't calculate unit economics
- Upgrade banner only appears at Step 4 (after user invested 1+ minutes)

#### 4. ATLAS — User Journey & Conversion Agent
**Role**: Funnel analyst, user psychology specialist
**Reviews**: Time-to-value, conversion funnel, onboarding, drop-off risks, paywall placement, retention hooks
**Delivers**:
- User journey map with friction scores per transition
- Conversion funnel optimization blueprint
- Onboarding redesign (first 60 seconds)
- Paywall UX redesign with behavioral triggers
- Retention strategy (accounts, gallery, email)

**Critical findings**:
- Time-to-value is 60+ seconds (upload → configure → wait 20-40s for generation)
- No onboarding — first-time users see blank upload zone, no sample gallery, no social proof
- Wizard state lost on refresh (all 42 `useState` variables gone)
- No email capture — zero re-engagement ability
- "Download All Platforms" fires 5 sequential `setTimeout` at 400ms — browsers block this
- No sharing flow (no OG tags, no shareable links, no direct-to-platform posting)

#### 5. GUARDIAN — DevOps & Reliability Agent
**Role**: Infrastructure engineer, deployment pipeline builder
**Reviews**: CI/CD, hosting, environments, monitoring, alerting, error tracking, backups
**Delivers**:
- GitHub Actions CI/CD pipeline spec
- Deployment architecture (Vercel/Cloudflare)
- Monitoring + alerting setup (Sentry, uptime)
- Environment management plan (dev/staging/prod)
- Incident response runbook

**Critical findings**:
- Zero CI/CD — no `.github/workflows`, no deployment automation
- No error tracking (Sentry, LogRocket, etc.) — developer-blind to production errors
- No environment separation — single `.env.local` for everything
- `build` script has no pre-build type checking
- No automated security scanning (`npm audit`, Dependabot)
- No feature flags for safe rollouts

---

### Tier 2 — Quality & Growth (required for sustainable growth)

#### 6. IRIS — UI/UX & Design Quality Agent
**Role**: Visual design specialist, interaction quality auditor
**Reviews**: Visual hierarchy, responsive behavior, component consistency, micro-interactions, loading/empty/error states, dark mode
**Delivers**:
- Visual consistency audit
- Mobile responsiveness gap analysis
- Design system extraction document
- Interaction quality scorecard

**Critical findings**:
- Steps 3 & 4 use fixed `w-72`/`w-80` sidebars — unusable below 768px
- Upload zone is fixed `h-72` — clips on short mobile screens
- 20-40s generation shows only a spinner — no skeleton, no progress, no engagement
- Edit history thumbnails at 48px (`w-12`) — too small to distinguish edits
- No dark mode despite being a creative tool

#### 7. COMPASS — Accessibility & Compliance Agent
**Role**: Inclusivity engineer, WCAG compliance specialist
**Reviews**: WCAG 2.1 AA compliance, keyboard navigation, screen readers, ARIA, color contrast, focus management, reduced motion
**Delivers**:
- WCAG violation report with severity levels
- Keyboard navigation flow map
- ARIA implementation spec
- Accessibility remediation roadmap

**Critical findings**:
- ~1 accessibility attribute in 1,057 lines (single `onKeyDown` on edit input)
- Upload zone is a `<div onClick>` — not keyboard-focusable, no `role="button"`
- All sliders lack `<label>`, `aria-label`, `aria-valuetext`
- No `role="switch"`/`aria-checked` on identity lock toggles
- No focus management on step transitions (AnimatePresence)
- ComparisonSlider is mouse/touch only — no keyboard support
- Error messages have no `role="alert"` or `aria-live`
- Identity confidence score uses color-only encoding (fails color-blind users)
- No `prefers-reduced-motion` respect

#### 8. PRISM — Code Quality & Maintainability Agent
**Role**: Clean code advocate, tech debt manager
**Reviews**: Complexity metrics, TypeScript strictness, duplication, naming, test coverage, linting
**Delivers**:
- Code complexity report
- TypeScript strict mode migration plan
- Test infrastructure setup (Vitest + Testing Library + Playwright)
- ESLint + Prettier configuration
- Component extraction roadmap
- i18n string catalog (~150 hardcoded strings)

**Critical findings**:
- Zero tests, zero test framework
- TypeScript not strict — no `strict: true`, no `noImplicitAny`
- No ESLint or Prettier
- Inline static arrays (STYLES, EXPRESSIONS) re-created on every render
- Non-null assertions (`canvasRef.current!`) with no guards
- Image `onload` handlers have no `onerror` fallback
- Response parsing duplicated 3x in `ai.ts`
- `package.json` name is still `"react-example"`

#### 9. MERCURY — Performance & Core Web Vitals Agent
**Role**: Speed engineer, Core Web Vitals optimizer
**Reviews**: Bundle size, LCP/INP/CLS, image handling, memory, code splitting, network waterfall
**Delivers**:
- Bundle analysis report
- Core Web Vitals baseline + targets
- Image optimization strategy
- Code splitting plan
- Memory management audit

**Critical findings**:
- `better-sqlite3` (native addon) + `express` in client dependencies
- Base64 images in state: 200-400KB per image, 4-8MB with variations + history
- No `React.lazy()` or dynamic imports anywhere
- No image compression on upload (12MP phone = 5-10MB base64)
- Canvas `toDataURL` at 2048px blocks main thread 100-500ms
- External `noise.svg` from Vercel CDN on critical rendering path
- No `<link rel="preconnect">` for Gemini API endpoint
- `vite` declared in both `dependencies` and `devDependencies`

#### 10. ORACLE — Analytics & Data Agent
**Role**: Measurement architect, data strategist
**Reviews**: Event tracking, KPI definitions, A/B testing readiness, funnel analysis, user segmentation
**Delivers**:
- Analytics event taxonomy
- Key metrics dashboard spec
- A/B testing framework recommendation
- Funnel analysis setup
- Unit economics tracking plan

**Critical findings**:
- Zero analytics of any kind — no GA, no Mixpanel, no PostHog
- No error rate visibility — API failures are caught but not reported
- Generation time (20-40s) never measured or tracked
- No feature usage tracking (which styles? which expressions? do people use locks?)
- No session recording (Hotjar, FullStory)
- No API cost tracking — can't calculate cost-per-portrait

---

### Tier 3 — Scale & Differentiation (competitive advantage)

#### 11. BEACON — Growth & Retention Agent
**Role**: Growth hacker, retention specialist
**Reviews**: Viral mechanics, SEO, social proof, email lifecycle, referrals, content marketing
**Delivers**:
- Viral loop design (share → visit → convert)
- SEO optimization checklist
- Email capture strategy + lifecycle sequences
- Referral program spec
- Social proof integration plan

**Critical findings**:
- Zero organic sharing — portraits die in Downloads folder
- No email capture anywhere
- No social proof (no user count, no testimonials, no "X portraits generated")
- SPA with no SSR — Google sees empty `<div id="root">`
- No OG/Twitter card tags — shared links preview blank
- No watermark on free tier — missed organic marketing
- 150+ hardcoded English strings — no i18n path

#### 12. SCOUT — Product-Market Fit Agent
**Role**: Product strategist, competitive intelligence analyst
**Reviews**: Competitive landscape, feature gaps, user jobs-to-be-done, positioning, feedback mechanisms
**Delivers**:
- Competitive feature matrix (10+ tools)
- Jobs-to-be-done analysis
- Feature gap prioritization (impact vs effort)
- Product positioning statement
- V2 feature roadmap

**Critical findings**:
- Identity locks system is genuinely differentiated — most competitors lack this
- Missing batch processing (teams need multiple photos)
- "Copy Settings JSON" is developer-oriented — needs visual preset gallery
- No API product for enterprise integration
- No in-app feedback mechanism (no NPS, no ratings, no "report issue")
- Undo/redo only appears on hover — most users won't discover it
- Regional edit mode is powerful but buried with no marketing emphasis

---

## Agent Orchestration

### Execution Order
```
Tier 0 (Parallel)     Tier 1 (Parallel)      Tier 2 (Parallel)      Tier 3 (Parallel)
┌──────────┐          ┌──────────┐            ┌──────────┐           ┌──────────┐
│ SENTINEL │─┐   ┌───▶│  VAULT   │─┐     ┌───▶│   IRIS   │     ┌───▶│  BEACON  │
│ Security │ │   │    │  Money   │ │     │    │   UI/UX  │     │    │  Growth  │
└──────────┘ │   │    └──────────┘ │     │    └──────────┘     │    └──────────┘
             ├───┤    ┌──────────┐ │     │    ┌──────────┐     │    ┌──────────┐
┌──────────┐ │   │    │  ATLAS   │ ├─────┤    │ COMPASS  │     │    │  SCOUT   │
│  FORGE   │─┘   │    │ Journey  │ │     │    │  A11y    │     │    │  PMF     │
│   Arch   │     │    └──────────┘ │     │    └──────────┘     │    └──────────┘
└──────────┘     │    ┌──────────┐ │     │    ┌──────────┐     │
                 └───▶│ GUARDIAN │─┘     ├───▶│  PRISM   │─────┘
                      │  DevOps  │       │    │  Quality │
                      └──────────┘       │    └──────────┘
                                         │    ┌──────────┐
                                         ├───▶│ MERCURY  │
                                         │    │   Perf   │
                                         │    └──────────┘
                                         │    ┌──────────┐
                                         └───▶│  ORACLE  │
                                              │ Analytics│
                                              └──────────┘
```

### Inter-Agent Dependencies
| Agent | Depends On | Feeds Into |
|-------|-----------|------------|
| SENTINEL | — | FORGE (backend required), GUARDIAN (security scanning) |
| FORGE | SENTINEL | VAULT (data model), PRISM (decomposition), GUARDIAN (infra) |
| VAULT | FORGE, ATLAS | SCOUT (feature gating), ORACLE (unit economics) |
| ATLAS | IRIS, SENTINEL | VAULT (paywall), BEACON (email), ORACLE (funnels) |
| GUARDIAN | FORGE, PRISM | All agents (CI pipeline enables everyone) |
| IRIS | — | COMPASS (contrast), ATLAS (flow), PRISM (components) |
| COMPASS | IRIS | PRISM (semantic HTML), SENTINEL (compliance) |
| PRISM | FORGE | GUARDIAN (test pipeline), all agents (code changes) |
| MERCURY | FORGE | GUARDIAN (build optimization), IRIS (perceived perf) |
| ORACLE | — | ATLAS (A/B tests), VAULT (unit economics), SCOUT (usage data) |
| BEACON | ATLAS, ORACLE | SCOUT (positioning) |
| SCOUT | ORACLE, BEACON | VAULT (roadmap), FORGE (architecture roadmap) |

### Conflict Resolution
When agents disagree (e.g., MERCURY wants to strip animations that IRIS needs), FORGE arbitrates technical tradeoffs, ATLAS provides user-impact tiebreaker.

---

## Implementation Approach

Each agent will be implemented as a Task subagent that:
1. Reads the relevant source files
2. Produces a structured audit report with severity-rated findings (CRITICAL/HIGH/MEDIUM/LOW)
3. Provides specific remediation steps with file paths and line numbers
4. Estimates effort per fix
5. Lists dependencies on other agents' work

### Critical Files Every Agent Touches
- `src/components/PortraitGenerator.tsx` — 1,057-line monolith (ground zero for 10/12 agents)
- `src/services/ai.ts` — AI service with security, performance, reliability issues
- `vite.config.ts` — API key embedding vulnerability
- `package.json` — Unused deps, missing tooling, template name
- `index.html` — Missing CSP, preconnect, OG tags, SEO

### Verification
- Run each agent against the codebase and collect structured reports
- Cross-reference findings across agents for consistency
- Prioritize by tier (0 → 1 → 2 → 3) for execution order
- Each agent's output feeds into a unified commercialization roadmap
