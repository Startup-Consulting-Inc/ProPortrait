import { randomUUID } from 'crypto';

interface SessionData {
  isPro: boolean;
  stripeCustomerId?: string;
  createdAt: number;
}

const sessions = new Map<string, SessionData>();

export function getOrCreateSession(id?: string): [string, SessionData] {
  if (id && sessions.has(id)) return [id, sessions.get(id)!];
  const newId = randomUUID();
  const data: SessionData = { isPro: false, createdAt: Date.now() };
  sessions.set(newId, data);
  return [newId, data];
}

export function getSession(id: string): SessionData | undefined {
  return sessions.get(id);
}

export function setProStatus(id: string, isPro: boolean, stripeCustomerId?: string) {
  const session = sessions.get(id);
  if (session) {
    session.isPro = isPro;
    if (stripeCustomerId) session.stripeCustomerId = stripeCustomerId;
  }
}

export const SESSION_COOKIE = 'pp_session';
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};
