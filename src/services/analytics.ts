import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return;

  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    session_recording: { maskAllInputs: true },
    advanced_disable_feature_flags: true,
  });

  // Respect prior cookie consent choice
  const consent = localStorage.getItem('pp_cookie_consent');
  if (consent === 'declined') posthog.opt_out_capturing();

  initialized = true;
}

export function capture(event: string, props?: Record<string, unknown>) {
  if (initialized) posthog.capture(event, props);
}

export function optOut() {
  if (initialized) posthog.opt_out_capturing();
}

export function optIn() {
  if (initialized) posthog.opt_in_capturing();
}

export { posthog };
