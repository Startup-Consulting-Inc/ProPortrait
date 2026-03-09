/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import PortraitGenerator from './components/PortraitGenerator';
import ContactPage from './components/ContactPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import CookieConsent from './components/CookieConsent';
import ThemeToggle from './components/ThemeToggle';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';
import UserProfileModal from './components/UserProfileModal';
import AdminPage from './pages/AdminPage';
import OnboardingModal from './components/OnboardingModal';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import AppFooter from './components/AppFooter';
import { shouldShowOnboarding } from './services/onboarding';
import type { PortraitDefaults } from './types/onboarding';

function AppContent() {
  const path = window.location.pathname;
  const { user, loading, isPro, refreshProfile, profile } = useAuthContext();

  // Profile modal
  const [showProfile, setShowProfile] = useState(false);
  // Auth modal
  const [showAuth, setShowAuth] = useState(false);
  // Admin nav
  const [showAdmin, setShowAdmin] = useState(false);
  // Payment success banner
  const [paymentPending, setPaymentPending] = useState(() =>
    new URLSearchParams(window.location.search).get('payment') === 'success',
  );
  const [proActivated, setProActivated] = useState(false);
  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDefaults, setOnboardingDefaults] = useState<PortraitDefaults | null>(null);
  const [pendingOnboarding, setPendingOnboarding] = useState(false);

  // After Stripe redirect with ?payment=success, poll until Firestore reflects isPro=true
  useEffect(() => {
    if (!paymentPending || loading) return;
    if (isPro) {
      setPaymentPending(false);
      setProActivated(true);
      // Clean URL
      window.history.replaceState({}, '', '/app');
      setTimeout(() => setProActivated(false), 6000);
      return;
    }
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      await refreshProfile();
      if (attempts >= 15) {
        clearInterval(interval);
        setPaymentPending(false);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [paymentPending, loading, isPro]);

  // Redirect to login if accessing protected routes while not authenticated
  useEffect(() => {
    if (!loading && !user && (path === '/app' || path === '/admin')) {
      setShowAuth(true);
    }
  }, [loading, user, path]);

  // Check if user needs onboarding after auth loads
  useEffect(() => {
    if (!loading && user && path === '/app') {
      // Check for pending onboarding from session (set before redirect to /app)
      const pendingFromSession = sessionStorage.getItem('pp_pending_onboarding') === 'true';
      if (pendingFromSession) {
        sessionStorage.removeItem('pp_pending_onboarding');
        // Check if onboarding hasn't been completed yet
        if (shouldShowOnboarding(profile)) {
          setShowOnboarding(true);
        }
        return;
      }
      
      // Also check the in-memory flag (for same-page transitions)
      if (pendingOnboarding && shouldShowOnboarding(profile)) {
        setShowOnboarding(true);
        setPendingOnboarding(false);
      }
    }
  }, [loading, user, profile, path, pendingOnboarding]);

  const handleAccountCreated = useCallback(() => {
    setPendingOnboarding(true);
    // Persist across redirect to /app
    sessionStorage.setItem('pp_pending_onboarding', 'true');
  }, []);

  const handleOnboardingComplete = useCallback((defaults: PortraitDefaults) => {
    setOnboardingDefaults(defaults);
    setShowOnboarding(false);
    void refreshProfile(); // Refresh to get the saved defaults
  }, [refreshProfile]);

  const handleOnboardingSkip = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  // Static pages — no auth required
  if (path === '/contact') return <ContactPage />;
  if (path === '/privacy') return <PrivacyPage />;
  if (path === '/terms') return <TermsPage />;

  // Landing page — public
  if (path !== '/app' && path !== '/admin') {
    return (
      <>
        <LandingPage onSignIn={() => setShowAuth(true)} />
        <AuthModal
          open={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={() => { window.location.href = '/app'; }}
          onAccountCreated={handleAccountCreated}
        />
      </>
    );
  }

  // Admin page
  if (path === '/admin') {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    if (!user) {
      return (
        <>
          <LandingPage onSignIn={() => setShowAuth(true)} />
          <AuthModal
            open={showAuth}
            onClose={() => setShowAuth(false)}
            onSuccess={() => {
              setShowAuth(false);
              window.location.href = '/admin';
            }}
            onAccountCreated={handleAccountCreated}
          />
        </>
      );
    }
    return (
      <>
        <AdminPage />
        <AppFooter />
      </>
    );
  }

  // /app — requires auth
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('pp_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('pp_theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleThemeChange = (t: 'light' | 'dark') => {
    setTheme(t);
    localStorage.setItem('pp_theme', t);
  };

  // Show loading spinner while Firebase resolves auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not signed in — show landing with auth modal
  if (!user) {
    return (
      <>
        <LandingPage onSignIn={() => setShowAuth(true)} />
        <AuthModal
          open={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            window.location.href = '/app';
          }}
          onAccountCreated={handleAccountCreated}
        />
      </>
    );
  }

  return (
    <>
      <CookieConsent />
      {paymentPending && (
        <div className="fixed top-0 inset-x-0 z-50 bg-indigo-600 text-white text-sm text-center py-2.5 flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Activating your Pro plan…
        </div>
      )}
      {proActivated && (
        <div className="fixed top-0 inset-x-0 z-50 bg-emerald-600 text-white text-sm text-center py-2.5">
          Pro plan activated — enjoy 2K portraits and priority generation!
        </div>
      )}
      <div
        data-theme={theme}
        className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 selection:text-indigo-900 relative"
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
        <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
          <UserMenu
            onOpenProfile={() => setShowProfile(true)}
            onOpenAdmin={() => { window.location.href = '/admin'; }}
          />
          <ThemeToggle theme={theme} onChange={handleThemeChange} />
        </div>
        <div className="relative z-10 py-12">
          <PortraitGenerator onboardingDefaults={onboardingDefaults ?? undefined} />
        </div>
        <AppFooter />
      </div>

      <UserProfileModal 
        open={showProfile} 
        onClose={() => setShowProfile(false)} 
        onRetakeOnboarding={() => setShowOnboarding(true)}
      />

      <OnboardingModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
