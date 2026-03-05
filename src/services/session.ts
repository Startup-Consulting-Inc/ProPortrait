import { getIdToken } from './auth';

interface SessionInfo {
  isPro: boolean;
  sessionId: string;
  uid?: string;
  email?: string;
  isAdmin?: boolean;
  isFirebaseUser?: boolean;
}

let cached: SessionInfo | null = null;

export async function getSessionInfo(): Promise<SessionInfo> {
  if (cached) return cached;
  try {
    const token = await getIdToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/auth/me', { headers, credentials: 'include' });
    if (!res.ok) throw new Error('auth failed');
    cached = await res.json() as SessionInfo;
    return cached;
  } catch {
    return { isPro: false, sessionId: '' };
  }
}

export function invalidateSession() {
  cached = null;
}
