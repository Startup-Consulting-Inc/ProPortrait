import { randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from './firebase.js';

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

// Reads credits from Firestore — works across all Cloud Run instances
export async function getSessionCredits(id: string): Promise<{ hdCredits: number; platformCredits: number }> {
  try {
    const doc = await adminFirestore().collection('anonymous_credits').doc(id).get();
    if (!doc.exists) return { hdCredits: 0, platformCredits: 0 };
    const d = doc.data()!;
    return { hdCredits: d.hdCredits ?? 0, platformCredits: d.platformCredits ?? 0 };
  } catch {
    // Firestore unavailable — fall back to in-memory
    const session = sessions.get(id);
    return { hdCredits: session?.hdCredits ?? 0, platformCredits: session?.platformCredits ?? 0 };
  }
}

// Writes to both in-memory (fast path) and Firestore (cross-instance durable)
export async function addSessionCredits(id: string, hdDelta: number, platformDelta: number): Promise<void> {
  // Update in-memory for fast path on same instance
  const session = sessions.get(id);
  if (session) {
    session.hdCredits += hdDelta;
    session.platformCredits += platformDelta;
  }
  // Persist to Firestore so all Cloud Run instances see the update
  try {
    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (hdDelta !== 0) update.hdCredits = FieldValue.increment(hdDelta);
    if (platformDelta !== 0) update.platformCredits = FieldValue.increment(platformDelta);
    await adminFirestore().collection('anonymous_credits').doc(id).set(update, { merge: true });
  } catch (err) {
    console.error('[session] Firestore addSessionCredits failed:', err);
  }
}

// Atomically consumes one credit via Firestore transaction
export async function consumeSessionCredit(id: string, type: 'hd' | 'platform'): Promise<boolean> {
  const field = type === 'hd' ? 'hdCredits' : 'platformCredits';
  const ref = adminFirestore().collection('anonymous_credits').doc(id);

  try {
    const result = await adminFirestore().runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const current = doc.exists ? ((doc.data()![field] as number) ?? 0) : 0;
      if (current <= 0) return false;
      tx.update(ref, { [field]: FieldValue.increment(-1), updatedAt: FieldValue.serverTimestamp() });
      return true;
    });
    // Also update in-memory to keep it in sync
    if (result) {
      const session = sessions.get(id);
      if (session) {
        if (type === 'hd') session.hdCredits = Math.max(0, session.hdCredits - 1);
        else session.platformCredits = Math.max(0, session.platformCredits - 1);
      }
    }
    return result;
  } catch (err) {
    console.error('[session] Firestore consumeSessionCredit failed:', err);
    // Fall back to in-memory
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
}

export const SESSION_COOKIE = 'pp_session';
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};
