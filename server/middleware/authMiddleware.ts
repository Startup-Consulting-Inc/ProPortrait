import type { Request, Response, NextFunction } from 'express';
import { adminAuth, adminFirestore } from '../lib/firebase.js';
import { getOrCreateSession, SESSION_COOKIE, COOKIE_OPTIONS } from '../lib/session.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7);
    let uid: string | null = null;
    let email = '';

    try {
      const decoded = await adminAuth().verifyIdToken(idToken);
      uid = decoded.uid;
      email = decoded.email ?? '';
    } catch {
      // Invalid token — fall through to anonymous
    }

    if (uid) {
      // Token is valid — fetch Firestore profile (best-effort, never blocks auth)
      let isPro = false;
      let isAdmin = false;
      let tier: 'free' | 'creator' | 'pro' | 'max' = 'free';
      try {
        const snap = await adminFirestore().collection('users').doc(uid).get();
        const doc = snap.exists ? (snap.data() as { isPro?: boolean; isAdmin?: boolean; tier?: string }) : {};
        // Derive tier: explicit field takes precedence, fall back from isPro
        const rawTier = doc.tier as string | undefined;
        tier = (rawTier === 'creator' || rawTier === 'pro' || rawTier === 'max')
          ? rawTier
          : (doc.isPro ? 'pro' : 'free');
        isPro = tier !== 'free';
        isAdmin = doc.isAdmin ?? false;
      } catch {
        // Firestore unavailable — continue with defaults
      }

      req.auth = { mode: 'firebase', uid, email, isPro, isAdmin, tier };
      next();
      return;
    }
  }

  // Anonymous session fallback
  const cookieId = req.cookies?.[SESSION_COOKIE];
  const [sessionId, session] = getOrCreateSession(cookieId);
  if (!cookieId || cookieId !== sessionId) {
    res.cookie(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
  }

  req.auth = {
    mode: 'anonymous',
    sessionId,
    isPro: session.isPro,
    isAdmin: false,
    tier: session.isPro ? 'pro' : 'free',
  };
  next();
}

export function requireFirebaseAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.auth.mode !== 'firebase') {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.auth.mode !== 'firebase' || !req.auth.isAdmin) {
    res.status(403).json({ error: 'Forbidden.' });
    return;
  }
  next();
}
