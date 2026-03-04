Context

 ProPortrait AI is a pure React SPA with no backend. The Gemini API key is currently
 baked into the client JS bundle — a critical security issue for public deployment.
 This plan adds an Express backend deployed on Cloud Run to act as an authenticated
 API proxy, moves all secrets to Secret Manager, adds Firebase Auth and Firestore,
 and wires up a GitHub Actions CI/CD pipeline. The frontend is deployed to Firebase
 Hosting.

 Projects
 - Firebase: portrait-7b01d
 - Google Cloud: ai-biz-6b7ec
 - Git: https://github.com/Startup-Consulting-Inc/ProPortrait
 - Region: us-central1 (closest to Gemini API, low latency)

 ---
 Target Architecture

 ┌─────────────────────────────────────────────────────────────┐
 │  GitHub Actions CI/CD                                        │
 │  push → lint → build → deploy frontend + backend in parallel│
 └─────────────────────┬───────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   Firebase Hosting  Cloud Run   Firebase Auth
   (React SPA)      (Express API) (Google / Email)
          │            │
          │            ├── Secret Manager (GEMINI_API_KEY)
          │            ├── Google Gemini API
          │            ├── Firestore (users, portraits, usage)
          │            └── Firebase Storage (portrait images)
          │
          └── Firebase Auth SDK (client-side token)

 Request flow:
 1. User signs in via Firebase Auth (Google Sign-In)
 2. React app gets Firebase ID token
 3. All Gemini calls go to Cloud Run /api/portrait with Authorization: Bearer <token>
 4. Cloud Run verifies token, checks rate limit, proxies to Gemini using Secret
 Manager key
 5. Portrait returned to client; metadata + image URL saved to Firestore + Storage

 ---
 Phase 1 — Backend (Cloud Run Express API)

 1.1 Create server/ directory

 server/package.json — standalone server package (separate from frontend deps):
 {
   "name": "proportrait-api",
   "type": "module",
   "scripts": {
     "start": "node dist/index.js",
     "build": "tsc -p tsconfig.json",
     "dev": "tsx watch index.ts"
   },
   "dependencies": {
     "express": "^4.21.2",
     "firebase-admin": "^12.x",
     "@google/genai": "^1.29.0",
     "cors": "^2.8.5",
     "helmet": "^8.x",
     "express-rate-limit": "^7.x"
   },
   "devDependencies": {
     "typescript": "~5.8.2",
     "@types/express": "^4.17.21",
     "@types/cors": "^2.x",
     "tsx": "^4.21.0"
   }
 }

 server/index.ts — Express entry point:
 - helmet() for security headers
 - cors({ origin: ["https://portrait-7b01d.web.app",
 "https://portrait-7b01d.firebaseapp.com", "http://localhost:3000"] })
 - express.json({ limit: '10mb' }) for base64 image payloads
 - Routes: /api/portrait/generate, /api/portrait/edit, /api/health
 - Firebase Admin initialized from ADC (Application Default Credentials) — no key
 file in container

 server/middleware/auth.ts — Firebase token verification:
 const admin = getFirebaseAdmin();
 const decoded = await admin.auth().verifyIdToken(token);
 req.uid = decoded.uid;

 server/middleware/rateLimit.ts — per-user rate limits:
 - Free tier: 10 generations/day
 - Pro tier: 100 generations/day
 - Stored as Firestore usage/{uid}/daily counters with TTL

 server/routes/portrait.ts — Gemini proxy:
 - Reads GEMINI_API_KEY from process.env (injected by Cloud Run from Secret Manager)
 - Moves all logic from src/services/ai.ts to server-side
 - Returns generated images as base64 data URIs (same contract as current client
 code)

 server/Dockerfile:
 FROM node:22-alpine AS builder
 WORKDIR /app
 COPY package*.json ./
 RUN npm ci --production=false
 COPY . .
 RUN npm run build

 FROM node:22-alpine
 WORKDIR /app
 COPY --from=builder /app/dist ./dist
 COPY --from=builder /app/node_modules ./node_modules
 ENV NODE_ENV=production PORT=8080
 EXPOSE 8080
 CMD ["node", "dist/index.js"]

 ---
 Phase 2 — Frontend Changes

 2.1 Remove API key from client bundle

 vite.config.ts — remove define block for GEMINI_API_KEY and API_KEY:
 // Remove these lines:
 // 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
 // 'process.env.API_KEY': JSON.stringify(env.API_KEY),

 // Add dev proxy to local backend:
 server: {
   proxy: {
     '/api': 'http://localhost:8080'
   }
 }

 2.2 Add Firebase SDK to frontend

 New file: src/lib/firebase.ts:
 import { initializeApp } from 'firebase/app';
 import { getAuth } from 'firebase/auth';
 import { getFirestore } from 'firebase/firestore';
 import { getStorage } from 'firebase/storage';

 const firebaseConfig = {
   projectId: 'portrait-7b01d',
   // ... other config from Firebase console
 };

 export const app = initializeApp(firebaseConfig);
 export const auth = getAuth(app);
 export const db = getFirestore(app);
 export const storage = getStorage(app);

 New file: src/lib/api.ts — authenticated fetch wrapper:
 export async function portraitFetch(path: string, body: object) {
   const token = await getIdToken(auth.currentUser!);
   const res = await fetch(`/api${path}`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`
 },
     body: JSON.stringify(body),
   });
   if (!res.ok) throw new Error(await res.text());
   return res.json();
 }

 2.3 Replace ApiKeyGuard with AuthGuard

 src/components/ApiKeyGuard.tsx → src/components/AuthGuard.tsx:
 - Replace window.aistudio check with Firebase Auth onAuthStateChanged
 - Show Google Sign-In button if not authenticated
 - No more API key selection UI

 2.4 Update ai.ts → api.ts

 src/services/ai.ts — change Gemini calls to hit backend proxy:
 // Before: GoogleGenAI called directly
 // After: portraitFetch('/portrait/generate', { imageBase64, style, ... })
 All function signatures stay identical — no changes needed in PortraitGenerator.tsx.

 ---
 Phase 3 — Firebase Configuration

 3.1 firebase.json — hosting + rewrite rules:

 {
   "hosting": {
     "public": "dist",
     "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
     "rewrites": [{ "source": "**", "destination": "/index.html" }],
     "headers": [{
       "source": "**/*.@(js|css)",
       "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000,
 immutable" }]
     }]
   },
   "firestore": {
     "rules": "firestore.rules",
     "indexes": "firestore.indexes.json"
   },
   "storage": {
     "rules": "storage.rules"
   }
 }

 3.2 .firebaserc:

 {
   "projects": { "default": "portrait-7b01d" }
 }

 3.3 Firestore data model:

 users/{uid}
   - email, displayName, photoURL
   - tier: 'free' | 'pro'
   - createdAt, lastActiveAt

 portraits/{portraitId}
   - uid, style, expressionPreset
   - originalImageURL (Storage)
   - generatedImageURL (Storage)
   - settings: { likenessStrength, naturalness, identityLocks, ... }
   - createdAt

 usage/{uid}
   - daily: { date: string, generateCount: number }

 3.4 Firestore security rules (firestore.rules):

 rules_version = '2';
 service cloud.firestore {
   match /databases/{database}/documents {
     match /users/{uid} {
       allow read, write: if request.auth.uid == uid;
     }
     match /portraits/{portraitId} {
       allow read, write: if request.auth.uid == resource.data.uid;
     }
     match /usage/{uid} {
       allow read: if request.auth.uid == uid;
       allow write: if false; // only server (Admin SDK) can write
     }
   }
 }

 3.5 Firebase Storage rules:

 rules_version = '2';
 service firebase.storage {
   match /b/{bucket}/o {
     match /portraits/{uid}/{fileName} {
       allow read, write: if request.auth.uid == uid;
     }
   }
 }

 ---
 Phase 4 — Google Cloud Setup

 4.1 Secret Manager

 # Store Gemini API key — NEVER in code or env files
 gcloud secrets create GEMINI_API_KEY \
   --project=ai-biz-6b7ec \
   --replication-policy="automatic"

 echo -n "YOUR_KEY_HERE" | \
   gcloud secrets versions add GEMINI_API_KEY --data-file=-

 4.2 Cloud Run service

 gcloud run deploy proportrait-api \
   --project=ai-biz-6b7ec \
   --region=us-central1 \
   --image=us-central1-docker.pkg.dev/ai-biz-6b7ec/proportrait/api:latest \
   --platform=managed \
   --allow-unauthenticated \        # Firebase Auth handled in app layer
   --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest \
   --set-env-vars=FIREBASE_PROJECT_ID=portrait-7b01d,NODE_ENV=production \
   --memory=512Mi \
   --cpu=1 \
   --min-instances=0 \
   --max-instances=10 \
   --timeout=120s                   # Gemini can take 40s; 120s gives buffer

 4.3 Artifact Registry (for Docker images)

 gcloud artifacts repositories create proportrait \
   --repository-format=docker \
   --location=us-central1 \
   --project=ai-biz-6b7ec

 4.4 Service Account permissions

 Cloud Run service account needs:
 - roles/secretmanager.secretAccessor (read GEMINI_API_KEY)
 - roles/firebase.sdkAdminServiceAgent (verify Firebase tokens)
 - roles/datastore.user (read/write Firestore)
 - roles/storage.objectAdmin (read/write Firebase Storage)

 ---
 Phase 5 — CI/CD (GitHub Actions)

 .github/workflows/deploy.yml:
 name: Deploy ProPortrait

 on:
   push:
     branches: [main]

 jobs:
   lint:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4
         with: { node-version: '22', cache: 'npm' }
       - run: npm ci
       - run: npm run lint

   deploy-backend:
     needs: lint
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: google-github-actions/auth@v2
         with:
           credentials_json: ${{ secrets.GCP_SA_KEY }}
       - uses: google-github-actions/setup-gcloud@v2
       - name: Build & push Docker image
         run: |
           cd server
           gcloud builds submit \
             --tag us-central1-docker.pkg.dev/ai-biz-6b7ec/proportrait/api:${{
 github.sha }} \
             --project=ai-biz-6b7ec
       - name: Deploy to Cloud Run
         run: |
           gcloud run deploy proportrait-api \
             --image us-central1-docker.pkg.dev/ai-biz-6b7ec/proportrait/api:${{
 github.sha }} \
             --region=us-central1 \
             --project=ai-biz-6b7ec

   deploy-frontend:
     needs: lint
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4
         with: { node-version: '22', cache: 'npm' }
       - run: npm ci
       - name: Build frontend
         run: npm run build
         env:
           VITE_API_URL: https://proportrait-api-<hash>-uc.a.run.app
           VITE_FIREBASE_PROJECT_ID: portrait-7b01d
           # Other non-secret Firebase config vars
       - uses: FirebaseExtended/action-hosting-deploy@v0
         with:
           repoToken: ${{ secrets.GITHUB_TOKEN }}
           firebaseServiceAccount: ${{ secrets.FIREBASE_SA_KEY }}
           projectId: portrait-7b01d
           channelId: live

 GitHub Secrets to configure:

 ┌─────────────────┬──────────────────────────────────────────────────────────────┐
 │     Secret      │                            Value                             │
 ├─────────────────┼──────────────────────────────────────────────────────────────┤
 │ GCP_SA_KEY      │ GCP service account JSON (Cloud Build + Cloud Run deploy     │
 │                 │ roles)                                                       │
 ├─────────────────┼──────────────────────────────────────────────────────────────┤
 │ FIREBASE_SA_KEY │ Firebase service account JSON (Hosting deploy role)          │
 └─────────────────┴──────────────────────────────────────────────────────────────┘

 ---
 Phase 6 — Environment Promotion

 ┌─────────────┬──────────────────────────────┬────────────────────────┬─────────┐
 │ Environment │         Frontend URL         │      Backend URL       │ Branch  │
 ├─────────────┼──────────────────────────────┼────────────────────────┼─────────┤
 │ Production  │ portrait-7b01d.web.app       │ Cloud Run (production) │ main    │
 ├─────────────┼──────────────────────────────┼────────────────────────┼─────────┤
 │ Staging     │ Firebase Hosting preview     │ Cloud Run staging      │ staging │
 │             │ channel                      │ revision               │         │
 ├─────────────┼──────────────────────────────┼────────────────────────┼─────────┤
 │ Local dev   │ localhost:3000               │ localhost:8080         │ any     │
 └─────────────┴──────────────────────────────┴────────────────────────┴─────────┘

 Local dev setup (after this plan is implemented):
 # Terminal 1 — backend
 cd server && npm run dev

 # Terminal 2 — frontend (proxies /api to localhost:8080)
 npm run dev

 ---
 Files to Create

 ┌────────────────────────────────┬───────────────────────────────────────────────┐
 │              File              │                    Purpose                    │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ server/index.ts                │ Express entry point                           │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ server/middleware/auth.ts      │ Firebase token verification                   │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ server/middleware/rateLimit.ts │ Per-user rate limits via Firestore            │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ server/routes/portrait.ts      │ Gemini proxy (generate + edit)                │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ server/Dockerfile              │ Cloud Run container                           │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ server/package.json            │ Server-only dependencies                      │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ server/tsconfig.json           │ Server TypeScript config                      │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ server/lib/logger.ts           │ Structured JSON logger → Cloud Logging        │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ src/lib/firebase.ts            │ Firebase client init                          │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ src/lib/api.ts                 │ Authenticated fetch wrapper                   │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ src/components/AuthGuard.tsx   │ Replaces ApiKeyGuard                          │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ firebase.json                  │ Firebase Hosting config                       │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ .firebaserc                    │ Firebase project binding                      │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ firestore.rules                │ Firestore security rules                      │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ firestore.indexes.json         │ Firestore composite indexes                   │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ storage.rules                  │ Firebase Storage rules                        │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ .github/workflows/deploy.yml   │ CI/CD pipeline (with npm audit + secret       │
 │                                │ scanning)                                     │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ .github/dependabot.yml         │ Automated weekly dependency security updates  │
 └────────────────────────────────┴───────────────────────────────────────────────┘

 Files to Modify

 ┌────────────────────────────────┬───────────────────────────────────────────────┐
 │              File              │                    Change                     │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ vite.config.ts                 │ Remove define for API keys; add /api dev      │
 │                                │ proxy                                         │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ src/services/ai.ts             │ Replace GoogleGenAI calls with                │
 │                                │ portraitFetch()                               │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ src/components/ApiKeyGuard.tsx │ Replace with AuthGuard (Firebase Auth)        │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ src/App.tsx                    │ Swap ApiKeyGuard import for AuthGuard         │
 ├────────────────────────────────┼───────────────────────────────────────────────┤
 │ package.json                   │ Remove express, better-sqlite3, dotenv, tsx   │
 │                                │ from root (move to server/)                   │
 └────────────────────────────────┴───────────────────────────────────────────────┘

 ---
 Phase 7 — Observability

 Addresses all ORACLE + GUARDIAN findings: zero analytics, no error tracking, no cost
  tracking, no security scanning.

 7.1 Structured Logging (Cloud Run → Cloud Logging)

 server/lib/logger.ts — JSON structured logger:
 export const log = {
   info: (msg: string, meta?: object) =>
     console.log(JSON.stringify({ severity: 'INFO', message: msg, ...meta })),
   error: (msg: string, err?: Error, meta?: object) =>
     console.error(JSON.stringify({ severity: 'ERROR', message: msg, stack:
 err?.stack, ...meta })),
 };

 Every Gemini call logs: { uid, style, numImages, gemini_latency_ms,
 total_latency_ms, success } — gives cost tracking and performance baselines
 automatically via Cloud Logging.

 7.2 Cloud Error Reporting

 Auto-enabled from Cloud Run structured logs — no setup needed. Any severity: ERROR
 log is captured and grouped in Cloud Error Reporting console. Add unhandled
 rejection handler in server/index.ts:
 process.on('unhandledRejection', (reason) => log.error('Unhandled rejection', reason
  as Error));

 7.3 Cloud Monitoring Alerts

 Create these in ai-biz-6b7ec Cloud Monitoring:

 ┌─────────────────┬─────────────────────────────────────┬─────────┐
 │      Alert      │              Condition              │ Channel │
 ├─────────────────┼─────────────────────────────────────┼─────────┤
 │ High error rate │ Cloud Run error rate > 5% for 5 min │ Email   │
 ├─────────────────┼─────────────────────────────────────┼─────────┤
 │ High latency    │ Cloud Run p95 latency > 50s         │ Email   │
 ├─────────────────┼─────────────────────────────────────┼─────────┤
 │ Cost spike      │ Daily Gemini call count > 500       │ Email   │
 ├─────────────────┼─────────────────────────────────────┼─────────┤
 │ Instance surge  │ Cloud Run instance count > 8        │ Email   │
 └─────────────────┴─────────────────────────────────────┴─────────┘

 Dashboard panels: generation count/hour, error rate, latency p50/p95, per-style
 usage breakdown.

 7.4 API Cost Tracking (Firestore)

 In server/routes/portrait.ts — after each successful generation, write to Firestore:
 await db.collection('gemini_usage').doc(today).set({
   calls: FieldValue.increment(numImages),
   estimated_cost_usd: FieldValue.increment(numImages * 0.005), // ~$0.005/image
 }, { merge: true });
 This gives daily cost visibility without external billing tooling.

 7.5 Firebase Analytics (Frontend)

 Add to src/lib/firebase.ts:
 export const analytics = getAnalytics(app);

 Track these events in PortraitGenerator.tsx:

 ┌───────────────────────┬────────────────────┬──────────────────────────────────┐
 │         Event         │        When        │            Properties            │
 ├───────────────────────┼────────────────────┼──────────────────────────────────┤
 │ portrait_generated    │ Generation         │ style, expression, numImages,    │
 │                       │ completes          │ latency_ms                       │
 ├───────────────────────┼────────────────────┼──────────────────────────────────┤
 │ style_selected        │ User picks a style │ style                            │
 ├───────────────────────┼────────────────────┼──────────────────────────────────┤
 │ identity_lock_toggled │ Any lock toggled   │ feature, locked: boolean         │
 ├───────────────────────┼────────────────────┼──────────────────────────────────┤
 │ pro_upgrade_clicked   │ Upgrade button     │ source: 'step4'                  │
 │                       │ clicked            │                                  │
 ├───────────────────────┼────────────────────┼──────────────────────────────────┤
 │ platform_downloaded   │ Platform export    │ platform, format                 │
 │                       │ used               │                                  │
 ├───────────────────────┼────────────────────┼──────────────────────────────────┤
 │ edit_applied          │ Regional edit      │ editMode, hasRegionTarget        │
 │                       │ submitted          │                                  │
 └───────────────────────┴────────────────────┴──────────────────────────────────┘

 7.6 Firebase Performance Monitoring (Frontend)

 Add to src/main.tsx:
 import { getPerformance } from 'firebase/performance';
 getPerformance(app); // auto-tracks FCP, LCP, FID, page loads

 Custom trace in PortraitGenerator.tsx around generation:
 const trace = perf.trace('portrait_generation');
 trace.putAttribute('style', selectedStyle);
 trace.start();
 // ... await generation ...
 trace.stop(); // records duration automatically

 7.7 Security Scanning (CI/CD additions)

 Add to .github/workflows/deploy.yml lint job:
 - name: Security audit
   run: npm audit --audit-level=high
 - name: Check for secrets in code
   run: npx secretlint "**/*"

 Add .github/dependabot.yml for automated dependency updates:
 version: 2
 updates:
   - package-ecosystem: "npm"
     directory: "/"
     schedule: { interval: "weekly" }
   - package-ecosystem: "npm"
     directory: "/server"
     schedule: { interval: "weekly" }
   - package-ecosystem: "github-actions"
     directory: "/"
     schedule: { interval: "weekly" }

 7.8 Additional Files for Observability

 ┌────────────────────────┬──────────────────────────────────────────┐
 │          File          │                 Purpose                  │
 ├────────────────────────┼──────────────────────────────────────────┤
 │ server/lib/logger.ts   │ Structured JSON logger for Cloud Logging │
 ├────────────────────────┼──────────────────────────────────────────┤
 │ .github/dependabot.yml │ Automated weekly security updates        │
 └────────────────────────┴──────────────────────────────────────────┘

 ---
 Execution Order

 1. GCP/Firebase one-time setup (Secret Manager, Artifact Registry, service accounts)
 2. Create server/ backend (Express + Firebase Admin + Gemini proxy + structured
 logger)
 3. Update frontend (remove API key from bundle, add Firebase Auth, Firebase
 Analytics, Performance Monitoring, update ai.ts)
 4. Create Firebase config files (firebase.json, rules)
 5. Set up GitHub Actions CI/CD (with npm audit + Dependabot)
 6. Deploy backend to Cloud Run manually (first deploy)
 7. Deploy frontend to Firebase Hosting manually (first deploy)
 8. Configure Cloud Monitoring alerts and dashboard
 9. Verify end-to-end: auth → generate → portrait saved → analytics event fired →
 Cloud Logging shows structured log

 ---
 Verification

 # 1. Health check backend
 curl https://proportrait-api-<hash>-uc.a.run.app/api/health

 # 2. Unauthenticated request should return 401
 curl -X POST https://proportrait-api-<hash>-uc.a.run.app/api/portrait/generate

 # 3. Full flow — sign in with Google in browser, generate portrait, check Firestore
 for saved record

 # 4. Confirm API key is NOT in frontend bundle
 grep -r "AIzaSy" dist/  # Should return no results

 # 5. Check Cloud Run logs
 gcloud run logs read proportrait-api --region=us-central1 --project=ai-biz-6b7ec