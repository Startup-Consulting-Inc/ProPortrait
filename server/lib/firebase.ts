import { App, getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  // Prefer explicit service account JSON (set as Secret Manager secret in Cloud Run)
  const saJson = process.env.FIREBASE_ADMIN_JSON;
  if (saJson) {
    const sa = JSON.parse(saJson) as Record<string, string>;
    return initializeApp({ credential: cert(sa), projectId: sa.project_id });
  }

  // Fallback: Application Default Credentials (works locally with gcloud auth)
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
