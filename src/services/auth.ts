import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  deleteUser,
  getIdToken as firebaseGetIdToken,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ?? 'portrait-7b01d.firebaseapp.com',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) ?? 'portrait-7b01d',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ?? 'portrait-7b01d.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function createAccountWithEmail(email: string, password: string, displayName: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  return cred;
}

export async function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in');
  return deleteUser(user);
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await firebaseGetIdToken(user);
  } catch {
    return null;
  }
}
