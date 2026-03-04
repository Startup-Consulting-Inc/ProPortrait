import { Router, Request, Response } from 'express';
import { getOrCreateSession, SESSION_COOKIE, COOKIE_OPTIONS } from '../lib/session.js';

const router = Router();

router.get('/me', (req: Request, res: Response) => {
  const cookieId = req.cookies?.[SESSION_COOKIE];
  const [sessionId, session] = getOrCreateSession(cookieId);

  // Refresh cookie if new session was created
  if (!cookieId || cookieId !== sessionId) {
    res.cookie(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
  }

  res.json({ isPro: session.isPro, sessionId });
});

export default router;
