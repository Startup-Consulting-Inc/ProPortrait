import { randomUUID } from 'crypto';

interface SessionData {
  isPro: boolean;
  stripeCustomerId?: string;
  hdCredits: number;
  platformCredits: number;
  createdAt: number;
}

const sessions = new Map<string, SessionData>();

export function getOrCreateSession(id?: string): [string, SessionData] {
  if (id && sessions.has(id)) return [id, sessions.get(id)!];
  const newId = randomUUID();
  const data: SessionData = { isPro: false, hdCredits: 0, platformCredits: 0, createdAt: Date.now() };
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

export function addSessionCredits(id: string, hdDelta: number, platformDelta: number) {
  const session = sessions.get(id);
  if (session) {
    session.hdCredits += hdDelta;
    session.platformCredits += platformDelta;
  }
}

export function consumeSessionCredit(id: string, type: 'hd' | 'platform'): boolean {
  const session = sessions.get(id);
  if (!session) return false;
  if (type === 'hd') {
    if (session.hdCredits <= 0) return false;
    session.hdCredits--;
    return true;
  }
  if (session.platformCredits <= 0) return false;
  session.platformCredits--;
  return true;
}

export const SESSION_COOKIE = 'pp_session';
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};
