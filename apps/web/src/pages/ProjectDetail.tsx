import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fundProjectRequestSchema, type Project } from '@sih/shared-types';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { Badge } from '../components/Badge.js';
import CsrCertificateModal from '../components/csr/CsrCertificateModal.js';

interface MilestoneItem {
  title: string;
  target_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
  proof_url?: string;
  completion_notes?: string;
  completed_at?: string;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [project, setProject] = useState<Project | null>(null);
  const [amount, setAmount] = useState<number>(50000);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  // Milestone edit state
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState<number | null>(null);
  const [milestoneProofUrl, setMilestoneProofUrl] = useState('');
  const [milestoneNotes, setMilestoneNotes] = useState('');
  const [milestoneUpdating, setMilestoneUpdating] = useState(false);

  const refresh = useCallback(() => {
    if (!id) return;
    apiClient
      .get(`/projects/${id}`)
      .then((res) => {
        setProject(res.data.data);
        if (res.data.data?.budget) {
          setAmount(res.data.data.budget);
        }
      })
      .catch((err) => console.error('Failed to load project:', err));
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fund = async () => {
    if (!id) return;
    setError(null);
    setSuccessMsg(null);
    const parsed = fundProjectRequestSchema.safeParse({ amount });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid amount');
      return;
    }
    setLoading(true);
    try {
      await apiClient.put(`/projects/${id}/fund`, parsed.data);
      setSuccessMsg('CSR Funding committed successfully! Statutory 80G tax certificate generated.');
      refresh();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not fund project'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMilestone = async (idx: number, status: 'pending' | 'in_progress' | 'completed') => {
    if (!id) return;
    setMilestoneUpdating(true);
    try {
      await apiClient.put(`/projects/${id}/milestones/${idx}`, {
        status,
        proof_url: milestoneProofUrl.trim() || undefined,
        completion_notes: milestoneNotes.trim() || undefined,
      });
      setActiveMilestoneIdx(null);
      setMilestoneProofUrl('');
      setMilestoneNotes('');
      refresh();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to update milestone'));
    } finally {
      setMilestoneUpdating(false);
    }
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-3" />
        <p className="text-xs font-medium text-slate-500">Loading project solution...</p>
      </div>
    );
  }

  const milestones: MilestoneItem[] = (project as any).milestones || [
    { title: 'Phase 1: Ground Lab Testing & Architecture Blueprint', status: 'completed' },
    { title: 'Phase 2: Prototype Fabrication & District Field Trials', status: 'in_progress' },
    { title: 'Phase 3: Final Deployment & Citizen Redressal Sign-off', status: 'pending' },
  ];

  const isFunded = (project.status as string) === 'funded' || project.status === 'active' || !!project.industry_partner_id;
  const canFund = user?.role === 'industry' && (project.status === 'under_review' || project.status === 'proposed');
  const canUpdateMilestones = user?.role === 'university' || user?.role === 'admin';

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/industry" className="hover:text-emerald-600 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          CSR Exchange
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium">Problem #{project.problem_id} Solution</span>
      </div>

      {/* Hero Card */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                University R&D Solution
              </span>
              <span className="text-xs text-slate-400">Problem ID #{project.problem_id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
              Technical Intervention Proposal
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Badge tone={isFunded ? 'green' : 'blue'}>
              {project.status.replace(/_/g, ' ')}
            </Badge>
            {isFunded && (
              <button
                type="button"
                onClick={() => setShowCertModal(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">workspace_premium</span>
                80G Certificate
              </button>
            )}
          </div>
        </div>

        {/* Proposal Details */}
        <div className="py-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Technical Methodology & Execution Strategy
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {project.proposal_text}
          </p>
        </div>

        {/* Budget & Funding HUD */}
        <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-slate-400">Estimated Budget</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              ₹{(project.budget ?? 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Current Funded Amount</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              ₹{((project as any).funding_amount ?? (isFunded ? project.budget : 0)).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Statutory Tax Eligibility</p>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">verified</span>
              100% Deductible (Section 80G)
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Industry Funding Action Bar */}
        {canFund && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">handshake</span>
              Disburse Corporate CSR Grant
            </h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-7 pr-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>
              <Button
                onClick={fund}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
                  {loading ? 'sync' : 'verified'}
                </span>
                {loading ? 'Processing Disbursal...' : 'Confirm Grant & Issue 80G'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Milestone Roadmap & Verification Checklist */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500 text-base">alt_route</span>
              Milestone Execution & Tranche Verification Checklist
            </h2>
            <p className="text-xs text-slate-500">
              Universities document validation proof for each milestone to unlock CSR funding tranches.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {milestones.map((m, idx) => {
            const isCompleted = m.status === 'completed';
            const isInProgress = m.status === 'in_progress';
            const isEditing = activeMilestoneIdx === idx;

            return (
              <div
                key={idx}
                className={`rounded-xl border p-4 transition-all ${
                  isCompleted
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : isInProgress
                    ? 'border-orange-500/30 bg-orange-500/5 ring-1 ring-orange-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isInProgress
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isCompleted ? (
                        <span className="material-symbols-outlined text-sm">check</span>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {m.title}
                      </h4>
                      {m.completion_notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                          "{m.completion_notes}"
                        </p>
                      )}
                      {m.proof_url && (
                        <a
                          href={m.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline mt-1"
                        >
                          <span className="material-symbols-outlined text-xs">attach_file</span>
                          Validation Evidence / Report
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isInProgress
                          ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>

                    {canUpdateMilestones && !isCompleted && !isEditing && (
                      <button
                        type="button"
                        onClick={() => setActiveMilestoneIdx(idx)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <span className="material-symbols-outlined text-xs">edit</span>
                        Submit Evidence
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Milestone Evidence Form */}
                {isEditing && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <input
                      type="url"
                      placeholder="Proof / Documentation URL (e.g. Google Drive link or test report URL)"
                      value={milestoneProofUrl}
                      onChange={(e) => setMilestoneProofUrl(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                    />
                    <textarea
                      rows={2}
                      placeholder="Brief notes on field findings, lab results, and citizen engagement..."
                      value={milestoneNotes}
                      onChange={(e) => setMilestoneNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setActiveMilestoneIdx(null)}
                        disabled={milestoneUpdating}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleUpdateMilestone(idx, 'completed')}
                        disabled={milestoneUpdating}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                      >
                        {milestoneUpdating ? 'Saving...' : 'Mark as Completed'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tax Exemption Certificate Modal */}
      {showCertModal && (
        <CsrCertificateModal
          isOpen={showCertModal}
          onClose={() => setShowCertModal(false)}
          certificateId={(project as any).csr_certificate_id || `JH-CSR-${project._id.slice(-6).toUpperCase()}`}
          csrReference={(project as any).csr_reference || `JH-CSR-REF-${project._id.slice(-4).toUpperCase()}`}
          projectName={project.proposal_text.slice(0, 100)}
          problemId={String(project.problem_id)}
          universityName={typeof project.university_id === 'object' ? (project.university_id as any).full_name : 'State Engineering University'}
          industryName={user?.organization || user?.full_name || 'Tata Steel CSR Foundation'}
          amount={(project as any).funding_amount || project.budget || 50000}
          date={new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        />
      )}
    </div>
  );
}
