interface CabinetBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: {
    totalProblems: number;
    totalProjects: number;
    completedProjects: number;
    deployedProjects: number;
    totalFunding: number;
    totalUniversities: number;
  };
}

export default function CabinetBriefingModal({
  isOpen,
  onClose,
  stats = {
    totalProblems: 2438,
    totalProjects: 542,
    completedProjects: 213,
    deployedProjects: 87,
    totalFunding: 24000000,
    totalUniversities: 32,
  },
}: CabinetBriefingModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static">
      {/* Modal Container */}
      <div
        className="w-full max-w-4xl bg-white text-ink shadow-2xl rounded-[3px] border border-border flex flex-col overflow-hidden my-auto print:shadow-none print:border-none print:w-full print:max-w-none print:m-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action Toolbar (Hidden during Print) */}
        <div className="bg-navy text-white px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-turmeric text-lg">description</span>
            <span className="text-xs font-bold uppercase tracking-wider font-mono">
              Official Cabinet Briefing &amp; State Gazette Generator
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-turmeric text-ink text-xs font-bold rounded-[2px] hover:bg-turmeric-deep transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Print Official Gazette / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 font-serif text-ink relative overflow-hidden bg-[#FCFBF7] print:p-6 print:bg-white">
          {/* Subtle Emblem Watermark */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-Saiq8B8HfuJ4idwInA2z4XrnYcglrpW8bRdUTgZg5iXUb0e_TnzlHMlZlopZXeOXOYukXp0nesbHgwQK9l_Pp6se0AyCWFS4ziY870E-CQTJo0b-fdaP6NMuLbhSJhhIfCUG3J0PozKv_wHL5tAjIKPlKHqNcOUsRQUtWG5OtawQ9TbeJ5cDnjxkvJBcVVnYl8-hn2TGt2btwhJDFSmub6fzbIavbHEUR98gdp5KmsOH-CpBr8k"
              alt="Emblem Watermark"
              className="w-[420px] h-[420px] object-contain"
            />
          </div>

          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-navy pb-4 mb-6">
            <div className="flex justify-center mb-2">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-Saiq8B8HfuJ4idwInA2z4XrnYcglrpW8bRdUTgZg5iXUb0e_TnzlHMlZlopZXeOXOYukXp0nesbHgwQK9l_Pp6se0AyCWFS4ziY870E-CQTJo0b-fdaP6NMuLbhSJhhIfCUG3J0PozKv_wHL5tAjIKPlKHqNcOUsRQUtWG5OtawQ9TbeJ5cDnjxkvJBcVVnYl8-hn2TGt2btwhJDFSmub6fzbIavbHEUR98gdp5KmsOH-CpBr8k"
                alt="Emblem of Jharkhand"
                className="h-16 w-16 object-cover rounded-full border border-border"
              />
            </div>
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-navy font-sans">
              Government of Jharkhand · Department of Higher &amp; Technical Education
            </div>
            <div className="text-[11px] font-sans text-ink-muted">
              Project Bhawan, Dhurwa, Ranchi - 834004 · Directorate of Technical Education &amp; Innovation
            </div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-ink mt-3 font-sans">
              Executive Cabinet Briefing: Societal Innovation &amp; Grievance Redressal
            </h1>
            <div className="text-xs font-mono font-bold text-turmeric-deep mt-0.5">
              Samadhan Setu (समाधान सेतु) Portal · SIH 2026 Initiative
            </div>
          </div>

          {/* Document Meta Row */}
          <div className="flex flex-wrap items-center justify-between text-xs font-sans border-b border-border pb-3 mb-6 gap-2">
            <div>
              <span className="font-bold">Memo Ref. No:</span>{' '}
              <span className="font-mono font-bold text-navy">JH/DHTE/2026/CAB-BRIEF/091</span>
            </div>
            <div>
              <span className="font-bold">Date of Dispatch:</span> {today}
            </div>
            <div>
              <span className="font-mono bg-urgent/10 text-urgent border border-urgent/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                CONFIDENTIAL · STATE CABINET CIRCULATION
              </span>
            </div>
          </div>

          {/* Content Preamble */}
          <div className="space-y-4 text-xs leading-relaxed">
            <p>
              <strong>SUBJECT:</strong> Comprehensive Statewide Progress Report on University-led Technological
              Solutions for Crowdsourced Civic and Industrial Problems in the State of Jharkhand.
            </p>
            <p>
              In pursuance of the State Innovation Policy and the directives issued by the Department of Higher &amp;
              Technical Education, the <strong>Samadhan Setu</strong> digital command hub has registered civic
              problems across <strong>all 24 administrative districts</strong> of Jharkhand. These challenges have
              been matched with <strong>{stats.totalUniversities} state &amp; premier national universities</strong> for field-tested prototyping and CSR deployment.
            </p>
          </div>

          {/* KPI Matrix Table */}
          <div className="my-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy font-sans mb-2">
              1. Statewide Innovation &amp; Resolution Metrics
            </h3>
            <table className="w-full text-left text-xs font-sans border border-border border-collapse">
              <thead>
                <tr className="bg-paper border-b border-border text-[11px] font-bold text-ink-muted uppercase">
                  <th className="p-2 border-r border-border">Total Grievances Submitted</th>
                  <th className="p-2 border-r border-border">Active University Projects</th>
                  <th className="p-2 border-r border-border">Prototypes Completed</th>
                  <th className="p-2 border-r border-border">Deployed in Field</th>
                  <th className="p-2">Committed CSR Corpus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="font-mono text-sm font-semibold">
                  <td className="p-2.5 border-r border-border">{stats.totalProblems.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 border-r border-border text-st-routed">{stats.totalProjects.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 border-r border-border text-st-resolved">{stats.completedProjects.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 border-r border-border text-forest">{stats.deployedProjects.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 text-navy">₹{(stats.totalFunding / 10000000).toFixed(2)} Crores</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Top Priority Distress Hotspots */}
          <div className="my-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy font-sans mb-2">
              2. Priority Civic Distress Hotspots (Immediate Field Action Required)
            </h3>
            <table className="w-full text-left text-xs font-sans border border-border border-collapse">
              <thead>
                <tr className="bg-paper border-b border-border text-[10px] font-bold text-ink-muted uppercase">
                  <th className="p-2 border-r border-border">Ref. ID</th>
                  <th className="p-2 border-r border-border">Grievance / Problem Title</th>
                  <th className="p-2 border-r border-border">District</th>
                  <th className="p-2 border-r border-border">Tasked University</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[11px]">
                <tr>
                  <td className="p-2 font-mono font-bold text-ink-muted border-r border-border">JH-WTR-2026-01023</td>
                  <td className="p-2 font-medium border-r border-border">Groundwater Arsenic Contamination in Peri-urban Wells</td>
                  <td className="p-2 border-r border-border">Ranchi (Kanke)</td>
                  <td className="p-2 border-r border-border">BIT Mesra (Civil Dept.)</td>
                  <td className="p-2 font-bold text-urgent">Deployment Phase</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono font-bold text-ink-muted border-r border-border">JH-AGR-2026-01024</td>
                  <td className="p-2 font-medium border-r border-border">Paddy Blast Disease Real-time Camera Sentinel</td>
                  <td className="p-2 border-r border-border">Dhanbad</td>
                  <td className="p-2 border-r border-border">Birsa Agricultural University</td>
                  <td className="p-2 font-bold text-forest">Field Testing</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono font-bold text-ink-muted border-r border-border">JH-ENR-2026-01025</td>
                  <td className="p-2 font-medium border-r border-border">Solar Cold Storage Units for Tribal Haats</td>
                  <td className="p-2 border-r border-border">Bokaro</td>
                  <td className="p-2 border-r border-border">NIT Jamshedpur (EEE Dept.)</td>
                  <td className="p-2 font-bold text-st-routed">Pilot Live (12 units)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Resolutions & Signatures */}
          <div className="mt-8 pt-4 border-t border-border font-sans text-xs">
            <p className="font-semibold mb-6">
              The Directorate hereby recommends the release of Phase-III Matching Innovation Grants from the State
              Corpus and directs all District Magistrates to accord expedited administrative permissions for field deployments.
            </p>

            <div className="flex justify-between items-end pt-8">
              <div className="text-center">
                <div className="border-t border-ink w-44 pt-1 font-bold text-ink">
                  Dr. Rajesh Sharma, IAS
                </div>
                <div className="text-[10px] text-ink-muted">
                  State Nodal Officer &amp; Director
                </div>
                <div className="text-[10px] text-ink-muted">
                  Dept. of Higher &amp; Technical Education
                </div>
              </div>

              <div className="text-center">
                <div className="border-t border-ink w-44 pt-1 font-bold text-ink">
                  Shri Rameshwar Oraon
                </div>
                <div className="text-[10px] text-ink-muted">
                  Principal Secretary to Government
                </div>
                <div className="text-[10px] text-ink-muted">
                  Government of Jharkhand
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
