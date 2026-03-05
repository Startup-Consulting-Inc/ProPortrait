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
