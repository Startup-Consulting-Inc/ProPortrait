import posthog from 'posthog-js';

let initialized = false;
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

// Per-step entry timestamps for duration tracking
const stepEnteredAt: Record<number, number> = {};
const STEP_NAMES: Record<number, string> = {
  1: 'upload',
  2: 'generate',
  3: 'review_edit',
  4: 'export',
};

function getSessionId(): string {
  const match = document.cookie.match(/pp_session=([^;]+)/);
  return match?.[1] ?? '';
}

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return;

  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://eu.i.posthog.com',
    person_profiles: 'always', // Track anonymous visitors too; merges on identify()
    capture_pageview: true,
    session_recording: { maskAllInputs: true },
    advanced_disable_feature_flags: true,
  });

  // Super-property: every event carries the server session cookie ID
  const sid = getSessionId();
  if (sid) posthog.register({ session_id: sid });

  const consent = localStorage.getItem('pp_cookie_consent');
  if (consent === 'declined') posthog.opt_out_capturing();

  initialized = true;
}

/** Fire-and-forget POST to the server event log (works for both authed + anonymous) */
function trackServerSide(event: string, props?: Record<string, unknown>) {
  void fetch(`${API_BASE}/api/events/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, properties: props ?? {}, timestamp: Date.now() }),
    credentials: 'include',
  }).catch(() => {});
}

export function capture(event: string, props?: Record<string, unknown>) {
  if (initialized) posthog.capture(event, props);
  trackServerSide(event, props);
}

// ── Step tracking helpers ─────────────────────────────────────────────────────

export function captureStepEntered(step: number, fromStep?: number) {
  stepEnteredAt[step] = Date.now();
  capture('step_viewed', {
    step,
    stepName: STEP_NAMES[step],
    fromStep,
    fromStepName: fromStep != null ? STEP_NAMES[fromStep] : undefined,
  });
}

export function captureStepCompleted(step: number, nextStep?: number) {
  const durationMs = stepEnteredAt[step] != null ? Date.now() - stepEnteredAt[step] : undefined;
  capture('step_completed', {
    step,
    stepName: STEP_NAMES[step],
    nextStep,
    nextStepName: nextStep != null ? STEP_NAMES[nextStep] : undefined,
    durationMs,
  });
}

export function captureStepAbandoned(step: number) {
  const durationMs = stepEnteredAt[step] != null ? Date.now() - stepEnteredAt[step] : undefined;
  capture('step_abandoned', {
    step,
    stepName: STEP_NAMES[step],
    durationMs,
    exitIntent: true,
  });
}

// ── Settings snapshot ─────────────────────────────────────────────────────────

export function saveSettingsSnapshot(
  settings: Record<string, unknown>,
  reason: 'auto_save' | 'generate' | 'step_exited',
  previousSettings?: Record<string, unknown>,
): void {
  void fetch(`${API_BASE}/api/settings/snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings, reason, previousSettings }),
    credentials: 'include',
  }).catch(() => {});
}

// ── Consent ───────────────────────────────────────────────────────────────────

export function optOut() {
  if (initialized) posthog.opt_out_capturing();
}

export function optIn() {
  if (initialized) posthog.opt_in_capturing();
}

export { posthog };
