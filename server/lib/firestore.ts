import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from './firebase.js';

export interface UserDoc {
  email: string;
  displayName: string;
  photoURL?: string;
  isPro: boolean;
  isAdmin: boolean;
  stripeCustomerId?: string;
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
  await adminFirestore().collection('users').doc(uid).set(
    {
      generationCount: FieldValue.increment(1),
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
