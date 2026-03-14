import { Router, Request, Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminAuth } from '../lib/firebase.js';
import { upsertUserDoc, getDailyStats, getUserDoc, addDownloadCredits } from '../lib/firestore.js';
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

// Helper to serialize user data for admin responses
function serializeUser(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  const d = doc.data();
  if (!d) return null;
  
  const styleUsage = (d.styleUsage ?? {}) as Record<string, number>;
  const topStyle = Object.entries(styleUsage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  
  return {
    uid: doc.id,
    email: d.email ?? '',
    displayName: d.displayName ?? '',
    photoURL: d.photoURL ?? '',
    isPro: d.isPro ?? false,
    tier: (d.tier ?? (d.isPro ? 'pro' : 'free')) as string,
    isAdmin: d.isAdmin ?? false,
    isSuspended: d.isSuspended ?? false,
    stripeCustomerId: d.stripeCustomerId ?? '',
    // Usage stats
    generationCount: d.generationCount ?? 0,
    generationsThisMonth: d.generationsThisMonth ?? 0,
    editCount: d.editCount ?? 0,
    exportCount: d.exportCount ?? 0,
    saveCount: d.saveCount ?? 0,
    downloadCredits: d.downloadCredits ?? 0,
    loginCount: d.loginCount ?? 0,
    totalCostUsd: d.totalCostUsd ?? 0,
    // Preferences
    defaultStyle: d.defaultStyle ?? '',
    defaultExpression: d.defaultExpression ?? '',
    // Onboarding
    icpSegment: d.icpSegment ?? '',
    industry: d.industry ?? '',
    vibePreference: d.vibePreference ?? '',
    primaryUseCases: d.primaryUseCases ?? [],
    onboardingCompletedAt: toSecs(d.onboardingCompletedAt),
    // Activity
    styleUsage,
    topStyle,
    lastActiveAt: toSecs(d.lastActiveAt),
    lastLoginAt: toSecs(d.lastLoginAt),
    createdAt: toSecs(d.createdAt),
    updatedAt: toSecs(d.updatedAt),
  };
}

// GET /api/admin/users — list users (50/page)
router.get('/users', requireAdmin, async (_req: Request, res: Response) => {
  try {
    // Avoid orderBy('createdAt') — Firestore excludes docs missing that field
    const snap = await adminFirestore()
      .collection('users')
      .limit(50)
      .get();

    const users = snap.docs.map(serializeUser).filter(Boolean);
    res.json({ users });
  } catch (err) {
    console.error('[admin/users]', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// GET /api/admin/users/:uid — get detailed user info
router.get('/users/:uid', requireAdmin, async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const doc = await adminFirestore().collection('users').doc(uid).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const user = serializeUser(doc);
    
    // Get recent generations from saved portraits
    const portraitsSnap = await adminFirestore()
      .collection('users')
      .doc(uid)
      .collection('savedPortraits')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    const recentGenerations = portraitsSnap.docs.map(d => ({
      id: d.id,
      title: d.data().title ?? '',
      style: d.data().style ?? '',
      createdAt: toSecs(d.data().createdAt),
    }));

    res.json({ user, recentGenerations });
  } catch (err) {
    console.error('[admin/users/:uid]', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// DELETE /api/admin/users/:uid — delete user completely
router.delete('/users/:uid', requireAdmin, async (req: Request, res: Response) => {
  const { uid } = req.params;
  const { deleteAuth = true } = req.query;
  
  try {
    // Get user data first for logging
    const userDoc = await getUserDoc(uid);
    
    // Delete all saved portraits subcollection
    const portraitsSnap = await adminFirestore()
      .collection('users')
      .doc(uid)
      .collection('savedPortraits')
      .get();
    
    const batch = adminFirestore().batch();
    portraitsSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Delete Firestore user document
    await adminFirestore().collection('users').doc(uid).delete();

    // Delete Firebase Auth user (optional, for data privacy compliance)
    if (deleteAuth !== 'false') {
      try {
        await adminAuth().deleteUser(uid);
      } catch (authErr) {
        // User might not exist in Auth (edge case), log but continue
        console.warn('[admin/users/delete] Auth delete failed:', authErr);
      }
    }

    console.log(`[admin] User deleted by ${req.auth.email}: ${userDoc?.email ?? uid}`);
    res.json({ ok: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('[admin/users/delete]', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// POST /api/admin/users/:uid/suspend — suspend/unsuspend user
router.post('/users/:uid/suspend', requireAdmin, async (req: Request, res: Response) => {
  const { uid } = req.params;
  const { suspended = true, reason = '' } = req.body as { suspended?: boolean; reason?: string };
  
  try {
    const update: Record<string, unknown> = {
      isSuspended: Boolean(suspended),
      suspensionReason: reason,
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (suspended) {
      update.suspendedAt = FieldValue.serverTimestamp();
    } else {
      update.suspendedAt = null;
    }
    
    await upsertUserDoc(uid, update);

    console.log(`[admin] User ${suspended ? 'suspended' : 'unsuspended'} by ${req.auth.email}: ${uid}`);
    res.json({ ok: true, suspended: Boolean(suspended) });
  } catch (err) {
    console.error('[admin/users/suspend]', err);
    res.status(500).json({ error: 'Failed to update suspension status.' });
  }
});

// PATCH /api/admin/users/:uid/subscription — manage subscription
router.patch('/users/:uid/subscription', requireAdmin, async (req: Request, res: Response) => {
  const { uid } = req.params;
  const {
    tier,
    isPro,
    expiresAt,
    stripeCustomerId,
    note,
    downloadCredits: creditsOverride,
  } = req.body as {
    tier?: string;
    isPro?: boolean;
    expiresAt?: string;
    stripeCustomerId?: string;
    note?: string;
    downloadCredits?: number;
  };

  try {
    const update: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (tier !== undefined) {
      update.tier = tier;
      update.isPro = tier !== 'free';
    } else if (isPro !== undefined) {
      update.isPro = Boolean(isPro);
      if (!isPro) update.tier = 'free';
    }

    if (expiresAt !== undefined) {
      update.subscriptionExpiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    if (stripeCustomerId !== undefined) {
      update.stripeCustomerId = stripeCustomerId;
    }

    if (note) {
      update.adminNote = note;
    }

    await upsertUserDoc(uid, update);

    // Grant download credits: explicit override, or 1 credit when activating a paid tier
    const creditsToAdd = creditsOverride !== undefined
      ? creditsOverride
      : (tier && tier !== 'free' ? 1 : 0);
    if (creditsToAdd > 0) {
      await addDownloadCredits(uid, creditsToAdd);
    }

    console.log(`[admin] Subscription updated by ${req.auth.email}: ${uid}`, { tier, isPro, creditsToAdd });
    res.json({ ok: true, update });
  } catch (err) {
    console.error('[admin/users/subscription]', err);
    res.status(500).json({ error: 'Failed to update subscription.' });
  }
});

// PATCH /api/admin/users/:uid — update user profile (admin edit)
router.patch('/users/:uid', requireAdmin, async (req: Request, res: Response) => {
  const { uid } = req.params;
  const { 
    displayName, 
    isAdmin,
    defaultStyle,
    defaultExpression,
  } = req.body as { 
    displayName?: string;
    isAdmin?: boolean;
    defaultStyle?: string;
    defaultExpression?: string;
  };
  
  try {
    const update: Record<string, unknown> = {};
    
    if (displayName !== undefined) update.displayName = String(displayName).slice(0, 100);
    if (isAdmin !== undefined) update.isAdmin = Boolean(isAdmin);
    if (defaultStyle !== undefined) update.defaultStyle = defaultStyle;
    if (defaultExpression !== undefined) update.defaultExpression = defaultExpression;

    await upsertUserDoc(uid, update);
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/users/patch]', err);
    res.status(500).json({ error: 'Failed to update user.' });
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

// POST /api/admin/users/:uid/pro — toggle isPro for a user (legacy, use PATCH /subscription)
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
