import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { getOrCreateSession, setProStatus, SESSION_COOKIE, COOKIE_OPTIONS } from '../lib/session.js';

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

  const cookieId = req.cookies?.[SESSION_COOKIE];
  const [sessionId, _session] = getOrCreateSession(cookieId);
  res.cookie(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);

  const { plan } = req.body as { plan: 'session' | 'pro' | 'teams' };

  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  try {
    if (plan === 'session') {
      // One-time Session Pass ($14.99)
      const priceId = process.env.STRIPE_SESSION_PRICE_ID;
      if (!priceId) {
        res.status(503).json({ error: 'Session Pass price not configured', mock: true });
        return;
      }
      const checkout = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}?payment=success`,
        cancel_url: `${appUrl}?payment=cancelled`,
        metadata: { sessionId },
      });
      res.json({ url: checkout.url });
    } else if (plan === 'pro') {
      // Pro Studio subscription ($19.99/mo)
      const priceId = process.env.STRIPE_PRO_PRICE_ID;
      if (!priceId) {
        res.status(503).json({ error: 'Pro price not configured', mock: true });
        return;
      }
      const checkout = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}?payment=success`,
        cancel_url: `${appUrl}?payment=cancelled`,
        metadata: { sessionId },
      });
      res.json({ url: checkout.url });
    } else if (plan === 'teams') {
      const priceId = process.env.STRIPE_TEAMS_PRICE_ID;
      if (!priceId) {
        res.status(503).json({ error: 'Teams price not configured', mock: true });
        return;
      }
      const checkout = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}?payment=success`,
        cancel_url: `${appUrl}?payment=cancelled`,
        metadata: { sessionId },
      });
      res.json({ url: checkout.url });
    } else {
      res.status(400).json({ error: 'Invalid plan' });
    }
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
    const sid = session.metadata?.sessionId;
    if (sid) {
      setProStatus(sid, true, session.customer as string | undefined);
      console.log(`[payments] Pro activated for session ${sid}`);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    // Find session by stripeCustomerId (linear scan — fine for in-memory store)
    const customerId = sub.customer as string;
    console.log(`[payments] Subscription deleted for customer ${customerId}`);
    // Note: in a real DB you'd look up the session by customerId and revoke pro
  }

  res.json({ received: true });
});

export default router;
