import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { getIdToken } from '../services/auth';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  isPro: boolean;
  tier: string;
  isAdmin: boolean;
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

// ── User Detail Drawer ────────────────────────────────────────────────────────

function UserDrawer({
  user,
  onClose,
  onTogglePro,
}: {
  user: AdminUser;
  onClose: () => void;
  onTogglePro: (uid: string, current: boolean) => Promise<void>;
}) {
  const maxStyle = Math.max(1, ...Object.values(user.styleUsage));
  const sortedStyles = Object.entries(user.styleUsage).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-slate-200">
          <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials(user.displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 truncate">{user.displayName || '—'}</h2>
              {user.isPro && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 capitalize">{user.tier}</span>}
              {user.isAdmin && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Admin</span>}
            </div>
            <p className="text-sm text-slate-500 font-mono truncate">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none flex-shrink-0">×</button>
        </div>

        {/* Stats grid */}
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Activity</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Joined',        value: fmtDate(user.createdAt) },
              { label: 'Last Active',   value: fmtActive(user.lastActiveAt) },
              { label: 'Last Login',    value: fmtActive(user.lastLoginAt) },
              { label: 'Logins',        value: user.loginCount },
              { label: 'Generations',   value: user.generationCount },
              { label: 'Edits',         value: user.editCount },
              { label: 'Exports',       value: user.exportCount },
              { label: 'Est. Cost',     value: `$${user.totalCostUsd.toFixed(2)}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-semibold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Style usage */}
        {sortedStyles.length > 0 && (
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Style Usage</h3>
            <div className="space-y-2">
              {sortedStyles.map(([style, count]) => (
                <div key={style} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-28 truncate capitalize">{style.replace(/_/g, ' ')}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${Math.round((count / maxStyle) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 mt-auto">
          <button
            onClick={() => onTogglePro(user.uid, user.isPro)}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              user.isPro
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {user.isPro ? 'Remove Pro Access' : 'Grant Pro Access'}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

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
    setSelectedUser(prev => prev?.uid === uid ? { ...prev, isPro: !current } : prev);
  };

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin, fetchAll]);

  // Derived summary
  const today = stats[0];
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 86400;
  const activeUsers7d = users.filter(u => u.lastActiveAt && u.lastActiveAt.seconds > sevenDaysAgo).length;
  const totalGen = today?.generationCount ?? 0;
  const freeGen = today?.freeGenerations ?? 0;
  const proGen = today?.proGenerations ?? 0;
  const freePct = totalGen > 0 ? Math.round((freeGen / totalGen) * 100) : 0;
  const proPct  = totalGen > 0 ? Math.round((proGen  / totalGen) * 100) : 0;

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
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">{users.length} users total</p>
            </div>
            <div className="flex gap-3">
              <a href="/app" className="text-sm text-slate-500 hover:text-slate-700 transition-colors py-2">← Back to App</a>
              <button
                onClick={fetchAll}
                disabled={fetching}
                className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {fetching ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Generations Today</p>
              <p className="text-2xl font-bold text-slate-900">{totalGen}</p>
              <p className="text-xs text-slate-400 mt-1">{freeGen} free · {proGen} pro</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Est. Cost Today</p>
              <p className="text-2xl font-bold text-slate-900">${(today?.totalCostUsd ?? 0).toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">API cost estimate</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Active (7d)</p>
              <p className="text-2xl font-bold text-slate-900">{activeUsers7d}</p>
              <p className="text-xs text-slate-400 mt-1">of {users.length} registered</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Free / Pro Split</p>
              <p className="text-2xl font-bold text-slate-900">{freePct}% / {proPct}%</p>
              <p className="text-xs text-slate-400 mt-1">today's generations</p>
            </div>
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
            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">User</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Joined</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Logins</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Gen</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Edits</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Exports</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Last Active</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Est. Cost</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Top Style</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Pro</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr
                      key={u.uid}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(u)}
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">{u.displayName || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{u.email}</td>
                      <td className="px-4 py-3 text-slate-400">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{u.loginCount}</td>
                      <td className="px-4 py-3 text-right text-slate-700 font-medium">{u.generationCount}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{u.editCount}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{u.exportCount}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{fmtActive(u.lastActiveAt)}</td>
                      <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">${u.totalCostUsd.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs capitalize">{u.topStyle?.replace(/_/g, ' ') ?? '—'}</td>
                      <td className="px-4 py-3 text-center" onClick={e => { e.stopPropagation(); togglePro(u.uid, u.isPro); }}>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          u.isPro ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}>
                          {u.isPro ? u.tier : 'Free'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.isAdmin && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!fetching && users.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-4 py-8 text-center text-slate-400">No users yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                onSelect={setSelectedUser}
              />
              <RankingCard
                title="Highest Spend"
                users={users}
                value={u => u.totalCostUsd}
                format={v => `$${v.toFixed(2)}`}
                onSelect={setSelectedUser}
              />
              <RankingCard
                title="Most Active"
                users={users}
                value={u => u.lastActiveAt?.seconds ?? 0}
                format={(_, u) => fmtActive(u.lastActiveAt)}
                onSelect={setSelectedUser}
              />
              <RankingCard
                title="Most Exports"
                users={users}
                value={u => u.exportCount}
                format={v => `${v} export${v !== 1 ? 's' : ''}`}
                onSelect={setSelectedUser}
              />
            </div>
          )}

        </div>
      </div>

      {/* User detail drawer */}
      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onTogglePro={togglePro}
        />
      )}
    </>
  );
}
