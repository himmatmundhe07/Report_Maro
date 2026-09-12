import { useState } from 'react';
import { apiClient, apiErrorMessage } from '../../lib/apiClient';

export interface ReportItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: 'submitted' | 'verified' | 'assigned' | 'in_progress' | 'funded' | 'resolved';
  district: string;
  createdAt: string;
  duplicate_count?: number;
  duplicate_of?: string | null;
  citizen_feedback?: {
    rating?: number;
    comment?: string;
    submittedAt?: string;
  };
}

const STAGES = [
  { key: 'submitted', label: 'Lodged', icon: 'send', desc: 'Citizen report recorded' },
  { key: 'verified', label: 'AI Triaged', icon: 'psychology', desc: 'Category & priority scored' },
  { key: 'assigned', label: 'Assigned', icon: 'school', desc: 'Dispatched to University' },
  { key: 'in_progress', label: 'Solution Active', icon: 'engineering', desc: 'Milestones underway' },
  { key: 'funded', label: 'CSR Funded', icon: 'handshake', desc: 'Industry tranches disbursed' },
  { key: 'resolved', label: 'Resolved', icon: 'verified', desc: 'Issue resolved on-ground' },
];

export default function MyReportsTracker({ report, onUpdate }: { report: ReportItem; onUpdate?: () => void }) {
  const [rating, setRating] = useState<number>(report.citizen_feedback?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>(report.citizen_feedback?.comment || '');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(!!report.citizen_feedback?.submittedAt);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const getStageIndex = (status: string) => {
    const idx = STAGES.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const currentIndex = getStageIndex(report.status);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    setFeedbackError(null);
    try {
      await apiClient.post(`/problems/${report.id}/feedback`, {
        rating,
        comment,
      });
      setFeedbackSuccess(true);
      if (onUpdate) onUpdate();
    } catch (err) {
      setFeedbackError(apiErrorMessage(err, 'Failed to submit feedback'));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {report.title}
            </h3>
            {report.duplicate_count && report.duplicate_count > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <span className="material-symbols-outlined text-xs">group</span>
                +{report.duplicate_count} community reports linked
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {report.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="material-symbols-outlined text-xs text-orange-500">location_on</span>
            {report.district}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${
            report.priority === 'high'
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              : report.priority === 'medium'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          }`}>
            <span className="material-symbols-outlined text-xs">bolt</span>
            {report.priority} priority
          </span>
        </div>
      </div>

      {/* 6-Stage Visual Stepper */}
      <div className="relative pt-2 pb-1">
        <div className="hidden md:flex items-center justify-between relative">
          {/* Progress Bar background */}
          <div className="absolute top-4 left-4 right-4 h-1 bg-slate-200 dark:bg-slate-800 -z-0" />
          <div
            className="absolute top-4 left-4 h-1 bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-500 -z-0"
            style={{ width: `${(currentIndex / (STAGES.length - 1)) * 96}%` }}
          />

          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={stage.key} className="flex flex-col items-center text-center z-10 w-24">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-all shadow-sm ${
                    isCurrent
                      ? 'bg-orange-500 text-white ring-4 ring-orange-500/20 ring-offset-2 dark:ring-offset-slate-900 scale-110'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {isCompleted ? 'check' : stage.icon}
                  </span>
                </div>
                <span className={`mt-2 text-xs font-semibold ${isCurrent ? 'text-orange-600 dark:text-orange-400' : isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                  {stage.label}
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[80px]">
                  {stage.desc}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile vertical stepper */}
        <div className="md:hidden space-y-2">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={stage.key}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  isCurrent ? 'bg-orange-500/10 border border-orange-500/20' : 'opacity-70'
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    isCurrent
                      ? 'bg-orange-500 text-white'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isCompleted ? 'check' : stage.icon}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{stage.label}</p>
                  <p className="text-[11px] text-slate-400">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Citizen Feedback & Satisfaction Rating (Shown for resolved/in-progress) */}
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-amber-500 text-sm">rate_review</span>
          Citizen Resolution Feedback & Verification
        </h4>

        {feedbackSuccess ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-300">
            <span className="material-symbols-outlined text-base text-emerald-500">check_circle</span>
            <div>
              <p className="font-semibold">Feedback Recorded ({rating}/5 Stars)</p>
              {comment && <p className="text-slate-600 dark:text-slate-400 mt-0.5 italic">"{comment}"</p>}
            </div>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Your satisfaction:</span>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating !== null ? hoverRating : rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                    >
                      <span className={`material-symbols-outlined text-xl ${active ? 'text-amber-400' : ''}`} style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                        star
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Satisfactory' : 'Needs Improvement'}
              </span>
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Has the civic authority or university team adequately resolved this issue? Share your observations..."
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            {feedbackError && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                {feedbackError}
              </p>
            )}

            <button
              type="submit"
              disabled={submittingFeedback}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-orange-500 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              {submittingFeedback ? 'Submitting...' : 'Submit Citizen Verification'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
