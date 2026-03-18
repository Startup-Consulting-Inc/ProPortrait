import { Router, Request, Response } from 'express';
import { getSessionCredits } from '../lib/session.js';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '../lib/firebase.js';

const router = Router();

// GET /api/auth/me — reads from req.auth (populated by authMiddleware)
router.get('/me', async (req: Request, res: Response) => {
  const { uid, email, isAdmin, sessionId, mode } = req.auth;
  let hdCredits = req.auth.hdCredits ?? 0;
  let platformCredits = req.auth.platformCredits ?? 0;

  // For anonymous users, read credits from Firestore (cross-instance durable storage)
  // req.auth credits come from in-memory session which may be stale on a different instance
  if (mode === 'anonymous' && sessionId) {
    try {
      const credits = await getSessionCredits(sessionId);
      hdCredits = credits.hdCredits;
      platformCredits = credits.platformCredits;
    } catch {
      // keep in-memory fallback values
    }
  }

  res.json({
    sessionId,
    uid,
    email,
    isAdmin,
    isFirebaseUser: mode === 'firebase',
    hdCredits,
    platformCredits,
  });
});

// POST /api/auth/link-session — link an anonymous session to a registered user on sign-in
router.post('/link-session', async (req: Request, res: Response) => {
  const sessionId = (req.cookies as Record<string, string>)?.pp_session;
  const uid = req.auth?.uid;
  if (!uid || !sessionId) {
    res.json({ ok: false });
    return;
  }
  try {
    await adminFirestore().collection('anonymous_sessions').doc(sessionId).set(
      { convertedToUser: true, convertedUserId: uid, convertedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
});

export default router;
