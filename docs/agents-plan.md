I now have a comprehensive understanding of every source file. Here is the full design for the specialized AI review agent team.
---
Show less
## ProPortrait AI -- Commercialization Review Agent Team Design
After a thorough audit of all 8 source files (1,711 LOC total), the `package.json` dependencies, the Vite config, `index.html`, and the project structure, here is the design for 12 specialized review agents that would take this prototype to a revenue-generating SaaS product.
---
### Agent 1: IRIS -- UI/UX & Design Quality Agent
**Identity**: Visual design specialist and interaction quality auditor. Named for the eye -- the organ of visual perception. Evaluates whether the product looks, feels, and flows like a $9.99/month tool users would trust with their professional identity.
**What It Reviews/Audits**:
- Visual hierarchy, spacing consistency, and typographic scale
- Color contrast ratios against WCAG AA/AAA
- Component consistency (button styles, border radii, shadow depths)
- Responsive behavior across breakpoints (mobile, tablet, desktop)
- Micro-interaction quality (loading states, transitions, hover feedback)
- Empty states, error states, and edge case visual handling
- Touch target sizes on mobile
**Specific Deliverables**:
1. Visual consistency audit report with screenshots and deviation matrix
2. Mobile responsiveness gap analysis (breakpoint-by-breakpoint)
3. Design system extraction document (tokens, components, patterns currently implicit)
4. Interaction quality scorecard (each user touchpoint rated)
**Priority Findings for THIS Codebase**:
- **No mobile layout**: The entire UI uses `flex gap-8`, `w-80`, and `w-72` sidebars that will break on mobile. Step 3 Edit view (`flex gap-6` with a `w-72` sidebar) and Step 4 Export view (`flex gap-8` with `w-80` sidebar) are completely unusable on screens under 768px.
- **Hardcoded dimensions everywhere**: `min-h-[600px]`, `min-h-[580px]`, `min-h-[480px]`, `max-w-6xl` with no responsive variants.
- **The upload zone**: `h-72` is fixed height -- on short mobile screens the entire zone may not be visible.
- **8-column grid on Step 2**: `grid-cols-2 sm:grid-cols-4 lg:grid-cols-8` for 16 styles works on desktop, but on mobile the `3:4` aspect cards with 10px text are barely readable.
- **No loading skeleton**: During the 20-40 second generation time, users see only a spinner and pulsing text. No progress indication, no skeleton preview, no engagement.
- **Step 4 Export preview**: The `style={{ aspectRatio: exportRatio.replace(':', '/') }}` with `maxHeight: '480px'` creates inconsistent sizing across different browser windows.
- **Edit history strip**: Thumbnails at `w-12` are 48px wide -- too small to distinguish edits on retouched portraits.
- **No dark mode support**: Despite having a `Moon` icon imported (for B&W style), there is no system-level dark mode.
**Interactions with Other Agents**:
- Feeds findings to the Accessibility Agent (contrast ratios, touch targets)
- Coordinates with User Journey Agent on flow pain points
- Provides design specifications to Code Quality Agent for component extraction
---
### Agent 2: ATLAS -- User Journey & Conversion Optimization Agent
**Identity**: Conversion funnel analyst and user psychology specialist. Maps every path from landing to payment, identifies friction, and optimizes for the metric that matters: paid conversions.
**What It Reviews/Audits**:
- Complete user journey from first visit to first download
- Time-to-value (how fast does a user get their first usable portrait)
- Conversion funnel: Visit -> Upload -> Generate -> Edit -> Export -> Pay
- Drop-off risk at each step transition
- Onboarding experience for first-time users
- Upgrade trigger placement and psychology
- Retention hooks and re-engagement signals
**Specific Deliverables**:
1. User journey map with friction scores at each transition
2. Conversion funnel optimization blueprint (with A/B test candidates)
3. Onboarding redesign spec (first 60 seconds)
4. Pricing page/paywall UX redesign with behavioral triggers
5. Retention strategy document (email capture, saved presets, gallery)
**Priority Findings for THIS Codebase**:
- **Critical: Payment is fake**: Line 991 reads `onClick={() => setIsPro(true)}`. This just flips a boolean in React state. Refreshing the page loses "Pro" status. There is zero payment infrastructure -- no Stripe, no checkout, no backend, no session persistence.
- **No user accounts**: Without authentication, there is no way to persist Pro status, save portraits, build a gallery, or re-engage users. The entire value proposition disappears on tab close.
- **Time-to-value is 40+ seconds**: Users upload (5s) -> configure (30s) -> wait for generation (20-40s) -> see results. Over 1 minute before any value. A competitive tool should show a sample transformation within seconds.
- **No onboarding**: First-time users see a blank upload zone and a privacy notice. No sample portraits, no "see what we can do" gallery, no social proof.
- **The Pro paywall appears only at Step 4**: By then, users have already invested time. Good for sunk-cost conversion, but risky because they may feel deceived finding out they cannot get PNG or high-res after doing all the work.
- **Wizard state lost on refresh**: `useState` for all 42 state variables. If the browser tab crashes during the 40-second generation, everything is lost. URL has no state encoding.
- **No email capture**: Zero ability to re-engage users who leave. No newsletter, no "email me when my portrait is ready" for async processing.
- **"Download All Platforms" fires 5 sequential `setTimeout` calls** at 400ms intervals (line 282-284). This creates 5 separate download dialogs in most browsers, which modern browsers will block as spam downloads.
- **No sharing flow**: Users cannot share their portrait directly to LinkedIn or other platforms. No Open Graph preview, no shareable links.
**Interactions with Other Agents**:
- Feeds requirements to Monetization Agent (what to gate behind paywall)
- Coordinates with Growth Agent on email capture and viral loops
- Receives mobile usability data from IRIS
---
### Agent 3: SENTINEL -- Security & Privacy Agent
**Identity**: Threat modeler and privacy compliance officer. Ensures the application does not leak API keys, expose user data, or violate privacy regulations governing biometric/facial data.
**What It Reviews/Audits**:
- API key exposure and credential management
- Client-side data handling for facial images (GDPR, CCPA, BIPA implications)
- Network request security (HTTPS, CORS, CSP)
- Input validation and injection vectors
- Third-party dependency vulnerabilities
- Data retention and deletion guarantees
- Privacy policy accuracy vs actual behavior
**Specific Deliverables**:
1. Threat model document (STRIDE methodology)
2. API key exposure remediation plan
3. Privacy compliance gap analysis (GDPR, CCPA, BIPA)
4. Content Security Policy specification
5. Dependency vulnerability audit report
**Priority Findings for THIS Codebase**:
- **CRITICAL: API key embedded in client bundle**: `vite.config.ts` lines 11-13 use `JSON.stringify(env.GEMINI_API_KEY)` inside `define`, which means the API key is literally compiled into the JavaScript bundle. Anyone can open DevTools -> Sources and extract it. This is the single most urgent security issue.
- **No backend proxy**: All Gemini API calls happen directly from the browser (`src/services/ai.ts`). The API key must be in the client for this to work. The planned Express backend (present in `package.json` but unused) is essential for security.
- **No rate limiting**: Without a backend, there is no way to prevent API abuse. A malicious user can extract the API key and make unlimited calls at the project owner's expense.
- **No Content Security Policy**: `index.html` has no CSP headers. The external image reference (`https://grainy-gradients.vercel.app/noise.svg` in `App.tsx` line 13) demonstrates an open external resource policy.
- **No input validation on file upload**: `handleImageUpload` (line 90-108) reads any file the user provides. No file size limit, no file type validation beyond the `accept="image/*"` attribute (which is trivially bypassed), no malicious file detection.
- **Prompt injection via custom edit**: `customEditPrompt` (line 860) is passed directly to the Gemini API with no sanitization. While this is primarily a prompt injection risk on the AI side, it could be used to extract system prompts or generate inappropriate content.
- **Console.log leaks full prompts**: Lines 191, 219, 226, 258, 287 in `ai.ts` log complete prompts to the browser console, including the system role instructions. Any user can see the full prompt engineering.
- **Privacy Notice claims are partially inaccurate**: The PrivacyNotice says images "are cleared when you close the tab." This is true for React state, but base64 images in data URLs may persist in browser history, and the images ARE sent to Google's servers for processing.
- **No GDPR consent mechanism**: Facial data is biometric data under GDPR. There is no explicit consent capture, no data processing agreement reference, no right-to-erasure mechanism.
- **`better-sqlite3` and `express` in production dependencies**: These server-side packages ship in the client bundle if not properly tree-shaken. `better-sqlite3` includes a native binary addon. These should be devDependencies or in a separate server package.
**Interactions with Other Agents**:
- Feeds critical API key issue to Architecture Agent (backend requirement)
- Coordinates with DevOps Agent on CSP headers and deployment config
- Provides compliance requirements to User Journey Agent (consent flows)
---
### Agent 4: FORGE -- Architecture & Scalability Agent
**Identity**: Systems architect focused on taking a single-file prototype to a production-grade, multi-user SaaS architecture. Designs for the next 12 months of growth.
**What It Reviews/Audits**:
- Component architecture and separation of concerns
- State management strategy and scalability
- API layer design and backend service architecture
- Data persistence and database design
- Caching strategy (API responses, generated images)
- Deployment architecture (CDN, serverless, containers)
- Multi-tenancy and user isolation
**Specific Deliverables**:
1. Target architecture diagram (client, API gateway, services, storage)
2. Component decomposition plan (breaking the 1,057-line monolith)
3. State management migration strategy (from 42 `useState` to structured state)
4. Backend API design document (endpoints, auth, rate limiting)
5. Database schema design (users, portraits, subscriptions, usage)
6. Infrastructure sizing and cost model
**Priority Findings for THIS Codebase**:
- **Monolithic component**: `PortraitGenerator.tsx` at 1,057 lines contains ALL application logic: upload handling, AI generation, editing, history management, export/canvas rendering, payment UI, and the entire 4-step wizard UI. This is the definition of a component that has too many reasons to change.
- **42 `useState` calls in one component**: Lines 27-78 declare 42 separate state variables. These break down to roughly 6 independent state domains: (1) wizard navigation, (2) image data, (3) style/generation config, (4) edit history, (5) export settings, (6) UI flags. Each domain should be its own hook or context.
- **No routing**: The app is a single page with wizard steps controlled by `useState<Step>(1)`. No URL routing means no deep linking, no browser back button support, no bookmarkable states, and no code splitting by route.
- **No backend exists**: Despite `express` and `better-sqlite3` being in `package.json`, there is no server code. The entire app runs client-side. To commercialize, a backend is mandatory for: API key proxying, user authentication, payment processing, image storage, usage tracking, and rate limiting.
- **Images stored as base64 data URLs in React state**: Generated portraits (which are roughly 200-500KB each as base64) live in `useState<string[]>`. With 4 variations plus edit history, a single session can hold 2-5MB of base64 strings in memory. This will cause browser tab crashes on mobile devices.
- **No image persistence**: Generated portraits disappear on page refresh. There is no cloud storage, no IndexedDB, no localStorage fallback.
- **Canvas rendering is synchronous and blocking**: `renderToCanvas` (lines 205-234) does synchronous canvas operations. With high-resolution exports (2048px for Pro), this blocks the main thread.
- **Sequential batch download is a hack**: `handleDownloadAll` (lines 281-285) uses `setTimeout` with 400ms stagger. This pattern is browser-hostile and will be blocked.
- **No error boundaries**: A crash in any child component takes down the entire app. React 19's error boundary features are not used.
- **`process.env` usage in client code**: The `ai.ts` service references `process.env.API_KEY` which works only because Vite's `define` replaces it at build time. This is fragile and non-standard.
**Interactions with Other Agents**:
- Receives security requirements from SENTINEL (backend is mandatory)
- Provides decomposition plan to Code Quality Agent
- Feeds infrastructure design to DevOps Agent
- Coordinates with Monetization Agent on subscription data model
---
### Agent 5: PRISM -- Code Quality & Maintainability Agent
**Identity**: Clean code advocate and technical debt manager. Ensures the codebase can sustain a team of developers, pass code review, and evolve without fear.
**What It Reviews/Audits**:
- Code complexity metrics (cyclomatic, cognitive)
- Type safety and TypeScript strictness
- Component cohesion and coupling
- Error handling patterns and robustness
- Code duplication and DRY violations
- Naming conventions and readability
- Testing infrastructure and coverage
- Linting and formatting configuration
**Specific Deliverables**:
1. Code complexity report with per-function metrics
2. TypeScript strict mode migration plan
3. Test infrastructure setup specification (Vitest + Testing Library + Playwright)
4. Linting configuration (ESLint + Prettier) with custom rules
5. Component extraction and refactoring roadmap
6. Hardcoded strings catalog (~150 strings for i18n extraction)
**Priority Findings for THIS Codebase**:
- **Zero tests**: No test files, no test framework, no `test` script in `package.json`. The `lint` script is only `tsc --noEmit`.
- **TypeScript is not strict**: `tsconfig.json` has no `strict: true`, no `noImplicitAny`, no `strictNullChecks`. The `skipLibCheck: true` hides type errors in dependencies.
- **No ESLint or Prettier**: No `.eslintrc`, no `.prettierrc`. Code formatting is inconsistent -- some lines have trailing semicolons and some do not in template strings.
- **Massive function complexity**: `PortraitGenerator` component has a cognitive complexity that likely exceeds 100. It contains 15+ inline event handlers, 10+ conditional render blocks, and 6+ inline object array definitions (STYLES, EXPRESSIONS, IDENTITY_LOCK_ITEMS etc.) that should be extracted.
- **Inline array definitions re-created on every render**: The `STYLES` array (lines 326-343), `EXPRESSIONS` array (lines 345-351), and `IDENTITY_LOCK_ITEMS` array (lines 353-359) are all defined inside the component body. They are re-allocated on every render. These are static data and should be module-level constants.
- **Non-null assertions**: `canvasRef.current!` (line 206) and `ctx = canvas.getContext('2d')!` (line 209) will crash silently if refs are null. No null checking.
- **Image loading with no error handling**: `handleExport` (lines 236-258) and `handlePlatformDownload` (lines 260-279) create `new Image()` and set `onload`, but there is no `onerror` handler. If the image fails to load, the function silently does nothing.
- **History data structure is fragile**: `Record<number, string[]>` and `Record<number, number>` for edit history (lines 40-41) use index-based keys that break if the generated images array is ever reordered.
- **DRY violations in AI service**: The response parsing loop (`for (const candidate ...)`) appears 3 times in `ai.ts` (lines 207-213, 241-247, 303-309) with identical logic. This should be a utility function.
- **No package name**: `package.json` has `"name": "react-example"` -- still using the template name.
**Interactions with Other Agents**:
- Receives component decomposition plan from Architecture Agent
- Feeds test requirements to DevOps Agent (CI pipeline)
- Coordinates with Accessibility Agent on semantic HTML patterns
- Provides i18n string catalog to Growth Agent
---
### Agent 6: MERCURY -- Performance & Core Web Vitals Agent
**Identity**: Performance engineer obsessed with perceived speed and measurable metrics. Every millisecond matters when users are paying for a creative tool.
**What It Reviews/Audits**:
- Bundle size analysis and code splitting opportunities
- Largest Contentful Paint (LCP) optimization
- First Input Delay (FID) / Interaction to Next Paint (INP)
- Cumulative Layout Shift (CLS)
- Image handling performance (loading, rendering, memory)
- Network waterfall and API call optimization
- Runtime performance during canvas operations
- Memory leak detection
**Specific Deliverables**:
1. Bundle analysis report with treemap visualization
2. Core Web Vitals baseline measurement and improvement targets
3. Image handling optimization strategy (lazy loading, compression, WebP)
4. Code splitting implementation plan
5. Memory management audit (base64 strings in state)
6. Perceived performance improvement roadmap (skeleton screens, progressive loading)
**Priority Findings for THIS Codebase**:
- **Massive bundle bloat from unused dependencies**: `better-sqlite3` (native addon), `express`, and `dotenv` are in `dependencies` but never imported in client code. Vite should tree-shake them, but the native `better-sqlite3` addon may cause build issues. At minimum, these inflate `node_modules` and `package-lock.json`.
- **Base64 images in memory**: Each generated portrait is a full base64 data URL stored in React state. A single image at 1K resolution is approximately 200-400KB as base64. With 4 variations plus edit history of 5 steps each, a session can consume 4-8MB of string data in JavaScript heap. On mobile devices, this risks OOM crashes.
- **No lazy loading**: All icons from `lucide-react` are imported upfront (40+ icons in `PortraitGenerator.tsx`, line 3-9). The `motion` animation library loads eagerly. There is no `React.lazy()` or dynamic imports anywhere.
- **No image compression on upload**: `handleImageUpload` reads the file as a full-resolution data URL with no compression. A 12MP phone photo (4000x3000) becomes a 5-10MB base64 string that gets sent to the Gemini API.
- **Synchronous canvas rendering**: `renderToCanvas` does synchronous `drawImage` and `toDataURL` operations on the main thread. At 2048px (Pro mode), this can block the UI for 100-500ms.
- **No request deduplication or caching**: If a user generates with the same settings twice, it makes entirely new API calls. No caching layer.
- **CLS from AnimatePresence**: The `AnimatePresence mode="wait"` with `motion.div` transitions causes layout shifts as step content appears/disappears. The `min-h-[600px]` on the container mitigates this partially but not completely.
- **External resource on critical path**: `App.tsx` line 13 loads `https://grainy-gradients.vercel.app/noise.svg` for a decorative background texture. This is an external dependency on the critical rendering path. If that CDN is slow, the visual effect is delayed.
- **No preconnect hints**: No `<link rel="preconnect">` for `generativelanguage.googleapis.com` (the Gemini API endpoint). The first API call pays the full DNS + TCP + TLS cost.
- **Vite is listed in both dependencies and devDependencies**: Lines 26 and 36 of `package.json` both declare `vite ^6.2.0`.
**Interactions with Other Agents**:
- Receives architecture decisions from FORGE (code splitting boundaries)
- Feeds bundle analysis to DevOps Agent (build optimization)
- Coordinates with IRIS on perceived performance (skeleton screens)
- Provides memory constraints to Architecture Agent
---
### Agent 7: VAULT -- Monetization & Pricing Strategy Agent
**Identity**: Revenue strategist and pricing psychologist. Designs the pricing model, subscription infrastructure, and feature gating strategy that maximizes lifetime value while minimizing churn.
**What It Reviews/Audits**:
- Current pricing model and feature gating logic
- Competitive pricing landscape for AI portrait tools
- Free-to-paid conversion mechanics
- Value metric alignment (what do users actually pay for?)
- Subscription vs. credits vs. one-time purchase viability
- Payment infrastructure requirements
- Revenue projection models
**Specific Deliverables**:
1. Competitive pricing analysis (10+ competitors mapped)
2. Pricing model recommendation with tier definitions
3. Feature gating matrix (free vs. pro vs. enterprise)
4. Payment integration specification (Stripe/Paddle)
5. Usage-based pricing model design (credits system)
6. Revenue projection spreadsheet (MRR/ARR at various adoption rates)
**Priority Findings for THIS Codebase**:
- **Payment is entirely fake**: `onClick={() => setIsPro(true)}` on line 991. This is a local state toggle. No payment processing, no Stripe, no backend verification.
- **Current gating is weak**: Pro only unlocks (1) 2048px resolution vs 1024px, and (2) PNG format. Users get all 16 styles, 4 variations, all editing features, and all platform exports for free. The paywall has almost no teeth.
- **$9.99 is ambiguous**: Is it $9.99 one-time, monthly, yearly? The UI says "Unlock for $9.99" with no time qualifier. The Pro benefits listed are resolution and format -- not enough value for a subscription.
- **No usage limits on free tier**: Free users can generate unlimited portraits, use all editing features, and export to all platforms. The only limit is resolution and format. Competitor analysis would likely show that generation limits (credits) are the standard free-tier constraint.
- **No API cost awareness**: Each portrait generation calls Gemini twice (generation + retouch pass), and the user can generate 2 or 4 variations. That is 4-8 API calls per generation. With no backend, there is no way to track or limit API costs per user.
- **Missing upsell moments**: The upgrade banner only appears in Step 4 (Export). There is no "you have 3 free generations remaining" counter, no watermark on free exports, no preview of Pro quality to create desire.
- **No team/enterprise tier**: The "Copy Settings JSON" feature (line 287-301) hints at team usage, but there is no team pricing, shared workspace, or brand template features.
**Interactions with Other Agents**:
- Feeds subscription model requirements to Architecture Agent (data model)
- Coordinates with User Journey Agent on paywall placement
- Provides feature gating rules to Code Quality Agent
- Requires backend from SENTINEL before any real payments can happen
---
### Agent 8: BEACON -- Growth & Retention Agent
**Identity**: Growth hacker and retention specialist. Designs viral loops, referral mechanics, and re-engagement strategies that turn one-time users into advocates.
**What It Reviews/Audits**:
- Viral coefficient and organic sharing mechanics
- SEO and discoverability
- Social proof and trust signals
- Email capture and lifecycle marketing hooks
- Referral and incentive programs
- Content marketing and portfolio features
- Community building opportunities
**Specific Deliverables**:
1. Viral loop design document (share -> visit -> convert)
2. SEO optimization checklist (technical + content)
3. Email capture strategy and lifecycle email sequences
4. Referral program specification
5. Social proof integration plan (testimonials, counters, badges)
6. Content marketing calendar (before/after showcases)
**Priority Findings for THIS Codebase**:
- **Zero organic sharing**: Users cannot share portraits to social media, generate a shareable comparison link, or showcase before/after results. Every portrait dies in the user's Downloads folder.
- **No email capture**: There is no email field anywhere. Zero ability to re-engage users after they leave the tab.
- **No social proof**: No user count, no testimonial, no "X portraits generated" counter. The landing page (Step 1) is just an upload zone. A first-time visitor has no evidence this tool works well.
- **SEO is minimal**: `index.html` has basic meta tags but it is a SPA with no SSR/SSG. Google will see an empty `<div id="root"></div>`. No structured data, no blog, no landing pages.
- **No Open Graph / social sharing tags**: When someone shares the URL, there is no OG image, no OG description, no Twitter card. The share preview will be blank or default.
- **No user gallery or portfolio**: Generated portraits are not saved anywhere. Users cannot build a collection, revisit old portraits, or showcase their professional images.
- **No watermark on free tier**: Free exports have no ProPortrait AI branding. This is a missed organic marketing opportunity -- every free portrait shared could be a billboard.
- **The `~150 hardcoded strings` block i18n**: All UI text is English-only with no internationalization framework. Expanding to non-English markets is a full rewrite of string handling.
- **No referral mechanism**: No invite codes, no "get a free generation when a friend signs up", no affiliate links.
**Interactions with Other Agents**:
- Coordinates with User Journey Agent on email capture placement
- Feeds social sharing requirements to Architecture Agent
- Provides SEO requirements to DevOps Agent (SSR/SSG)
- Receives i18n string catalog from Code Quality Agent
---
### Agent 9: GUARDIAN -- DevOps & Reliability Agent
**Identity**: Infrastructure engineer and reliability champion. Builds the deployment pipeline, monitoring stack, and operational readiness that separates toys from products.
**What It Reviews/Audits**:
- CI/CD pipeline existence and configuration
- Deployment strategy and hosting platform
- Environment management (dev, staging, production)
- Monitoring, alerting, and observability
- Error tracking and incident response
- Backup and disaster recovery
- Infrastructure as code
**Specific Deliverables**:
1. CI/CD pipeline specification (GitHub Actions)
2. Deployment architecture recommendation (Vercel/Cloudflare/AWS)
3. Monitoring and alerting setup plan (Sentry, Datadog)
4. Environment configuration management plan
5. Incident response runbook template
6. Infrastructure cost estimation
**Priority Findings for THIS Codebase**:
- **Zero CI/CD**: No `.github/workflows`, no `Dockerfile`, no deployment configuration. There is a `dist/` directory committed (it exists locally), suggesting manual builds.
- **No error tracking**: No Sentry, no LogRocket, no error reporting service. When users encounter errors, they see "Failed to generate portrait. Please try again." and the developer has no visibility.
- **No health checks**: No uptime monitoring, no synthetic tests, no canary deployment strategy.
- **No environment separation**: `.env.local` is the only environment file. No `.env.production`, no `.env.staging`. The same API key would be used across all environments.
- **Build is not validated**: The `build` script is just `vite build` with no pre-build checks. No type checking in the build pipeline (the `lint` script does `tsc --noEmit` but is not part of `build`).
- **No caching headers configuration**: Static assets have no cache-busting strategy defined. Vite handles this with content hashes by default, but there is no explicit configuration for CDN caching.
- **`dist/` should be gitignored**: While `.gitignore` includes `dist/`, there is a `dist/` directory present locally, suggesting it was committed before the gitignore rule was added or was manually created.
- **No automated security scanning**: No `npm audit` in CI, no Snyk, no Dependabot configuration.
- **No logging infrastructure**: Console.log statements in `ai.ts` are the only "logging." In production, these are invisible unless the user opens DevTools.
- **No feature flags**: No LaunchDarkly, no environment-based feature flags. Rolling out new features requires a full deployment.
**Interactions with Other Agents**:
- Receives test suite requirements from Code Quality Agent
- Implements deployment for architecture designed by FORGE
- Sets up error tracking requested by multiple agents
- Coordinates with SENTINEL on security scanning in CI
---
### Agent 10: COMPASS -- Accessibility & Compliance Agent
**Identity**: Inclusivity engineer and compliance specialist. Ensures every person, regardless of ability, can use the product. Ensures legal compliance with accessibility laws.
**What It Reviews/Audits**:
- WCAG 2.1 AA compliance (minimum) targeting AAA where feasible
- Keyboard navigation for all interactive elements
- Screen reader compatibility and ARIA labeling
- Color contrast ratios throughout the application
- Focus management during step transitions
- Form input labels and error messaging
- Motion/animation preferences (prefers-reduced-motion)
**Specific Deliverables**:
1. WCAG 2.1 violation report with severity levels
2. Keyboard navigation flow map
3. ARIA implementation specification
4. Color contrast audit with failing pairs
5. Screen reader testing results (VoiceOver, NVDA)
6. Accessibility remediation roadmap (prioritized)
**Priority Findings for THIS Codebase**:
- **Only 1 accessibility attribute in 1,057 lines**: Grep found exactly 1 `aria-` or `role=` or `tabIndex` or `onKeyDown` occurrence in the entire `PortraitGenerator.tsx`. The single occurrence is the `onKeyDown` on the custom edit input (line 860). Everything else -- every button, every toggle, every slider, every selection grid -- has zero accessibility markup.
- **Upload zone is a div, not a button**: The upload drop zone (line 406-418) is a `<div onClick>`. It is not focusable via keyboard, has no `role="button"`, no `tabIndex`, no `aria-label`. Screen reader users cannot reach or activate it.
- **Style selection grid**: 16 style buttons have no `aria-pressed` or `aria-selected` state. Screen readers cannot tell which style is active.
- **Identity lock toggles**: The 5 identity lock buttons have no `role="switch"` or `aria-checked`. Their visual state (indigo background vs white) is the only indicator.
- **Range sliders have no accessible labels**: The Likeness Strength slider (line 550-552) and Naturalness slider (line 612-614) use raw `<input type="range">` with no `<label>`, no `aria-label`, no `aria-valuetext`.
- **No focus management on step transitions**: When AnimatePresence transitions between steps, focus is not programmatically moved. Keyboard users are stranded after each transition.
- **Comparison slider is mouse-only**: `ComparisonSlider.tsx` handles `onMouseDown`, `mousemove`, and `mouseup`, plus basic `onTouchStart/Move`. There is no keyboard control (arrow keys), no `role="slider"`, no `aria-valuenow`.
- **Images lack meaningful alt text**: Generated portraits use `alt="Portrait"` (line 719) instead of descriptive text like "AI-generated professional portrait in corporate style."
- **Error messages not announced**: Error states (lines 446-450, 684-686, 867) use visual-only red text with no `role="alert"` or `aria-live` region.
- **No `prefers-reduced-motion` respect**: All motion/framer-motion animations play regardless of user preference.
- **Color-only information**: The Identity Confidence score (lines 640-656) uses only color (green/amber/red) to communicate level. Color-blind users cannot distinguish the states.
**Interactions with Other Agents**:
- Receives component structure from IRIS for contrast and target size analysis
- Feeds semantic HTML requirements to Code Quality Agent
- Provides compliance requirements to legal/privacy aspects of SENTINEL
- Coordinates with MERCURY on animation performance with reduced-motion
---
### Agent 11: ORACLE -- Analytics & Data-Driven Decisions Agent
**Identity**: Data strategist and measurement architect. If you cannot measure it, you cannot improve it. Designs the instrumentation that turns user behavior into product insights.
**What It Reviews/Audits**:
- Event tracking architecture and taxonomy
- Key metrics definition (north star, health, input metrics)
- Analytics infrastructure selection and integration
- A/B testing framework readiness
- User behavior analysis capabilities
- Funnel and cohort analysis setup
- Data privacy compliance in analytics
**Specific Deliverables**:
1. Analytics event taxonomy (every trackable user action)
2. Key metrics dashboard specification
3. A/B testing framework recommendation and implementation plan
4. Funnel analysis setup (Upload -> Generate -> Edit -> Export -> Pay)
5. User segmentation strategy
6. Data pipeline architecture for analytics
**Priority Findings for THIS Codebase**:
- **Zero analytics**: No Google Analytics, no Mixpanel, no PostHog, no Amplitude, no tracking of any kind. There is literally no way to know how many users visit, how far they get in the funnel, or what causes them to leave.
- **No error rate visibility**: When generation fails (line 148-153), the error is caught, a user-facing message is shown, but nothing is reported anywhere. There is no way to know the API failure rate.
- **No performance metrics collection**: Generation time (20-40 seconds) is never measured or reported. There is no way to know if performance is degrading over time.
- **No feature usage tracking**: Which styles are most popular? Which expression preset do users choose? Do people use identity locks? Do they use the edit studio? Nobody knows.
- **No conversion tracking**: The fake Pro upgrade (line 991) is not tracked. When real payments exist, there will be no historical data for comparison.
- **No session recording**: No Hotjar, no FullStory, no session replay. Cannot see where users get confused or frustrated.
- **The `console.log` statements in `ai.ts`** are the closest thing to instrumentation. They log prompts and retouch passes, but only to the browser console.
- **No user segmentation data**: Without accounts, there is no way to distinguish new vs returning users, free vs paid, casual vs power users.
- **No API cost tracking**: Each Gemini API call has a cost. Without tracking API calls per user, there is no way to calculate unit economics (cost per portrait, cost per user, margin).
**Interactions with Other Agents**:
- Provides measurement requirements to every other agent
- Feeds A/B testing capabilities to User Journey Agent
- Coordinates with SENTINEL on data privacy in analytics
- Provides unit economics data to Monetization Agent
---
### Agent 12: SCOUT -- Feature Completeness & Product-Market Fit Agent
**Identity**: Product strategist and competitive intelligence analyst. Evaluates whether the product solves real problems well enough for users to choose it over alternatives and recommend it to others.
**What It Reviews/Audits**:
- Competitive landscape and feature gap analysis
- User job-to-be-done alignment
- Feature completeness vs. feature bloat assessment
- User feedback collection mechanisms
- Product-market fit signals
- Market positioning and differentiation
- Feature prioritization framework
**Specific Deliverables**:
1. Competitive feature matrix (vs. 10+ competitors)
2. Jobs-to-be-done analysis for target user segments
3. Feature gap prioritization matrix (impact vs. effort)
4. Product positioning statement
5. User feedback collection plan (in-app surveys, interviews)
6. V2 feature roadmap recommendation
**Priority Findings for THIS Codebase**:
- **Strong differentiation on identity preservation**: The identity locks system (eye color, skin tone, hair length, hair texture, glasses) is genuinely differentiated. Most AI portrait tools do not offer this granularity. This should be the core marketing message.
- **Missing batch processing**: Professionals need to process multiple photos at once (e.g., for a team page). Currently, it is one photo at a time with a 40-second wait.
- **No template/preset library**: The "Copy Settings JSON" feature (line 287) is a developer-oriented workaround. Users need a visual preset gallery: "LinkedIn Ready," "Speaker Series," "Dating Profile" with one-click application.
- **No API/integration for teams**: Enterprise users want to integrate portrait generation into their onboarding flow (e.g., automatically generate portraits from badge photos). There is no API access product.
- **No feedback mechanism**: No in-app survey, no NPS collection, no "was this portrait good?" rating, no "report an issue" button. The product team is flying blind.
- **The edit studio is a strength but hidden**: The regional edit mode (background/clothing/lighting/hair targeting) is powerful and differentiated. But it is buried in Step 3 with no marketing emphasis.
- **No undo confirmation**: The undo/redo functionality works (lines 194-203) but only appears on hover (`opacity-0 group-hover:opacity-100` on line 735). Many users will not discover it.
- **Multi-person photo selection is innovative**: The group photo person selector (lines 479-498) is a genuinely useful feature. However, the "left/center/right" positioning is crude -- face detection or clickable face selection would be superior.
- **No before/after showcase**: The ComparisonSlider is used only in the Edit step. There is no way to generate a shareable before/after comparison image for social media.
**Interactions with Other Agents**:
- Feeds positioning to Growth Agent for marketing messaging
- Coordinates with Monetization Agent on which features to gate
- Provides competitive context to Architecture Agent for roadmap planning
- Receives user behavior data from Analytics Agent to validate priorities
---
## Inter-Agent Orchestration Model
The 12 agents are organized in three execution tiers:
**Tier 0 -- Blockers (must fix before launch)**:
1. SENTINEL (Security) -- API key exposure is a launch-blocking deficiency
2. FORGE (Architecture) -- Backend is required for security, payments, and persistence
**Tier 1 -- Revenue Enablement (required for first dollar)**:
3. VAULT (Monetization) -- Real payment infrastructure
4. ATLAS (User Journey) -- Conversion optimization
5. GUARDIAN (DevOps) -- CI/CD and deployment pipeline
**Tier 2 -- Quality & Growth (required for sustainable growth)**:
6. IRIS (UI/UX) -- Mobile support, design polish
7. COMPASS (Accessibility) -- Legal compliance, inclusive design
8. PRISM (Code Quality) -- Tests, type safety, maintainability
9. MERCURY (Performance) -- Bundle optimization, memory management
10. ORACLE (Analytics) -- Instrumentation for data-driven decisions
**Tier 3 -- Scale & Differentiation (competitive advantage)**:
11. BEACON (Growth) -- Viral loops, SEO, retention
12. SCOUT (Product-Market Fit) -- Feature roadmap, competitive positioning
**Communication Protocol**: Each agent produces a standardized report with:
- Severity-rated findings (CRITICAL / HIGH / MEDIUM / LOW)
- Estimated effort for remediation
- Dependencies on other agents' work
- Prioritized action items
**Conflict Resolution**: When agents disagree (e.g., MERCURY wants to strip animations that IRIS considers essential), FORGE (Architecture) serves as the arbitrator, and ATLAS (User Journey) provides the user-impact tiebreaker.
---
### Critical Files for Implementation
- `/Users/jaeheesong/projects/node/proportrait/src/components/PortraitGenerator.tsx` - The 1,057-line monolith containing all application logic, 42 state variables, and every UI/UX, accessibility, and conversion issue. This is ground zero for 10 of the 12 agents.
- `/Users/jaeheesong/projects/node/proportrait/src/services/ai.ts` - Core AI service with exposed API key pattern, no retry logic, no rate limiting, console.log prompt leaking, and duplicate response parsing. Security, performance, and reliability agents all need this file.
- `/Users/jaeheesong/projects/node/proportrait/vite.config.ts` - The API key embedding mechanism (`define: { 'process.env.GEMINI_API_KEY': JSON.stringify(...) }`) that creates the critical security vulnerability. Architecture and DevOps agents must redesign this.
- `/Users/jaeheesong/projects/node/proportrait/package.json` - Contains unused server dependencies (express, better-sqlite3), duplicate vite entries, template project name, and missing test/lint tooling. Every agent's remediation work starts here.
- `/Users/jaeheesong/projects/node/proportrait/index.html` - Missing CSP headers, no preconnect hints, no OG tags, minimal SEO -- the entry point for security, performance, growth, and accessibility improvements.
agentId: a29745b5ba89940f0 (for resuming to continue this agent's work if needed)
<usage>total_tokens: 107871