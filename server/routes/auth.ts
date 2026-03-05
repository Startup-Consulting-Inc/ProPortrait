import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/auth/me — reads from req.auth (populated by authMiddleware)
router.get('/me', (req: Request, res: Response) => {
  const { isPro, uid, email, isAdmin, sessionId, mode } = req.auth;
  res.json({
    isPro,
    sessionId,
    uid,
    email,
    isAdmin,
    isFirebaseUser: mode === 'firebase',
  });
});

export default router;
