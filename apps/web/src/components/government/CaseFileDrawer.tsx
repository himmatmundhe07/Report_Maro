import { useState } from 'react';

export interface CaseFileItem {
  id: string;
  title: string;
  district: string;
  domain: string;
  priority: string;
  status: string;
  reason?: string;
  daysSince?: number;
  university?: string;
  block?: string;
  village?: string;
  description?: string;
  submittedBy?: string;
  gpsCoords?: string;
}

interface CaseFileDrawerProps {
  isOpen: boolean;
  item: CaseFileItem | null;
  onClose: () => void;
  onActionDispatched?: (actionType: string, details: string) => void;
}

const UNIVERSITIES_MATCH = [
  { id: 'bit_mesra', name: 'BIT Mesra', score: 96.4, dept: 'Dept. of Environmental Engineering & Remote Sensing' },
  { id: 'nit_jsr', name: 'NIT Jamshedpur', score: 93.8, dept: 'Civil & Water Infrastructure Lab' },
  { id: 'iit_ism', name: 'IIT (ISM) Dhanbad', score: 91.2, dept: 'Mining & Environmental Geoscience' },
  { id: 'bau_ranchi', name: 'Birsa Agricultural University', score: 88.5, dept: 'Agronomy & Soil Health Division' },
  { id: 'ranchi_univ', name: 'Ranchi University', score: 84.0, dept: 'Applied Sciences & Public Health Node' },
];

export default function CaseFileDrawer({
  isOpen,
  item,
  onClose,
  onActionDispatched,
}: CaseFileDrawerProps) {
  const [selectedUniv, setSelectedUniv] = useState(UNIVERSITIES_MATCH[0]!.id);
  const [grantAmount, setGrantAmount] = useState('250000');
  const [directiveNote, setDirectiveNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<Array<{ id: string; action: string; time: string; officer: string }>>([
    { id: '1', action: 'AI Triage Completed & Escalated to State Command', time: '18 hrs ago', officer: 'AI Gateway Node JH-01' },
  ]);

  if (!isOpen || !item) return null;

  const handleDispatch = (type: 'university' | 'grant' | 'memo' | 'audit') => {
    setIsProcessing(true);
    setTimeout(() => {
      let desc = '';
      const noteSuffix = directiveNote.trim() ? ` [Note: "${directiveNote.trim()}"]` : '';
      if (type === 'university') {
        const univObj = UNIVERSITIES_MATCH.find((u) => u.id === selectedUniv);
        desc = `Assigned challenge to ${univObj?.name} (AI Suitability: ${univObj?.score}%)${noteSuffix}`;
      } else if (type === 'grant') {
        desc = `Authorized ₹${(parseInt(grantAmount, 10) / 100000).toFixed(1)}L Emergency Innovation Grant from State Corpus${noteSuffix}`;
      } else if (type === 'memo') {
        desc = `Issued Urgent Collectorate Notice to DC (${item.district}) with 7-day compliance window${noteSuffix}`;
      } else {
        desc = `Dispatched field verification team with GPS telemetry requirement${noteSuffix}`;
      }

      setAuditLog((prev) => [
        { id: Date.now().toString(), action: desc, time: 'Just now', officer: 'State Nodal Officer' },
        ...prev,
      ]);
      setFeedbackMessage(`✓ Directive Executed: ${desc}`);
      setDirectiveNote('');
      setIsProcessing(false);
      onActionDispatched?.(type, desc);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="bg-navy text-white px-6 py-4 flex items-center justify-between border-b border-navy-deep">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-turmeric uppercase tracking-wider">
                Case File: {item.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-[2px] uppercase ${
                  item.priority.toLowerCase() === 'critical'
                    ? 'bg-urgent text-white'
                    : item.priority.toLowerCase() === 'high'
                      ? 'bg-st-review text-white'
                      : 'bg-forest text-white'
                }`}
              >
                {item.priority}
              </span>
            </div>
            <h2 className="text-base font-semibold leading-snug mt-1 text-white truncate max-w-md">
              {item.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Drawer Body Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-ink">
          {/* Feedback banner */}
          {feedbackMessage && (
            <div className="p-3 bg-forest/10 border border-forest rounded-[3px] text-forest text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* Section 1: Geographic & Citizen Telemetry */}
          <div className="p-4 bg-paper rounded-[3px] border border-border space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink font-mono flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-turmeric-deep">location_on</span>
                <span>Citizen Telemetry &amp; Location</span>
              </span>
              <span className="text-[10px] font-mono bg-paper-dark px-2 py-0.5 rounded text-ink-muted">
                LGD Verified
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-ink-muted text-[10px] uppercase font-bold block">District</span>
                <span className="font-semibold text-ink">{item.district || 'Ranchi'}</span>
              </div>
              <div>
                <span className="text-ink-muted text-[10px] uppercase font-bold block">Domain / Sector</span>
                <span className="font-semibold text-ink">{item.domain}</span>
              </div>
              <div>
                <span className="text-ink-muted text-[10px] uppercase font-bold block">Days in Distress</span>
                <span className="font-mono font-bold text-urgent">{item.daysSince || 18} Days Unresolved</span>
              </div>
              <div>
                <span className="text-ink-muted text-[10px] uppercase font-bold block">Current Lifecycle</span>
                <span className="font-mono text-navy font-bold">{item.status}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60">
              <span className="text-ink-muted text-[10px] uppercase font-bold block mb-1">Citizen Narrative / Grievance Statement</span>
              <p className="text-xs text-ink/90 leading-relaxed bg-white p-2.5 rounded-[2px] border border-border/80">
                "{item.description || item.reason || 'High arsenic levels detected in the primary groundwater source feeding the community tap line. Over 1,400 households facing severe drinking water scarcity. Urgent decentralized filtration array required.'}"
              </p>
            </div>
          </div>

          {/* Section 2: AI Root Cause Analysis & Societal Impact */}
          <div className="p-4 bg-turmeric/5 rounded-[3px] border border-turmeric/30 space-y-2.5">
            <div className="flex items-center justify-between border-b border-turmeric/20 pb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-turmeric-deep font-mono flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">psychology</span>
                <span>AI Root-Cause &amp; Vulnerability Assessment</span>
              </span>
              <span className="text-[10px] font-bold text-turmeric-deep font-mono">Confidence: 98.4%</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded border border-turmeric/20">
                <span className="text-[10px] text-ink-muted uppercase font-bold block">Urgency Score</span>
                <span className="text-base font-bold text-urgent font-mono">9.4 / 10</span>
              </div>
              <div className="bg-white p-2 rounded border border-turmeric/20">
                <span className="text-[10px] text-ink-muted uppercase font-bold block">Vulnerability</span>
                <span className="text-base font-bold text-st-review font-mono">High (Tier 1)</span>
              </div>
              <div className="bg-white p-2 rounded border border-turmeric/20">
                <span className="text-[10px] text-ink-muted uppercase font-bold block">Est. Solution Time</span>
                <span className="text-base font-bold text-forest font-mono">3–4 Weeks</span>
              </div>
            </div>
          </div>

          {/* Section 3: Actionable Executive Directives */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy font-mono flex items-center gap-1.5 border-b border-border pb-1.5">
              <span className="material-symbols-outlined text-sm">bolt</span>
              <span>Execute State Administrative Directives</span>
            </h3>

            {/* Directive 1: Assign to University */}
            <div className="p-3.5 bg-paper rounded-[3px] border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-forest">school</span>
                  <span>1. Direct Tasking to Jharkhand University R&amp;D Node</span>
                </span>
                <span className="text-[10px] font-mono text-forest font-bold">AI Matchmaker</span>
              </div>

              <select
                value={selectedUniv}
                onChange={(e) => setSelectedUniv(e.target.value)}
                className="w-full text-xs bg-white border border-border rounded-[2px] p-2 focus:border-navy focus:outline-none"
              >
                {UNIVERSITIES_MATCH.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.dept} ({u.score}% Suitability)
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleDispatch('university')}
                className="w-full py-2 bg-forest text-white text-xs font-bold rounded-[2px] hover:bg-forest-deep transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                <span>Dispatch Formal Problem Statement to University</span>
              </button>
            </div>

            {/* Directive 2: Release Grant */}
            <div className="p-3.5 bg-paper rounded-[3px] border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-turmeric-deep">payments</span>
                  <span>2. Authorize State Innovation Grant</span>
                </span>
                <span className="text-[10px] font-mono text-ink-muted">Corpus Balance: ₹1.82 Cr</span>
              </div>

              <div className="flex items-center gap-2">
                {['150000', '250000', '500000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setGrantAmount(amt)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-[2px] border transition ${
                      grantAmount === amt
                        ? 'bg-navy text-white border-navy shadow-xs'
                        : 'bg-white text-ink border-border hover:border-navy'
                    }`}
                  >
                    ₹{(parseInt(amt, 10) / 100000).toFixed(1)} Lakhs
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleDispatch('grant')}
                className="w-full py-2 bg-navy text-white text-xs font-bold rounded-[2px] hover:bg-navy-deep transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>Release ₹{(parseInt(grantAmount, 10) / 100000).toFixed(1)}L Prototyping Grant</span>
              </button>
            </div>

            {/* Directive Remark / Note */}
            <div>
              <label className="block text-[11px] font-bold text-ink mb-1">
                Executive Directive Remark (Optional)
              </label>
              <textarea
                rows={2}
                value={directiveNote}
                onChange={(e) => setDirectiveNote(e.target.value)}
                placeholder="Add special instructions, statutory references, or timeline mandates..."
                className="w-full text-xs bg-white border border-border rounded-[2px] p-2 focus:border-navy focus:outline-none resize-none placeholder:text-ink-muted/50"
              />
            </div>

            {/* Directive 3: Collectorate Notice */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleDispatch('memo')}
                className="py-2.5 px-3 border border-border bg-white text-ink text-xs font-semibold rounded-[2px] hover:bg-paper hover:border-urgent transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-urgent">notification_important</span>
                <span>Issue DC Notice</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleDispatch('audit')}
                className="py-2.5 px-3 border border-border bg-white text-ink text-xs font-semibold rounded-[2px] hover:bg-paper hover:border-forest transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-forest">satellite_alt</span>
                <span>Request Telemetry Audit</span>
              </button>
            </div>
          </div>

          {/* Section 4: Audit Trail */}
          <div className="p-4 bg-paper/50 rounded-[3px] border border-border space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted font-mono block">
              Administrative Audit Log &amp; Dispatch History
            </span>
            <div className="space-y-2 text-xs">
              {auditLog.map((log) => (
                <div key={log.id} className="border-l-2 border-forest pl-2 py-0.5">
                  <div className="font-semibold text-ink">{log.action}</div>
                  <div className="text-[10px] text-ink-muted font-mono flex items-center gap-2 mt-0.5">
                    <span>{log.time}</span>
                    <span>·</span>
                    <span className="text-navy">{log.officer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="bg-paper border-t border-border px-6 py-3 flex items-center justify-between text-xs">
          <span className="text-[11px] text-ink-muted font-mono">
            Signed by Nodal Officer Authority
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-navy text-white text-xs font-bold rounded-[2px] hover:bg-navy-deep transition cursor-pointer"
          >
            Close Case File
          </button>
        </div>
      </div>
    </div>
  );
}
