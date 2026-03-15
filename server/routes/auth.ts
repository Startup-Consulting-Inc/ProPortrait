import { Router, Request, Response } from 'express';
import { getSessionCredits } from '../lib/session.js';

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

export default router;
