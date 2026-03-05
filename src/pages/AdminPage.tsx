import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { getIdToken } from '../services/auth';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  isPro: boolean;
  isAdmin: boolean;
  createdAt?: { seconds: number };
  generationCount?: number;
  editCount?: number;
  lastActiveAt?: { seconds: number };
  totalCostUsd?: number;
  topStyle?: string | null;
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

export default function AdminPage() {
  const { isAdmin, loading } = useAuthContext();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
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
  };

  const togglePro = async (uid: string, current: boolean) => {
    const token = await getIdToken();
    await fetch(`${API_BASE}/api/admin/users/${uid}/pro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ isPro: !current }),
    });
    setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, isPro: !current } : u));
  };

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  // Derive summary from today's stats
  const today = stats[0];
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 86400;
  const activeUsers7d = users.filter((u) => u.lastActiveAt && u.lastActiveAt.seconds > sevenDaysAgo).length;
  const totalGen = today?.generationCount ?? 0;
  const freeGen = today?.freeGenerations ?? 0;
  const proGen = today?.proGenerations ?? 0;
  const freePct = totalGen > 0 ? Math.round((freeGen / totalGen) * 100) : 0;
  const proPct = totalGen > 0 ? Math.round((proGen / totalGen) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">{users.length} users total</p>
          </div>
          <div className="flex gap-3">
            <a href="/app" className="text-sm text-slate-500 hover:text-slate-700 transition-colors py-2">
              ← Back to App
            </a>
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
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Summary Cards */}
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

        {/* User Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">User</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Joined</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Generations</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Last Active</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Est. Cost</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Top Style</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Pro</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.displayName || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 font-medium">
                    {u.generationCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {u.lastActiveAt ? relativeTime(u.lastActiveAt.seconds) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">
                    ${(u.totalCostUsd ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {u.topStyle ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => togglePro(u.uid, u.isPro)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        u.isPro
                          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {u.isPro ? 'Pro' : 'Free'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.isAdmin && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        Admin
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!fetching && users.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">No users yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
