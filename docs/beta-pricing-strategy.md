# Beta Pricing Strategy

> Strategy document for ProPortrait AI beta period pricing and user rewards
> 
> Status: Planned | Target Implementation: Pre-launch phase

---

## Overview

This document outlines the revised beta pricing strategy for ProPortrait AI. The approach focuses on:

1. **Immediate value** — Beta users get free Creator tier access ($24.99 value)
2. **Reward engagement** — Active users who provide feedback unlock 50% off Pro/Max for 1 year
3. **Simple structure** — No separate beta tier, just 4 standard plans
4. **Data collection** — Incentivize feedback during critical early phase

---

## Standard Pricing Structure (4 Tiers)

| Tier | Price | Type | Generation Limit | Key Features | Target User |
|------|-------|------|------------------|--------------|-------------|
| **Free** | $0 | Forever | 3 total | Basic styles, 1K exports | Casual try-out |
| **Creator** | $24.99 | One-time | 30 total | All features, 2K, PNG, saves | Occasional users |
| **Pro** | $29.99/mo | Subscription | 100/month | Unlimited saves, priority | Regular professionals |
| **Max** | $49.99/mo | Subscription | 500/month | Highest priority, bulk use | Power users/agencies |

### Beta Period Rewards (Not a Separate Tier)

**For ALL Beta Signups:**
> 🎁 **Free Creator Upgrade**
> 
> Anyone who signs up during the beta period automatically gets Creator tier features for free.
> 
> - 30 portrait generations (vs 3 on Free)
> - All 7 professional styles
> - 2K resolution exports
> - Save up to 30 portraits
> - **Value: $24.99**

**For Active + Feedback Users:**
> 💎 **50% Off Pro or Max — 1 Year**
> 
> Users who actively use the product AND submit feedback unlock a 1-year discount.
> 
> - **Pro:** ~~$29.99/mo~~ → **$14.99/mo** (save $180/year)
> - **Max:** ~~$49.99/mo~~ → **$24.99/mo** (save $300/year)
> - Valid for 12 months, then reverts to standard pricing
> - Can be applied anytime during beta or within 30 days after

---

## Qualifying for 50% Discount

### Requirements

To unlock the 50% discount, users must:

1. **Sign up during beta period** (automatic Creator upgrade)
2. **Generate at least 3 portraits** (show active usage)
3. **Submit feedback** via one of:
   - In-app feedback form (min 100 characters)
   - Reply to feedback request email
   - Direct email to support
   - Survey completion

### Feedback Should Cover

| Category | Questions |
|----------|-----------|
| **Product** | What did you like? What was confusing? |
| **Quality** | How did your portraits turn out? |
| **Features** | What features are missing? |
| **Pricing** | What would you pay for this? |
| **Bugs** | Any issues encountered? |

### Verification Process

```
User submits feedback
    ↓
System checks: generations >= 3?
    ↓
Admin reviews feedback (quality check)
    ↓
If approved: Flag user as "feedback_eligible"
    ↓
User receives "50% off unlocked" email with coupon code
```

---

## User Flow

### New Beta User Journey

```
Landing Page
    ↓
Clicks "Get Started" or "Try Free"
    ↓
Signs up → Account created with tier: 'creator'
    ↓
Completes onboarding → Directed to /app
    ↓
Uses product (up to 30 generations)
    ↓
Day 3: Feedback request email sent
    ↓
Submits feedback → Qualifies for 50% off
    ↓
Receives "Discount Unlocked" email with PRO50MAX50 code
    ↓
Can upgrade anytime with 50% off for 1 year
```

### Email Sequence

| Day | Subject | Content |
|-----|---------|---------|
| 0 | Welcome to ProPortrait AI! | You're upgraded to Creator (free). Start generating. |
| 3 | Quick question about your portraits | Feedback request + mention of 50% discount unlock |
| 7 | [If feedback submitted] Your 50% discount is unlocked! | PRO50MAX50 coupon + upgrade CTA |
| 7 | [If no feedback] Help us improve (and save 50%) | Reminder about feedback = discount |
| 14 | How are your portraits looking? | Tips + final feedback reminder |
| 21 | Beta ending soon + your discount | Urgency to use 50% off before window closes |

---

## Landing Page Design

### Layout: 4-Card Grid (No Beta Tier)

```
┌─────────────────────────────────────────────────────────────────┐
│                   SIMPLE, TRANSPARENT PRICING                   │
│                                                                 │
│  🎁 FREE CREATOR UPGRADE DURING BETA                            │
│  Sign up now, get $24.99 Creator tier for free                  │
│                                                                 │
│  ┌────────┐  ┌─────────┐  ┌───────┐  ┌──────┐                  │
│  │  FREE  │  │ CREATOR │  │  PRO  │  │ MAX  │                  │
│  │  $0    │  │ $24.99  │  │$29.99 │  │$49.99│                  │
│  │        │  │one-time │  │ /mo   │  │ /mo  │                  │
│  │ 3 gen  │  │ 30 gen  │  │100/mo │  │500/mo│                  │
│  └────────┘  └─────────┘  └───────┘  └──────┘                  │
│                                                                 │
│  [Start Free]  [Upgrade to Creator]  [Start Pro]  [Start Max]   │
│                                                                 │
│  💎 Active beta users who share feedback get 50% off Pro/Max    │
│     for one year ($180-$300 savings)                            │
└─────────────────────────────────────────────────────────────────┘
```

### Hero Section Messaging

**Headline:**
```
Your best professional photo, without the photoshoot.
```

**Subheadline:**
```
🎁 Beta special: Free Creator access ($24.99 value)
Generate 30 professional portraits on us. 
Share feedback, unlock 50% off Pro or Max for a year.
```

**CTA Button:**
```
[Start Free — Get Creator Access]
```

### Pricing Card Details

**Creator Card (Show as "Free During Beta"):**
```
CREATOR
~~$24.99~~ → FREE (during beta)

✓ 30 portrait generations
✓ All 7 professional styles  
✓ 2K resolution exports
✓ Save up to 30 portraits
✓ All export formats

[Get Free Access]

💎 Share feedback, unlock 50% off Pro/Max
```

---

## Technical Implementation

### Database Schema

**UserDoc interface (server/lib/firestore.ts):**

```typescript
export type Tier = 'free' | 'creator' | 'pro' | 'max';

export interface UserDoc {
  // ... existing fields ...
  
  tier: Tier;
  
  // Beta tracking
  joinedDuringBeta?: boolean;
  betaJoinedAt?: FirebaseFirestore.Timestamp;
  
  // Feedback/rewards tracking
  feedbackSubmitted?: boolean;
  feedbackSubmittedAt?: FirebaseFirestore.Timestamp;
  feedbackContent?: string;  // Store their feedback
  feedbackRewardEligible?: boolean;  // Approved for discount
  
  // Discount tracking
  discountCode?: string;  // e.g., "PRO50" or "MAX50"
  discountApplied?: boolean;
  discountExpiresAt?: FirebaseFirestore.Timestamp;  // 1 year from application
}
```

### New User Signup (During Beta)

**server/routes/users.ts:**

```typescript
// During first login / signup in beta period
await adminFirestore().collection('users').doc(uid).set({
  // ... other fields ...
  tier: 'creator',  // Auto-upgrade to Creator
  joinedDuringBeta: true,
  betaJoinedAt: FieldValue.serverTimestamp(),
});
```

### Generation Limits

No changes needed — Creator tier limits (30 generations) apply automatically.

### Feedback Collection Endpoint

**New endpoint: POST /api/users/feedback**

```typescript
router.post('/feedback', requireFirebaseAuth, async (req: Request, res: Response) => {
  const uid = req.auth.uid!;
  const { content, rating, category } = req.body;
  
  // Get user doc
  const userDoc = await getUserDoc(uid);
  
  // Check if eligible for reward
  const hasGeneratedEnough = (userDoc?.generationCount || 0) >= 3;
  const isBetaUser = userDoc?.joinedDuringBeta;
  
  const update: Partial<UserDoc> = {
    feedbackSubmitted: true,
    feedbackSubmittedAt: FieldValue.serverTimestamp(),
    feedbackContent: content,
  };
  
  // Auto-approve if meets criteria, or flag for manual review
  if (isBetaUser && hasGeneratedEnough && content.length >= 100) {
    update.feedbackRewardEligible = true;
    // Send discount email (async)
    void sendFeedbackRewardEmail(uid);
  }
  
  await upsertUserDoc(uid, update);
  
  res.json({ 
    ok: true, 
    rewardEligible: update.feedbackRewardEligible || false 
  });
});
```

### Stripe Discount Coupons

Create two coupons in Stripe:

**Coupon 1: PRO50**
- **ID:** `PRO50_1YEAR`
- **Type:** Percentage
- **Amount:** 50%
- **Duration:** 12 months (not forever)
- **Applies to:** Pro plan only

**Coupon 2: MAX50**
- **ID:** `MAX50_1YEAR`
- **Type:** Percentage  
- **Amount:** 50%
- **Duration:** 12 months
- **Applies to:** Max plan only

### Checkout Integration

**server/routes/payments.ts:**

```typescript
// When creating checkout session
const userDoc = await getUserDoc(uid);

// Determine which coupon to apply based on selected plan
const selectedPlan = req.body.plan; // 'pro' or 'max'
let couponCode: string | undefined;

if (userDoc?.feedbackRewardEligible && userDoc?.joinedDuringBeta) {
  couponCode = selectedPlan === 'max' ? 'MAX50_1YEAR' : 'PRO50_1YEAR';
}

const sessionParams: Stripe.Checkout.SessionCreateParams = {
  // ... other params ...
  discounts: couponCode ? [{ coupon: couponCode }] : undefined,
};
```

---

## Reward Eligibility Email

**Subject:** Your 50% discount is unlocked! 🎉

```
Hi [Name],

Thanks for your feedback! We reviewed your suggestions and 
want to say thanks with a special discount.

🎁 YOU'VE UNLOCKED: 50% off Pro or Max for 1 year

Choose your plan:

Pro Studio
~~$29.99/mo~~ → $14.99/mo for 12 months
(Save $180)
[Upgrade to Pro]

Max Studio  
~~$49.99/mo~~ → $24.99/mo for 12 months
(Save $300)
[Upgrade to Max]

Your discount is valid for 30 days. After upgrading, your 
50% off applies for the first 12 months.

Questions? Just reply to this email.

Thanks for helping us build ProPortrait AI!

— The ProPortrait Team
```

---

## Admin Dashboard Updates

Add a new section to track beta rewards:

```
┌─────────────────────────────────────────┐
│  Beta Users & Feedback                  │
├─────────────────────────────────────────┤
│  Total beta signups: 247                │
│  Feedback submitted: 89 (36%)           │
│  Reward eligible: 62 (25%)              │
│  Upgraded with discount: 18 (7%)        │
└─────────────────────────────────────────┘
```

**New admin endpoint:** GET /api/admin/beta-users

Returns list of beta users with:
- Signup date
- Generations count
- Feedback status
- Reward eligibility
- Upgrade status

---

## FAQ

**Q: Do I need a credit card for the free Creator access?**
> No. Sign up during beta, get Creator features free. No card required.

**Q: What happens to my portraits after beta ends?**
> Your Creator access continues. Beta users keep their tier.

**Q: How do I get the 50% discount?**
> Use ProPortrait AI actively (3+ portraits) and submit feedback via the 
> in-app form or email. We'll review and send your discount code.

**Q: Is the 50% off forever?**
> No, it's for 12 months. After that, standard pricing applies. You can 
> cancel anytime.

**Q: What counts as "feedback"?**
> Any thoughtful input: feature requests, bug reports, quality feedback, 
> pricing opinions. Minimum ~2-3 sentences so we can actually use it.

**Q: When does beta end?**
> We'll announce 30 days in advance. All beta perks (free Creator + 
> discount eligibility) remain available until then.

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Beta signups | 500+ | Total accounts with `joinedDuringBeta: true` |
| Feedback submission rate | 30%+ | % of beta users who submit feedback |
| Feedback quality approval | 70%+ | % of feedback approved for discount |
| Discount redemption rate | 40%+ | % of eligible users who use discount |
| Upgrade conversion (paid) | 15%+ | % of beta users who upgrade to paid |
| Cost per feedback | <$5 | (Creator value $25) / (feedback count × upgrade %) |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Low feedback quality | Set minimum length (100 chars), require specific questions |
| Gaming the system (fake feedback) | Manual review step, IP tracking, generation quality check |
| Too expensive (giving away Creator) | Cap beta period, limit to first X users, or require feedback for full 30 generations |
| Users don't upgrade after 1 year | Strong onboarding, habit formation, feature lock-in during first year |
| Feedback volume overwhelms team | Start with manual review, later automate basic checks |

---

## Implementation Checklist

### Phase 1: Backend
- [ ] Remove `'beta'` from Tier type (keep only 4 tiers)
- [ ] Update new user signup: set `tier: 'creator'` during beta
- [ ] Add feedback fields to UserDoc schema
- [ ] Create `POST /api/users/feedback` endpoint
- [ ] Create `GET /api/admin/beta-users` endpoint
- [ ] Create Stripe coupons: `PRO50_1YEAR`, `MAX50_1YEAR` (12 months)
- [ ] Update checkout to apply coupons for eligible users

### Phase 2: Frontend
- [ ] Update LandingPage: remove Beta tier, show 4 cards
- [ ] Add "Free during beta" messaging on Creator card
- [ ] Add feedback form component in app (after 2-3 generations)
- [ ] Show "Feedback submitted" / "Discount unlocked" status in profile
- [ ] Update PricingModal to show discount for eligible users

### Phase 3: Email
- [ ] Welcome email: "You're upgraded to Creator (free)"
- [ ] Day 3: Feedback request email
- [ ] Discount unlocked email (triggered on approval)
- [ ] Day 14: Reminder to submit feedback
- [ ] Day 21: Beta ending + discount reminder

### Phase 4: Admin
- [ ] Add Beta Users section to AdminPage
- [ ] Build feedback review UI (approve/reject)
- [ ] Export beta user data

---

## Summary

### What Changed from Original Plan

| Original | New |
|----------|-----|
| 5 tiers (Free, **Beta**, Creator, Pro, Max) | 4 tiers (Free, Creator, Pro, Max) |
| Beta tier with 10 generations | All beta signups get Creator (30 generations) |
| Automatic 50% off for all beta users | 50% off only for active users who submit feedback |
| 50% off forever | 50% off for 1 year only |
| No engagement requirement | Must generate 3+ portraits + submit feedback |

### Why This Is Better

1. **Simpler** — No confusion about "beta tier" vs other tiers
2. **More fair** — Rewards engaged users, not just signups
3. **Better data** — Incentivizes quality feedback collection
4. **Sustainable** — 1-year discount vs forever is more viable
5. **Clear value** — Free $25 Creator is concrete and attractive

---

*Document revised: March 2026*
*Original beta tier plan replaced with Creator auto-upgrade + feedback rewards*
