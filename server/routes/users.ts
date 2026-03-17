import { Router, Request, Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminFirestore } from '../lib/firebase.js';
import { getUserDoc, upsertUserDoc, trackLogin, saveOnboardingData, submitBetaFeedback, type OnboardingData, type FeedbackSubmission } from '../lib/firestore.js';
import { consumeSessionCredit, getSessionCredits } from '../lib/session.js';
import { requireFirebaseAuth } from '../middleware/authMiddleware.js';


const router = Router();

// Beta configuration — disabled for public launch
const BETA_ACTIVE = process.env.BETA_ACTIVE === 'true'; // default false

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

    // Beta users get free download credits
    const isBetaUser = BETA_ACTIVE;

    await adminFirestore().collection('users').doc(uid).set({
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: photoURL || null,
      hdCredits: isBetaUser ? 3 : 0, // Beta users get 3 free HD downloads
      isAdmin,
      // Beta tracking
      joinedDuringBeta: isBetaUser,
      betaJoinedAt: isBetaUser ? FieldValue.serverTimestamp() : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    // Backfill any fields that may be missing from docs created before schema was finalised
    const patch: Record<string, unknown> = {};
    if (!existing.email) patch.email = email;
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

// POST /api/users/me/onboarding — save onboarding data and generate defaults
router.post('/me/onboarding', requireFirebaseAuth, async (req: Request, res: Response) => {
  const uid = req.auth.uid!;
  const { icpSegment, industry, vibePreference, primaryUseCases } = req.body as Partial<OnboardingData>;

  // Validate required fields
  if (!icpSegment || !industry || !vibePreference) {
    res.status(400).json({ error: 'Missing required onboarding fields: icpSegment, industry, vibePreference' });
    return;
  }

  // Validate icpSegment
  const validSegments = ['career', 'executive', 'creative_tech', 'service', 'artist'];
  if (!validSegments.includes(icpSegment)) {
    res.status(400).json({ error: `Invalid icpSegment. Must be one of: ${validSegments.join(', ')}` });
    return;
  }

  // Validate vibePreference
  const validVibes = ['polished', 'warm', 'bold', 'creative'];
  if (!validVibes.includes(vibePreference)) {
    res.status(400).json({ error: `Invalid vibePreference. Must be one of: ${validVibes.join(', ')}` });
    return;
  }

  try {
    const onboardingData: OnboardingData = {
      icpSegment: icpSegment as OnboardingData['icpSegment'],
      industry: String(industry).slice(0, 100),
      vibePreference: vibePreference as OnboardingData['vibePreference'],
      primaryUseCases: Array.isArray(primaryUseCases) 
        ? primaryUseCases.filter((u): u is string => typeof u === 'string').map(u => u.slice(0, 50)).slice(0, 5)
        : [],
    };

    const defaults = await saveOnboardingData(uid, onboardingData);
    res.json({ ok: true, defaults });
  } catch (err) {
    console.error('[users/onboarding]', err);
    res.status(500).json({ error: 'Failed to save onboarding data.' });
  }
});

// POST /api/users/me/feedback — submit beta feedback
router.post('/me/feedback', requireFirebaseAuth, async (req: Request, res: Response) => {
  const uid = req.auth.uid!;
  const { rating, feedback, npsScore, featureRequests } = req.body as Partial<FeedbackSubmission>;

  // Validate required fields
  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Rating is required and must be a number between 1 and 5' });
    return;
  }
  if (!feedback || typeof feedback !== 'string' || feedback.trim().length < 10) {
    res.status(400).json({ error: 'Feedback is required and must be at least 10 characters' });
    return;
  }

  try {
    const result = await submitBetaFeedback(uid, {
      rating,
      feedback: feedback.trim(),
      npsScore: typeof npsScore === 'number' && npsScore >= 0 && npsScore <= 10 ? npsScore : undefined,
      featureRequests: typeof featureRequests === 'string' ? featureRequests.trim().slice(0, 500) : undefined,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[users/feedback]', err);
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
});

// GET /api/users/me/download-credits — check remaining download credits
router.get('/me/download-credits', async (req: Request, res: Response) => {
  // Anonymous session path — read from Firestore for cross-instance accuracy
  if (req.auth.mode === 'anonymous') {
    const { hdCredits, platformCredits } = await getSessionCredits(req.auth.sessionId!);
    res.json({
      hdCredits,
      platformCredits,
      canDownloadHd: hdCredits > 0,
      canDownloadPlatform: platformCredits > 0,
    });
    return;
  }

  const doc = await getUserDoc(req.auth.uid!);
  if (!doc) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const hdCredits = doc.hdCredits ?? 0;
  const platformCredits = doc.platformCredits ?? 0;
  // Legacy fallback: old downloadCredits still counts for HD
  const legacyCredits = doc.downloadCredits ?? 0;
  const effectiveHd = hdCredits || legacyCredits;

  res.json({
    hdCredits: effectiveHd,
    platformCredits,
    canDownloadHd: effectiveHd > 0,
    canDownloadPlatform: platformCredits > 0,
  });
});

// POST /api/users/me/consume-download — consume one or more download credits
router.post('/me/consume-download', async (req: Request, res: Response) => {
  const { consume, type, count } = req.body as { consume?: boolean; type?: 'hd' | 'platform'; count?: number };
  const creditType: 'hd' | 'platform' = type === 'platform' ? 'platform' : 'hd';
  const n = (typeof count === 'number' && count > 1) ? count : 1;

  // Anonymous session path — read from Firestore for cross-instance accuracy
  if (req.auth.mode === 'anonymous') {
    const sessionId = req.auth.sessionId!;
    const { hdCredits, platformCredits } = await getSessionCredits(sessionId);

    if (creditType === 'platform') {
      if (platformCredits < n) {
        res.status(403).json({ error: `Need ${n} platform credits (have ${platformCredits}).`, code: 'no_platform_credits', platformCredits });
        return;
      }
      if (consume) {
        for (let i = 0; i < n; i++) {
          const ok = consumeSessionCredit(sessionId, 'platform');
          if (!ok) {
            res.status(403).json({ error: 'No platform download credits remaining.', code: 'no_platform_credits' });
            return;
          }
        }
        res.json({ success: true, consumed: n, remaining: platformCredits - n, type: 'platform' });
      } else {
        res.json({ canDownload: true, platformCredits });
      }
    } else {
      if (hdCredits <= 0) {
        res.status(403).json({ error: 'No HD download credits remaining.', code: 'no_hd_credits', hdCredits });
        return;
      }
      if (consume) {
        const ok = consumeSessionCredit(sessionId, 'hd');
        if (!ok) {
          res.status(403).json({ error: 'No HD download credits remaining.', code: 'no_hd_credits' });
          return;
        }
        res.json({ success: true, consumed: 1, remaining: hdCredits - 1, type: 'hd' });
      } else {
        res.json({ canDownload: true, hdCredits });
      }
    }
    return;
  }

  // Firebase user path
  const uid = req.auth.uid!;
  const doc = await getUserDoc(uid);
  if (!doc) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  if (creditType === 'platform') {
    const platformCredits = doc.platformCredits ?? 0;
    const legacyCredits = doc.downloadCredits ?? 0;
    const effective = platformCredits || legacyCredits;
    if (effective < n) {
      res.status(403).json({
        error: `Need ${n} platform credits (have ${effective}).`,
        code: 'no_platform_credits',
        platformCredits: effective,
      });
      return;
    }
    if (consume) {
      // Prefer decrementing the new field; fall back to legacy
      const field = platformCredits > 0 ? 'platformCredits' : 'downloadCredits';
      await adminFirestore().collection('users').doc(uid).set(
        { [field]: FieldValue.increment(-n), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
      res.json({ success: true, consumed: n, remaining: effective - n, type: 'platform' });
    } else {
      res.json({ canDownload: true, platformCredits: effective });
    }
  } else {
    // HD credit — always consumes 1
    const hdCredits = doc.hdCredits ?? 0;
    const legacyCredits = doc.downloadCredits ?? 0;
    const effective = hdCredits || legacyCredits;
    if (effective <= 0) {
      res.status(403).json({
        error: 'No HD download credits remaining.',
        code: 'no_hd_credits',
        hdCredits,
      });
      return;
    }
    if (consume) {
      const field = hdCredits > 0 ? 'hdCredits' : 'downloadCredits';
      await adminFirestore().collection('users').doc(uid).set(
        { [field]: FieldValue.increment(-1), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
      res.json({ success: true, consumed: 1, remaining: effective - 1, type: 'hd' });
    } else {
      res.json({ canDownload: true, hdCredits: effective });
    }
  }
});

// GET /api/users/me/portrait-proxy — proxy R2 image with CORS headers
// This allows canvas operations on images that don't have CORS configured
// Note: No auth required because img tags can't send auth headers, and R2 signed URLs are already secure
router.get('/me/portrait-proxy', async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  
  if (!imageUrl) {
    res.status(400).json({ error: 'URL parameter required' });
    return;
  }

  // Validate URL is from our R2 bucket and is a signed URL (contains signature)
  if (!imageUrl.includes('r2.cloudflarestorage.com') || !imageUrl.includes('X-Amz-Signature')) {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to fetch image' });
      return;
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    // Set CORS headers to allow canvas operations
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=3600');
    
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('[users/portrait-proxy]', err);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

export default router;
