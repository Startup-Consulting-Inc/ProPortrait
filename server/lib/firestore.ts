import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from './firebase.js';

export type Tier = 'free' | 'creator' | 'pro' | 'max';

export interface UserDoc {
  email: string;
  displayName: string;
  photoURL?: string;
  isPro: boolean;
  isAdmin: boolean;
  tier?: Tier;
  stripeCustomerId?: string;
  // Generation limits
  generationCount?: number;
  generationsThisMonth?: number;
  lastResetMonth?: string; // YYYY-MM
  // Save limits
  saveCount?: number;
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

/** Check generation limits and increment counter. Throws with code if over limit. */
export async function checkAndIncrementGeneration(uid: string, doc: UserDoc): Promise<void> {
  const tier: Tier = doc.tier ?? (doc.isPro ? 'pro' : 'free');
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const generationCount = doc.generationCount ?? 0;
  let generationsThisMonth = doc.generationsThisMonth ?? 0;

  // Monthly reset for pro/max
  if ((tier === 'pro' || tier === 'max') && doc.lastResetMonth !== currentMonth) {
    generationsThisMonth = 0;
    await adminFirestore().collection('users').doc(uid).update({
      generationsThisMonth: 0,
      lastResetMonth: currentMonth,
    });
  }

  if (tier === 'free' && generationCount >= 3) {
    throw Object.assign(new Error('Free plan limit reached (3 portraits). Upgrade to continue.'), { code: 'generation_limit' });
  }
  if (tier === 'creator' && generationCount >= 30) {
    throw Object.assign(new Error('Creator Pass limit reached (30 portraits).'), { code: 'generation_limit' });
  }
  if (tier === 'pro' && generationsThisMonth >= 100) {
    throw Object.assign(new Error('Pro monthly limit reached (100/month). Resets next month.'), { code: 'generation_limit' });
  }
  if (tier === 'max' && generationsThisMonth >= 500) {
    throw Object.assign(new Error('Max monthly limit reached (500/month). Resets next month.'), { code: 'generation_limit' });
  }
}

// ── Saved Portraits ───────────────────────────────────────────────────────────

export async function checkSaveLimit(uid: string, doc: UserDoc): Promise<void> {
  const tier: Tier = doc.tier ?? (doc.isPro ? 'pro' : 'free');
  if (tier === 'free') {
    throw Object.assign(new Error('Free users cannot save portraits. Upgrade to save.'), { code: 'save_limit' });
  }
  if (tier === 'creator' && (doc.saveCount ?? 0) >= 30) {
    throw Object.assign(new Error('Creator Pass save limit reached (30 saves).'), { code: 'save_limit' });
  }
  // pro and max: unlimited
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
