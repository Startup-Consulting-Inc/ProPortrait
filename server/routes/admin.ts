import { Router, Request, Response } from 'express';
import { adminFirestore } from '../lib/firebase.js';
import { upsertUserDoc, getDailyStats } from '../lib/firestore.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/admin/users — list users (50/page, newest first)
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    // orderBy('createdAt') excludes docs missing that field — use a plain get instead
    const snap = await adminFirestore()
      .collection('users')
      .limit(50)
      .get();

    const users = snap.docs.map((doc) => {
      const data = doc.data();
      // Derive top style from styleUsage map
      const styleUsage = (data.styleUsage ?? {}) as Record<string, number>;
      const topStyle = Object.entries(styleUsage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        uid: doc.id,
        ...data,
        topStyle,
      };
    });
    res.json({ users });
  } catch (err) {
    console.error('[admin/users]', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// GET /api/admin/stats — last 30 days of daily stats
router.get('/stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const stats = await getDailyStats(30);
    res.json({ stats });
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// POST /api/admin/users/:uid/pro — toggle isPro for a user
router.post('/users/:uid/pro', requireAdmin, async (req: Request, res: Response) => {
  const { uid } = req.params;
  const { isPro } = req.body as { isPro: boolean };
  try {
    await upsertUserDoc(uid, { isPro: Boolean(isPro) });
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/users/pro]', err);
    res.status(500).json({ error: 'Failed to update pro status.' });
  }
});

export default router;
