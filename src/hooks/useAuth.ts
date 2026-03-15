import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { auth, signInWithGoogle, signInWithEmail, createAccountWithEmail, signOut } from '../services/auth';
import { notifyFirstLogin, fetchUserProfile } from '../services/user';
import type { UserProfile, Tier } from '../services/user';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isPro: boolean;
  isAdmin: boolean;
  tier: Tier;
  hdCredits: number;
  platformCredits: number;
  isFirebaseUser: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccount: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const prof = await fetchUserProfile();
      setProfile(prof);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          await notifyFirstLogin(
            firebaseUser.displayName ?? undefined,
            firebaseUser.photoURL ?? undefined,
          );
          await loadProfile();
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignInWithGoogle = async () => {
    await signInWithGoogle();
    // onAuthStateChanged handles the rest
  };

  const handleSignInWithEmail = async (email: string, password: string) => {
    await signInWithEmail(email, password);
  };

  const handleCreateAccount = async (email: string, password: string, displayName: string) => {
    const cred = await createAccountWithEmail(email, password, displayName);
    // Explicitly seed Firestore with the correct displayName before onAuthStateChanged fires
    await notifyFirstLogin(displayName, cred.user.photoURL ?? undefined);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/';
  };

  const derivedTier: Tier = profile?.tier ?? 'free';
  // New credit fields; legacy downloadCredits counts as hdCredits for backward compat
  const derivedHdCredits = profile?.hdCredits ?? (profile?.downloadCredits ?? 0);
  const derivedPlatformCredits = profile?.platformCredits ?? 0;

  return {
    user,
    profile,
    loading,
    isPro: derivedTier !== 'free',
    isAdmin: profile?.isAdmin ?? false,
    tier: derivedTier,
    hdCredits: derivedHdCredits,
    platformCredits: derivedPlatformCredits,
    isFirebaseUser: !!user,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithEmail: handleSignInWithEmail,
    createAccount: handleCreateAccount,
    signOut: handleSignOut,
    refreshProfile: loadProfile,
  };
}
