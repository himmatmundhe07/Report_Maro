import React, { useState } from 'react';

interface EmergencyBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastSuccess?: (directiveTitle: string, domain: string, budget: string) => void;
}

export default function EmergencyBroadcastModal({
  isOpen,
  onClose,
  onBroadcastSuccess,
}: EmergencyBroadcastModalProps) {
  const [title, setTitle] = useState('Urgent: Rural Groundwater Arsenic Remediation Sentinel');
  const [domain, setDomain] = useState('Water & Sanitation');
  const [targetDistrict, setTargetDistrict] = useState('All 24 Districts');
  const [budget, setBudget] = useState('500000');
  const [deadlineDays, setDeadlineDays] = useState('21');
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH'>('CRITICAL');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);

    setTimeout(() => {
      setIsBroadcasting(false);
      setBroadcastDone(true);
      onBroadcastSuccess?.(title, domain, `₹${(parseInt(budget, 10) / 100000).toFixed(1)}L`);

      setTimeout(() => {
        setBroadcastDone(false);
        onClose();
      }, 1400);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg bg-white rounded-[3px] shadow-2xl border-2 border-urgent/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-urgent text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl animate-pulse">campaign</span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                State Emergency Challenge Directive
              </h3>
              <p className="text-[10px] text-white/80 font-sans">
                Broadcast innovation mandate to all 38 Jharkhand University R&amp;D cells
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Form Body */}
        {broadcastDone ? (
          <div className="p-8 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-forest/10 text-forest mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">done_all</span>
            </div>
            <h4 className="text-base font-bold text-ink">Directive Broadcasted Statewide</h4>
            <p className="text-xs text-ink-muted">
              Dispatched to 38 universities, Deans of R&amp;D, and 450+ faculty mentors with active push telemetry.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-ink">
            {/* Directive Title */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-ink-muted text-[10px] mb-1">
                Directive Subject / Title <span className="text-urgent">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-[2px] border border-border px-3 py-2 text-xs bg-white text-ink focus:outline-none focus:border-urgent font-medium"
              />
            </div>

            {/* Domain & Target District */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-ink-muted text-[10px] mb-1">
                  Sector / Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full rounded-[2px] border border-border px-2.5 py-2 text-xs bg-white text-ink focus:outline-none focus:border-urgent"
                >
                  <option value="Water & Sanitation">Water &amp; Sanitation</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Energy">Energy</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Environment">Environment</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-ink-muted text-[10px] mb-1">
                  Target Geographic Node
                </label>
                <select
                  value={targetDistrict}
                  onChange={(e) => setTargetDistrict(e.target.value)}
                  className="w-full rounded-[2px] border border-border px-2.5 py-2 text-xs bg-white text-ink focus:outline-none focus:border-urgent"
                >
                  <option value="All 24 Districts">All 24 Districts (Statewide)</option>
                  <option value="Ranchi">Ranchi District</option>
                  <option value="Dhanbad">Dhanbad District</option>
                  <option value="Bokaro">Bokaro District</option>
                  <option value="East Singhbhum">East Singhbhum (Jamshedpur)</option>
                  <option value="Palamu">Palamu Division</option>
                </select>
              </div>
            </div>

            {/* Grant Corpus & Deadline */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-ink-muted text-[10px] mb-1">
                  Corpus Grant Budget (INR)
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full rounded-[2px] border border-border px-2.5 py-2 text-xs bg-white text-ink focus:outline-none focus:border-urgent font-mono"
                >
                  <option value="250000">₹2.5 Lakhs (Standard Prototype)</option>
                  <option value="500000">₹5.0 Lakhs (High-Impact Fast-Track)</option>
                  <option value="1000000">₹10.0 Lakhs (Multi-Institutional Mesh)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-ink-muted text-[10px] mb-1">
                  Prototype Deadline
                </label>
                <select
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(e.target.value)}
                  className="w-full rounded-[2px] border border-border px-2.5 py-2 text-xs bg-white text-ink focus:outline-none focus:border-urgent font-mono"
                >
                  <option value="14">14 Days (Emergency Triage)</option>
                  <option value="21">21 Days (Rapid Prototyping)</option>
                  <option value="30">30 Days (Field Deployment)</option>
                </select>
              </div>
            </div>

            {/* Priority & Target Audience */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-ink-muted text-[10px] mb-1">
                Dispatch Priority Level
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('CRITICAL')}
                  className={`flex-1 py-1.5 rounded-[2px] border font-bold text-xs uppercase flex items-center justify-center gap-1 transition ${
                    priority === 'CRITICAL'
                      ? 'bg-urgent text-white border-urgent shadow-xs'
                      : 'bg-paper text-ink border-border'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">priority_high</span>
                  <span>Critical Tier 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('HIGH')}
                  className={`flex-1 py-1.5 rounded-[2px] border font-bold text-xs uppercase flex items-center justify-center gap-1 transition ${
                    priority === 'HIGH'
                      ? 'bg-st-review text-white border-st-review shadow-xs'
                      : 'bg-paper text-ink border-border'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">flag</span>
                  <span>High Priority</span>
                </button>
              </div>
            </div>

            {/* Authorization Notice */}
            <div className="p-2.5 bg-paper rounded-[2px] border border-border text-[10px] text-ink-muted">
              <strong>Notice:</strong> This directive will be signed with the State Nodal Officer digital token and
              broadcast via WebSocket to all institution portals with immediate notification alerts.
            </div>

            {/* Submit buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-border rounded-[2px] text-ink-muted hover:text-ink font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isBroadcasting}
                className="px-4 py-2 bg-urgent hover:bg-red-700 text-white font-bold rounded-[2px] shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                <span>{isBroadcasting ? 'Broadcasting Statewide…' : 'Authorize & Broadcast'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
