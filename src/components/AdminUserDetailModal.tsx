import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Crown,
  Trash2,
  Ban,
  CheckCircle,
  Calendar,
  Mail,
  User,
  Zap,
  Edit3,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface UserDetail {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isPro: boolean;
  tier: string;
  isAdmin: boolean;
  isSuspended: boolean;
  stripeCustomerId: string;
  generationCount: number;
  generationsThisMonth: number;
  editCount: number;
  exportCount: number;
  saveCount: number;
  loginCount: number;
  totalCostUsd: number;
  defaultStyle: string;
  defaultExpression: string;
  icpSegment: string;
  industry: string;
  vibePreference: string;
  primaryUseCases: string[];
  onboardingCompletedAt: { seconds: number } | null;
  lastActiveAt: { seconds: number } | null;
  lastLoginAt: { seconds: number } | null;
  createdAt: { seconds: number } | null;
}

interface Generation {
  id: string;
  title: string;
  style: string;
  createdAt: { seconds: number } | null;
}

interface AdminUserDetailModalProps {
  open: boolean;
  userId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

const TIER_OPTIONS = [
  { value: 'free', label: 'Free', color: 'bg-slate-100 text-slate-700' },
  { value: 'creator', label: 'Creator', color: 'bg-blue-100 text-blue-700' },
  { value: 'pro', label: 'Pro', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'max', label: 'Max', color: 'bg-purple-100 text-purple-700' },
];

export default function AdminUserDetailModal({
  open,
  userId,
  onClose,
  onUpdate,
}: AdminUserDetailModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'activity'>('overview');
  
  // Edit states
  const [isEditingTier, setIsEditingTier] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (!open || !userId) return;
    
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        setUser(data.user);
        setGenerations(data.recentGenerations || []);
        setSelectedTier(data.user.tier || 'free');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [open, userId]);

  const handleUpdateTier = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.uid}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selectedTier }),
      });
      if (!response.ok) throw new Error('Failed to update tier');
      setUser({ ...user, tier: selectedTier, isPro: selectedTier !== 'free' });
      setIsEditingTier(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.uid}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspended: !user.isSuspended }),
      });
      if (!response.ok) throw new Error('Failed to update suspension');
      setUser({ ...user, isSuspended: !user.isSuspended });
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || deleteConfirmText !== 'DELETE') return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.uid}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (timestamp: { seconds: number } | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const formatDateTime = (timestamp: { seconds: number } | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg">
                {user?.displayName?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {loading ? 'Loading...' : user?.displayName || 'Unknown User'}
              </h2>
              {!loading && user && (
                <p className="text-sm text-slate-500">{user.email}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {(['overview', 'subscription', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 -mb-px capitalize transition-colors',
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : !user ? (
            <div className="text-center py-12 text-slate-500">User not found</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <StatCard
                      label="Generations"
                      value={user.generationCount}
                      icon={Zap}
                    />
                    <StatCard
                      label="Edits"
                      value={user.editCount}
                      icon={Edit3}
                    />
                    <StatCard
                      label="Exports"
                      value={user.exportCount}
                      icon={CheckCircle}
                    />
                    <StatCard
                      label="Saved"
                      value={user.saveCount}
                      icon={User}
                    />
                  </div>

                  {/* Onboarding Info */}
                  {user.onboardingCompletedAt && (
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                      <h3 className="text-sm font-semibold text-indigo-900 mb-3">
                        Onboarding Profile
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Purpose:</span>{' '}
                          <span className="font-medium capitalize">
                            {user.icpSegment?.replace('_', ' ') || 'Not set'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Industry:</span>{' '}
                          <span className="font-medium capitalize">
                            {user.industry?.replace(/_/g, ' ') || 'Not set'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Vibe:</span>{' '}
                          <span className="font-medium capitalize">
                            {user.vibePreference || 'Not set'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Completed:</span>{' '}
                          <span className="font-medium">
                            {formatDate(user.onboardingCompletedAt)}
                          </span>
                        </div>
                      </div>
                      {user.primaryUseCases?.length > 0 && (
                        <div className="mt-3">
                          <span className="text-slate-500 text-sm">Use cases:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {user.primaryUseCases.map((use) => (
                              <span
                                key={use}
                                className="px-2 py-1 bg-white rounded-md text-xs text-slate-600 border border-indigo-100"
                              >
                                {use}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Account Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <InfoCard label="User ID" value={user.uid} />
                    <InfoCard label="Stripe Customer" value={user.stripeCustomerId || 'None'} />
                    <InfoCard label="Created" value={formatDateTime(user.createdAt)} />
                    <InfoCard label="Last Active" value={formatDateTime(user.lastActiveAt)} />
                    <InfoCard label="Last Login" value={formatDateTime(user.lastLoginAt)} />
                    <InfoCard label="Total Cost" value={`$${user.totalCostUsd.toFixed(2)}`} />
                  </div>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  {/* Current Tier */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Current Plan
                      </h3>
                      <button
                        onClick={() => setIsEditingTier(!isEditingTier)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {isEditingTier ? 'Cancel' : 'Change Tier'}
                      </button>
                    </div>

                    {isEditingTier ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          {TIER_OPTIONS.map((tier) => (
                            <button
                              key={tier.value}
                              onClick={() => setSelectedTier(tier.value)}
                              className={cn(
                                'flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                                selectedTier === tier.value
                                  ? 'border-indigo-600 bg-indigo-50'
                                  : 'border-slate-200 hover:border-indigo-200'
                              )}
                            >
                              {tier.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsEditingTier(false)}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateTier}
                            disabled={isSaving || selectedTier === user.tier}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'px-3 py-1 rounded-full text-sm font-semibold',
                            TIER_OPTIONS.find((t) => t.value === user.tier)?.color ||
                              'bg-slate-100 text-slate-700'
                          )}
                        >
                          {user.tier?.toUpperCase() || 'FREE'}
                        </span>
                        {user.isPro && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Admin Actions */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900">Admin Actions</h3>
                    
                    <button
                      onClick={handleToggleSuspend}
                      disabled={isSaving}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors',
                        user.isSuspended
                          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                          : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                      )}
                    >
                      {user.isSuspended ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <div>
                            <div className="font-semibold text-sm">Unsuspend User</div>
                            <div className="text-xs opacity-80">Allow user to access their account</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Ban className="w-5 h-5" />
                          <div>
                            <div className="font-semibold text-sm">Suspend User</div>
                            <div className="text-xs opacity-80">Block access but keep data intact</div>
                          </div>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-left"
                    >
                      <Trash2 className="w-5 h-5" />
                      <div>
                        <div className="font-semibold text-sm">Delete User</div>
                        <div className="text-xs opacity-80">
                          Permanently delete user and all their data
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Delete Confirmation */}
                  {showDeleteConfirm && (
                    <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 text-sm">
                            Confirm Permanent Deletion
                          </h4>
                          <p className="text-xs text-red-700 mt-1">
                            This will delete the user account, all saved portraits, and usage data.
                            This cannot be undone.
                          </p>
                          <p className="text-xs text-red-700 mt-2">
                            Type <strong>DELETE</strong> to confirm:
                          </p>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="w-full mt-2 px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Type DELETE"
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeleteConfirmText('');
                              }}
                              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleDelete}
                              disabled={deleteConfirmText !== 'DELETE' || isSaving}
                              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                              {isSaving ? 'Deleting...' : 'Delete Forever'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Recent Saved Portraits ({generations.length})
                  </h3>
                  {generations.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl">
                      No saved portraits
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {generations.map((gen) => (
                        <div
                          key={gen.id}
                          className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-sm text-slate-900">
                              {gen.title || 'Untitled Portrait'}
                            </div>
                            <div className="text-xs text-slate-500 capitalize">
                              {gen.style || 'Unknown style'}
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">
                            {formatDate(gen.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-slate-900 truncate" title={value}>
        {value}
      </div>
    </div>
  );
}
