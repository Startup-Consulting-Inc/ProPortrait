import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { getOrCreateSession, setProStatus, SESSION_COOKIE, COOKIE_OPTIONS } from '../lib/session.js';
import { firestoreSetProStatus, firestoreSetTier, getUserByStripeCustomerId, getUserDoc } from '../lib/firestore.js';
import type { Tier } from '../lib/firestore.js';
import { requireFirebaseAuth } from '../middleware/authMiddleware.js';

const router = Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// POST /api/payments/checkout
router.post('/checkout', async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: 'Payment not configured yet', mock: true });
    return;
  }

  const { plan } = req.body as { plan: 'creator' | 'pro' | 'max' };
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

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

  const checkoutBase: Stripe.Checkout.SessionCreateParams = {
    success_url: `${appUrl}/app?payment=success`,
    cancel_url: `${appUrl}/app?payment=cancelled`,
    metadata,
    ...(req.auth.email ? { customer_email: req.auth.email } : {}),
  };

  let priceId: string | undefined;
  let mode: 'payment' | 'subscription';

  if (plan === 'creator') {
    priceId = process.env.STRIPE_CREATOR_PRICE_ID ?? process.env.STRIPE_SESSION_PRICE_ID;
    mode = 'payment';
  } else if (plan === 'pro') {
    priceId = process.env.STRIPE_PRO_PRICE_ID;
    mode = 'subscription';
  } else if (plan === 'max') {
    priceId = process.env.STRIPE_MAX_PRICE_ID;
    mode = 'subscription';
  } else {
    res.status(400).json({ error: 'Invalid plan' });
    return;
  }

  if (!priceId) {
    res.status(503).json({ error: `${plan} price not configured`, mock: true });
    return;
  }

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      ...checkoutBase,
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
    const plan = (session.metadata?.plan ?? 'pro') as Tier;

    if (uid) {
      // Firebase user → persist tier to Firestore
      await firestoreSetTier(uid, plan, customerId);
      console.log(`[payments] Tier '${plan}' activated in Firestore for uid ${uid}`);
    } else if (sid) {
      // Anonymous session → mark as pro in memory (no tier granularity)
      setProStatus(sid, true, customerId);
      console.log(`[payments] Pro activated for session ${sid}`);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;

    const result = await getUserByStripeCustomerId(customerId);
    if (result) {
      await firestoreSetTier(result.uid, 'free');
      console.log(`[payments] Tier revoked (→ free) in Firestore for uid ${result.uid}`);
    } else {
      console.log(`[payments] Subscription deleted for customer ${customerId} — no Firestore doc found`);
    }
  }

  res.json({ received: true });
});

// POST /api/payments/portal — open Stripe billing portal (Firebase auth required)
router.post('/portal', requireFirebaseAuth, async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: 'Payment not configured yet' });
    return;
  }

  const doc = await getUserDoc(req.auth.uid!);
  if (!doc?.stripeCustomerId) {
    res.status(404).json({ error: 'No billing subscription found.' });
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
