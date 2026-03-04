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

export default function App() {
  const path = window.location.pathname;
  if (path === '/privacy') return <PrivacyPage />;
  if (path === '/terms') return <TermsPage />;
  if (path !== '/app') return <LandingPage />;

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

  return (
    <>
      <CookieConsent />
      <div
        data-theme={theme}
        className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 selection:text-indigo-900 relative"
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle theme={theme} onChange={handleThemeChange} />
        </div>
        <div className="relative z-10 py-12">
          <PortraitGenerator />
        </div>
      </div>
    </>
  );
}
