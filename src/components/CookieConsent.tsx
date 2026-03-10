import { useState, useEffect } from 'react';
import { optIn, optOut } from '../services/analytics';

const STORAGE_KEY = 'pp_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setVisible(true);
    }
    // Ensure PostHog reflects stored choice on reload
    if (consent === 'accepted') optIn();
    if (consent === 'declined') optOut();
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    optIn();
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    optOut();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl mx-auto px-4"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm text-slate-600 flex-1">
          We use analytics cookies to improve ProPortrait AI.{' '}
          <a href="/privacy" className="underline hover:text-indigo-600">Privacy policy</a>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-4 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
