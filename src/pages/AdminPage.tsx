import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { getIdToken } from '../services/auth';
import AdminUserDetailModal from '../components/AdminUserDetailModal';
import { Search, Crown, Ban, Filter, RefreshCw, Users, BarChart3 } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  isPro: boolean;
  tier: string;
  isAdmin: boolean;
  isSuspended: boolean;
  createdAt: { seconds: number } | null;
  generationCount: number;
  editCount: number;
  exportCount: number;
  loginCount: number;
  lastActiveAt: { seconds: number } | null;
  lastLoginAt: { seconds: number } | null;
  totalCostUsd: number;
  styleUsage: Record<string, number>;
  topStyle: string | null;
}

interface DailyStat {
  date: string;
  generationCount?: number;
  editCount?: number;
  totalCostUsd?: number;
  freeGenerations?: number;
  proGenerations?: number;
}

type TierFilter = 'all' | 'free' | 'creator' | 'pro' | 'max';
type StatusFilter = 'all' | 'active' | 'suspended';

function relativeTime(seconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtDate(ts: { seconds: number } | null): string {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString();
}

function fmtActive(ts: { seconds: number } | null): string {
  if (!ts) return '—';
  return relativeTime(ts.seconds);
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

// ── Rankings Tab ──────────────────────────────────────────────────────────────

function RankingCard({
  title,
  users,
  value,
  format,
  onSelect,
}: {
  title: string;
  users: AdminUser[];
  value: (u: AdminUser) => number;
  format: (v: number, u: AdminUser) => string;
  onSelect: (u: AdminUser) => void;
}) {
  const top = [...users].sort((a, b) => value(b) - value(a)).slice(0, 5);
  const maxVal = Math.max(1, value(top[0]));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {top.length === 0 ? (
        <p className="text-sm text-slate-400">No data yet.</p>
      ) : (
        <ol className="space-y-2.5">
          {top.map((u, i) => {
            const v = value(u);
            return (
              <li key={u.uid} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                <button
                  onClick={() => onSelect(u)}
                  className="text-sm font-medium text-slate-700 hover:text-indigo-600 truncate flex-1 text-left"
                >
                  {u.displayName || u.email}
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${Math.round((v / maxVal) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-14 text-right">{format(v, u)}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { isAdmin, loading } = useAuthContext();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'rankings'>('users');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchAll = useCallback(async () => {
    setFetching(true);
    setError('');
    try {
      const token = await getIdToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users`, { headers, credentials: 'include' }),
        fetch(`${API_BASE}/api/admin/stats`, { headers, credentials: 'include' }),
      ]);
      if (!usersRes.ok || !statsRes.ok) throw new Error('Failed');
      const [usersData, statsData] = await Promise.all([usersRes.json(), statsRes.json()]);
      setUsers(usersData.users as AdminUser[]);
      setStats(statsData.stats as DailyStat[]);
    } catch {
      setError('Failed to load data.');
    } finally {
      setFetching(false);
    }
  }, []);

  const togglePro = async (uid: string, current: boolean, tier = 'pro') => {
    const token = await getIdToken();
    await fetch(`${API_BASE}/api/admin/users/${uid}/pro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ isPro: !current, tier }),
    });
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isPro: !current } : u));
  };

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin, fetchAll]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          u.email.toLowerCase().includes(query) ||
          u.displayName?.toLowerCase().includes(query) ||
          u.uid.toLowerCase().includes(query);
        if (!matches) return false;
      }
      
      // Tier filter
      if (tierFilter !== 'all' && u.tier !== tierFilter) return false;
      
      // Status filter
      if (statusFilter === 'suspended' && !u.isSuspended) return false;
      if (statusFilter === 'active' && u.isSuspended) return false;
      
      return true;
    });
  }, [users, searchQuery, tierFilter, statusFilter]);

  // Derived summary
  const today = stats[0];
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 86400;
  const activeUsers7d = users.filter(u => u.lastActiveAt && u.lastActiveAt.seconds > sevenDaysAgo).length;
  const totalGen = today?.generationCount ?? 0;
  const freeGen = today?.freeGenerations ?? 0;
  const proGen = today?.proGenerations ?? 0;
  const freePct = totalGen > 0 ? Math.round((freeGen / totalGen) * 100) : 0;
  const proPct  = totalGen > 0 ? Math.round((proGen  / totalGen) * 100) : 0;
  
  // Stats by tier
  const statsByTier = useMemo(() => {
    return {
      free: users.filter(u => u.tier === 'free').length,
      creator: users.filter(u => u.tier === 'creator').length,
      pro: users.filter(u => u.tier === 'pro').length,
      max: users.filter(u => u.tier === 'max').length,
      suspended: users.filter(u => u.isSuspended).length,
    };
  }, [users]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-500">You don't have permission to view this page.</p>
          <a href="/app" className="mt-6 inline-block text-indigo-600 hover:underline text-sm">Go to App</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">
                {users.length} users · {statsByTier.suspended} suspended
              </p>
            </div>
            <div className="flex gap-3">
              <a href="/app" className="text-sm text-slate-500 hover:text-slate-700 transition-colors py-2">← Back to App</a>
              <button
                onClick={fetchAll}
                disabled={fetching}
                className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                {fetching ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard
              icon={Users}
              label="Total Users"
              value={users.length}
              subtext={`${activeUsers7d} active (7d)`}
            />
            <StatCard
              icon={Crown}
              label="Pro Users"
              value={statsByTier.pro + statsByTier.max + statsByTier.creator}
              subtext={`${statsByTier.pro} Pro · ${statsByTier.max} Max`}
              color="indigo"
            />
            <StatCard
              icon={Ban}
              label="Suspended"
              value={statsByTier.suspended}
              subtext="Blocked access"
              color="amber"
            />
            <StatCard
              icon={BarChart3}
              label="Gen Today"
              value={totalGen}
              subtext={`${freePct}% free · ${proPct}% pro`}
            />
            <StatCard
              icon={BarChart3}
              label="Est. Cost Today"
              value={`$${(today?.totalCostUsd ?? 0).toFixed(2)}`}
              subtext="API cost estimate"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-200 rounded-lg p-1 w-fit mb-5">
            {(['users', 'rankings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value as TierFilter)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Tiers</option>
                    <option value="free">Free</option>
                    <option value="creator">Creator</option>
                    <option value="pro">Pro</option>
                    <option value="max">Max</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">User</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Tier</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Joined</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Logins</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Gen</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Edits</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Last Active</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Est. Cost</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Top Style</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(u => (
                      <tr
                        key={u.uid}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${u.isSuspended ? 'opacity-50' : ''}`}
                        onClick={() => setSelectedUserId(u.uid)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                              {initials(u.displayName)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{u.displayName || '—'}</div>
                              <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            u.tier === 'free' ? 'bg-slate-100 text-slate-600' :
                            u.tier === 'creator' ? 'bg-blue-100 text-blue-700' :
                            u.tier === 'pro' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {u.tier?.toUpperCase() || 'FREE'}
                          </span>
                          {u.isSuspended && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              SUSPENDED
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(u.createdAt)}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{u.loginCount}</td>
                        <td className="px-4 py-3 text-right text-slate-700 font-medium">{u.generationCount}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{u.editCount}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmtActive(u.lastActiveAt)}</td>
                        <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">${u.totalCostUsd.toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs capitalize">{u.topStyle?.replace(/_/g, ' ') ?? '—'}</td>
                        <td className="px-4 py-3 text-center" onClick={e => { e.stopPropagation(); togglePro(u.uid, u.isPro); }}>
                          <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                            {u.isPro ? 'Remove Pro' : 'Make Pro'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!fetching && filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                          {searchQuery || tierFilter !== 'all' || statusFilter !== 'all'
                            ? 'No users match your filters.'
                            : 'No users yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rankings Tab */}
          {activeTab === 'rankings' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RankingCard
                title="Most Generations"
                users={users}
                value={u => u.generationCount}
                format={v => `${v} gen`}
                onSelect={(u) => setSelectedUserId(u.uid)}
              />
              <RankingCard
                title="Highest Spend"
                users={users}
                value={u => u.totalCostUsd}
                format={v => `$${v.toFixed(2)}`}
                onSelect={(u) => setSelectedUserId(u.uid)}
              />
              <RankingCard
                title="Most Active"
                users={users}
                value={u => u.lastActiveAt?.seconds ?? 0}
                format={(_, u) => fmtActive(u.lastActiveAt)}
                onSelect={(u) => setSelectedUserId(u.uid)}
              />
              <RankingCard
                title="Most Exports"
                users={users}
                value={u => u.exportCount}
                format={v => `${v} export${v !== 1 ? 's' : ''}`}
                onSelect={(u) => setSelectedUserId(u.uid)}
              />
            </div>
          )}

        </div>
      </div>

      {/* User detail modal */}
      <AdminUserDetailModal
        open={!!selectedUserId}
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onUpdate={fetchAll}
      />
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'slate',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext: string;
  color?: 'slate' | 'indigo' | 'amber';
}) {
  const colorClasses = {
    slate: 'bg-white border-slate-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    amber: 'bg-amber-50 border-amber-200',
  };

  const iconColors = {
    slate: 'text-slate-400',
    indigo: 'text-indigo-500',
    amber: 'text-amber-500',
  };

  return (
    <div className={`rounded-xl border px-5 py-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${iconColors[color]}`} />
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subtext}</p>
    </div>
  );
}
