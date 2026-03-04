import { posthog } from '../services/analytics';

/**
 * Read a PostHog feature flag value with a typed fallback.
 * Returns `defaultValue` when PostHog is not initialized or the flag is unset.
 */
export function useFeatureFlag<T>(flag: string, defaultValue: T): T {
  try {
    const val = posthog.getFeatureFlag(flag);
    return (val as T) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}
