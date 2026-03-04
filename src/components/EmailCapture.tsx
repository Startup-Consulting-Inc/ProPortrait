import React, { useState } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';

interface EmailCaptureProps {
  open: boolean;
  onClose: () => void;
}

export default function EmailCapture({ open, onClose }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('pp_email_captured', '1');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch('/api/email/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'post-generation' }),
      });
    } catch {
      // best-effort
    } finally {
      setLoading(false);
      setSubmitted(true);
      sessionStorage.setItem('pp_email_captured', '1');
      setTimeout(onClose, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Tips on the way!</h3>
            <p className="text-sm text-slate-500">Check your inbox for pro portrait tips.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Get your portrait tips</h3>
                <p className="text-xs text-slate-500">Pro tips for better identity-locked results</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send me the tips'}
              </button>
            </form>

            <button
              onClick={handleDismiss}
              className="w-full mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors text-center"
            >
              No thanks
            </button>
          </>
        )}
      </div>
    </div>
  );
}
