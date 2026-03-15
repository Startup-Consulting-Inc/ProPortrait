import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { updateUserProfile, deleteUserAccount, openBillingPortal } from '../services/user';
import { sendPasswordReset, deleteAccount } from '../services/auth';
import type { IdentityLocks, StyleOption, ExpressionPreset } from '../services/ai';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  onApplyPreferences?: (prefs: {
    style?: StyleOption;
    expression?: ExpressionPreset;
    identityLocks?: IdentityLocks;
    likeness?: number;
    naturalness?: number;
  }) => void;
  onRetakeOnboarding?: () => void;
}

type Tab = 'profile' | 'preferences' | 'account' | 'billing';

const STYLES: { value: StyleOption; label: string }[] = [
  { value: 'editorial', label: 'Editorial' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'candid', label: 'Candid' },
  { value: 'vintage', label: 'Vintage 35mm' },
  { value: 'bw', label: 'Black & White' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'watercolor', label: 'Watercolor' },
];

const EXPRESSIONS: { value: ExpressionPreset; label: string }[] = [
  { value: 'warm_smile', label: 'Warm Smile' },
  { value: 'confident', label: 'Confident' },
  { value: 'serious', label: 'Serious' },
  { value: 'natural', label: 'Natural' },
];

export default function UserProfileModal({ open, onClose, onApplyPreferences, onRetakeOnboarding }: UserProfileModalProps) {
  const { user, profile, hdCredits, platformCredits, refreshProfile } = useAuthContext();
  const [tab, setTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile tab state
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  // Preferences tab state
  const [style, setStyle] = useState<StyleOption>('editorial');
  const [expression, setExpression] = useState<ExpressionPreset>('warm_smile');
  const [identityLocks, setIdentityLocks] = useState<IdentityLocks>({
    eyeColor: true, skinTone: true, hairLength: true, hairTexture: false, glasses: false,
  });
  const [likeness, setLikeness] = useState(50);
  const [naturalness, setNaturalness] = useState(50);

  // Account tab state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Sync from profile
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || '');
    setPhotoURL(profile.photoURL || '');
    setStyle((profile.defaultStyle as StyleOption) || 'corporate');
    setExpression((profile.defaultExpression as ExpressionPreset) || 'confident_neutral');
    if (profile.defaultIdentityLocks) setIdentityLocks(profile.defaultIdentityLocks);
    if (profile.defaultLikeness !== undefined) setLikeness(profile.defaultLikeness);
    if (profile.defaultNaturalness !== undefined) setNaturalness(profile.defaultNaturalness);
  }, [profile, open]);

  if (!open || !user) return null;

  const clearMessages = () => { setError(''); setSuccess(''); };

  const handleSaveProfile = async () => {
    clearMessages();
    setSaving(true);
    try {
      await updateUserProfile({ displayName, photoURL: photoURL || undefined });
      await refreshProfile();
      setSuccess('Profile saved.');
    } catch {
      setError('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrefs = async () => {
    clearMessages();
    setSaving(true);
    try {
      await updateUserProfile({
        defaultStyle: style,
        defaultExpression: expression,
        defaultIdentityLocks: identityLocks,
        defaultLikeness: likeness,
        defaultNaturalness: naturalness,
      });
      await refreshProfile();
      setSuccess('Preferences saved.');
    } catch {
      setError('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleApply = () => {
    onApplyPreferences?.({ style, expression, identityLocks, likeness, naturalness });
    setSuccess('Applied to current session.');
  };

  const handlePasswordReset = async () => {
    if (!user.email) return;
    setSaving(true);
    try {
      await sendPasswordReset(user.email);
      setResetSent(true);
    } catch {
      setError('Failed to send reset email.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Type DELETE to confirm.');
      return;
    }
    setSaving(true);
    try {
      await deleteUserAccount();
      await deleteAccount();
      onClose();
    } catch {
      setError('Failed to delete account. Please sign in again and retry.');
    } finally {
      setSaving(false);
    }
  };

  const handleBillingPortal = async () => {
    clearMessages();
    setSaving(true);
    try {
      const url = await openBillingPortal();
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing portal.');
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'preferences', label: 'Preferences' },
    { key: 'account', label: 'Account' },
    { key: 'billing', label: 'Billing' },
  ];

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Profile & Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 flex-shrink-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); clearMessages(); }}
              className={`py-2 px-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{success}</div>
          )}

          {/* Profile tab */}
          {tab === 'profile' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Photo URL (optional)</label>
                <input
                  type="url"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://..."
                  className="border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="self-start bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
              >
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          )}

          {/* Preferences tab */}
          {tab === 'preferences' && (
            <div className="flex flex-col gap-5">
              {/* Onboarding Profile Summary */}
              {profile?.onboardingCompletedAt && (
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-indigo-900">Your Portrait Profile</h4>
                    {onRetakeOnboarding && (
                      <button
                        onClick={() => { onClose(); onRetakeOnboarding(); }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Retake Quiz
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {profile.icpSegment && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Purpose:</span>
                        <span className="font-medium text-slate-700 capitalize">
                          {profile.icpSegment.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    {profile.industry && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Industry:</span>
                        <span className="font-medium text-slate-700">
                          {profile.industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    )}
                    {profile.vibePreference && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Vibe:</span>
                        <span className="font-medium text-slate-700 capitalize">
                          {profile.vibePreference}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Default Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStyle(s.value)}
                      className={`py-1.5 px-2 text-xs rounded-lg border transition-colors ${
                        style === s.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Default Expression</label>
                <div className="flex flex-wrap gap-2">
                  {EXPRESSIONS.map((ex) => (
                    <button
                      key={ex.value}
                      onClick={() => setExpression(ex.value)}
                      className={`py-1.5 px-3 text-xs rounded-lg border transition-colors ${
                        expression === ex.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Identity Locks</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(identityLocks) as (keyof IdentityLocks)[]).map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={identityLocks[key]}
                        onChange={(e) => setIdentityLocks((prev) => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                      <span className="text-sm text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Likeness Strength: {likeness}%</label>
                <input type="range" min={0} max={100} value={likeness} onChange={(e) => setLikeness(+e.target.value)} className="w-full accent-indigo-600" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Naturalness: {naturalness}%</label>
                <input type="range" min={0} max={100} value={naturalness} onChange={(e) => setNaturalness(+e.target.value)} className="w-full accent-indigo-600" />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSavePrefs}
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  {saving ? 'Saving…' : 'Save Preferences'}
                </button>
                {onApplyPreferences && (
                  <button
                    onClick={handleApply}
                    className="flex-1 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    Apply to Session
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Account tab */}
          {tab === 'account' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <div className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 bg-slate-50">
                  {user.email}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium text-slate-700">Password</div>
                {resetSent ? (
                  <div className="text-sm text-green-600">Reset email sent. Check your inbox.</div>
                ) : (
                  <button
                    onClick={handlePasswordReset}
                    disabled={saving}
                    className="self-start text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Send password reset email
                  </button>
                )}
              </div>

              <div className="border-t border-slate-200 pt-5 flex flex-col gap-3">
                <div className="text-sm font-semibold text-red-600">Danger Zone</div>
                <p className="text-sm text-slate-500">
                  Permanently delete your account and all data. This cannot be undone.
                </p>
                <input
                  type="text"
                  placeholder='Type "DELETE" to confirm'
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="border border-red-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-400"
                />
                <button
                  onClick={handleDeleteAccount}
                  disabled={saving || deleteConfirm !== 'DELETE'}
                  className="self-start bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
                >
                  {saving ? 'Deleting…' : 'Delete My Account'}
                </button>
              </div>
            </div>
          )}

          {/* Billing tab */}
          {tab === 'billing' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-sm font-medium text-slate-700">Credits</div>
                  <div className="text-lg font-bold text-indigo-600">{hdCredits} HD · {platformCredits} Platform</div>
                  <div className="text-xs text-slate-400 mt-0.5">Pay-per-download · No subscription</div>
                </div>
              </div>
              {profile?.stripeCustomerId && (
                <button
                  onClick={handleBillingPortal}
                  disabled={saving}
                  className="w-full border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  {saving ? 'Opening…' : 'View Purchase History'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    </>
  );
}
