import { getIdToken } from './auth';
import type { UserProfile } from './user';
import type { OnboardingData, PortraitDefaults } from '../types/onboarding';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export interface OnboardingResponse {
  ok: boolean;
  defaults: PortraitDefaults;
}

export async function saveOnboarding(data: OnboardingData): Promise<PortraitDefaults> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}/api/users/me/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Failed to save onboarding: ${response.status}`);
  }

  const result = (await response.json()) as OnboardingResponse;
  return result.defaults;
}

// Check if user needs onboarding (called when app loads)
export function shouldShowOnboarding(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  // Show onboarding if user hasn't completed it
  return !profile.onboardingCompletedAt;
}
