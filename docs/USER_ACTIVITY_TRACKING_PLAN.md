# User Activity Tracking Plan - ProPortrait

## Current State Overview

**Existing Tracking:**
- PostHog for client-side analytics (basic events)
- Server-side tracking: generation count, edit count, export count, login count
- Session-based anonymous user support (via `pp_session` cookie)
- Firestore collections: `users`, `stats/daily/days`, `anonymous_credits`

**Goal:** Comprehensive tracking of user journey from landing to export, including time spent, drop-offs, and feature usage — for both registered and unregistered users.

---

## 1. Anonymous User Identification Strategy

### 1.1 Session-Based Tracking (Already Exists)
```
Cookie: pp_session={uuid}
Duration: 30 days
Stored in: Firestore anonymous_credits collection
```

### 1.2 Enhanced Anonymous Profile
New collection: `anonymous_sessions` (extends existing `anonymous_credits`)

```typescript
interface AnonymousSessionDoc {
  sessionId: string;           // UUID from cookie
  firstSeenAt: Timestamp;
  lastActiveAt: Timestamp;
  
  // Device/Context
  userAgent: string;
  referrer: string;
  landingPage: string;
  
  // Activity Summary
  totalGenerations: number;
  totalEdits: number;
  totalUploads: number;
  timeSpentSeconds: number;
  
  // Conversion tracking
  convertedToUser: boolean;
  convertedUserId?: string;
  convertedAt?: Timestamp;
}
```

---

## 2. Event Tracking Schema

### 2.1 Funnel Events (Step Navigation)

| Event Name | When | Properties |
|------------|------|------------|
| `step_viewed` | User lands on any step | `step: 1\|2\|3\|4`, `fromStep?: number`, `timeOnPreviousStep?: number` |
| `step_completed` | User advances to next step | `step: 1\|2\|3`, `timeSpentSeconds: number` |
| `step_abandoned` | User leaves without completing | `step: 1\|2\|3\|4`, `timeSpentSeconds: number`, `exitIntent?: boolean` |

### 2.2 Upload Events

| Event Name | When | Properties |
|------------|------|------------|
| `upload_started` | File selection begins | `source: 'click' \| 'drag'` |
| `upload_completed` | Image successfully loaded | `fileSizeMB: number`, `fileType: string`, `width: number`, `height: number`, `durationMs: number` |
| `upload_failed` | Invalid file or error | `reason: 'size' \| 'type' \| 'corrupt' \| 'error'`, `fileSizeMB?: number` |
| `upload_retry` | User retries upload | `attemptNumber: number` |

### 2.3 Style Selection Events (NEW)

Track every user selection/change in the Style step to understand configuration patterns and abandoned preferences.

| Event Name | When | Properties |
|------------|------|------------|
| `style_selected` | User clicks a style option | `style: StyleOption`, `previousStyle?: StyleOption`, `isQuickMode: boolean` |
| `expression_selected` | User picks expression | `expression: ExpressionPreset`, `previousExpression?: ExpressionPreset` |
| `identity_lock_toggled` | User toggles an identity lock | `lock: string`, `enabled: boolean`, `allLocks: IdentityLocks` |
| `likeness_changed` | Slider value changes | `likeness: number`, `previousLikeness?: number` |
| `naturalness_changed` | Naturalness preset or slider | `preset: NaturalnessPreset`, `value: number`, `previousPreset?: NaturalnessPreset` |
| `variations_changed` | User changes variation count | `variations: number`, `previousVariations?: number` |
| `blemish_toggle_changed` | User changes blemish setting | `removeBlemishes: boolean` |
| `group_photo_hint_selected` | User selects person in group | `hint: string \| null`, `isCustom: boolean` |
| `mode_switched` | Quick/Advanced toggle | `mode: 'quick' \| 'advanced'`, `previousMode: 'quick' \| 'advanced'` |
| `settings_snapshot_saved` | Auto-saved periodically | `settings: StyleSettingsSnapshot`, `reason: 'auto_save' \| 'generate_clicked' \| 'step_exited'` |

**StyleSettingsSnapshot Interface:**
```typescript
interface StyleSettingsSnapshot {
  // Core Style
  selectedStyle: StyleOption;
  expressionPreset: ExpressionPreset;
  
  // Identity & Realism
  identityLocks: IdentityLocks;
  likenessStrength: number;
  naturalness: number;
  naturalnessPreset: NaturalnessPreset;
  removeBlemishes: boolean;
  
  // Generation Options
  numVariations: number;
  
  // Advanced Options
  selectedPersonHint: string | null;
  customPersonDescription?: string;
  
  // UI State
  isQuickMode: boolean;
  
  // Metadata
  snapshotAt: number;  // timestamp
  sessionId: string;
}
```

**Settings History Collection (NEW):**
```typescript
// Collection: user_settings_history (or anonymous_settings_history)
interface SettingsHistoryDoc {
  userId?: string;           // null for anonymous
  sessionId: string;
  
  // Complete settings snapshot
  settings: StyleSettingsSnapshot;
  
  // Context
  capturedAt: Timestamp;
  step: 2;                   // always step 2
  reason: 'change' | 'generate' | 'abandoned' | 'auto_save';
  
  // Previous settings (for diff tracking)
  previousSettings?: StyleSettingsSnapshot;
  
  // Generation outcome (populated later if generate clicked)
  generationResult?: {
    generationId?: string;
    succeeded: boolean;
    completedAt?: Timestamp;
  };
}
```

### 2.4 Generation Events

| Event Name | When | Properties |
|------------|------|------------|
| `generation_initiated` | User clicks Generate | `style: string`, `numVariations: number`, `isQuickMode: boolean`, `settingsSnapshotId: string` |
| `generation_progress` | Every 5 seconds during gen | `elapsedMs: number`, `progressPercent?: number` |
| `generation_completed` | Images received | `durationMs: number`, `style: string`, `numVariations: number`, `success: true` |
| `generation_failed` | Error during generation | `durationMs: number`, `error: string`, `errorType: 'rate_limit' \| 'timeout' \| 'api_error'` |

**Settings snapshot to track:**
```typescript
interface GenerationSettings {
  style: StyleOption;
  expression: ExpressionPreset;
  likenessStrength: number;
  naturalness: number;
  naturalnessPreset: NaturalnessPreset;
  identityLocks: IdentityLocks;
  numVariations: number;
  removeBlemishes: boolean;
  selectedPersonHint: string | null;
}
```

### 2.4 Edit Events

| Event Name | When | Properties |
|------------|------|------------|
| `edit_initiated` | User enters edit mode | `editMode: 'clothes' \| 'background' \| 'region' \| 'custom'` |
| `edit_submitted` | User triggers edit | `instruction: string`, `hasRegionTarget: boolean`, `regionTarget?: string`, `clothesDetails?: object` |
| `edit_completed` | Edit result received | `durationMs: number`, `instruction: string`, `success: true` |
| `edit_failed` | Edit error | `durationMs: number`, `error: string`, `instruction: string` |
| `edit_undo` | User clicks undo | `fromHistoryIndex: number`, `toHistoryIndex: number` |
| `edit_redo` | User clicks redo | `fromHistoryIndex: number`, `toHistoryIndex: number` |
| `edit_history_jump` | User clicks history item | `fromIndex: number`, `toIndex: number`, `historyLength: number` |
| `variation_switched` | User clicks different variation | `fromIndex: number`, `toIndex: number`, `totalVariations: number` |
| `compare_mode_toggled` | User toggles compare | `enabled: boolean`, `durationEnabled?: number` |

### 2.5 Export Events

| Event Name | When | Properties |
|------------|------|------------|
| `export_configured` | User adjusts export settings | `ratio: string`, `format: string`, `mode: 'fill' \| 'fit'`, `cropPosition?: object` |
| `export_initiated` | User clicks download | `type: 'hd' \| 'platform' \| 'all'`, `platformId?: string`, `hasCredits: boolean` |
| `export_completed` | Download starts | `type: 'hd' \| 'platform' \| 'all'`, `platformId?: string`, `creditsRemaining: number`, `fileSizeMB?: number` |
| `export_failed` | Download blocked/error | `type: 'hd' \| 'platform' \| 'all'`, `reason: 'no_credits' \| 'auth_required' \| 'error'` |
| `paywall_shown` | Credits modal appears | `trigger: 'step4' \| 'download_click'`, `creditsNeeded: number` |
| `paywall_dismissed` | User closes without buying | `timeOnModalMs: number` |
| `purchase_initiated` | User clicks buy | `plan: 'starter' \| 'pro' \| 'max'`, `trigger: string` |
| `purchase_completed` | Stripe success | `plan: string`, `amount: number`, `sessionId: string` |

### 2.6 Portrait Management Events

| Event Name | When | Properties |
|------------|------|------------|
| `portrait_saved` | Save to library | `portraitId: string`, `style: string`, `saveCount: number` |
| `portrait_deleted` | Delete from library | `portraitId: string` |
| `library_opened` | View saved portraits | `totalPortraits: number` |
| `library_portrait_selected` | Load from library | `portraitId: string`, `style: string`, `ageDays: number` |
| `preset_copied` | Copy settings JSON | `settings: object` |

### 2.7 UI/UX Events

| Event Name | When | Properties |
|------------|------|------------|
| `mode_switched` | Quick/Advanced toggle | `mode: 'quick' \| 'advanced'`, `step: number` |
| `settings_expanded` | Show advanced options | `section: string` |
| `tour_started` | Feature tour begins | `tourVersion: string` |
| `tour_step_viewed` | Tour step shown | `step: number`, `stepName: string` |
| `tour_completed` | Tour finished | `totalSteps: number`, `timeSpentMs: number` |
| `tour_skipped` | User skips tour | `atStep: number` |
| `theme_changed` | Light/dark toggle | `theme: 'light' \| 'dark'` |

---

## 3. Time Tracking Implementation

### 3.1 Session Time Tracking
```typescript
// Track total active time
interface SessionTimeTracker {
  sessionStart: number;        // timestamp
  stepEntryTime: number;       // when user entered current step
  totalActiveTime: number;     // accumulated (excluding idle)
  lastActivityTime: number;    // last interaction
  
  // Per-step breakdown
  stepTimes: {
    step1: number;  // upload
    step2: number;  // style
    step3: number;  // edit
    step4: number;  // export
  };
}
```

### 3.2 Idle Detection
- Consider user idle after **60 seconds** without interaction
- Pause time tracking during idle
- Resume on next interaction
- Capture `session_idle_detected` event after 5 minutes idle

### 3.3 Time-Based Events to Track

| Event | Trigger |
|-------|---------|
| `session_time_milestone` | Every 5 minutes active |
| `step_time_exceeded` | User spends >5 min on a step |
| `generation_wait_time` | Time from click to result |
| `edit_wait_time` | Time from submit to result |

---

## 4. Data Storage Schema

### 4.1 Enhanced User Doc (Firestore)
```typescript
interface UserDoc {
  // ... existing fields ...
  
  // Style Preferences (from saved snapshots)
  mostUsedStyle?: StyleOption;
  mostUsedExpression?: ExpressionPreset;
  averageLikenessSetting?: number;
  averageNaturalnessSetting?: number;
  preferredVariationsCount?: number;  // mode of their choices
  quickModePercentage?: number;       // % of time they use quick mode
  
  // Activity Timestamps
  firstGenerationAt?: Timestamp;
  firstExportAt?: Timestamp;
  firstEditAt?: Timestamp;
  
  // Time Tracking
  totalSessionTimeSeconds: number;
  totalGenerationTimeSeconds: number;
  totalEditTimeSeconds: number;
  
  // Funnel Progress
  furthestStepReached: 1 | 2 | 3 | 4;
  completedFlow: boolean;
  
  // Feature Usage
  quickModeUses: number;
  advancedModeUses: number;
  editsPerGeneration: number;  // average
  variationsGenerated: number; // total across all sessions
  
  // Edit Details
  editBreakdown: {
    clothes: number;
    background: number;
    region: number;
    custom: number;
  };
  
  // Export Details
  exportBreakdown: {
    hd: number;
    platform: number;
    all: number;
  };
  platformExportBreakdown: Record<string, number>;  // per platform
  
  // Engagement
  returnVisitCount: number;
  daysSinceLastVisit: number;
  sessionCount: number;
}
```

### 4.2 Session Events Collection (New)
Collection: `user_sessions` (subcollection under users) / `anonymous_sessions`

```typescript
interface SessionEvent {
  id: string;
  sessionId: string;        // for anonymous
  userId?: string;          // null for anonymous
  startedAt: Timestamp;
  endedAt?: Timestamp;
  
  // Funnel
  stepsReached: number[];   // [1, 2, 3] if reached step 3
  completed: boolean;       // reached export
  
  // Time
  totalTimeSeconds: number;
  stepTimes: Record<string, number>;
  idleTimeSeconds: number;
  
  // Activity Counts
  uploads: number;
  generations: number;
  edits: number;
  exports: number;
  
  // Context
  deviceType: 'desktop' | 'tablet' | 'mobile';
  referrer: string;
  landingPage: string;
  utmParams?: Record<string, string>;
  
  // Conversion (for anonymous)
  convertedToUser: boolean;
  convertedUserId?: string;
}
```

### 4.3 Settings History Collection (New)
Collection: `settings_history`

```typescript
interface SettingsHistoryDoc {
  id: string;
  userId?: string;              // null for anonymous
  sessionId: string;
  
  // Complete settings snapshot
  settings: StyleSettingsSnapshot;
  
  // Context
  capturedAt: Timestamp;
  step: 2;                      // always step 2
  reason: 'change' | 'generate' | 'abandoned' | 'auto_save' | 'step_exited';
  
  // Previous settings for diff analysis
  previousSettings?: StyleSettingsSnapshot;
  
  // Generation outcome (populated later)
  generationResult?: {
    generationId?: string;
    succeeded: boolean;
    completedAt?: Timestamp;
  };
  
  // For analytics queries
  date: string;                 // YYYY-MM-DD
}
```

**Usage Scenarios:**
1. **Abandoned Settings Recovery**: Find settings where `reason = 'step_exited'` and no `generationResult`
2. **Popular Configurations**: Aggregate most common style + expression combinations
3. **A/B Test Analysis**: Compare generation rates for different default settings
4. **User Preferences**: Calculate user's preferred settings over time

### 4.4 Detailed Events Collection (New)
Collection: `events` (time-series, can be partitioned by date)

```typescript
interface TrackedEvent {
  id: string;
  userId?: string;
  sessionId: string;
  timestamp: Timestamp;
  
  eventType: 'step' | 'upload' | 'generation' | 'edit' | 'export' | 'ui' | 'purchase' | 'style_selection';
  eventName: string;
  
  // Context
  step?: number;
  timeOnStep?: number;
  
  // Properties (flexible based on event)
  properties: Record<string, unknown>;
  
  // For querying
  date: string;  // YYYY-MM-DD for daily partitioning
}
```

---

## 5. Implementation Phases

### Phase 1: Core Funnel Tracking (Week 1)
- [ ] Implement step_viewed / step_completed / step_abandoned events
- [ ] Add time tracking per step
- [ ] Store session-level time data
- [ ] Create `user_sessions` collection

### Phase 1.5: Style Settings Tracking (Week 1-2)
- [ ] **Track all style selection changes** (style, expression, identity locks, etc.)
- [ ] **Create `settings_history` collection**
- [ ] Auto-save settings snapshot every 5 seconds
- [ ] Save snapshot on generate click
- [ ] Save snapshot when leaving Step 2 without generating
- [ ] Endpoint: POST /api/settings/snapshot
- [ ] Endpoint: GET /api/settings/last (for abandoned settings recovery)

**Files to modify:**
- `src/components/PortraitGenerator.tsx` - step navigation
- `src/services/analytics.ts` - new tracking functions
- `server/lib/firestore.ts` - session storage functions

### Phase 2: Feature-Level Tracking (Week 2)
- [ ] Upload events (start, complete, fail)
- [ ] **Style selection tracking** (all setting changes)
- [ ] **Settings snapshot save** (auto-save + generate click)
- [ ] Settings history collection
- [ ] Generation events (initiated, progress, completed, failed)
- [ ] Enhanced generation settings snapshot
- [ ] Edit events (initiated, submitted, completed, undo/redo)

**Files to modify:**
- `src/components/PortraitGenerator.tsx` - upload, generate, edit handlers
- `server/index.ts` - server-side event logging

### Phase 3: Export & Purchase Tracking (Week 3)
- [ ] Export configuration events
- [ ] Download events (initiated, completed, failed)
- [ ] Paywall interaction tracking
- [ ] Purchase funnel tracking

**Files to modify:**
- `src/components/PortraitGenerator.tsx` - export handlers
- `src/components/BuyCreditsModal.tsx` - purchase events

### Phase 4: Anonymous User Enhancement (Week 4)
- [ ] Enhanced anonymous session tracking
- [ ] Anonymous-to-registered conversion tracking
- [ ] Cross-session stitching for pre-login activity

**Files to modify:**
- `server/middleware/authMiddleware.ts` - session handling
- `server/routes/auth.ts` - conversion tracking
- `src/contexts/AuthContext.tsx` - client-side session linking

### Phase 5: Dashboard & Reporting (Week 5-6)
- [ ] Admin dashboard for funnel visualization
- [ ] Daily/weekly activity reports
- [ ] Cohort analysis (signup → first generation → first export)

**Files to create:**
- `src/pages/AnalyticsDashboard.tsx` (admin only)
- `server/routes/analytics.ts` - aggregation endpoints

---

## 6. Code Implementation Examples

### 6.1 Enhanced Analytics Service
```typescript
// src/services/analytics.ts
import posthog from 'posthog-js';
import { getSessionId } from './session';

let initialized = false;

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return;

  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    session_recording: { maskAllInputs: true },
  });

  // Set up session ID for anonymous tracking
  const sessionId = getSessionId();
  posthog.register({ session_id: sessionId });

  const consent = localStorage.getItem('pp_cookie_consent');
  if (consent === 'declined') posthog.opt_out_capturing();

  initialized = true;
}

// Basic event capture
export function capture(event: string, props?: Record<string, unknown>) {
  if (initialized) posthog.capture(event, props);
  
  // Also send to our backend for persistent storage
  void trackEventServerSide(event, props);
}

// Server-side event tracking
async function trackEventServerSide(event: string, props?: Record<string, unknown>) {
  try {
    const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
    await fetch(`${API_BASE}/api/events/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties: props, timestamp: Date.now() }),
      credentials: 'include',
    });
  } catch {
    // Fire and forget - don't block UI
  }
}

// Time tracking utilities
const timeTracker = {
  stepEntryTime: 0,
  currentStep: 0,
  stepTimes: { 1: 0, 2: 0, 3: 0, 4: 0 },
  
  enterStep(step: number) {
    const now = Date.now();
    if (this.currentStep > 0) {
      this.stepTimes[this.currentStep] += now - this.stepEntryTime;
    }
    this.currentStep = step;
    this.stepEntryTime = now;
  },
  
  getTimeOnCurrentStep(): number {
    return Date.now() - this.stepEntryTime;
  },
  
  getStepTimes() {
    return { ...this.stepTimes };
  }
};

export { timeTracker };
```

### 6.2 Step Tracking Integration
```typescript
// In PortraitGenerator.tsx
const [step, setStep] = useState<Step>(1);
const stepStartTime = useRef<number>(Date.now());

// Track step entry
useEffect(() => {
  const previousStep = step === 1 ? null : step - 1;
  const timeOnPreviousStep = previousStep 
    ? Date.now() - stepStartTime.current 
    : undefined;
  
  capture('step_viewed', {
    step,
    fromStep: previousStep,
    timeOnPreviousStep,
    totalTimeInSession: Date.now() - sessionStartTime.current,
  });
  
  stepStartTime.current = Date.now();
  
  // Update furthest step reached on server
  if (user) {
    void updateFurthestStep(user.uid, step);
  }
}, [step]);

// Save settings snapshot when leaving Step 2 without generating
useEffect(() => {
  return () => {
    if (step === 2 && !hasGenerated) {
      void saveSettingsSnapshot({
        settings: buildSettingsSnapshot(),
        reason: 'step_exited',
        sessionId: getSessionId(),
      });
    }
  };
}, [step, hasGenerated]);

// Track step completion when advancing
const advanceStep = (fromStep: Step, toStep: Step) => {
  const timeSpent = Date.now() - stepStartTime.current;
  
  capture('step_completed', {
    step: fromStep,
    nextStep: toStep,
    timeSpentSeconds: Math.round(timeSpent / 1000),
  });
  
  setStep(toStep);
};

// Track abandonment on unload
useEffect(() => {
  const handleBeforeUnload = () => {
    capture('step_abandoned', {
      step,
      timeSpentSeconds: Math.round((Date.now() - stepStartTime.current) / 1000),
      exitIntent: true,
    });
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [step]);

// ─────────────────────────────────────────────────────────────────────────────
// STYLE SELECTION TRACKING EXAMPLE
// ─────────────────────────────────────────────────────────────────────────────

// Hook for tracking style setting changes
function useStyleTracking() {
  const previousSettings = useRef<StyleSettingsSnapshot | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const trackSettingChange = useCallback((
    eventName: string, 
    newValue: unknown, 
    previousValue?: unknown,
    extraProps?: Record<string, unknown>
  ) => {
    capture(eventName, {
      newValue,
      previousValue,
      ...extraProps,
      sessionId: getSessionId(),
    });
    
    // Debounced snapshot save (every 5 seconds max)
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void saveSettingsSnapshot({
        settings: buildSettingsSnapshot(),
        reason: 'auto_save',
        previousSettings: previousSettings.current,
        sessionId: getSessionId(),
      });
      previousSettings.current = buildSettingsSnapshot();
    }, 5000);
  }, []);
  
  return { trackSettingChange };
}

// Usage in PortraitGenerator:
const { trackSettingChange } = useStyleTracking();

// Track style selection
const handleStyleSelect = (newStyle: StyleOption) => {
  const previousStyle = selectedStyle;
  setSelectedStyle(newStyle);
  
  trackSettingChange('style_selected', newStyle, previousStyle, {
    isQuickMode: !showAdvanced,
  });
};

// Track expression selection
const handleExpressionSelect = (newExpression: ExpressionPreset) => {
  const previousExpression = expressionPreset;
  setExpressionPreset(newExpression);
  
  trackSettingChange('expression_selected', newExpression, previousExpression);
};

// Track identity lock toggle
const toggleLock = (key: keyof IdentityLocks) => {
  const newLocks = { ...identityLocks, [key]: !identityLocks[key] };
  setIdentityLocks(newLocks);
  
  capture('identity_lock_toggled', {
    lock: key,
    enabled: newLocks[key],
    allLocks: newLocks,
  });
};

// Track likeness slider
const handleLikenessChange = (value: number) => {
  const previousValue = likenessStrength;
  setLikenessStrength(value);
  
  trackSettingChange('likeness_changed', value, previousValue);
};

// Track naturalness preset/slider
const setNaturalnessFromPreset = (preset: NaturalnessPreset) => {
  const previousPreset = naturalnessPreset;
  const newValue = NATURALNESS_MAP[preset];
  
  setNaturalnessPreset(preset);
  setNaturalness(newValue);
  
  trackSettingChange('naturalness_changed', { preset, value: newValue }, previousPreset);
};

// Build complete settings snapshot
function buildSettingsSnapshot(): StyleSettingsSnapshot {
  return {
    selectedStyle,
    expressionPreset,
    identityLocks,
    likenessStrength,
    naturalness,
    naturalnessPreset,
    removeBlemishes,
    numVariations,
    selectedPersonHint,
    customPersonDescription: selectedPersonHint === 'custom' ? customPersonDescription : undefined,
    isQuickMode: !showAdvanced,
    snapshotAt: Date.now(),
    sessionId: getSessionId(),
  };
}

// Save snapshot before generating
const handleGenerate = async () => {
  const snapshot = buildSettingsSnapshot();
  
  // Save final settings snapshot
  const snapshotId = await saveSettingsSnapshot({
    settings: snapshot,
    reason: 'generate_clicked',
    previousSettings: previousSettings.current,
    sessionId: getSessionId(),
  });
  
  capture('generation_initiated', {
    style: selectedStyle,
    numVariations,
    isQuickMode: !showAdvanced,
    settingsSnapshotId: snapshotId,
    settings: snapshot,
  });
  
  // ... rest of generation logic
};
```

### 6.3 Server-Side Event Endpoint
```typescript
// server/routes/events.ts (new file)
import { Router } from 'express';
import { adminFirestore } from '../lib/firestore.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

interface TrackEventBody {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

router.post('/track', async (req, res) => {
  const { event, properties, timestamp } = req.body as TrackEventBody;
  const userId = req.auth?.uid;
  const sessionId = req.auth?.sessionId || req.cookies?.pp_session;
  
  const eventDoc = {
    userId: userId || null,
    sessionId: sessionId || null,
    timestamp: FieldValue.serverTimestamp(),
    clientTimestamp: new Date(timestamp),
    eventType: categorizeEvent(event),
    eventName: event,
    properties: properties || {},
    date: new Date().toISOString().slice(0, 10),
  };
  
  // Write to events collection (fire-and-forget)
  adminFirestore()
    .collection('events')
    .add(eventDoc)
    .catch(console.error);
  
  // Update session aggregates
  if (sessionId) {
    updateSessionAggregates(sessionId, event, properties).catch(console.error);
  }
  
  res.json({ ok: true });
});

function categorizeEvent(event: string): string {
  if (event.startsWith('step_')) return 'step';
  if (event.startsWith('upload_')) return 'upload';
  if (event.startsWith('generation_')) return 'generation';
  if (event.startsWith('edit_')) return 'edit';
  if (event.startsWith('export_')) return 'export';
  if (event.startsWith('purchase_')) return 'purchase';
  return 'ui';
}

async function updateSessionAggregates(
  sessionId: string, 
  event: string, 
  properties?: Record<string, unknown>
) {
  const updates: Record<string, unknown> = {
    lastActiveAt: FieldValue.serverTimestamp(),
  };
  
  // Track counts by event type
  if (event === 'upload_completed') {
    updates.totalUploads = FieldValue.increment(1);
  } else if (event === 'generation_completed') {
    updates.totalGenerations = FieldValue.increment(1);
  } else if (event === 'edit_completed') {
    updates.totalEdits = FieldValue.increment(1);
  }
  
  await adminFirestore()
    .collection('anonymous_sessions')
    .doc(sessionId)
    .set(updates, { merge: true });
}

// POST /api/settings/snapshot - Save style settings snapshot
router.post('/settings/snapshot', async (req, res) => {
  const { settings, reason, previousSettings } = req.body as {
    settings: StyleSettingsSnapshot;
    reason: 'change' | 'generate' | 'abandoned' | 'auto_save' | 'step_exited';
    previousSettings?: StyleSettingsSnapshot;
  };
  
  const userId = req.auth?.uid;
  const sessionId = req.auth?.sessionId || req.cookies?.pp_session;
  
  const snapshotDoc = {
    userId: userId || null,
    sessionId: sessionId || null,
    settings,
    capturedAt: FieldValue.serverTimestamp(),
    step: 2,
    reason,
    previousSettings: previousSettings || null,
  };
  
  try {
    const docRef = await adminFirestore()
      .collection('settings_history')
      .add(snapshotDoc);
    
    res.json({ ok: true, snapshotId: docRef.id });
  } catch (err) {
    console.error('[settings/snapshot]', err);
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

// GET /api/settings/last - Get last settings for session (for recovery)
router.get('/settings/last', async (req, res) => {
  const userId = req.auth?.uid;
  const sessionId = req.auth?.sessionId || req.cookies?.pp_session;
  
  if (!userId && !sessionId) {
    res.status(400).json({ error: 'No user or session' });
    return;
  }
  
  try {
    let query = adminFirestore()
      .collection('settings_history')
      .where('reason', 'in', ['auto_save', 'generate_clicked'])
      .orderBy('capturedAt', 'desc')
      .limit(1);
    
    if (userId) {
      query = query.where('userId', '==', userId);
    } else {
      query = query.where('sessionId', '==', sessionId);
    }
    
    const snap = await query.get();
    
    if (snap.empty) {
      res.json({ found: false });
      return;
    }
    
    const doc = snap.docs[0];
    const data = doc.data();
    
    // Check if this was already generated (don't suggest completed sessions)
    const wasGenerated = data.reason === 'generate_clicked' || 
                        (data.generationResult?.succeeded);
    
    res.json({
      found: true,
      snapshotId: doc.id,
      settings: data.settings,
      capturedAt: data.capturedAt,
      wasGenerated,
    });
  } catch (err) {
    console.error('[settings/last]', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

export default router;
```

---

## 7. Privacy & Compliance

### 7.1 Data Retention
- **Events**: 90 days in Firestore, then export to BigQuery for long-term storage
- **Anonymous sessions**: 30 days if no conversion, indefinitely if converted
- **Session recordings** (PostHog): 30 days

### 7.2 PII Handling
- No PII in event properties for anonymous users
- Hash IP addresses before storage
- Respect cookie consent preferences
- Provide data export/deletion on request

### 7.3 GDPR Compliance
- `analytics.optOut()` on cookie decline
- Clear data retention policies
- User data export endpoint
- Right to erasure support

---

## 8. Key Metrics to Track

### 8.1 Funnel Metrics
| Metric | Calculation |
|--------|-------------|
| Upload → Generate Rate | `step_completed(step=2) / step_completed(step=1)` |
| Generate → Edit Rate | `edit_initiated / generation_completed` |
| Generate → Export Rate | `export_initiated / generation_completed` |
| Export Success Rate | `export_completed / export_initiated` |
| Time to First Generation | Time from first visit to generation_completed |
| Time to First Export | Time from first visit to export_completed |

### 8.2 Engagement Metrics
| Metric | Description |
|--------|-------------|
| Avg Session Duration | Total active time per session |
| Avg Time per Step | Breakdown by step |
| Return User Rate | Users with 2+ sessions |
| Edits per Generation | Average edits after generating |
| Variations per Generation | How many variations users choose |

### 8.3 Conversion Metrics
| Metric | Description |
|--------|-------------|
| Anonymous → Signup Rate | Sessions that convert to users |
| Free → Paid Rate | Users who purchase credits |
| Paywall Conversion | `purchase_completed / paywall_shown` |
| Revenue per User | Total spend / user count |

### 8.4 Style Selection Metrics (NEW)
| Metric | Description |
|--------|-------------|
| Avg Settings Config Time | Time from entering Step 2 to clicking Generate |
| Setting Change Frequency | Average number of changes before generating |
| Most Popular Style | Which style is selected most often |
| Quick vs Advanced Usage | % of users using each mode |
| Abandoned Settings | Settings snapshots where user never clicked Generate |
| Style → Generation Success | Which settings correlate with successful generations |
| Identity Lock Adoption | % of users who customize identity locks |
| Expression Preference by ICP | Which expressions different user types prefer |

---

## 10. Using Style Settings Data

### 10.1 Useful Analytics Queries

**Find abandoned settings (high intent, no generation):**
```javascript
// Get settings where user configured but never generated
db.collection('settings_history')
  .where('reason', '==', 'step_exited')
  .where('generationResult', '==', null)
  .where('capturedAt', '>', oneDayAgo)
  .get();
```

**Most popular style combinations:**
```javascript
// Aggregate style + expression usage
db.collection('settings_history')
  .where('reason', '==', 'generate_clicked')
  .get()
  .then(snap => {
    const combos = {};
    snap.docs.forEach(doc => {
      const s = doc.data().settings;
      const key = `${s.selectedStyle} + ${s.expressionPreset}`;
      combos[key] = (combos[key] || 0) + 1;
    });
    return combos; // { "editorial + confident": 45, "environmental + warm_smile": 32, ... }
  });
```

**Average time configuring before generating:**
```javascript
// Time from first settings snapshot to generation
// (requires joining with generation events)
```

**Settings that lead to successful generations vs failures:**
```javascript
// Compare settings snapshots that succeeded vs failed
db.collection('settings_history')
  .where('generationResult.succeeded', '==', true)
  .get(); // vs false
```

### 10.2 Pre-fill User Preferences
When a returning user starts a new session:
```typescript
// Load their most common settings from history
const lastSettings = await getMostCommonSettings(userId);
setSelectedStyle(lastSettings.selectedStyle);
setExpressionPreset(lastSettings.expressionPreset);
// ... etc
```

### 10.2 Smart Defaults for New Users
Based on aggregate data from similar users (by ICP/industry):
```typescript
// "Users in Tech industry prefer Environmental style 60% of the time"
const smartDefaults = await getRecommendedDefaults({
  icpSegment: 'creative_tech',
  industry: 'tech_saas'
});
```

### 10.3 Abandoned Settings Recovery
If user configured settings but didn't generate:
```typescript
// On next visit, show: "You had Portrait settings ready. Continue?"
const abandonedSettings = await getLastAbandonedSettings(sessionId);
if (abandonedSettings && !abandonedSettings.generationResult) {
  showContinuePreviousSessionModal(abandonedSettings);
}
```

### 10.4 A/B Testing Style Defaults
Track which default configurations lead to higher generation rates:
- Control: Editorial style, 70% likeness
- Variant A: Environmental style, 80% likeness
- Measure: Generation completion rate, time to generate

---

## 9. Next Steps

1. **Review this plan** - Provide feedback on priorities
2. **Set up BigQuery** (optional) - For long-term event storage
3. **Implement Phase 1** - Core funnel tracking
4. **Validate data quality** - Check events are firing correctly
5. **Build dashboard** - Visualize the funnel

---

## Questions to Consider

1. Do you want real-time analytics or is daily aggregation sufficient?
2. Should we integrate with a dedicated analytics platform (Mixpanel, Amplitude) or keep everything in Firestore?
3. What level of detail for the admin dashboard? (Basic numbers vs full funnel visualization)
4. Any specific metrics you're most interested in right now?
