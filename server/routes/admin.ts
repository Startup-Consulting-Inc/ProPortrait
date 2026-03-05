import { Router, Request, Response } from 'express';
import { adminFirestore } from '../lib/firebase.js';
import { upsertUserDoc } from '../lib/firestore.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/admin/users — list users (50/page, newest first)
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const snap = await adminFirestore()
      .collection('users')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const users = snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
    res.json({ users });
  } catch (err) {
    console.error('[admin/users]', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
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
