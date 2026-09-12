import { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { Problem, StatsOverview, User } from '@sih/shared-types';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { StatTile } from '../components/StatTile.js';
import { Button } from '../components/Button.js';
import { PriorityBadge, StatusBadge } from '../components/Badge.js';

const CATEGORY_PALETTE: Record<string, string> = {
  water: '#0284c7',
  road: '#ea580c',
  health: '#e11d48',
  other: '#10b981',
};

// Heuristic AI suitability scoring for universities
function calculateSuitability(problem: Problem, university: User): { score: number; rationale: string } {
  const org = (university.organization || university.full_name || '').toLowerCase();
  const cat = problem.category || 'other';

  if (cat === 'water') {
    if (org.includes('bit') || org.includes('mesra')) {
      return { score: 96, rationale: 'Center for Water Resource Engg' };
    }
    if (org.includes('ism') || org.includes('iit') || org.includes('dhanbad')) {
      return { score: 91, rationale: 'Dept of Environmental Science & Engg' };
    }
    if (org.includes('birsa') || org.includes('agri')) {
      return { score: 88, rationale: 'Agricultural Watershed Dept' };
    }
    return { score: 78, rationale: 'Applied Hydrology Group' };
  }

  if (cat === 'road') {
    if (org.includes('nit') || org.includes('jamshedpur')) {
      return { score: 97, rationale: 'Structural & Transportation Lab' };
    }
    if (org.includes('bit') || org.includes('mesra')) {
      return { score: 93, rationale: 'Civil & Infrastructure Dept' };
    }
    if (org.includes('iit') || org.includes('ism')) {
      return { score: 89, rationale: 'Geotechnical Engineering Div' };
    }
    return { score: 76, rationale: 'Civil Engineering Taskforce' };
  }

  if (cat === 'health') {
    if (org.includes('rims') || org.includes('medical') || org.includes('ranchi')) {
      return { score: 98, rationale: 'Epidemiology & Community Health' };
    }
    if (org.includes('bit') || org.includes('mesra')) {
      return { score: 85, rationale: 'Bioengineering & Healthcare Tech' };
    }
    return { score: 80, rationale: 'Public Health Research Wing' };
  }

  return { score: 84, rationale: 'Cross-Disciplinary R&D Group' };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsOverview['data'] | null>(null);
  const [queue, setQueue] = useState<Problem[]>([]);
  const [universities, setUniversities] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUniByProblem, setSelectedUniByProblem] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'users' | 'analytics'>('queue');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refresh = () => {
    apiClient
      .get('/problems/stats/dashboard')
      .then((res) => setStats(res.data.data))
      .catch((err) => console.error('Stats load failed:', err));

    apiClient
      .get('/problems', { params: { status: 'verified', limit: 25 } })
      .then((res) => setQueue(res.data.data))
      .catch((err) => console.error('Queue load failed:', err));

    apiClient
      .get('/users', { params: { role: 'university' } })
      .then((res) => setUniversities(res.data.data))
      .catch((err) => console.error('Universities load failed:', err));

    apiClient
      .get('/users')
      .then((res) => setAllUsers(res.data.data))
      .catch((err) => console.error('All users load failed:', err));
  };

  useEffect(refresh, []);

  const assign = async (problemId: string, customUniId?: string) => {
    const universityId = customUniId || selectedUniByProblem[problemId];
    if (!universityId) return;
    setActionLoading(problemId);
    try {
      await apiClient.put(`/problems/${problemId}/assign`, { universityId });
      setMessage('Successfully assigned problem to university taskforce.');
      refresh();
    } catch (err) {
      setMessage(apiErrorMessage(err, 'Could not assign problem'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      await apiClient.patch(`/users/${userId}/verify`, { is_verified: !currentStatus });
      refresh();
    } catch (err) {
      setMessage(apiErrorMessage(err, 'Failed to update user clearance'));
    } finally {
      setActionLoading(null);
    }
  };

  // Recharts Data
  const categoryChartData = useMemo(() => {
    if (!stats?.byCategory) return [];
    return stats.byCategory.map((c) => {
      const catKey = (c._id || 'other').toLowerCase();
      return {
        name: (c._id || 'Other').toUpperCase(),
        value: c.count,
        color: CATEGORY_PALETTE[catKey] || '#64748b',
      };
    });
  }, [stats]);

  const statusChartData = useMemo(() => {
    if (!stats?.byStatus) return [];
    const order = ['submitted', 'verified', 'assigned', 'in_progress', 'resolved'];
    return order.map((st) => {
      const found = stats.byStatus.find((s) => s._id === st);
      return {
        status: st.replace('_', ' ').toUpperCase(),
        count: found ? found.count : 0,
      };
    });
  }, [stats]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2.5">
              <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
              State Command & Governance Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Jharkhand Portal Administration
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Real-time monitoring of civic grievances, automated university matching, CSR allocation supervision, and institutional clearance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Sync Live Feeds
            </button>
          </div>
        </div>

        {/* Top KPIs */}
        {stats && (
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile label="Total Lodged" value={stats.total} />
            <StatTile
              label="Pending AI Triage"
              value={stats.byStatus.find((s) => s._id === 'submitted')?.count ?? 0}
            />
            <StatTile
              label="Assigned to Univs"
              value={stats.byStatus.find((s) => s._id === 'assigned')?.count ?? 0}
            />
            <StatTile
              label="Resolved Solutions"
              value={stats.byStatus.find((s) => s._id === 'resolved')?.count ?? 0}
            />
          </div>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">info</span>
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="hover:opacity-75">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'queue', label: 'AI Assignment Queue', icon: 'auto_mode', badge: queue.length },
          { id: 'analytics', label: 'Visual Analytics', icon: 'pie_chart' },
          { id: 'users', label: 'Institutional Verification', icon: 'verified_user', badge: allUsers.filter(u => u.role !== 'citizen').length },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                active
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: AI Assignment Queue */}
      {activeTab === 'queue' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500 text-lg">fact_check</span>
              Verified Incidents Awaiting University Dispatch ({queue.length})
            </h2>
            <span className="text-xs text-slate-400">
              Sorted by AI priority & verification confidence
            </span>
          </div>

          {queue.length === 0 ? (
            <Card className="py-12 text-center">
              <span className="material-symbols-outlined text-3xl text-emerald-500">task_alt</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2">
                All Verified Incidents Dispatched!
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                No civic grievances currently waiting in the assignment queue.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {queue.map((p) => {
                // Determine top recommended university based on matchmaker
                let bestMatch: { uni: User; score: number; rationale: string } | null = null;
                for (const u of universities) {
                  const match = calculateSuitability(p, u);
                  if (!bestMatch || match.score > bestMatch.score) {
                    bestMatch = { uni: u, score: match.score, rationale: match.rationale };
                  }
                }

                const isLoading = actionLoading === p._id;

                return (
                  <Card key={p._id} className="transition-all hover:border-orange-500/40 p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            {p.category}
                          </span>
                          <PriorityBadge priority={p.priority} />
                          <StatusBadge status={p.status} />
                          <span className="text-xs text-slate-500 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-xs text-orange-500">location_on</span>
                            {p.location?.district}
                          </span>
                        </div>

                        <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
                          {p.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                          {p.description}
                        </p>

                        {/* Top Match recommendation badge */}
                        {bestMatch && (
                          <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                              <span className="material-symbols-outlined text-xs">psychology</span>
                              AI Recommended: <strong className="font-bold">{bestMatch.uni.full_name}</strong> ({bestMatch.score}% Match)
                            </span>
                            <span className="text-[11px] text-slate-400 italic">
                              — {bestMatch.rationale}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right assign controls */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                        {bestMatch && (
                          <Button
                            onClick={() => assign(p._id, bestMatch?.uni.id)}
                            disabled={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">bolt</span>
                            Auto-Assign ({bestMatch.score}%)
                          </Button>
                        )}

                        <select
                          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                          value={selectedUniByProblem[p._id] ?? ''}
                          onChange={(e) =>
                            setSelectedUniByProblem((s) => ({ ...s, [p._id]: e.target.value }))
                          }
                        >
                          <option value="">Choose specific university...</option>
                          {universities.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.full_name} {u.organization ? `(${u.organization})` : ''}
                            </option>
                          ))}
                        </select>

                        <Button
                          onClick={() => assign(p._id)}
                          disabled={!selectedUniByProblem[p._id] || isLoading}
                          className="text-xs px-3 py-1.5"
                        >
                          {isLoading ? 'Assigning...' : 'Assign'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Visual Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sky-500 text-sm">pie_chart</span>
              Problem Category Distribution
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={4}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                      color: '#ffffff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              {categoryChartData.map((c) => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span>{c.name}: <strong>{c.value}</strong></span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-orange-500 text-sm">bar_chart</span>
              Grievance Lifecycle Velocity
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                      color: '#ffffff',
                    }}
                  />
                  <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Funnel conversion from citizen report to verified, assigned, and resolved milestones.
            </p>
          </Card>
        </div>
      )}

      {/* Tab 3: Institutional Clearance & User Verification */}
      {activeTab === 'users' && (
        <Card className="overflow-hidden p-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Institutional Directory & Security Clearances
              </h3>
              <p className="text-xs text-slate-500">
                Grant or revoke platform operational privileges for universities and industry partners.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Representative / Institute</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Clearance Status</th>
                  <th className="px-4 py-3 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allUsers
                  .filter((u) => u.role !== 'citizen')
                  .map((u) => {
                    const isVerified = (u as any).is_verified !== false;
                    const isLoading = actionLoading === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{u.full_name}</div>
                          <div className="text-slate-400 text-[11px]">{u.email} {u.organization ? `· ${u.organization}` : ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'university'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                              : u.role === 'industry'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {u.district || 'Ranchi HQ'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isVerified
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            <span className="material-symbols-outlined text-xs">
                              {isVerified ? 'check_circle' : 'pending'}
                            </span>
                            {isVerified ? 'Cleared' : 'Pending Verification'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleVerification(u.id, isVerified)}
                            disabled={isLoading}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                              isVerified
                                ? 'border border-rose-500/30 text-rose-600 hover:bg-rose-500/10'
                                : 'border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10'
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {isVerified ? 'block' : 'verified'}
                            </span>
                            {isVerified ? 'Revoke' : 'Approve'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
