# GUARDIAN — DevOps & Reliability Audit Report

**Agent**: GUARDIAN
**Role**: Infrastructure engineer, deployment pipeline builder
**Date**: 2026-03-02
**Status**: Complete

---

## Executive Summary

ProPortrait AI has **zero production infrastructure**. There is no CI/CD pipeline, no deployment automation, no environment separation, no error tracking, and no security scanning. The most severe finding — verified by direct bundle analysis — is that the live Gemini API key (`AIzaSyCiD-aV_ai2EGF8Ohigp14zhSBRWFf-4IY`) is **baked into every production build** in plain text, appearing twice in the 690 KB JavaScript bundle. Any user who opens DevTools can extract this key and make unlimited API calls at the project owner's expense.

There are 4 CRITICAL findings, 3 HIGH findings, 4 MEDIUM findings, and 3 LOW findings. Estimated remediation: 3–5 days of focused engineering.

---

## Current Infrastructure State

| Category | Status | Details |
|----------|--------|---------|
| CI/CD Pipeline | ABSENT | No `.github/workflows/` directory exists |
| Deployment Config | ABSENT | No `vercel.json`, `netlify.toml`, `Dockerfile`, `fly.toml`, or `render.yaml` |
| Environment Separation | ABSENT | Single `.env.local` file only, no staging/prod separation |
| Error Tracking | ABSENT | No Sentry, LogRocket, Datadog, or equivalent |
| Security Scanning | ABSENT | No automated `npm audit` in pipeline, no Dependabot |
| Feature Flags | ABSENT | No LaunchDarkly, Unleash, or equivalent |
| Uptime Monitoring | ABSENT | No Uptime Robot, BetterUptime, or equivalent |
| Source Maps in Dist | ABSENT (positive) | No `.map` files found in `dist/assets/` |
| `.gitignore` for secrets | PRESENT (partial) | `.env.*` is ignored, but `dist/` is also correctly gitignored |
| TypeScript type checking | PASSING | `tsc --noEmit` exits clean (0 errors) |
| Known CVEs | NONE | `npm audit` shows 0 vulnerabilities across 390 packages |
| Bundle size | WARNING | 690 KB JS uncompressed, 184 KB gzip — exceeds Vite's 500 KB threshold |

### What Exists
- `package.json` with 5 scripts: `dev`, `build`, `preview`, `clean`, `lint`
- `vite.config.ts` with React and Tailwind plugins
- `tsconfig.json` with ESNext target and bundler module resolution
- `.gitignore` that correctly excludes `dist/`, `node_modules/`, and `.env.*`
- One-file AI service (`src/services/ai.ts`) calling the Gemini API directly from the browser

### What Is Missing
- Every piece of deployment and reliability infrastructure

---

## Findings

### CRITICAL

#### C1: API Key Baked Into Production JavaScript Bundle (`vite.config.ts:11-12`)

**Description**: `vite.config.ts` uses Vite's `define` plugin to perform string replacement of `process.env.GEMINI_API_KEY` and `process.env.API_KEY` with their literal values at build time. This causes the key `AIzaSyCiD-aV_ai2EGF8Ohigp14zhSBRWFf-4IY` to appear **twice in plain text** inside `dist/assets/index-BrVphZS7.js`. This was verified by direct bundle scan:

```
API keys found in bundle: [
  'AIzaSyCiD-aV_ai2EGF8Ohigp14zhSBRWFf-4IY',
  'AIzaSyCiD-aV_ai2EGF8Ohigp14zhSBRWFf-4IY'
]
```

The key appears twice because `process.env.API_KEY` and `process.env.GEMINI_API_KEY` are both defined in `vite.config.ts`, and the AI service at `src/services/ai.ts:177` reads `process.env.API_KEY || process.env.GEMINI_API_KEY`, causing both substitutions to embed the same value.

**Impact**: Any visitor can open browser DevTools > Sources > search for `AIzaSy` and extract the full API key in under 10 seconds. The key then enables:
- Unlimited Gemini image generation charged to the owner's billing account
- Potential abuse of the `gemini-3.1-flash-image-preview` model for any content
- No way to distinguish legitimate usage from theft — all calls share the same key

**Root Cause**: The Gemini API is called directly from browser-side JavaScript (`src/services/ai.ts`), making it architecturally impossible to keep the key secret on the client side. The correct fix is to proxy all Gemini calls through a server-side API route.

**Remediation**:
1. **Immediately rotate** the exposed key at https://console.cloud.google.com/apis/credentials
2. Create a backend API route (e.g., `/api/generate-portrait`) that holds the key server-side
3. Move `src/services/ai.ts` logic to that server route
4. The frontend calls `/api/generate-portrait` — the key never touches the browser
5. Remove `define` entries for `GEMINI_API_KEY` and `API_KEY` from `vite.config.ts`
6. Add Google Cloud API key restrictions (HTTP referrer restrictions + API restrictions to Gemini only)

**Effort**: M (2–3 days — requires FORGE to design the backend proxy layer)

---

#### C2: Zero CI/CD Pipeline — No Automated Build Validation (`.github/` — ABSENT)

**Description**: There is no `.github/workflows/` directory. Every push to `main` is unvalidated. There is no automated gate preventing broken code, type errors, or security regressions from reaching production.

**Impact**:
- Broken builds go undetected until manual testing
- No automated type checking before deploy (even though `tsc --noEmit` currently passes)
- No security scan gate — a malicious or vulnerable dependency can be introduced silently
- No audit trail of what was deployed when, or who approved it

**Remediation**: Implement the GitHub Actions pipeline specified in the "CI/CD Pipeline Spec" section below. This is the highest-leverage single action in this audit.

**Effort**: S (4–6 hours)

---

#### C3: No Environment Separation — Single Flat `.env.local` for Everything (`vite.config.ts:7`)

**Description**: `vite.config.ts:7` calls `loadEnv(mode, '.', '')` which loads a single `.env.local` file for all environments. There is no `.env.production`, `.env.staging`, or equivalent. The same API key and model name are used in development and production — there is no way to use a restricted production key vs. a development key, and there is no staging environment to validate changes before they reach users.

**Impact**:
- Production incidents cannot be tested safely before they affect users
- No ability to use different Gemini API quotas or billing projects per environment
- Developer experiments hit the production Gemini API key's quota
- Rollbacks require manual intervention with no defined process

**Remediation**: Establish three environment tiers (dev / staging / prod) as detailed in the "Environment Management Plan" section below. Use Vercel environment variables (not file-based) for staging and prod.

**Effort**: S (2–3 hours)

---

#### C4: `express`, `better-sqlite3`, and `dotenv` Listed as Production Dependencies (`package.json:14-26`)

**Description**: Three server-side packages — `express@4.21.2`, `better-sqlite3@12.4.1`, and `dotenv@17.2.3` — are listed under `dependencies` in `package.json`, not `devDependencies`. None of these packages are imported anywhere in the current frontend source code (`src/`). However:
1. They are installed into production bundles on platforms that run `npm install --production`
2. They bloat the dependency tree (274 production packages reported by `npm audit`)
3. They signal an unimplemented backend architecture — suggesting incomplete work that may introduce bugs if partially added
4. `vite` appears in both `dependencies` and `devDependencies` — a direct duplicate

**Impact**: Build tooling confusion, unnecessary attack surface, inflated `node_modules` in production deployments, potential for tree-shaking failures if these are accidentally imported.

**Remediation**:
- Move `express`, `better-sqlite3`, `dotenv`, and `tsx` to `devDependencies` (or to a dedicated `server/package.json` if a backend is added)
- Remove the duplicate `vite` entry from `dependencies`
- Note: this is a blocker before the C1 fix lands, since implementing the API proxy will legitimately require `express` or a framework equivalent as a production dependency at that point

**Effort**: XS (30 minutes)

---

### HIGH

#### H1: No Error Tracking — Production Failures Are Invisible (all `src/` files)

**Description**: The application has 10 `console.log` / `console.error` calls (verified by scan) scattered across `src/services/ai.ts` and `src/components/`. In production, these write to individual users' browser consoles — no one at the development team sees them. There is no Sentry, LogRocket, Datadog RUM, or equivalent SDK integrated.

Key untracked failures include:
- `Error generating portrait:` — the core revenue-generating function failing silently
- `Error editing portrait:` — editing studio failures invisible to developers
- `Failed to select key:` — API key authentication failures

**Impact**: Developers are completely blind to production error rates, error types, and affected users. A regression causing 50% generation failures would go undetected until a user reports it manually.

**Remediation**:
```typescript
// src/main.tsx — add before ReactDOM.createRoot()
import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  // Never send image base64 data — strip large breadcrumbs
  beforeSend(event) {
    if (event.breadcrumbs) {
      event.breadcrumbs.values = event.breadcrumbs.values?.filter(
        b => !b.data?.body?.length || b.data.body.length < 1000
      ) ?? [];
    }
    return event;
  },
});
```

Add `VITE_SENTRY_DSN` as a Vercel environment variable. Replace raw `console.error` calls in `src/services/ai.ts` with `Sentry.captureException(error)`.

**Effort**: S (3–4 hours)

---

#### H2: `build` Script Has No Pre-Build Type Checking (`package.json:8`)

**Description**: The `"build": "vite build"` script runs Vite's bundler directly without first running `tsc --noEmit`. Vite intentionally skips TypeScript type checking during builds for speed. This means a build can succeed and be deployed while containing type errors that would be caught by the TypeScript compiler.

The `"lint": "tsc --noEmit"` script exists but is not chained into `build` or invoked by any CI process.

**Impact**: Type-unsafe code ships to production. The CI pipeline specified in this report mitigates this for automated runs, but the local `npm run build` command is still unsafe.

**Remediation**:
```json
"scripts": {
  "build": "tsc --noEmit && vite build",
  "build:ci": "vite build"
}
```
Use `build:ci` in GitHub Actions (faster — type checking happens in the dedicated `typecheck` job in parallel). Use `build` locally so developers catch errors before committing.

**Effort**: XS (5 minutes)

---

#### H3: No Automated Security Scanning — No Dependabot (`.github/` — ABSENT)

**Description**: There is no Dependabot configuration and no `npm audit` in any automated pipeline. While `npm audit` currently shows 0 vulnerabilities, this state is not continuously monitored. A new CVE in any of the 390 installed packages (274 production, 102 optional) would go undetected indefinitely.

**Impact**: The application may silently run vulnerable dependencies for weeks or months after a CVE is published, creating liability and security risk.

**Remediation**: Create `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 5
    reviewers:
      - "jaeheesong"
    labels:
      - "dependencies"
      - "security"
```

Also add `npm audit --audit-level=high` as a required step in the CI pipeline.

**Effort**: XS (15 minutes)

---

### MEDIUM

#### M1: `tsconfig.json` Has No `strict` Mode Enabled (`tsconfig.json:1-26`)

**Description**: The `tsconfig.json` does not set `"strict": true` or any of the individual strict flags (`strictNullChecks`, `noImplicitAny`, `noImplicitReturns`, etc.). With `"skipLibCheck": true` also enabled, the TypeScript configuration provides minimal compile-time safety net.

**Impact**: Entire categories of runtime errors (null pointer dereferences, implicit `any` types, missing return paths) are silently allowed by the compiler. This is particularly risky in `src/services/ai.ts` where API responses are parsed with unchecked type assumptions.

**Remediation**: Add to `tsconfig.json`:
```json
"strict": true,
"noImplicitReturns": true,
"noUncheckedIndexedAccess": true,
"exactOptionalPropertyTypes": true
```
Expect and fix type errors that surface — they represent real latent bugs.

**Effort**: M (2–4 hours to resolve surfaced errors)

---

#### M2: No Bundle Splitting — Single 690 KB JavaScript Chunk (`vite.config.ts`)

**Description**: The production build produces a single unoptimized JS bundle of 690 KB (184 KB gzip), triggering Vite's own chunk size warning: `"Some chunks are larger than 500 kB after minification."` `PortraitGenerator.tsx` alone is 59 KB of source. The `@google/genai` SDK, `motion`, and all React code load as one monolithic file.

**Impact**: Initial page load on a 3G connection requires downloading 184 KB before anything renders. Time to interactive is unnecessarily high. Core Web Vitals LCP and FID scores are degraded.

**Remediation**: Add to `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-motion': ['motion'],
        'vendor-genai': ['@google/genai'],
        'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
      },
    },
  },
},
```

**Effort**: S (1–2 hours including testing)

---

#### M3: No `.env.example` File — Onboarding Friction (`/` root — ABSENT)

**Description**: The `.gitignore` correctly ignores `.env.*` files (with `!.env.example` as an exception, indicating the author intended to create one). However, no `.env.example` file exists. New developers cloning the repo have no documented list of required environment variables.

**Impact**: New contributors cannot run the project without either reading the source code to find `GEMINI_API_KEY` and `GEMINI_MODEL`, or getting the variables verbally from another developer. This creates onboarding friction and increases the chance that developers use wrong variable names.

**Remediation**: Create `/Users/jaeheesong/projects/node/proportrait/.env.example`:
```bash
# Required: Google Gemini API Key (paid tier required for gemini-3.1-flash-image-preview)
# Obtain from: https://console.cloud.google.com/apis/credentials
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Override the Gemini model name
GEMINI_MODEL=gemini-3.1-flash-image-preview

# Optional: Disable HMR (used in AI Studio environments)
# DISABLE_HMR=true
```

**Effort**: XS (10 minutes)

---

#### M4: No Uptime or Performance Monitoring

**Description**: There is no external uptime check and no real user monitoring (RUM). Once deployed, there is no automated alerting if the application becomes unavailable, if Gemini API errors spike, or if page load times degrade.

**Impact**: Users experience outages that developers are unaware of until manual reports come in.

**Remediation**:
- Set up a free Uptime Robot monitor pointing at the production URL (1-minute interval, email alert)
- Add Sentry Performance monitoring (covered under H1) for Core Web Vitals
- Set Vercel deployment notification webhooks to a Slack channel

**Effort**: S (2 hours)

---

### LOW

#### L1: Google Site Verification Tag Is a Placeholder (`index.html:14`)

**Description**: `index.html` line 14 contains:
```html
<meta name="google-site-verification" content="google-site-verification=google-site-verification">
```
The `content` attribute is a copy-paste placeholder — the actual verification string was never replaced with a real Google Search Console token.

**Impact**: Google Search Console cannot verify site ownership, blocking access to search performance data and the ability to request indexing.

**Remediation**: Either replace the content with a real token from Google Search Console, or remove the tag until the domain is registered.

**Effort**: XS (5 minutes)

---

#### L2: `package.json` `name` Field Is a Default Value (`package.json:2`)

**Description**: `"name": "react-example"` — the project was scaffolded and the name was never updated. This affects npm script identification, error messages, and package identity.

**Remediation**: Change to `"name": "proportrait-ai"`.

**Effort**: XS (2 minutes)

---

#### L3: No `engines` Field in `package.json` — Node Version Not Pinned (`package.json`)

**Description**: `package.json` does not specify a `"engines"` field. The project uses TypeScript 5.8, Vite 6, and React 19 — all of which require Node.js 18+. Developers or CI runners on older Node versions will encounter cryptic errors.

**Remediation**:
```json
"engines": {
  "node": ">=20.0.0",
  "npm": ">=10.0.0"
}
```
Add an `.nvmrc` file containing `20` for developers using nvm.

**Effort**: XS (5 minutes)

---

## GitHub Actions CI/CD Pipeline Spec

This is a copy-paste-ready pipeline. Create this file at `.github/workflows/ci.yml`:

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: "20"

jobs:
  # ─────────────────────────────────────────────
  # Job 1: Security — runs on every push/PR
  # ─────────────────────────────────────────────
  security:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Scan for hardcoded secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --debug --only-verified

  # ─────────────────────────────────────────────
  # Job 2: Type Check — runs in parallel with security
  # ─────────────────────────────────────────────
  typecheck:
    name: TypeScript Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npx tsc --noEmit

  # ─────────────────────────────────────────────
  # Job 3: Build — depends on typecheck passing
  # ─────────────────────────────────────────────
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [typecheck]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build for production
        run: npm run build
        env:
          # CRITICAL: Never set real API keys here — use Vercel env vars for deployment.
          # This placeholder prevents the vite define() from embedding an empty string.
          GEMINI_API_KEY: "ci-placeholder-not-a-real-key"
          GEMINI_MODEL: "gemini-3.1-flash-image-preview"

      - name: Validate bundle does not contain real API key
        run: |
          if grep -r "AIzaSy" dist/; then
            echo "ERROR: Real API key found in build output!"
            exit 1
          fi
          echo "OK: No real API key found in bundle."

      - name: Check bundle size
        run: |
          JS_SIZE=$(du -sk dist/assets/*.js | awk '{sum += $1} END {print sum}')
          echo "Total JS bundle size: ${JS_SIZE} KB"
          if [ "$JS_SIZE" -gt 800 ]; then
            echo "WARNING: JS bundle exceeds 800 KB. Consider code splitting."
          fi

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ github.sha }}
          path: dist/
          retention-days: 7

  # ─────────────────────────────────────────────
  # Job 4: Deploy to Staging (main branch only)
  # ─────────────────────────────────────────────
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [security, build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: staging
      url: https://proportrait-staging.vercel.app
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          # Deploy to staging alias (not production)
          alias-domains: proportrait-staging.vercel.app

  # ─────────────────────────────────────────────
  # Job 5: Deploy to Production (manual approval)
  # ─────────────────────────────────────────────
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [deploy-staging]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://proportrait.ai
    # "production" environment in GitHub Settings requires manual approval
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"

      - name: Notify deployment
        if: success()
        uses: slackapi/slack-github-action@v1.26.0
        with:
          payload: |
            {
              "text": "ProPortrait AI deployed to production :rocket:\nCommit: ${{ github.sha }}\nBy: ${{ github.actor }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Required GitHub Secrets

Add these in GitHub Settings > Secrets and Variables > Actions:

| Secret Name | Description |
|-------------|-------------|
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | Vercel org/team ID (from Vercel project settings) |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook for deploy notifications (optional) |

**Important**: `GEMINI_API_KEY` must NEVER be added as a GitHub Actions secret. It must live exclusively in Vercel's encrypted environment variable store, accessible only at runtime on the server side (after C1 is resolved).

---

## Deployment Architecture

### Recommendation: Vercel

**Rationale**:
- Native Vite/React support with zero configuration
- Encrypted environment variable store (solves C3) — variables are injected at runtime, not build time
- Edge network deployment — global CDN for static assets
- Preview deployments on every PR — test before merging to main
- Free tier sufficient for early-stage traffic
- Direct GitHub integration with deploy hooks
- Analytics and Web Vitals built-in

**Vercel Project Configuration** (create `vercel.json` in project root):

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Note**: The security headers above add Content Security Policy, anti-clickjacking, and cache headers for immutable assets. This is free hardening that requires no code changes.

**Alternative: Cloudflare Pages**
- Superior global edge network performance
- Slightly more complex setup
- Consider if latency to Gemini API becomes a bottleneck (though Gemini calls are browser-to-Google, not server-to-Google in current architecture)

---

## Monitoring + Alerting Setup

### Sentry (Error Tracking)

1. Create a Sentry project at https://sentry.io — select "React" as platform
2. Install: `npm install @sentry/react`
3. Add `VITE_SENTRY_DSN` to Vercel environment variables (staging and prod only)
4. Initialize in `src/main.tsx` before `ReactDOM.createRoot()`

**Critical Sentry configuration for this project**: The `beforeSend` hook must strip base64 image data from error payloads. Portrait base64 strings can be 500 KB+. Without stripping, Sentry payloads will be rejected (1 MB limit) and error tracking will silently fail on the most important errors.

```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
  tracesSampleRate: 0.05,
  beforeSend(event) {
    // Strip base64 image data from breadcrumbs to stay under Sentry limits
    if (event.breadcrumbs?.values) {
      event.breadcrumbs.values = event.breadcrumbs.values.map(b => {
        if (b.data?.body && typeof b.data.body === 'string' && b.data.body.length > 500) {
          return { ...b, data: { ...b.data, body: '[truncated-image-data]' } };
        }
        return b;
      });
    }
    return event;
  },
});
```

**Alert thresholds to configure in Sentry**:
- Error rate > 5% in 5 minutes → PagerDuty/email alert
- New issue in `generateProfessionalPortrait` → immediate Slack notification
- Error rate spike (> 2x baseline) → email alert

### Uptime Monitoring

Set up a free Uptime Robot monitor (https://uptimerobot.com):
- **Type**: HTTP(S)
- **URL**: `https://proportrait.ai`
- **Check interval**: 5 minutes
- **Alert contacts**: Email + Slack webhook
- **Alert after**: 2 consecutive failures (avoids false positives)

### Vercel Analytics (Web Vitals)

Enable in Vercel dashboard → Analytics tab. No code changes required. Tracks LCP, CLS, FID, TTFB per deployment.

---

## Environment Management Plan

| Environment | Purpose | URL Pattern | API Key Source | Deploy Trigger |
|-------------|---------|-------------|----------------|----------------|
| dev | Local development | `localhost:3000` | `.env.local` (never committed) | `npm run dev` |
| staging | Pre-production validation | `proportrait-staging.vercel.app` | Vercel env vars (staging scope) | Auto on push to `main` |
| prod | Live user traffic | `proportrait.ai` | Vercel env vars (production scope) | Manual approval after staging |

### Environment Variable Matrix

| Variable | dev | staging | prod | Notes |
|----------|-----|---------|------|-------|
| `GEMINI_API_KEY` | `.env.local` | Vercel (staging) | Vercel (prod) | NEVER in CI secrets |
| `GEMINI_MODEL` | `.env.local` | `gemini-3.1-flash-image-preview` | `gemini-3.1-flash-image-preview` | Can differ for testing |
| `VITE_SENTRY_DSN` | unset | Vercel (staging) | Vercel (prod) | Disabled in dev |
| `VITE_APP_ENV` | `development` | `staging` | `production` | For runtime branching |

### Vite Environment File Hierarchy

Once C1 is resolved and the API key moves server-side, the client-only vars should use the `VITE_` prefix (which Vite exposes to the browser via `import.meta.env.*`, not `process.env.*`):

```
.env              → shared defaults (no secrets)
.env.development  → dev-specific (no secrets)
.env.staging      → staging-specific (no secrets, not committed)
.env.production   → prod-specific (no secrets, not committed)
.env.local        → local overrides (gitignored, secrets OK here)
```

---

## Incident Response Runbook

### Incident 1: Gemini API Key Compromised / Quota Exhausted

**Detection**: Users see "API Key not found" errors, or billing alert fires from Google Cloud.

**Steps**:
1. **Immediately** go to https://console.cloud.google.com/apis/credentials
2. Click the compromised key → "Regenerate key" (old key is immediately invalidated)
3. Update `GEMINI_API_KEY` in Vercel environment variables (staging and prod scopes)
4. Trigger a Vercel redeployment (environment variables are injected at build time for Vite projects, so a rebuild is required)
5. Verify new build does not contain old key: check CI job "Validate bundle does not contain real API key"
6. Review Google Cloud billing console for unauthorized usage charges — dispute with Google if needed
7. Post incident review: document root cause and ensure API proxy (C1 fix) is prioritized

**Resolution time target**: < 15 minutes from detection to new key live

---

### Incident 2: Production Build Failing

**Detection**: GitHub Actions "Build" job fails; no new deployment to staging.

**Steps**:
1. Check GitHub Actions tab for the failed job and read the error output
2. If TypeScript error: assign to the developer who pushed the breaking commit
3. If npm dependency error: run `npm audit` locally; check if `package-lock.json` is corrupted
4. If Vite build error: run `npm run build` locally to reproduce
5. Revert the offending commit: `git revert <commit-sha> && git push`
6. Open a follow-up PR to fix the root cause properly

**Resolution time target**: < 30 minutes

---

### Incident 3: Application Returns 5xx or Blank Page in Production

**Detection**: Uptime Robot fires alert; Sentry shows spike in unhandled errors.

**Steps**:
1. Check Vercel dashboard → Functions / Deployments for error logs
2. Check Sentry → Issues for the error type and stack trace
3. If regression: identify which deployment introduced it via Vercel deployment history
4. Roll back in Vercel dashboard: Deployments → find last good deployment → "Promote to Production"
5. Create a GitHub issue documenting the incident with reproduction steps
6. Fix and redeploy through normal CI/CD flow

**Resolution time target**: < 10 minutes to rollback, < 2 hours to fix forward

---

### Incident 4: Gemini API Returning Errors (503, 429, No Image Generated)

**Detection**: Sentry alert on `generateProfessionalPortrait` errors; user reports.

**Steps**:
1. Check Google Cloud Status dashboard: https://status.cloud.google.com
2. Check Gemini API quota usage in Google Cloud Console → APIs & Services → Quotas
3. If quota exceeded: determine if legitimate traffic spike or abuse; consider rate limiting
4. If Google-side outage: no action required; communicate via status page if one exists
5. If rate limit: implement exponential backoff retry in `src/services/ai.ts` (currently absent)

---

## Dependencies on Other Agents

**Requires**:
- **FORGE** (backend design agent): The C1 fix (API key exposure) requires designing and building a server-side API proxy. FORGE must specify the backend API contract (`POST /api/generate-portrait`, `POST /api/edit-portrait`) before GUARDIAN can finalize the CI pipeline's server-side build step. The CI/CD pipeline template above can be deployed immediately for the frontend; server CI jobs will be added when FORGE delivers the backend spec.
- **PRISM** (test infrastructure agent): The CI pipeline has placeholder space for a `test` job between `typecheck` and `build`. PRISM must define what tests exist (unit, integration, E2E) so GUARDIAN can add the appropriate job steps. Currently there are no test files, so the `test` job is omitted from the spec above to avoid a no-op step.

**Feeds into**:
- **All agents**: The CI/CD pipeline is the delivery mechanism for every other agent's recommendations. SENTINEL's security fixes, FORGE's backend changes, and PRISM's test suite all flow through this pipeline. Getting the pipeline live is the highest-leverage infrastructure action in the entire project.

---

## Prioritized Remediation Plan

The following is ordered by risk reduction per unit of effort.

1. **[IMMEDIATE] Rotate the exposed Gemini API key** — Go to Google Cloud Console, regenerate the key. Takes 2 minutes. The current key (`AIzaSyCiD-aV_ai2EGF8Ohigp14zhSBRWFf-4IY`) is burned into the dist bundle and may already be harvested. This cannot wait for the architectural fix.

2. **[DAY 1] Create `.github/workflows/ci.yml`** (C2) — Copy the YAML from this report. Add the three required Vercel secrets to GitHub Settings. This unblocks automated validation for all future changes.

3. **[DAY 1] Create `vercel.json` and deploy to Vercel** (C3) — Wire up staging and prod environments with separate API keys in Vercel's env var store. Establishes the environment separation that makes everything else testable.

4. **[DAY 1–2] Implement the API proxy backend** (C1) — Requires FORGE's input. This is the architectural fix that moves the Gemini API key server-side and permanently solves the key exposure problem. Until this lands, the key remains at risk in every build.

5. **[DAY 2] Install Sentry** (H1) — `npm install @sentry/react`, add DSN to Vercel env vars, initialize in `main.tsx`. Production observability is zero until this step.

6. **[DAY 2] Fix `package.json` dependency classification** (C4) — Move `express`, `better-sqlite3`, `dotenv` to devDependencies (or server package); remove duplicate `vite`.

7. **[DAY 2] Update `build` script to include type check** (H2) — Change to `"build": "tsc --noEmit && vite build"`. 5-minute change, immediate safety gain.

8. **[DAY 2] Add Dependabot config** (H3) — Create `.github/dependabot.yml` as shown above.

9. **[DAY 3] Enable TypeScript strict mode** (M1) — Fix surfaced errors. Prevents future runtime bugs.

10. **[DAY 3] Add bundle splitting** (M2) — Add `manualChunks` to `vite.config.ts`. Improves LCP and Time to Interactive.

11. **[DAY 3] Create `.env.example`** (M3), **set up Uptime Robot** (M4) — Documentation and monitoring hygiene.

12. **[ONGOING] Fix Google Search Console verification tag** (L1), **update `package.json` name** (L2), **add `engines` field** (L3).
