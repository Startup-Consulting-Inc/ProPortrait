import type { Request, Response, NextFunction } from 'express';
import { adminAuth, adminFirestore } from '../lib/firebase.js';
import { getOrCreateSession, SESSION_COOKIE, COOKIE_OPTIONS } from '../lib/session.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7);
    try {
      const decoded = await adminAuth().verifyIdToken(idToken);
      const uid = decoded.uid;
      const email = decoded.email ?? '';

      // Fetch user profile from Firestore
      const snap = await adminFirestore().collection('users').doc(uid).get();
      const doc = snap.exists ? (snap.data() as { isPro?: boolean; isAdmin?: boolean }) : {};

      req.auth = {
        mode: 'firebase',
        uid,
        email,
        isPro: doc.isPro ?? false,
        isAdmin: doc.isAdmin ?? false,
      };
      next();
      return;
    } catch {
      // Invalid token — fall through to anonymous
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
