import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from './firebase.js';

export type Tier = 'free' | 'basic' | 'plus';
export type IcpSegment = 'career' | 'executive' | 'creative_tech' | 'service' | 'artist';
export type VibePreference = 'polished' | 'warm' | 'bold' | 'creative';

export interface BetaFeedback {
  submittedAt: FirebaseFirestore.Timestamp;
  rating: number; // 1-5
  feedback: string;
  npsScore?: number; // 0-10
  featureRequests?: string;
  eligibleForDiscount: boolean;
  discountApplied: boolean;
}

export interface UserDoc {
  email: string;
  displayName: string;
  photoURL?: string;
  isPro: boolean;
  isAdmin: boolean;
  tier?: Tier;
  stripeCustomerId?: string;
  // Generation limits (no longer strictly enforced - free users get unlimited watermarked generations)
  generationCount?: number;
  generationsThisMonth?: number;
  lastResetMonth?: string; // YYYY-MM
  // Download credits (new pay-per-download model)
  downloadCredits?: number;
  // Save limits
  saveCount?: number;
  // Default preferences for portrait generation
  defaultStyle?: string;
  defaultExpression?: string;
  defaultIdentityLocks?: {
    eyeColor: boolean;
    skinTone: boolean;
    hairLength: boolean;
    hairTexture: boolean;
    glasses: boolean;
  };
  defaultLikeness?: number;
  defaultNaturalness?: number;
  // Onboarding data
  onboardingCompletedAt?: FirebaseFirestore.Timestamp;
  icpSegment?: IcpSegment;
  industry?: string;
  vibePreference?: VibePreference;
  primaryUseCases?: string[];
  defaultBackgroundCategory?: 'quick' | 'brand' | 'creative';
  preferredBackgrounds?: string[];
  // Beta program
  joinedDuringBeta?: boolean;
  betaJoinedAt?: FirebaseFirestore.Timestamp;
  betaFeedback?: BetaFeedback;
  betaFeedbackCount?: number;
  // Account management
  isSuspended?: boolean;
  suspensionReason?: string;
  suspendedAt?: FirebaseFirestore.Timestamp | null;
  subscriptionExpiresAt?: FirebaseFirestore.Timestamp | null;
  adminNote?: string;
  // Timestamps
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}

export interface SavedPortraitDoc {
  r2Key: string;
  style: string;
  title: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await adminFirestore().collection('users').doc(uid).get();
  if (!snap.exists) return null;
  return snap.data() as UserDoc;
}

export async function upsertUserDoc(uid: string, data: Partial<UserDoc>): Promise<void> {
  await adminFirestore().collection('users').doc(uid).set(
    { ...data, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export async function firestoreSetProStatus(
  uid: string,
  isPro: boolean,
  stripeCustomerId?: string,
): Promise<void> {
  const update: Record<string, unknown> = {
    isPro,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (stripeCustomerId) update.stripeCustomerId = stripeCustomerId;
  await adminFirestore().collection('users').doc(uid).set(update, { merge: true });
}

export async function firestoreSetTier(
  uid: string,
  tier: Tier,
  stripeCustomerId?: string,
): Promise<void> {
  const update: Record<string, unknown> = {
    tier,
    isPro: tier !== 'free',
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (stripeCustomerId) update.stripeCustomerId = stripeCustomerId;
  await adminFirestore().collection('users').doc(uid).set(update, { merge: true });
}

/** Check generation limits and increment counter. 
 * New model: Free users get unlimited watermarked generations.
 * Paid tiers (basic/plus) get higher quality and download credits.
 */
export async function checkAndIncrementGeneration(uid: string, doc: UserDoc): Promise<void> {
  const tier: Tier = doc.tier ?? 'free';
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  let generationsThisMonth = doc.generationsThisMonth ?? 0;

  // Monthly reset for paid tiers
  if ((tier === 'basic' || tier === 'plus') && doc.lastResetMonth !== currentMonth) {
    generationsThisMonth = 0;
    await adminFirestore().collection('users').doc(uid).update({
      generationsThisMonth: 0,
      lastResetMonth: currentMonth,
    });
  }

  // Free tier: unlimited generations (but watermarked, no download)
  // Basic/Plus: generous limits (1000/month should be effectively unlimited for most)
  if ((tier === 'basic' || tier === 'plus') && generationsThisMonth >= 1000) {
    throw Object.assign(new Error('Monthly generation limit reached (1000/month). Contact support if you need more.'), { code: 'generation_limit' });
  }
}

/** Check if user has download credits available */
export async function checkDownloadCredits(uid: string, doc: UserDoc): Promise<{ hasCredits: boolean; credits: number }> {
  const tier = doc.tier ?? 'free';
  const credits = doc.downloadCredits ?? 0;
  
  // Free users cannot download (watermarked preview only)
  if (tier === 'free') {
    return { hasCredits: false, credits: 0 };
  }
  
  return { hasCredits: credits > 0, credits };
}

/** Consume a download credit. Throws if no credits available. */
export async function consumeDownloadCredit(uid: string, doc: UserDoc): Promise<void> {
  const tier = doc.tier ?? 'free';
  const credits = doc.downloadCredits ?? 0;
  
  if (tier === 'free') {
    throw Object.assign(new Error('Free users cannot download. Please upgrade to download your portrait.'), { code: 'download_limit' });
  }
  
  if (credits <= 0) {
    throw Object.assign(new Error('No download credits remaining. Please purchase more downloads.'), { code: 'download_limit' });
  }
  
  await adminFirestore().collection('users').doc(uid).set(
    { downloadCredits: FieldValue.increment(-1), updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

/** Add download credits after purchase */
export async function addDownloadCredits(uid: string, credits: number): Promise<void> {
  await adminFirestore().collection('users').doc(uid).set(
    { downloadCredits: FieldValue.increment(credits), updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

// ── Saved Portraits ───────────────────────────────────────────────────────────

export async function checkSaveLimit(uid: string, doc: UserDoc): Promise<void> {
  const tier: Tier = doc.tier ?? 'free';
  // All tiers (including free) can now save portraits to library
  // This is now a value-add feature rather than a paywall
  // Limits only apply to prevent abuse
  const saveCount = doc.saveCount ?? 0;
  const maxSaves = tier === 'free' ? 10 : tier === 'basic' ? 50 : 200;
  
  if (saveCount >= maxSaves) {
    throw Object.assign(new Error(`Save limit reached (${maxSaves}). Delete some saved portraits to add more.`), { code: 'save_limit' });
  }
}

export async function savePortraitDoc(
  uid: string,
  r2Key: string,
  style: string,
  title: string = '',
): Promise<string> {
  const ref = adminFirestore().collection('users').doc(uid).collection('savedPortraits').doc();
  await ref.set({
    r2Key,
    style,
    title: title || `Portrait — ${new Date().toLocaleDateString()}`,
    createdAt: FieldValue.serverTimestamp(),
  });
  // Increment saveCount
  await adminFirestore().collection('users').doc(uid).set(
    { saveCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return ref.id;
}

export async function getSavedPortraits(uid: string): Promise<Array<SavedPortraitDoc & { id: string }>> {
  const snap = await adminFirestore()
    .collection('users').doc(uid).collection('savedPortraits')
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SavedPortraitDoc) }));
}

export async function deleteSavedPortrait(uid: string, portraitId: string): Promise<string | null> {
  const ref = adminFirestore().collection('users').doc(uid).collection('savedPortraits').doc(portraitId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as SavedPortraitDoc;
  await ref.delete();
  await adminFirestore().collection('users').doc(uid).set(
    { saveCount: FieldValue.increment(-1), updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return data.r2Key;
}

// ── Usage Tracking ───────────────────────────────────────────────────────────

const COST = { free_generate: 0.08, pro_generate: 0.22, edit: 0.06 };

async function trackDailyStat(
  type: 'generation' | 'edit',
  isPro: boolean,
  style?: string,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const ref = adminFirestore().collection('stats').doc('daily').collection('days').doc(today);
  const update: Record<string, unknown> = {
    date: today,
    [type === 'generation' ? 'generationCount' : 'editCount']: FieldValue.increment(1),
    totalCostUsd: FieldValue.increment(
      type === 'generation' ? (isPro ? COST.pro_generate : COST.free_generate) : COST.edit,
    ),
  };
  if (type === 'generation') {
    update[isPro ? 'proGenerations' : 'freeGenerations'] = FieldValue.increment(1);
    if (style) update[`styleBreakdown.${style}`] = FieldValue.increment(1);
  }
  await ref.set(update, { merge: true });
}

export async function trackGeneration(uid: string, style: string, isPro: boolean): Promise<void> {
  const cost = isPro ? COST.pro_generate : COST.free_generate;
  const currentMonth = new Date().toISOString().slice(0, 7);
  await adminFirestore().collection('users').doc(uid).set(
    {
      generationCount: FieldValue.increment(1),
      generationsThisMonth: FieldValue.increment(1),
      lastResetMonth: currentMonth,
      totalCostUsd: FieldValue.increment(cost),
      lastActiveAt: FieldValue.serverTimestamp(),
      [`styleUsage.${style}`]: FieldValue.increment(1),
    },
    { merge: true },
  );
  await trackDailyStat('generation', isPro, style);
}

export async function trackEdit(uid: string, isPro: boolean): Promise<void> {
  await adminFirestore().collection('users').doc(uid).set(
    {
      editCount: FieldValue.increment(1),
      totalCostUsd: FieldValue.increment(COST.edit),
      lastActiveAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await trackDailyStat('edit', isPro);
}

export async function trackLogin(uid: string): Promise<void> {
  await adminFirestore().collection('users').doc(uid).set(
    {
      loginCount: FieldValue.increment(1),
      lastLoginAt: FieldValue.serverTimestamp(),
      lastActiveAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  const today = new Date().toISOString().slice(0, 10);
  await adminFirestore().collection('stats').doc('daily').collection('days').doc(today).set(
    { date: today, loginCount: FieldValue.increment(1) },
    { merge: true },
  );
}

export async function trackExport(uid: string, platform: string): Promise<void> {
  await adminFirestore().collection('users').doc(uid).set(
    {
      exportCount: FieldValue.increment(1),
      lastActiveAt: FieldValue.serverTimestamp(),
      [`exportUsage.${platform}`]: FieldValue.increment(1),
    },
    { merge: true },
  );
  const today = new Date().toISOString().slice(0, 10);
  await adminFirestore().collection('stats').doc('daily').collection('days').doc(today).set(
    { date: today, exportCount: FieldValue.increment(1) },
    { merge: true },
  );
}

export async function getDailyStats(days = 30): Promise<Record<string, unknown>[]> {
  const snap = await adminFirestore()
    .collection('stats').doc('daily').collection('days')
    .orderBy('date', 'desc')
    .limit(days)
    .get();
  return snap.docs.map((d) => d.data());
}

export async function getUserByStripeCustomerId(customerId: string): Promise<{ uid: string; doc: UserDoc } | null> {
  const snap = await adminFirestore()
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { uid: docSnap.id, doc: docSnap.data() as UserDoc };
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export interface OnboardingData {
  icpSegment: IcpSegment;
  industry: string;
  vibePreference: VibePreference;
  primaryUseCases: string[];
}

export interface PortraitDefaults {
  style: string;
  expression: string;
  identityLocks: {
    eyeColor: boolean;
    skinTone: boolean;
    hairLength: boolean;
    hairTexture: boolean;
    glasses: boolean;
  };
  likeness: number;
  naturalness: number;
  naturalnessPreset: 'natural' | 'polished' | 'studio';
  backgroundCategory: 'quick' | 'brand' | 'creative';
  preferredBackgrounds: string[];
  removeBlemishes: boolean;
}

/** Generate portrait defaults based on onboarding answers */
export function generateDefaultsFromOnboarding(data: OnboardingData): PortraitDefaults {
  const { icpSegment, vibePreference, industry } = data;
  
  // Default style based on ICP + vibe
  let style: string;
  if (icpSegment === 'career') {
    style = 'editorial';
  } else if (icpSegment === 'executive') {
    style = vibePreference === 'bold' ? 'environmental' : 'editorial';
  } else if (icpSegment === 'creative_tech') {
    if (vibePreference === 'creative') style = 'watercolor';
    else if (vibePreference === 'bold') style = 'cyberpunk';
    else style = 'candid';
  } else if (icpSegment === 'service') {
    style = vibePreference === 'warm' ? 'environmental' : 'editorial';
  } else { // artist
    if (vibePreference === 'creative') style = 'watercolor';
    else if (vibePreference === 'bold') style = 'cyberpunk';
    else style = 'vintage';
  }
  
  // Expression based on ICP
  const expression = (icpSegment === 'career' || icpSegment === 'executive') 
    ? 'confident' 
    : (icpSegment === 'creative_tech' || icpSegment === 'service')
    ? 'warm_smile'
    : 'natural';
  
  // Identity locks based on industry
  const identityLocks = {
    eyeColor: true,
    skinTone: true,
    hairLength: true,
    hairTexture: industry === 'healthcare_medical' || industry === 'legal', // More professional standards
    glasses: industry === 'legal' || industry === 'finance_banking',
  };
  
  // Naturalness based on ICP
  let naturalness: number;
  let naturalnessPreset: 'natural' | 'polished' | 'studio';
  if (icpSegment === 'career' || icpSegment === 'executive') {
    naturalness = 50;
    naturalnessPreset = 'polished';
  } else if (icpSegment === 'creative_tech' || icpSegment === 'service') {
    naturalness = 30;
    naturalnessPreset = 'polished';
  } else {
    naturalness = 15;
    naturalnessPreset = 'natural';
  }
  
  // Background preferences
  let backgroundCategory: 'quick' | 'brand' | 'creative';
  let preferredBackgrounds: string[];
  
  if (icpSegment === 'career') {
    backgroundCategory = 'quick';
    preferredBackgrounds = ['charcoal_dark', 'warm_gray'];
  } else if (icpSegment === 'executive') {
    backgroundCategory = 'brand';
    preferredBackgrounds = ['charcoal_dark', 'deep_burgundy'];
  } else if (icpSegment === 'creative_tech') {
    backgroundCategory = 'creative';
    preferredBackgrounds = ['blurred_office', 'urban_blur', 'charcoal_dark'];
  } else if (icpSegment === 'service') {
    backgroundCategory = 'quick';
    preferredBackgrounds = ['soft_cream', 'warm_gray'];
  } else {
    backgroundCategory = 'creative';
    preferredBackgrounds = ['natural_outdoors', 'cozy_workspace'];
  }
  
  return {
    style,
    expression,
    identityLocks,
    likeness: 75, // Slightly higher than default 70
    naturalness,
    naturalnessPreset,
    backgroundCategory,
    preferredBackgrounds,
    removeBlemishes: true,
  };
}

export async function saveOnboardingData(
  uid: string,
  data: OnboardingData,
): Promise<PortraitDefaults> {
  const defaults = generateDefaultsFromOnboarding(data);
  
  await adminFirestore().collection('users').doc(uid).set(
    {
      ...data,
      onboardingCompletedAt: FieldValue.serverTimestamp(),
      defaultStyle: defaults.style,
      defaultExpression: defaults.expression,
      defaultIdentityLocks: defaults.identityLocks,
      defaultLikeness: defaults.likeness,
      defaultNaturalness: defaults.naturalness,
      defaultBackgroundCategory: defaults.backgroundCategory,
      preferredBackgrounds: defaults.preferredBackgrounds,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  
  return defaults;
}

// ── Beta Program ──────────────────────────────────────────────────────────────

export interface FeedbackSubmission {
  rating: number;
  feedback: string;
  npsScore?: number;
  featureRequests?: string;
}

/**
 * Submit beta feedback and check discount eligibility.
 * Eligible if: joinedDuringBeta AND generationCount >= 3
 */
export async function submitBetaFeedback(
  uid: string,
  data: FeedbackSubmission,
): Promise<{ eligibleForDiscount: boolean; message: string }> {
  const doc = await getUserDoc(uid);
  if (!doc) {
    throw new Error('User not found');
  }

  // Check eligibility: must have joined during beta AND generated 3+ portraits
  const generationCount = doc.generationCount ?? 0;
  const isBetaUser = doc.joinedDuringBeta === true;
  const eligibleForDiscount = isBetaUser && generationCount >= 3;

  const feedback: BetaFeedback = {
    submittedAt: FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    rating: data.rating,
    feedback: data.feedback,
    npsScore: data.npsScore,
    featureRequests: data.featureRequests,
    eligibleForDiscount,
    discountApplied: false,
  };

  await adminFirestore().collection('users').doc(uid).set(
    {
      betaFeedback: feedback,
      betaFeedbackCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const message = eligibleForDiscount
    ? 'Thank you! You are eligible for 50% off Pro or Max for 1 year. The discount will be applied at checkout.'
    : 'Thank you for your feedback!';

  return { eligibleForDiscount, message };
}

/**
 * Check if user is eligible for beta discount
 */
export async function isEligibleForBetaDiscount(uid: string): Promise<boolean> {
  const doc = await getUserDoc(uid);
  if (!doc) return false;
  
  // Must be beta user with feedback submitted and not already used discount
  if (!doc.joinedDuringBeta) return false;
  if (!doc.betaFeedback?.eligibleForDiscount) return false;
  if (doc.betaFeedback?.discountApplied) return false;
  
  return true;
}

/**
 * Mark beta discount as applied (call after successful checkout)
 */
export async function markBetaDiscountApplied(uid: string): Promise<void> {
  await adminFirestore().collection('users').doc(uid).set(
    {
      'betaFeedback.discountApplied': true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
