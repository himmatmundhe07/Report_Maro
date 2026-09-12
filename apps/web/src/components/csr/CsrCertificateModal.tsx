import { useRef } from 'react';

export interface CsrCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  certificateId: string;
  csrReference: string;
  projectName: string;
  problemId: string;
  universityName: string;
  industryName: string;
  amount: number;
  date: string;
}

export default function CsrCertificateModal({
  isOpen,
  onClose,
  certificateId,
  csrReference,
  projectName,
  problemId,
  universityName,
  industryName,
  amount,
  date,
}: CsrCertificateProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="material-symbols-outlined text-orange-500 text-base">verified</span>
            Official 80G / Section 135 Tax Exemption Certificate
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-500 active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Printable Certificate Canvas */}
        <div
          ref={printRef}
          className="p-8 sm:p-12 text-slate-900 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 relative"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {/* Ornate Double Border */}
          <div className="absolute inset-3 border-4 border-amber-600/30 rounded pointer-events-none" />
          <div className="absolute inset-5 border border-amber-700/20 rounded pointer-events-none" />

          {/* Header */}
          <div className="text-center relative z-10 space-y-1">
            <div className="flex items-center justify-center gap-2 text-xs font-sans font-bold uppercase tracking-widest text-amber-800">
              <span className="material-symbols-outlined text-xl text-amber-700">account_balance</span>
              Government of Jharkhand
            </div>
            <p className="text-[11px] font-sans text-slate-500 uppercase tracking-wider">
              Department of Higher, Technical Education & Skill Development
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-slate-900 pt-3">
              Corporate Social Responsibility (CSR) Certificate
            </h2>
            <p className="text-xs font-sans text-amber-700 font-semibold tracking-wider uppercase">
              Under Section 135 & Section 80G of the Income Tax Act, 1961
            </p>
          </div>

          {/* Certificate Body */}
          <div className="mt-8 space-y-5 text-sm sm:text-base leading-relaxed text-slate-800 text-center relative z-10">
            <p>
              This is to certify that <strong className="font-bold underline decoration-amber-500">{industryName}</strong> has
              contributed a Corporate Social Responsibility grant of
            </p>

            <div className="py-2">
              <span className="inline-block px-6 py-2 rounded-xl bg-amber-100/80 border border-amber-300 text-xl sm:text-2xl font-sans font-black text-amber-900 shadow-sm">
                ₹{amount.toLocaleString('en-IN')} INR
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              towards the research, technical development, and field deployment of:
            </p>

            <div className="rounded-xl border border-slate-200 bg-white/90 p-4 max-w-xl mx-auto shadow-sm text-left">
              <p className="text-xs font-sans font-bold uppercase text-slate-400">Solution Proposal</p>
              <p className="font-semibold text-slate-900 text-sm">{projectName}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between text-xs font-sans text-slate-500">
                <span>Executing University: <strong>{universityName}</strong></span>
                <span>Civic Issue ID: <strong>#{problemId}</strong></span>
              </div>
            </div>

            <p className="text-xs font-sans text-slate-500 max-w-lg mx-auto pt-2">
              This contribution qualifies as an eligible CSR expenditure under Schedule VII of the Companies Act, 2013 and is entitled to tax deduction under Section 80G.
            </p>
          </div>

          {/* Certificate Footer / Signatures */}
          <div className="mt-12 pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs font-sans relative z-10">
            <div className="space-y-1">
              <div className="h-8 flex items-center justify-center font-mono font-bold text-slate-700 text-[11px]">
                {csrReference}
              </div>
              <div className="h-0.5 w-24 bg-slate-300 mx-auto" />
              <p className="text-slate-400 text-[10px] uppercase">CSR Grant Ref</p>
            </div>

            <div className="space-y-1">
              <div className="h-8 flex items-center justify-center text-emerald-700">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <div className="h-0.5 w-24 bg-slate-300 mx-auto" />
              <p className="text-slate-400 text-[10px] uppercase">Digital Seal of Auth</p>
            </div>

            <div className="space-y-1">
              <div className="h-8 flex items-center justify-center font-semibold text-slate-700 text-xs">
                {date}
              </div>
              <div className="h-0.5 w-24 bg-slate-300 mx-auto" />
              <p className="text-slate-400 text-[10px] uppercase">Certification Date</p>
            </div>
          </div>

          <div className="mt-6 text-center text-[10px] font-mono text-slate-400 relative z-10">
            Certificate UID: {certificateId} · SIH Samadhan Setu Portal
          </div>
        </div>
      </div>
    </div>
  );
}
