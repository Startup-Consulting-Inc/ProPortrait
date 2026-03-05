import { App, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'portrait-7b01d',
  });
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function adminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}
