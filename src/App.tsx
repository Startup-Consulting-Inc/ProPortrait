/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import PortraitGenerator from './components/PortraitGenerator';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import CookieConsent from './components/CookieConsent';
import ThemeToggle from './components/ThemeToggle';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';
import UserProfileModal from './components/UserProfileModal';
import AdminPage from './pages/AdminPage';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';

function AppContent() {
  const path = window.location.pathname;
  const { user, loading } = useAuthContext();

  // Profile modal
  const [showProfile, setShowProfile] = useState(false);
  // Auth modal
  const [showAuth, setShowAuth] = useState(false);
  // Admin nav
  const [showAdmin, setShowAdmin] = useState(false);

  // Redirect to login if accessing protected routes while not authenticated
  useEffect(() => {
    if (!loading && !user && (path === '/app' || path === '/admin')) {
      setShowAuth(true);
    }
  }, [loading, user, path]);

  // Static pages — no auth required
  if (path === '/privacy') return <PrivacyPage />;
  if (path === '/terms') return <TermsPage />;

  // Landing page — public
  if (path !== '/app' && path !== '/admin') {
    return (
      <>
        <LandingPage onSignIn={() => setShowAuth(true)} />
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
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
          />
        </>
      );
    }
    return <AdminPage />;
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
        />
      </>
    );
  }

  return (
    <>
      <CookieConsent />
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
          <PortraitGenerator />
        </div>
      </div>

      <UserProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
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
