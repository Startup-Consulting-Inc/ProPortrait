import { Router, Request, Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminFirestore } from '../lib/firebase.js';
import { getUserDoc, upsertUserDoc, trackLogin } from '../lib/firestore.js';
import { requireFirebaseAuth } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/users/me/first-login — seed Firestore doc on first Firebase sign-in
router.post('/me/first-login', requireFirebaseAuth, async (req: Request, res: Response) => {
  const { uid, email } = req.auth;
  if (!uid || !email) {
    res.status(400).json({ error: 'Invalid auth state.' });
    return;
  }

  const existing = await getUserDoc(uid);
  const isAdmin = email === 'jsong@koreatous.com';

  if (!existing) {
    const { displayName, photoURL } = req.body as { displayName?: string; photoURL?: string };
    await adminFirestore().collection('users').doc(uid).set({
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: photoURL || null,
      isPro: false,
      isAdmin,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    // Backfill any fields that may be missing from docs created before schema was finalised
    const patch: Record<string, unknown> = {};
    if (!existing.email) patch.email = email;
    if (existing.isPro === undefined) patch.isPro = false;
    if (isAdmin && !existing.isAdmin) patch.isAdmin = true;
    if (Object.keys(patch).length > 0) await upsertUserDoc(uid, patch as Partial<import('../lib/firestore.js').UserDoc>);
  }

  void trackLogin(uid);
  const doc = await getUserDoc(uid);
  res.json({ doc });
});

// GET /api/users/me — return full UserDoc
router.get('/me', requireFirebaseAuth, async (req: Request, res: Response) => {
  const doc = await getUserDoc(req.auth.uid!);
  if (!doc) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.json({ doc });
});

// PATCH /api/users/me — update profile & preferences
router.patch('/me', requireFirebaseAuth, async (req: Request, res: Response) => {
  const uid = req.auth.uid!;
  const {
    displayName,
    photoURL,
    defaultStyle,
    defaultExpression,
    defaultIdentityLocks,
    defaultLikeness,
    defaultNaturalness,
  } = req.body;

  const update: Partial<import('../lib/firestore.js').UserDoc> = {};
  if (displayName !== undefined) update.displayName = String(displayName).slice(0, 100);
  if (photoURL !== undefined) update.photoURL = photoURL ? String(photoURL).slice(0, 1000) : undefined;
  if (defaultStyle !== undefined) update.defaultStyle = defaultStyle;
  if (defaultExpression !== undefined) update.defaultExpression = defaultExpression;
  if (defaultIdentityLocks !== undefined) update.defaultIdentityLocks = defaultIdentityLocks;
  if (defaultLikeness !== undefined) update.defaultLikeness = Number(defaultLikeness);
  if (defaultNaturalness !== undefined) update.defaultNaturalness = Number(defaultNaturalness);

  await upsertUserDoc(uid, update);
  const doc = await getUserDoc(uid);
  res.json({ doc });
});

// DELETE /api/users/me — delete Firestore doc + Firebase Auth user
router.delete('/me', requireFirebaseAuth, async (req: Request, res: Response) => {
  const uid = req.auth.uid!;
  try {
    await adminFirestore().collection('users').doc(uid).delete();
    await adminAuth().deleteUser(uid);
    res.json({ ok: true });
  } catch (err) {
    console.error('[users/delete]', err);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

export default router;
