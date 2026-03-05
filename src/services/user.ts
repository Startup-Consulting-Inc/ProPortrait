import { getIdToken } from './auth';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export interface UserProfile {
  email: string;
  displayName: string;
  photoURL?: string;
  isPro: boolean;
  isAdmin: boolean;
  stripeCustomerId?: string;
  defaultStyle?: string;
  defaultExpression?: string;
  defaultIdentityLocks?: {
    eyeColor: boolean;
    skinTone: boolean;
    hairLength: boolean;
    hairTexture: boolean;
    glasses: boolean;
  };
  defaultLikeness?: number;
  defaultNaturalness?: number;
}

export async function notifyFirstLogin(displayName?: string, photoURL?: string): Promise<void> {
  const headers = await authHeaders();
  if (!headers.Authorization) return;
  await fetch(`${API_BASE}/api/users/me/first-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ displayName, photoURL }),
    credentials: 'include',
  });
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/users/me`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  const data = await res.json();
  return data.doc as UserProfile;
}

export async function updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to update profile');
  const result = await res.json();
  return result.doc as UserProfile;
}

export async function deleteUserAccount(): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/users/me`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete account');
}

export async function openBillingPortal(): Promise<string> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/payments/portal`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to open billing portal');
  const data = await res.json();
  return data.url as string;
}
