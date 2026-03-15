import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/auth/me — reads from req.auth (populated by authMiddleware)
router.get('/me', (req: Request, res: Response) => {
  const { isPro, uid, email, isAdmin, sessionId, mode, hdCredits, platformCredits } = req.auth;
  res.json({
    isPro,
    sessionId,
    uid,
    email,
    isAdmin,
    isFirebaseUser: mode === 'firebase',
    hdCredits: hdCredits ?? 0,
    platformCredits: platformCredits ?? 0,
  });
});

export default router;
