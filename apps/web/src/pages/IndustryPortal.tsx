import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '@sih/shared-types';
import { apiClient } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { Badge } from '../components/Badge.js';
import CsrCertificateModal from '../components/csr/CsrCertificateModal.js';
import { useAuthStore } from '../store/authStore.js';

export default function IndustryPortal() {
  const user = useAuthStore((s) => s.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [selectedCertProject, setSelectedCertProject] = useState<Project | null>(null);

  useEffect(() => {
    apiClient
      .get('/projects')
      .then((res) => {
        setProjects(res.data.data || []);
      })
      .catch((err) => console.error('Failed to load projects:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const isFunded = (p.status as string) === 'funded' || p.status === 'active' || !!p.industry_partner_id;
      if (filterDomain !== 'all') {
        if (filterDomain === 'funded' && !isFunded) return false;
        if (filterDomain === 'seeking' && isFunded) return false;
      }
      return true;
    });
  }, [projects, filterDomain]);

  // Industry CSR stats
  const portfolioStats = useMemo(() => {
    const fundedProjects = projects.filter(
      (p) => (p.status as string) === 'funded' || p.status === 'active' || !!p.industry_partner_id
    );
    const totalCommitted = fundedProjects.reduce(
      (acc, p) => acc + ((p as any).funding_amount || p.budget || 0),
      0
    );
    const seekingProjects = projects.filter(
      (p) => p.status === 'under_review' || p.status === 'proposed'
    );
    const estimatedImpact = fundedProjects.length * 15000 + 45000;
    return {
      totalCommitted,
      fundedCount: fundedProjects.length,
      seekingCount: seekingProjects.length,
      estimatedImpact,
    };
  }, [projects]);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
            <span className="material-symbols-outlined text-sm">corporate_fare</span>
            Corporate Social Responsibility (CSR) Exchange
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Jharkhand University Innovation Funding Hub
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Directly fund vetted university technical solutions addressing critical water, road, and health challenges. Fulfill Schedule VII statutory mandates with automated Section 80G tax certificates.
          </p>
        </div>

        {/* CSR Portfolio HUD */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <p className="text-xs font-medium text-slate-400">Total CSR Grants Disbursed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              ₹{portfolioStats.totalCommitted.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <p className="text-xs font-medium text-slate-400">Innovations Funded</p>
            <p className="text-2xl font-bold text-white mt-1">{portfolioStats.fundedCount}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <p className="text-xs font-medium text-slate-400">Projects Seeking Grants</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{portfolioStats.seekingCount}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <p className="text-xs font-medium text-slate-400">Citizens Impacted</p>
            <p className="text-2xl font-bold text-sky-400 mt-1">
              {portfolioStats.estimatedImpact.toLocaleString('en-IN')}+
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All R&D Projects', count: projects.length },
            { id: 'seeking', label: 'Awaiting CSR Grants', count: portfolioStats.seekingCount },
            { id: 'funded', label: 'Funded & Active', count: portfolioStats.fundedCount },
          ].map((tab) => {
            const active = filterDomain === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterDomain(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading university CSR proposals...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="py-12 text-center">
          <span className="material-symbols-outlined text-3xl text-slate-400">folder_open</span>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2">
            No Projects in this Filter
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Check back soon as universities draft new technical solutions.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => {
            const isFunded = (p.status as string) === 'funded' || p.status === 'active' || !!p.industry_partner_id;
            const reqBudget = p.budget ?? 0;

            return (
              <Card
                key={p._id}
                className="h-full flex flex-col justify-between transition-all hover:border-emerald-500/40 hover:shadow-md p-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-semibold text-slate-400">
                      Problem #{p.problem_id}
                    </span>
                    <Badge tone={isFunded ? 'green' : 'blue'}>
                      {p.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-2">
                    {p.proposal_text}
                  </h3>

                  {/* Milestone 3-Tranche breakdown preview */}
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 border border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Tranche Schedule:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">30% · 40% · 30%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: isFunded ? '100%' : '30%' }} />
                      {!isFunded && <div className="bg-emerald-300 dark:bg-emerald-700 h-full w-[40%]" />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500">Required Grant:</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{reqBudget.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Link
                    to={`/projects/${p._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Inspect Full Proposal
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </Link>

                  {isFunded ? (
                    <button
                      type="button"
                      onClick={() => setSelectedCertProject(p)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-xs">workspace_premium</span>
                      80G Certificate
                    </button>
                  ) : (
                    <Link
                      to={`/projects/${p._id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-sm"
                    >
                      Fund Project
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tax Exemption Certificate Modal */}
      {selectedCertProject && (
        <CsrCertificateModal
          isOpen={!!selectedCertProject}
          onClose={() => setSelectedCertProject(null)}
          certificateId={(selectedCertProject as any).csr_certificate_id || `JH-CSR-${selectedCertProject._id.slice(-6).toUpperCase()}`}
          csrReference={(selectedCertProject as any).csr_reference || `JH-CSR-REF-${selectedCertProject._id.slice(-4).toUpperCase()}`}
          projectName={selectedCertProject.proposal_text.slice(0, 100)}
          problemId={String(selectedCertProject.problem_id)}
          universityName={typeof selectedCertProject.university_id === 'object' ? (selectedCertProject.university_id as any).full_name : 'State Engineering University'}
          industryName={user?.organization || user?.full_name || 'Tata Steel CSR Foundation'}
          amount={(selectedCertProject as any).funding_amount || selectedCertProject.budget || 50000}
          date={new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        />
      )}
    </div>
  );
}
