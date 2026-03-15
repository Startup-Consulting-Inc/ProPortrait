# Beta Pricing Strategy

> Strategy document for ProPortrait AI beta period pricing and user conversion
> 
> Status: Planned | Target Implementation: Pre-launch phase

---

## Overview

This document outlines the pricing strategy for the ProPortrait AI beta period. The goal is to:

1. **Maximize beta signups** by offering free access with generous limits
2. **Incentivize upgrades** through a 50% 1 years discount for beta users
3. **Maintain transparency** by showing all pricing options upfront
4. **Create urgency** with limited-time beta access

---

## Pricing Structure (5 Tiers)

| Tier | Price | Type | Generation Limit | Key Features | Target User |
|------|-------|------|------------------|--------------|-------------|
| **Free** | $0 | Forever | 3 total | Basic styles, 1K exports | Casual try-out |
| **🧪 Beta** | **$0** | Limited time | 10 total | All styles, 2K exports, saves | Early adopters |
| **Creator** | $24.99 | One-time | 30 total | All features, 2K, PNG, saves | Occasional users |
| **Pro** | $29.99/mo | Subscription | 100/month | Unlimited saves, priority | Regular professionals |
| **Max** | $49.99/mo | Subscription | 500/month | Highest priority, bulk use | Power users/agencies |

### Beta Tier Details

**Duration:** Limited time (e.g., 30 days or until product launch)

**Limits:**
- 10 portrait generations
- All 7 professional styles unlocked
- 2K resolution exports
- All export formats (JPG, PNG with transparency)
- Save up to 10 portraits to library
- Access to editing studio

**Exclusive Beta Perk:**
> 💎 **50% off any paid plan forever**
> 
> Beta users who upgrade to Creator, Pro, or Max lock in 50% discount for life.
> 
> Examples:
> - Creator: ~~$24.99~~ → **$12.49** (one-time)
> - Pro: ~~$29.99/mo~~ → **$14.99/mo**
> - Max: ~~$49.99/mo~~ → **$24.99/mo**

---

## User Flow

### New User Journey

```
Landing Page
    ↓
Sees 5-tier pricing (Beta highlighted as "limited time")
    ↓
Clicks "Join Beta" (primary CTA)
    ↓
Signs up → Account created with tier: 'beta'
    ↓
Completes onboarding → Directed to /app
    ↓
Uses up to 10 free generations
    ↓
Email sequence begins...
```

### Email Sequence for Beta Users

| Day | Subject | Content |
|-----|---------|---------|
| 0 | Welcome to ProPortrait AI Beta! | Getting started tips, beta perks reminder |
| 3 | How's your experience? | Quick survey, support offer |
| 7 | Your beta perk: 50% off forever | Upgrade CTA with discount emphasis |
| 10 | [If not upgraded] Still enjoying ProPortrait? | Feature highlight, upgrade reminder |
| 14 | [If near beta end] Your beta expires in X days | Urgency, upgrade or downgrade info |
| 21 | Final days: Lock in 50% off | Last chance messaging |

### Upgrade Flow

```
Beta user clicks "Upgrade" in app or email
    ↓
Sees pricing modal with strikethrough original prices
    ↓
Stripe checkout with BETA50 coupon auto-applied
    ↓
Payment complete → Tier upgraded
    ↓
Confirmation email: "You locked in 50% off forever!"
```

---

## Landing Page Design

### Layout: 5-Card Grid

```
┌─────────────────────────────────────────────────────────────────┐
│                   SIMPLE, TRANSPARENT PRICING                   │
│                                                                 │
│  ┌────────┐  ┌────────────┐  ┌─────────┐  ┌───────┐  ┌──────┐ │
│  │  FREE  │  │  🧪 BETA   │  │ CREATOR │  │  PRO  │  │ MAX  │ │
│  │        │  │  FEATURED  │  │         │  │       │  │      │ │
│  │  $0    │  │    $0      │  │ $24.99  │  │$29.99 │  │$49.99│ │
│  │        │  │  LIMITED   │  │ one-time│  │ /mo   │  │ /mo  │ │
│  │ 3 gen  │  │   TIME     │  │ 30 gen  │  │100/mo │  │500/mo│ │
│  │        │  │  10 gen    │  │         │  │       │  │      │ │
│  │        │  │ +50% off   │  │         │  │       │  │      │ │
│  │        │  │  forever   │  │         │  │       │  │      │ │
│  └────────┘  └────────────┘  └─────────┘  └───────┘  └──────┘ │
│                                                                 │
│  [Start Free]  [Join Beta]  [Buy Creator] [Start Pro][Start Max]│
│                                                                 │
│  "Beta users lock in 50% off forever on any paid plan"         │
│  "After beta: Creator $24.99, Pro $29.99, Max $49.99"          │
└─────────────────────────────────────────────────────────────────┘
```

### Beta Card Design Spec

- **Position:** 2nd card (Free → **Beta** → Creator → Pro → Max)
- **Border:** 2px solid `amber-400`
- **Background:** `amber-50`
- **Badge:** "🧪 Limited Beta" pill at top (amber-500 bg, white text)
- **CTA Button:** Amber background (`amber-500`), white text, bold

### Key Copy Elements

**Hero Badge:**
```
🧪 Free Beta Access — 50% off when you upgrade
```

**Beta Card Title:**
```
Beta Access
```

**Beta Card Price:**
```
$0
during beta period
```

**Beta Card Features:**
```
✓ 10 portrait generations
✓ All 7 professional styles
✓ 2K resolution exports
✓ All platform formats
✓ Save up to 10 portraits
✓ 💎 50% off any upgrade forever
```

**Beta Card CTA:**
```
Join Beta
```

**Beta Card Footer:**
```
Beta users get 50% off Creator, Pro, or Max forever
```

---

## Technical Implementation

### Database Schema Changes

**UserDoc interface (server/lib/firestore.ts):**

```typescript
export type Tier = 'free' | 'beta' | 'creator' | 'pro' | 'max';

export interface UserDoc {
  // ... existing fields ...
  
  tier?: Tier;
  
  // Beta tracking
  joinedDuringBeta?: boolean;
  betaJoinedAt?: FirebaseFirestore.Timestamp;
  betaExpiresAt?: FirebaseFirestore.Timestamp; // Optional: for time-limited beta
}
```

### Generation Limits

**server/lib/firestore.ts:**

```typescript
export async function checkAndIncrementGeneration(uid: string, doc: UserDoc): Promise<void> {
  const tier: Tier = doc.tier ?? (doc.isPro ? 'pro' : 'free');
  const generationCount = doc.generationCount ?? 0;
  
  // Check beta expiration if applicable
  if (tier === 'beta' && doc.betaExpiresAt) {
    const now = Timestamp.now();
    if (now.seconds > doc.betaExpiresAt.seconds) {
      throw Object.assign(
        new Error('Beta period has ended. Please upgrade to continue.'), 
        { code: 'beta_expired' }
      );
    }
  }
  
  // Generation limits by tier
  if (tier === 'free' && generationCount >= 3) {
    throw Object.assign(
      new Error('Free plan limit reached (3 portraits). Upgrade to continue.'), 
      { code: 'generation_limit' }
    );
  }
  
  if (tier === 'beta' && generationCount >= 10) {
    throw Object.assign(
      new Error('Beta limit reached (10 portraits). Upgrade to continue.'), 
      { code: 'generation_limit' }
    );
  }
  
  if (tier === 'creator' && generationCount >= 30) {
    throw Object.assign(
      new Error('Creator Pass limit reached (30 portraits).'), 
      { code: 'generation_limit' }
    );
  }
  
  // ... pro and max checks remain the same ...
}
```

### Stripe Integration

**Coupon Setup:**

Create in Stripe Dashboard:
- **Coupon ID:** `BETA50`
- **Type:** Percentage
- **Amount:** 50%
- **Duration:** Forever
- **Redemption limit:** (Optional: limit total redemptions)

**Auto-apply at checkout (server/routes/payments.ts):**

```typescript
// When creating checkout session
const userDoc = await getUserDoc(uid);
const isBetaUser = userDoc?.tier === 'beta' || userDoc?.joinedDuringBeta;

const sessionParams: Stripe.Checkout.SessionCreateParams = {
  // ... other params ...
  discounts: isBetaUser ? [{ coupon: 'BETA50' }] : undefined,
};
```

### User Onboarding Update

**New user signup (server/routes/users.ts):**

```typescript
// During first login / signup
await adminFirestore().collection('users').doc(uid).set({
  // ... other fields ...
  tier: 'beta',  // Default new users to beta tier
  joinedDuringBeta: true,
  betaJoinedAt: FieldValue.serverTimestamp(),
  // Optionally set expiration:
  // betaExpiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
});
```

### Frontend Components

**Pricing Card Component (LandingPage.tsx):**

```tsx
// Beta tier card
<div className="flex flex-col p-6 rounded-2xl border-2 border-amber-400 bg-amber-50 relative">
  {/* Limited Beta Badge */}
  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
    🧪 Limited Beta
  </div>
  
  {/* Header */}
  <div className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-1">
    Beta Access
  </div>
  
  {/* Price */}
  <div className="flex items-baseline gap-1 mb-1">
    <span className="text-4xl font-extrabold text-slate-900">$0</span>
  </div>
  <div className="text-xs text-amber-600 font-semibold mb-5">
    During beta period
  </div>
  
  {/* Features */}
  <ul className="space-y-2.5 flex-1 mb-6">
    <li className="flex items-center gap-2 text-sm text-slate-700">
      <CheckIcon /> 10 portrait generations
    </li>
    <li className="flex items-center gap-2 text-sm text-slate-700">
      <CheckIcon /> All 7 professional styles
    </li>
    <li className="flex items-center gap-2 text-sm text-slate-700">
      <CheckIcon /> 2K resolution exports
    </li>
    <li className="flex items-center gap-2 text-sm text-slate-700">
      <CheckIcon /> All platform formats
    </li>
    <li className="flex items-center gap-2 text-sm text-slate-700">
      <CheckIcon /> Save up to 10 portraits
    </li>
    <li className="flex items-center gap-2 text-sm text-slate-700 font-semibold text-amber-700">
      <DiamondIcon /> 50% off any upgrade forever
    </li>
  </ul>
  
  {/* CTA */}
  <button
    onClick={goToApp}
    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow"
  >
    Join Beta
  </button>
  
  {/* Footer note */}
  <p className="text-xs text-amber-700 mt-3 text-center">
    Beta users get 50% off Creator, Pro, or Max forever
  </p>
</div>
```

---

## Marketing Messaging

### Primary Headlines

**Option 1 (Value-focused):**
> Try ProPortrait AI free during beta. Lock in 50% off forever when you upgrade.

**Option 2 (Urgency-focused):**
> 🧪 Limited beta spots available. Get free access + 50% off for life.

**Option 3 (Simple):**
> Free beta access. 10 professional portraits. 50% off when you upgrade.

### Supporting Copy

**Hero section:**
```
Join the beta and get:
✓ 10 free portrait generations
✓ All professional styles unlocked
✓ 2K resolution exports
✓ 50% off any paid plan forever

No credit card required.
```

**FAQ entry:**
```
Q: What happens after beta?
A: You can stay on the free tier (3 generations) or upgrade to any 
   paid plan with 50% off forever. Beta pricing is our way of saying 
   thanks to early users.
```

**Email subject lines:**
- "Your beta access is ready (+ 50% off for life)"
- "10 free portraits waiting for you"
- "Lock in 50% off before beta ends"
- "Final days: Your beta expires soon"

---

## Success Metrics

Track these KPIs to measure beta strategy effectiveness:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Beta signups | 500+ users | Count of `tier: 'beta'` users |
| Beta-to-paid conversion | 15-20% | % of beta users who upgrade |
| Time to upgrade | < 14 days | Average days from signup to paid |
| 50% discount redemptions | Track usage | Stripe coupon usage stats |
| Churn after beta | < 10% | Users who don't renew after first month |
| NPS score | > 50 | Survey beta users |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Too many beta users, high cost | Cap total beta spots (e.g., first 1000) or set expiration date |
| Users wait for beta to end | Emphasize "limited time" and send expiration reminders |
| 50% discount hurts revenue long-term | Set expectation it's "founder's pricing"; grandfather existing users |
| Beta users don't convert | Improve email sequence, add personal outreach, extend beta if needed |
| Abuse of free generations | IP tracking, rate limiting, manual review if suspicious |

---

## Implementation Checklist

### Phase 1: Backend Setup
- [ ] Add `'beta'` to `Tier` type
- [ ] Add `joinedDuringBeta`, `betaJoinedAt` fields to `UserDoc`
- [ ] Update `checkAndIncrementGeneration()` with beta limits
- [ ] Set `tier: 'beta'` as default for new signups
- [ ] Create `BETA50` coupon in Stripe
- [ ] Update payment route to auto-apply coupon for beta users

### Phase 2: Frontend Updates
- [ ] Add Beta tier card to `LandingPage.tsx`
- [ ] Update `PricingModal.tsx` with beta option
- [ ] Add beta badge/messaging to hero section
- [ ] Update upgrade flows to show discount

### Phase 3: Email Setup
- [ ] Configure email sequence (days 0, 3, 7, 14, 21)
- [ ] Create email templates with 50% off messaging
- [ ] Set up expiration reminder emails

### Phase 4: Analytics
- [ ] Add tracking for beta signup source
- [ ] Track conversion funnel: signup → generation → upgrade
- [ ] Monitor coupon usage in Stripe

---

## Future Considerations

### Post-Beta Transition

When beta period ends:

1. **Current beta users:**
   - Keep `joinedDuringBeta: true` for discount eligibility
   - Reset `tier` to `'free'` if not upgraded
   - Keep 50% discount available indefinitely

2. **New users:**
   - Default to `'free'` tier
   - Beta tier no longer available
   - Regular pricing applies

3. **Messaging:**
   - "Beta has ended, but early users keep their perks"
   - Continue honoring 50% discount for all beta alumni

### Potential A/B Tests

- Beta limit: 10 vs 15 generations
- Beta duration: 30 days vs unlimited until launch
- Discount: 50% vs 30% vs "first month free"
- Position: Beta as 2nd card vs featured/centered

---

## Summary

This beta pricing strategy balances:
- **Generosity** (free access, generous limits) to drive adoption
- **Incentive** (50% forever) to drive upgrades
- **Transparency** (all pricing visible) to build trust
- **Urgency** (limited time) to drive action

The goal is converting beta users into lifelong customers at a sustainable price point.

---

*Document created: March 2026*
*Next review: After first 100 beta signups*
