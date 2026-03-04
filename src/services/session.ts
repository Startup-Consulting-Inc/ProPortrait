interface SessionInfo {
  isPro: boolean;
  sessionId: string;
}

let cached: SessionInfo | null = null;

export async function getSessionInfo(): Promise<SessionInfo> {
  if (cached) return cached;
  try {
    const res = await fetch('/api/auth/me');
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
