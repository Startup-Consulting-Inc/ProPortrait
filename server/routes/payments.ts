import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { getOrCreateSession, setProStatus, addSessionCredits, SESSION_COOKIE, COOKIE_OPTIONS } from '../lib/session.js';
import { firestoreSetProStatus, firestoreSetTier, addDownloadCredits, addHdCredits, addPlatformCredits, getUserByStripeCustomerId, getUserDoc } from '../lib/firestore.js';
import type { Tier } from '../lib/firestore.js';

const router = Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Price IDs for base plans
const PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID,                    // $4.99 - 1 HD download
  plus: process.env.STRIPE_PLUS_PRICE_ID,                      // $9.99 - 1 HD + 1 platform
  hd_addon: process.env.STRIPE_HD_ADDON_PRICE_ID,              // $4.99 - +1 HD credit
  platform_single: process.env.STRIPE_PLATFORM_SINGLE_PRICE_ID, // $2.99 - +1 platform credit
  platform_bundle: process.env.STRIPE_PLATFORM_BUNDLE_PRICE_ID, // $9.99 - +1 HD + +5 platform credits
};

type Plan = Tier | 'hd_addon' | 'platform_single' | 'platform_bundle';

// POST /api/payments/checkout
router.post('/checkout', async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: 'Payment not configured yet', mock: true });
    return;
  }

  const { plan } = req.body as { plan: Plan };
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const validPlans: Plan[] = ['basic', 'plus', 'hd_addon', 'platform_single', 'platform_bundle'];
  if (!validPlans.includes(plan)) {
    res.status(400).json({ error: `Invalid plan. Choose one of: ${validPlans.join(', ')}` });
    return;
  }

  // Build metadata to identify purchaser in webhook
  const firebaseUid = req.auth.uid;
  const sessionId = req.auth.sessionId;
  const metadata: Record<string, string> = { plan };
  if (firebaseUid) {
    metadata.firebaseUid = firebaseUid;
  } else if (sessionId) {
    // Anonymous fallback — ensure cookie is set
    const cookieId = req.cookies?.[SESSION_COOKIE];
    const [newSessionId] = getOrCreateSession(cookieId);
    if (!cookieId || cookieId !== newSessionId) {
      res.cookie(SESSION_COOKIE, newSessionId, COOKIE_OPTIONS);
    }
    metadata.sessionId = newSessionId;
  }

  const priceId = (PRICE_IDS as Record<string, string | undefined>)[plan];

  if (!priceId) {
    res.status(503).json({ error: `${plan} price not configured`, mock: true });
    return;
  }

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/create?payment=success&plan=${plan}`,
      cancel_url: `${appUrl}/create?payment=cancelled`,
      metadata,
      ...(req.auth.email ? { customer_email: req.auth.email } : {}),
    });
    res.json({ url: checkout.url });
  } catch (err) {
    console.error('[payments/checkout]', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/payments/webhook  (Stripe → server, needs raw body)
router.post('/webhook', async (req: Request, res: Response) => {
  if (!stripe) {
    res.json({ received: true });
    return;
  }

  const sig = req.headers['stripe-signature'] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('[payments/webhook] STRIPE_WEBHOOK_SECRET not set');
    res.json({ received: true });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, secret);
  } catch (err) {
    console.error('[payments/webhook] Signature verification failed:', err);
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.metadata?.firebaseUid;
    const sid = session.metadata?.sessionId;
    const customerId = session.customer as string | undefined;
    const plan = (session.metadata?.plan ?? 'basic') as Plan;

    if (uid) {
      if (plan === 'basic') {
        await firestoreSetTier(uid, 'basic', customerId);
        await addHdCredits(uid, 1);
        console.log(`[payments] basic activated — hdCredits +1 for uid ${uid}`);
      } else if (plan === 'plus') {
        await firestoreSetTier(uid, 'plus', customerId);
        await addHdCredits(uid, 1);
        await addPlatformCredits(uid, 1);
        console.log(`[payments] plus activated — hdCredits +1, platformCredits +1 for uid ${uid}`);
      } else if (plan === 'hd_addon') {
        await addHdCredits(uid, 1);
        console.log(`[payments] hd_addon — hdCredits +1 for uid ${uid}`);
      } else if (plan === 'platform_single') {
        await addPlatformCredits(uid, 1);
        console.log(`[payments] platform_single — platformCredits +1 for uid ${uid}`);
      } else if (plan === 'platform_bundle') {
        await addHdCredits(uid, 1);
        await addPlatformCredits(uid, 5);
        console.log(`[payments] platform_bundle — hdCredits +1, platformCredits +5 for uid ${uid}`);
      }
    } else if (sid) {
      // Anonymous session → grant credits per plan
      if (plan === 'basic') {
        addSessionCredits(sid, 1, 0);
        console.log(`[payments] basic — hdCredits +1 for session ${sid}`);
      } else if (plan === 'plus') {
        addSessionCredits(sid, 1, 1);
        console.log(`[payments] plus — hdCredits +1, platformCredits +1 for session ${sid}`);
      } else if (plan === 'hd_addon') {
        addSessionCredits(sid, 1, 0);
        console.log(`[payments] hd_addon — hdCredits +1 for session ${sid}`);
      } else if (plan === 'platform_single') {
        addSessionCredits(sid, 0, 1);
        console.log(`[payments] platform_single — platformCredits +1 for session ${sid}`);
      } else if (plan === 'platform_bundle') {
        addSessionCredits(sid, 1, 5);
        console.log(`[payments] platform_bundle — hdCredits +1, platformCredits +5 for session ${sid}`);
      }
      setProStatus(sid, true, customerId);
    }
  }

  res.json({ received: true });
});

// POST /api/payments/portal — open Stripe billing portal (Firebase auth required)
// Note: With one-time payments, this is less useful, but kept for customer support
router.post('/portal', async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: 'Payment not configured yet' });
    return;
  }

  const doc = await getUserDoc(req.auth.uid!);
  if (!doc?.stripeCustomerId) {
    res.status(404).json({ error: 'No billing history found.' });
    return;
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: doc.stripeCustomerId,
      return_url: `${appUrl}/app`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('[payments/portal]', err);
    res.status(500).json({ error: 'Failed to open billing portal.' });
  }
});

export default router;
