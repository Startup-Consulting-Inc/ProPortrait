import { Router, Request, Response } from 'express';
import { adminFirestore } from '../lib/firebase.js';
import { upsertUserDoc, getDailyStats } from '../lib/firestore.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// firebase-admin v13 serializes Timestamps as { _seconds, _nanoseconds } (underscore prefix).
// This helper normalises all variants to a plain { seconds: number } object.
function toSecs(ts: unknown): { seconds: number } | null {
  if (!ts || typeof ts !== 'object') return null;
  const t = ts as Record<string, unknown>;
  const s = typeof t._seconds === 'number' ? t._seconds
          : typeof t.seconds  === 'number' ? t.seconds
          : null;
  return s !== null ? { seconds: s } : null;
}

// GET /api/admin/users — list users (50/page)
router.get('/users', requireAdmin, async (_req: Request, res: Response) => {
  try {
    // Avoid orderBy('createdAt') — Firestore excludes docs missing that field
    const snap = await adminFirestore()
      .collection('users')
      .limit(50)
      .get();

    const users = snap.docs.map((doc) => {
      const d = doc.data();
      const styleUsage = (d.styleUsage ?? {}) as Record<string, number>;
      const topStyle = Object.entries(styleUsage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        uid:             doc.id,
        email:           d.email ?? '',
        displayName:     d.displayName ?? '',
        isPro:           d.isPro ?? false,
        tier:            (d.tier ?? (d.isPro ? 'pro' : 'free')) as string,
        isAdmin:         d.isAdmin ?? false,
        generationCount: d.generationCount ?? 0,
        editCount:       d.editCount ?? 0,
        exportCount:     d.exportCount ?? 0,
        loginCount:      d.loginCount ?? 0,
        totalCostUsd:    d.totalCostUsd ?? 0,
        styleUsage,
        topStyle,
        createdAt:       toSecs(d.createdAt),
        lastActiveAt:    toSecs(d.lastActiveAt),
        lastLoginAt:     toSecs(d.lastLoginAt),
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
  const { isPro, tier } = req.body as { isPro: boolean; tier?: string };
  try {
    const update: Record<string, unknown> = { isPro: Boolean(isPro) };
    if (isPro && tier) update.tier = tier;
    else if (!isPro) update.tier = 'free';
    await upsertUserDoc(uid, update);
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/users/pro]', err);
    res.status(500).json({ error: 'Failed to update pro status.' });
  }
});

export default router;
