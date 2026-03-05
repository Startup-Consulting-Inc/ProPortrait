import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { sendPasswordReset } from '../services/auth';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: 'signin' | 'create';
}

export default function AuthModal({ open, onClose, onSuccess, initialTab = 'signin' }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, createAccount } = useAuthContext();
  const [tab, setTab] = useState<'signin' | 'create'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTab(initialTab);
    setError('');
    setResetSent(false);
  }, [open, initialTab]);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const friendlyError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
      return 'Incorrect email or password.';
    }
    if (msg.includes('email-already-in-use')) return 'An account with this email already exists.';
    if (msg.includes('weak-password')) return 'Password must be at least 6 characters.';
    if (msg.includes('popup-closed')) return '';
    return 'Something went wrong. Please try again.';
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = friendlyError(err);
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Please enter your name.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await createAccount(email, password, displayName.trim());
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email address first.'); return; }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
      setError('');
    } catch {
      setError('Failed to send reset email. Check your email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="h-6 w-6" />
            <span className="font-bold text-slate-900">ProPortrait AI</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 pt-5">
          {(['signin', 'create'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setResetSent(false); }}
              className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <div className="px-6 pb-6 pt-5 flex flex-col gap-4">
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Reset sent */}
          {resetSent && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
              Password reset email sent. Check your inbox.
            </div>
          )}

          {/* Form */}
          <form onSubmit={tab === 'signin' ? handleEmailSignIn : handleCreate} className="flex flex-col gap-3">
            {tab === 'create' && (
              <input
                type="text"
                placeholder="Full name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder={tab === 'create' ? 'Password (min 8 characters)' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={tab === 'create' ? 8 : 1}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {tab === 'signin' && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-indigo-600 hover:text-indigo-800 text-right transition-colors self-end"
              >
                Forgot password?
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-1"
            >
              {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
