import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { getOrCreateSession, setProStatus, SESSION_COOKIE, COOKIE_OPTIONS } from '../lib/session.js';
import { firestoreSetProStatus, firestoreSetTier, addDownloadCredits, getUserByStripeCustomerId, getUserDoc } from '../lib/firestore.js';
import type { Tier } from '../lib/firestore.js';

const router = Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Price IDs for the new simplified model
const PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID,      // $4.99 - 1 HD download
  plus: process.env.STRIPE_PLUS_PRICE_ID,        // $9.99 - 1 HD download + all platforms
};

// Download credits granted per purchase
const DOWNLOAD_CREDITS: Record<Tier, number> = {
  free: 0,
  basic: 1,
  plus: 1,
};

// POST /api/payments/checkout
router.post('/checkout', async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: 'Payment not configured yet', mock: true });
    return;
  }

  const { plan } = req.body as { plan: 'basic' | 'plus' };
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  // Validate plan
  if (plan !== 'basic' && plan !== 'plus') {
    res.status(400).json({ error: 'Invalid plan. Choose basic or plus.' });
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

  const priceId = PRICE_IDS[plan];

  if (!priceId) {
    res.status(503).json({ error: `${plan} price not configured`, mock: true });
    return;
  }

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/app?payment=success&plan=${plan}`,
      cancel_url: `${appUrl}/app?payment=cancelled`,
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
    const plan = (session.metadata?.plan ?? 'basic') as Tier;

    if (uid) {
      // Firebase user → persist tier and add download credits
      await firestoreSetTier(uid, plan, customerId);
      
      // Add download credits based on plan
      const credits = DOWNLOAD_CREDITS[plan] ?? 0;
      if (credits > 0) {
        await addDownloadCredits(uid, credits);
      }
      
      console.log(`[payments] Tier '${plan}' activated with ${credits} credits for uid ${uid}`);
    } else if (sid) {
      // Anonymous session → mark as pro in memory (no tier granularity)
      setProStatus(sid, true, customerId);
      console.log(`[payments] Pro activated for session ${sid}`);
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
