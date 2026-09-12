import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { GovernmentDashboardStats } from '@sih/shared-types';
import { apiClient } from '../lib/apiClient.js';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore.js';
import JharkhandMap from '../components/government/JharkhandMap';
import CaseFileDrawer, { CaseFileItem } from '../components/government/CaseFileDrawer';
import CabinetBriefingModal from '../components/government/CabinetBriefingModal';
import EmergencyBroadcastModal from '../components/government/EmergencyBroadcastModal';
import { playAlertChime, playSuccessChime } from '../utils/soundEffects';

/* ─────────────────────────────────────────────────────────
   Type definitions
   ───────────────────────────────────────────────────────── */

interface DomainItem {
  name: string;
  count: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  colorClass: string;
}

interface DistrictItem {
  name: string;
  total: number;
  breakdown: Record<string, number>;
}

interface PipelineStep {
  stage: string;
  count: number;
  pct: number;
}

interface AttentionProject {
  id: string;
  title: string;
  district: string;
  reason: string;
  severity: 'critical' | 'high' | 'medium';
  university: string;
  daysSince: number;
}

interface UniversityRow {
  name: string;
  challenges: number;
  projects: number;
  completed: number;
  deployed: number;
  students: number;
  faculty: number;
}

interface IndustryRow {
  name: string;
  projects: number;
  funding: string;
  pilots: number;
  mentorships: number;
}

interface ChallengeRow {
  id: string;
  title: string;
  district: string;
  domain: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: string;
}

interface ImpactSector {
  sector: string;
  people: number;
}

/* ─────────────────────────────────────────────────────────
   Seeded data — real DB values in production; demo-ready now
   ───────────────────────────────────────────────────────── */

const DOMAINS: DomainItem[] = [
  { name: 'Agriculture', count: 520, critical: 82, high: 174, medium: 201, low: 63, colorClass: 'bg-cat-agriculture' },
  { name: 'Healthcare', count: 390, critical: 64, high: 120, medium: 146, low: 60, colorClass: 'bg-cat-health' },
  { name: 'Water & Sanitation', count: 310, critical: 51, high: 98, medium: 112, low: 49, colorClass: 'bg-cat-water' },
  { name: 'Education', count: 270, critical: 32, high: 84, medium: 104, low: 50, colorClass: 'bg-cat-education' },
  { name: 'Environment', count: 240, critical: 28, high: 66, medium: 96, low: 50, colorClass: 'bg-cat-environment' },
  { name: 'Infrastructure', count: 180, critical: 42, high: 58, medium: 60, low: 20, colorClass: 'bg-cat-urban' },
  { name: 'Energy', count: 150, critical: 21, high: 49, medium: 55, low: 25, colorClass: 'bg-cat-energy' },
  { name: 'Accessibility', count: 120, critical: 15, high: 35, medium: 48, low: 22, colorClass: 'bg-cat-accessibility' },
];

const DISTRICTS: DistrictItem[] = [
  { name: 'Ranchi', total: 342, breakdown: { Agriculture: 72, Healthcare: 64, 'Water & San.': 51, Education: 47, Infra: 42, Others: 66 } },
  { name: 'Dhanbad', total: 287, breakdown: { Agriculture: 48, Healthcare: 55, 'Water & San.': 62, Education: 39, Infra: 50, Others: 33 } },
  { name: 'East Singhbhum', total: 251, breakdown: { Agriculture: 38, Healthcare: 52, 'Water & San.': 45, Education: 43, Infra: 48, Others: 25 } },
  { name: 'Bokaro', total: 198, breakdown: { Agriculture: 41, Healthcare: 38, 'Water & San.': 37, Education: 32, Infra: 30, Others: 20 } },
  { name: 'Hazaribagh', total: 164, breakdown: { Agriculture: 55, Healthcare: 29, 'Water & San.': 30, Education: 25, Infra: 15, Others: 10 } },
  { name: 'Deoghar', total: 142, breakdown: { Agriculture: 40, Healthcare: 32, 'Water & San.': 28, Education: 22, Infra: 12, Others: 8 } },
  { name: 'Dumka', total: 128, breakdown: { Agriculture: 44, Healthcare: 26, 'Water & San.': 22, Education: 18, Infra: 10, Others: 8 } },
  { name: 'Giridih', total: 118, breakdown: { Agriculture: 38, Healthcare: 24, 'Water & San.': 20, Education: 16, Infra: 12, Others: 8 } },
  { name: 'Palamu', total: 114, breakdown: { Agriculture: 42, Healthcare: 22, 'Water & San.': 18, Education: 14, Infra: 10, Others: 8 } },
  { name: 'Garhwa', total: 96, breakdown: { Agriculture: 35, Healthcare: 18, 'Water & San.': 16, Education: 12, Infra: 8, Others: 7 } },
  { name: 'Latehar', total: 88, breakdown: { Agriculture: 30, Healthcare: 16, 'Water & San.': 14, Education: 12, Infra: 10, Others: 6 } },
  { name: 'Chatra', total: 84, breakdown: { Agriculture: 32, Healthcare: 15, 'Water & San.': 14, Education: 10, Infra: 8, Others: 5 } },
  { name: 'Koderma', total: 78, breakdown: { Agriculture: 22, Healthcare: 16, 'Water & San.': 15, Education: 11, Infra: 8, Others: 6 } },
  { name: 'Ramgarh', total: 92, breakdown: { Agriculture: 28, Healthcare: 18, 'Water & San.': 16, Education: 12, Infra: 10, Others: 8 } },
  { name: 'Jamtara', total: 74, breakdown: { Agriculture: 26, Healthcare: 14, 'Water & San.': 12, Education: 10, Infra: 7, Others: 5 } },
  { name: 'Godda', total: 82, breakdown: { Agriculture: 31, Healthcare: 16, 'Water & San.': 13, Education: 10, Infra: 7, Others: 5 } },
  { name: 'Pakur', total: 76, breakdown: { Agriculture: 28, Healthcare: 15, 'Water & San.': 12, Education: 9, Infra: 7, Others: 5 } },
  { name: 'Sahibganj', total: 86, breakdown: { Agriculture: 32, Healthcare: 17, 'Water & San.': 14, Education: 10, Infra: 8, Others: 5 } },
  { name: 'Lohardaga', total: 68, breakdown: { Agriculture: 25, Healthcare: 13, 'Water & San.': 11, Education: 8, Infra: 6, Others: 5 } },
  { name: 'Gumla', total: 94, breakdown: { Agriculture: 36, Healthcare: 18, 'Water & San.': 15, Education: 11, Infra: 8, Others: 6 } },
  { name: 'Simdega', total: 72, breakdown: { Agriculture: 26, Healthcare: 14, 'Water & San.': 12, Education: 9, Infra: 6, Others: 5 } },
  { name: 'Khunti', total: 80, breakdown: { Agriculture: 30, Healthcare: 15, 'Water & San.': 13, Education: 10, Infra: 7, Others: 5 } },
  { name: 'West Singhbhum', total: 112, breakdown: { Agriculture: 40, Healthcare: 22, 'Water & San.': 19, Education: 14, Infra: 10, Others: 7 } },
  { name: 'Seraikela Kharsawan', total: 104, breakdown: { Agriculture: 34, Healthcare: 20, 'Water & San.': 18, Education: 14, Infra: 11, Others: 7 } },
];

const PIPELINE: PipelineStep[] = [
  { stage: 'Submitted', count: 2438, pct: 100 },
  { stage: 'Validated', count: 1940, pct: 80 },
  { stage: 'Domain Matched', count: 1240, pct: 51 },
  { stage: 'Univ. Assigned', count: 1020, pct: 42 },
  { stage: 'Project Active', count: 542, pct: 22 },
  { stage: 'Completed', count: 213, pct: 9 },
  { stage: 'Pilot', count: 96, pct: 4 },
  { stage: 'Deployed', count: 87, pct: 4 },
];

const ATTENTION: AttentionProject[] = [
  { id: 'JH-AGR-2026-01082', title: 'Smart Solar Irrigation Mesh', district: 'Hazaribagh', reason: 'No milestone update received (18 days)', severity: 'high', university: 'Birsa Agricultural University', daysSince: 18 },
  { id: 'JH-HLT-2026-01094', title: 'Rural Tele-Healthcare Diagnostic Unit', district: 'Dhanbad', reason: 'Industry partner marked inactive; funding paused', severity: 'critical', university: 'BIT Sindri', daysSince: 24 },
  { id: 'JH-WTR-2026-01102', title: 'Arsenic Water Filtration Sensor Array', district: 'Ranchi', reason: 'Field deployment delayed — permit pending', severity: 'medium', university: 'Ranchi University', daysSince: 21 },
  { id: 'JH-EDU-2026-01118', title: 'AI-based Dropout Prediction System', district: 'Dumka', reason: 'Faculty mentor resigned; replacement pending', severity: 'high', university: 'Sido Kanhu Murmu University', daysSince: 12 },
];

const UNIVERSITIES: UniversityRow[] = [
  { name: 'BIT Mesra', challenges: 142, projects: 48, completed: 22, deployed: 14, students: 240, faculty: 18 },
  { name: 'Birsa Agricultural University', challenges: 120, projects: 42, completed: 18, deployed: 11, students: 190, faculty: 14 },
  { name: 'NIT Jamshedpur', challenges: 98, projects: 35, completed: 14, deployed: 9, students: 165, faculty: 12 },
  { name: 'IIT (ISM) Dhanbad', challenges: 84, projects: 31, completed: 12, deployed: 8, students: 140, faculty: 11 },
  { name: 'Ranchi University', challenges: 76, projects: 27, completed: 9, deployed: 5, students: 120, faculty: 9 },
  { name: 'Sido Kanhu Murmu Univ.', challenges: 64, projects: 22, completed: 7, deployed: 3, students: 98, faculty: 7 },
];

const INDUSTRIES: IndustryRow[] = [
  { name: 'Tata Steel CSR Foundation', projects: 14, funding: '₹45L', pilots: 9, mentorships: 22 },
  { name: 'BCCL Innovation Lab', projects: 10, funding: '₹32L', pilots: 7, mentorships: 18 },
  { name: 'Jindal Steel & Power', projects: 8, funding: '₹25L', pilots: 5, mentorships: 14 },
  { name: 'Jharkhand Renewable Energy Corp.', projects: 6, funding: '₹18L', pilots: 4, mentorships: 11 },
  { name: 'Adityapur Industrial Area Dev. Auth.', projects: 5, funding: '₹12L', pilots: 3, mentorships: 8 },
];

const CHALLENGES: ChallengeRow[] = [
  { id: 'JH-WTR-2026-01023', title: 'Groundwater Arsenic Contamination in Peri-urban Wells', district: 'Ranchi', domain: 'Water & Sanitation', priority: 'Critical', status: 'Univ. Assigned' },
  { id: 'JH-AGR-2026-01024', title: 'Paddy Blast Disease Detection via Imagery', district: 'Dhanbad', domain: 'Agriculture', priority: 'High', status: 'Project Active' },
  { id: 'JH-ENR-2026-01025', title: 'Solar-Powered Cold Storage for Tribal Markets', district: 'Bokaro', domain: 'Energy', priority: 'High', status: 'Pilot Phase' },
  { id: 'JH-HLT-2026-01026', title: 'Primary Health Sub-Centre Tele-link System', district: 'Hazaribagh', domain: 'Healthcare', priority: 'Medium', status: 'Completed' },
  { id: 'JH-INF-2026-01027', title: 'Bridge Structural Micro-crack Sensor Network', district: 'East Singhbhum', domain: 'Infrastructure', priority: 'Critical', status: 'Validated' },
  { id: 'JH-EDU-2026-01028', title: 'Vernacular Language EdTech Content Pipeline', district: 'Dumka', domain: 'Education', priority: 'Medium', status: 'Project Active' },
  { id: 'JH-ENV-2026-01029', title: 'Damodar River Effluent Monitoring Buoy', district: 'Bokaro', domain: 'Environment', priority: 'High', status: 'Validated' },
];

const IMPACT_BY_SECTOR: ImpactSector[] = [
  { sector: 'Healthcare', people: 12400 },
  { sector: 'Agriculture', people: 9800 },
  { sector: 'Water & Sanitation', people: 8200 },
  { sector: 'Education', people: 6400 },
  { sector: 'Accessibility', people: 5200 },
];

/* Sidebar navigation items */
const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard' },
  { id: 'map', label: 'Geospatial Map' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'attention', label: 'Attention (Alerts)' },
  { id: 'universities', label: 'Universities' },
  { id: 'industry', label: 'Industry' },
  { id: 'impact', label: 'Impact' },
  { id: 'predictive', label: 'AI Risk Engine' },
  { id: 'search', label: 'Case Registry' },
  { id: 'reports', label: 'Briefings & Reports' },
] as const;

/* ─────────────────────────────────────────────────────────
   Reusable micro-components
   ───────────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted font-mono">
      {children}
    </span>
  );
}

function SectionHeading({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div id={id} className="scroll-mt-4 pb-3 border-b border-border">
      <h2 className="font-display text-xl font-medium text-ink">{title}</h2>
      {subtitle && <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>}
    </div>
  );
}

function SeverityBadge({ level }: { level: 'critical' | 'high' | 'medium' | 'low' | string }) {
  const cls =
    level === 'critical' || level === 'Critical' ? 'bg-urgent/10 text-urgent border border-urgent/30' :
    level === 'high' || level === 'High' ? 'bg-st-review/10 text-st-review border border-st-review/30' :
    level === 'medium' || level === 'Medium' ? 'bg-st-routed/10 text-st-routed border border-st-routed/30' :
    'bg-st-submitted/10 text-st-submitted border border-st-submitted/30';
  return (
    <span className={`inline-block rounded-[3px] px-2 py-0.5 text-[10px] font-semibold uppercase font-mono ${cls}`}>
      {level}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────────── */

export default function GovernmentDashboard() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [selectedDomain, setSelectedDomain] = useState<DomainItem>(DOMAINS[0]!);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictItem>(DISTRICTS[0]!);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState('All');
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [backendLive, setBackendLive] = useState(false);
  const [realStats, setRealStats] = useState<GovernmentDashboardStats['data'] | null>(null);

  // Executive Modals & Interactive Drawer State
  const [isCabinetModalOpen, setIsCabinetModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [caseFileItem, setCaseFileItem] = useState<CaseFileItem | null>(null);
  const [isCaseFileOpen, setIsCaseFileOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const displayUniversities = useMemo(() => {
    if (backendLive) {
      if (!realStats?.universityStats) return [];
      return realStats.universityStats.map(u => ({
        name: u.name || 'Unknown',
        challenges: u.totalProjects * 2,
        projects: u.totalProjects || 0,
        completed: u.completed || 0,
        deployed: Math.floor((u.completed || 0) * 0.6), 
        students: (u.totalProjects || 0) * 5,
        faculty: (u.totalProjects || 0) * 1,
      }));
    }
    return UNIVERSITIES;
  }, [backendLive, realStats]);

  const displayIndustries = useMemo(() => {
    if (backendLive) {
      if (!realStats?.industryStats) return [];
      return realStats.industryStats.map(ind => ({
        name: ind.name || 'Unknown',
        projects: ind.totalProjects || 0,
        funding: `₹${((ind.totalFunding || 0) / 100000).toFixed(1)}L`,
        pilots: Math.floor((ind.totalProjects || 0) * 0.8), 
        mentorships: (ind.totalProjects || 0) * 2, 
      }));
    }
    return INDUSTRIES;
  }, [backendLive, realStats]);

  const displayAttention = useMemo(() => {
    if (backendLive) {
      if (!realStats?.attentionProjects) return [];
      return realStats.attentionProjects.map(p => ({
        id: p.projectId.substring(0, 10).toUpperCase(),
        title: p.problemTitle,
        district: 'N/A', 
        reason: p.reason,
        severity: (p.daysSinceUpdate > 20 ? 'critical' : p.daysSinceUpdate > 14 ? 'high' : 'medium') as 'critical' | 'high' | 'medium',
        university: p.university,
        daysSince: p.daysSinceUpdate,
      }));
    }
    return ATTENTION;
  }, [backendLive, realStats]);

  const displayDomains = useMemo(() => {
    if (backendLive) {
      return DOMAINS.map(dom => {
        let realCount = 0;
        const mapping: Record<string, string> = {
          'Water & Sanitation': 'water',
          'Infrastructure': 'road',
          'Healthcare': 'health',
        };
        const catKey = mapping[dom.name];
        if (catKey && realStats?.byCategory) {
          const match = realStats.byCategory.find(c => c._id === catKey);
          if (match) realCount = match.count;
        } else if (dom.name === 'Other' && realStats?.byCategory) {
           const match = realStats.byCategory.find(c => c._id === 'other');
           if (match) realCount = match.count;
        }
        return { ...dom, count: realCount };
      });
    }
    return DOMAINS;
  }, [backendLive, realStats]);

  const displayDistricts = useMemo(() => {
    if (backendLive) {
      return DISTRICTS.map(dist => {
        let realCount = 0;
        if (realStats?.byDistrict) {
          const match = realStats.byDistrict.find(d => d._id === dist.name);
          if (match) {
            realCount = match.count;
          }
        }
        return { ...dist, total: realCount };
      });
    }
    return DISTRICTS;
  }, [backendLive, realStats]);

  /* Connect to backend's real stats endpoint */
  useEffect(() => {
    apiClient.get<GovernmentDashboardStats>('/government/dashboard-stats')
      .then((res) => {
        if (res.data.data) {
          setRealStats(res.data.data);
          setBackendLive(true);
        }
      })
      .catch(() => { setBackendLive(false); });
  }, []);

  /* Scroll sidebar → section */
  const scrollTo = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const [liveChallenges, setLiveChallenges] = useState<ChallengeRow[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [liveFeed, setLiveFeed] = useState<{id: string, text: React.ReactNode, time: string, color: string}[]>([
    { id: 'f1', text: <><span className="font-semibold text-navy">Tata Steel CSR</span> funded JH-ENR-2026 cold storage</>, time: '2 mins ago', color: 'turmeric' },
    { id: 'f2', text: <><span className="font-semibold text-forest">Ranchi Univ Lab</span> deployed field arsenic filtration array</>, time: '14 mins ago', color: 'forest' },
    { id: 'f3', text: <><span className="font-semibold text-urgent">Citizen Sentinel</span> flagged water turbidity spike in Kanke</>, time: '28 mins ago', color: 'urgent' },
  ]);

  /* Real-time WebSockets */
  useEffect(() => {
    if (!backendLive) return;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const socket = io(apiUrl);
    
    socket.on('problem_submitted', (data) => {
      if (soundEnabled) playAlertChime();
      setLiveFeed(prev => [{
        id: Date.now().toString(),
        text: <><span className="font-semibold text-navy">Citizen</span> submitted new civic issue in {data?.district || 'Jharkhand'}</>,
        time: 'Just now',
        color: 'navy'
      }, ...prev].slice(0, 6));
    });

    socket.on('problem_verified', (data) => {
      if (soundEnabled) playSuccessChime();
      setLiveFeed(prev => [{
        id: Date.now().toString(),
        text: <><span className="font-semibold text-forest">District Admin</span> verified issue #{data?.problemId?.substring(0,6) || 'XYZ'}</>,
        time: 'Just now',
        color: 'forest'
      }, ...prev].slice(0, 6));
    });

    return () => { socket.disconnect(); };
  }, [backendLive, soundEnabled]);

  /* Challenge search / filter logic */
  useEffect(() => {
    if (backendLive) {
      apiClient.get('/government/challenges', {
        params: {
          search: searchQuery || undefined,
          category: filterDomain !== 'All' ? filterDomain : undefined,
          district: filterDistrict !== 'All' ? filterDistrict : undefined,
          status: filterPriority !== 'All' ? filterPriority.toLowerCase() : undefined,
          page: searchPage,
          limit: 10
        }
      })
      .then(res => {
        if (res.data.success) {
          setLiveChallenges(res.data.data.map((c: { _id: string; title: string; location?: { district?: string }; category?: string; priority?: string; status: string }) => ({
            id: c._id.substring(0, 10).toUpperCase(),
            title: c.title,
            district: c.location?.district || 'N/A',
            domain: c.category || 'Other',
            priority: (c.priority === 'high' ? 'High' : c.priority === 'medium' ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
            status: c.status
          })));
          setTotalPages(res.data.pagination?.pages || 1);
        }
      })
      .catch(() => {
        setLiveChallenges([]);
      });
    }
  }, [backendLive, searchQuery, filterDomain, filterDistrict, filterPriority, searchPage]);

  const filteredChallenges = useMemo(() => {
    if (backendLive && liveChallenges.length > 0) {
      return liveChallenges;
    }
    
    return CHALLENGES.filter((ch) => {
      const q = searchQuery.toLowerCase();
      const matchQ = !q || ch.title.toLowerCase().includes(q) || ch.id.toLowerCase().includes(q);
      const matchDom = filterDomain === 'All' || ch.domain === filterDomain;
      const matchDist = filterDistrict === 'All' || ch.district === filterDistrict;
      const matchPri = filterPriority === 'All' || ch.priority === filterPriority;
      return matchQ && matchDom && matchDist && matchPri;
    });
  }, [backendLive, liveChallenges, searchQuery, filterDomain, filterDistrict, filterPriority]);

  /* Open Case File Drawer */
  const openCaseFile = useCallback((ch: Partial<CaseFileItem>) => {
    setCaseFileItem({
      id: ch.id || 'JH-GEN-2026',
      title: ch.title || 'Civic Infrastructure Challenge',
      district: ch.district || 'Ranchi',
      domain: ch.domain || 'Water & Sanitation',
      priority: ch.priority || 'High',
      status: ch.status || 'Active',
      reason: ch.reason,
      daysSince: ch.daysSince || 18,
      university: ch.university || 'Pending Assignment',
      description: ch.description,
    });
    setIsCaseFileOpen(true);
    if (soundEnabled) playSuccessChime();
  }, [soundEnabled]);

  /* Handle Action Execution */
  const handleActionDispatched = (_actionType: string, desc: string) => {
    if (soundEnabled) playSuccessChime();
    setLiveFeed(prev => [{
      id: Date.now().toString(),
      text: <><span className="font-semibold text-navy">State Nodal Officer</span>: {desc}</>,
      time: 'Just now',
      color: 'forest'
    }, ...prev].slice(0, 6));
  };

  /* Handle Emergency Broadcast */
  const handleBroadcastSuccess = (title: string, _domain: string, budget: string) => {
    if (soundEnabled) playAlertChime();
    setLiveFeed(prev => [{
      id: Date.now().toString(),
      text: <><span className="font-bold text-urgent">[BROADCAST]</span> {title} ({budget}) dispatched to all universities</>,
      time: 'Just now',
      color: 'urgent'
    }, ...prev].slice(0, 6));
  };

  /* CSV export */
  const exportCsv = (filename = 'jharkhand-challenges-export.csv') => {
    if (backendLive) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      window.open(`${apiUrl}/government/export-csv`, '_blank');
      return;
    }
    const hdr = ['Ref. No.', 'Title', 'District', 'Domain', 'Priority', 'Status'];
    const rows = filteredChallenges.map((c) =>
      [c.id, `"${c.title}"`, c.district, c.domain, c.priority, c.status],
    );
    const csv = [hdr.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── JSX ─── */
  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">

      {/* ═══════════════ LEFT COMMAND SIDEBAR ═══════════════ */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-border bg-paper">
        {/* Brand block */}
        <div className="border-b border-border px-5 py-4 bg-paper">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted font-mono">
            Government of Jharkhand
          </div>
          <div className="font-display text-lg font-bold text-navy leading-tight mt-1">
            समाधान सेतु
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5 font-mono">State Command Hub</div>
        </div>

        {/* Officer Status Card */}
        <div className="p-3 mx-3 mt-3 bg-white border border-border rounded-[3px] shadow-xs">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs font-mono">
              {user?.full_name?.charAt(0) || 'R'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-ink truncate">
                {user?.full_name || 'Dr. Rajesh Sharma, IAS'}
              </div>
              <div className="text-[9px] text-ink-muted truncate font-mono">
                State Nodal Officer
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-ink-muted font-mono">
            <span className="flex items-center gap-1 text-forest font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-forest animate-pulse"></span>
              NIC-Net Live
            </span>
            <span className="text-[9px]">{currentTime}</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`w-full text-left rounded-[3px] px-3 py-2 text-[12px] font-medium transition-colors cursor-pointer flex items-center justify-between ${
                activeSection === item.id
                  ? 'bg-navy text-white font-bold shadow-xs'
                  : 'text-ink-muted hover:bg-navy/5 hover:text-ink'
              }`}
            >
              <span>{item.label}</span>
              {item.id === 'attention' && displayAttention.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-urgent text-white font-mono font-bold">
                  {displayAttention.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Live Command Feed */}
        <div className="border-t border-border bg-paper/70 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="block h-2 w-2 rounded-full bg-forest animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase text-ink-muted tracking-wider font-mono">
                War Room Ticker
              </span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Audio Alerts' : 'Enable Audio Alerts'}
              className="text-ink-muted hover:text-navy cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">
                {soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
            </button>
          </div>
          <div className="space-y-2 text-[11px] text-ink">
            {liveFeed.map((item) => (
              <div
                key={item.id}
                className={`border-l-2 ${
                  item.color === 'urgent'
                    ? 'border-urgent bg-urgent/[0.03]'
                    : item.color === 'forest'
                      ? 'border-forest'
                      : 'border-turmeric'
                } pl-2 py-0.5 transition-all`}
              >
                <div className="leading-snug">{item.text}</div>
                <div className="text-[9px] text-ink-muted font-mono mt-0.5">{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer link */}
        <div className="border-t border-border px-5 py-3 bg-paper">
          <Link to="/" className="text-[11px] font-medium text-turmeric-deep hover:underline flex items-center gap-1">
            <span>←</span>
            <span>Back to Portal</span>
          </Link>
        </div>
      </aside>

      {/* ═══════════════ MAIN CONTENT AREA ═══════════════ */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── Band 2 — Officer Command Bar ── */}
        <div className="flex flex-wrap items-center justify-between border-b border-border bg-white px-6 py-3 gap-3">
          {/* Identity & Department */}
          <div className="flex items-center gap-3.5">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-Saiq8B8HfuJ4idwInA2z4XrnYcglrpW8bRdUTgZg5iXUb0e_TnzlHMlZlopZXeOXOYukXp0nesbHgwQK9l_Pp6se0AyCWFS4ziY870E-CQTJo0b-fdaP6NMuLbhSJhhIfCUG3J0PozKv_wHL5tAjIKPlKHqNcOUsRQUtWG5OtawQ9TbeJ5cDnjxkvJBcVVnYl8-hn2TGt2btwhJDFSmub6fzbIavbHEUR98gdp5KmsOH-CpBr8k"
              alt="Emblem of Jharkhand"
              className="h-11 w-11 object-cover shrink-0 rounded-full border border-border bg-white"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted font-mono">
                  State Higher &amp; Technical Education · Secretariat Command
                </span>
                <span className="font-mono text-[9px] bg-forest/10 text-forest font-bold px-1.5 py-0.2 rounded border border-forest/30">
                  TLS 1.3 SECURE
                </span>
              </div>
              <h1 className="font-display text-lg font-bold text-navy leading-tight mt-0.5">
                Samadhan Setu · State Innovation &amp; Grievance War Room
              </h1>
            </div>
          </div>

          {/* Quick Action Command Buttons */}
          <div className="flex items-center gap-2 text-[12px]">
            {/* Emergency Broadcast Button */}
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="rounded-[3px] bg-urgent/10 hover:bg-urgent/20 text-urgent border border-urgent/30 px-3 py-1.5 font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-base animate-pulse">campaign</span>
              <span>Broadcast Directive</span>
            </button>

            {/* Cabinet Briefing PDF Generator */}
            <button
              onClick={() => setIsCabinetModalOpen(true)}
              className="rounded-[3px] bg-turmeric hover:bg-turmeric-deep text-ink font-bold px-3 py-1.5 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base">description</span>
              <span>Cabinet Briefing (PDF)</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={() => exportCsv()}
              className="rounded-[3px] border border-border bg-paper hover:bg-paper-dark px-3 py-1.5 font-semibold text-ink-muted hover:text-navy transition cursor-pointer"
            >
              Export CSV
            </button>

            {/* Critical Alerts Badge */}
            <button
              onClick={() => scrollTo('attention')}
              className="flex items-center gap-1.5 rounded-[3px] border border-urgent/30 bg-urgent/5 px-2.5 py-1.5 text-urgent font-bold cursor-pointer hover:bg-urgent/10 transition"
            >
              <span className="block h-2 w-2 rounded-full bg-urgent animate-pulse"></span>
              <span>{displayAttention.length} Critical Alerts</span>
            </button>
          </div>
        </div>

        {/* ── Scrollable Main Content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1340px] px-6 py-6 space-y-8">

            {/* ══════════════════════════════════════════
                SECTION 1 — KPI Stat Cards
               ══════════════════════════════════════════ */}
            <section id="overview">
              <Eyebrow>State-Level Innovation &amp; Grievance Indicators</Eyebrow>
              <div className="mt-3 grid grid-cols-4 gap-px bg-border lg:grid-cols-7 rounded-[3px] overflow-hidden border border-border shadow-xs">
                {[
                  { label: 'Problems Submitted', value: realStats?.kpis?.totalProblems ?? 2438, sub: '24 / 24 districts' },
                  { label: 'Active Projects', value: realStats?.kpis?.totalProjects ?? 542, sub: `${realStats?.kpis?.totalUniversities ?? 38} universities` },
                  { label: 'Solutions Tested', value: realStats?.kpis?.completedProjects ?? 213, sub: 'Validated prototypes' },
                  { label: 'Field Deployed', value: realStats?.kpis?.deployedProjects ?? 87, sub: 'Public installations' },
                  { label: 'Universities', value: realStats?.kpis?.totalUniversities ?? 32, sub: 'Onboarded nodes' },
                  { label: 'Industry Partners', value: realStats?.kpis?.totalIndustry ?? 86, sub: `₹${((realStats?.kpis?.totalFunding ?? 24000000) / 10000000).toFixed(1)} Cr committed` },
                  { label: 'People Impacted', value: '42,000+', sub: '86 villages reached' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white px-4 py-4 hover:bg-paper transition-colors">
                    <div className="text-[11px] font-bold text-ink-muted uppercase font-mono">{kpi.label}</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-navy">
                      {typeof kpi.value === 'number' ? kpi.value.toLocaleString('en-IN') : kpi.value}
                    </div>
                    <div className="mt-0.5 text-[10px] text-ink-muted font-sans">{kpi.sub}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SECTION 2 & 3 — Interactive Map & Domain Breakdown
               ══════════════════════════════════════════ */}
            <section id="map" className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-12">
                {/* INTERACTIVE GEOSPATIAL VECTOR MAP OF JHARKHAND */}
                <div className="lg:col-span-7">
                  <JharkhandMap
                    districts={displayDistricts}
                    selectedDistrict={selectedDistrict}
                    onSelectDistrict={(dist) => {
                      setSelectedDistrict(dist);
                      setFilterDistrict(dist.name);
                    }}
                  />
                </div>

                {/* DOMAIN ANALYTICS & DISTRICT SECTOR PROFILE */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {/* Selected District Deep Dive Card */}
                  <div className="border border-border bg-white p-4 rounded-[2px] shadow-xs">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted font-mono">
                          Active District Focus
                        </div>
                        <h3 className="font-display text-lg font-bold text-navy mt-0.5">
                          {selectedDistrict.name} District
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold font-mono text-ink">{selectedDistrict.total}</span>
                        <div className="text-[9px] text-ink-muted uppercase font-mono font-bold">Total Issues</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-[11px] font-bold text-ink mb-2">District Sector Breakdown</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {Object.entries(selectedDistrict.breakdown).map(([sector, count]) => (
                          <button
                            key={sector}
                            onClick={() => setFilterDomain(sector.includes('Water') ? 'Water & Sanitation' : sector)}
                            className="rounded-[2px] border border-border bg-paper hover:border-navy hover:bg-white p-2 text-center transition cursor-pointer"
                          >
                            <div className="font-mono text-sm font-bold text-navy">{count}</div>
                            <div className="text-[10px] text-ink-muted truncate font-medium">{sector}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Challenges by Domain Breakdown */}
                  <div id="challenges" className="border border-border bg-white p-4 rounded-[2px] flex-1 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
                          Statewide Domain Severity
                        </h3>
                        <p className="text-[11px] text-ink-muted">Click any domain to inspect triage severity</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-navy">
                        {displayDomains.reduce((acc, curr) => acc + curr.count, 0)} Total
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {displayDomains.map((dom) => {
                        const pct = Math.round((dom.count / 550) * 100);
                        const active = selectedDomain.name === dom.name;
                        return (
                          <button
                            key={dom.name}
                            onClick={() => setSelectedDomain(dom)}
                            className={`block w-full rounded-[2px] p-2 text-left transition cursor-pointer ${
                              active ? 'bg-navy/5 border border-navy/30' : 'hover:bg-navy/[0.02] border border-transparent'
                            }`}
                          >
                            <div className="flex items-baseline justify-between text-xs">
                              <span className="font-semibold text-ink">{dom.name}</span>
                              <span className="font-mono text-xs font-bold text-ink">{dom.count}</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full rounded-[2px] bg-border/50 overflow-hidden">
                              <div className={`h-full rounded-[2px] ${dom.colorClass}`} style={{ width: `${pct}%` }}></div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Domain Severity Mini-Matrix */}
                    <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-ink truncate max-w-[140px]">{selectedDomain.name}</span>
                      <div className="flex gap-2 font-mono text-[10px]">
                        <span className="text-urgent font-bold">{selectedDomain.critical} Crit</span>
                        <span className="text-st-review font-bold">{selectedDomain.high} High</span>
                        <span className="text-st-routed font-bold">{selectedDomain.medium} Med</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SECTION 4 — Challenge → Project Pipeline Funnel
               ══════════════════════════════════════════ */}
            <section id="pipeline" className="border border-border bg-white p-5 rounded-[2px] shadow-xs">
              <SectionHeading id="pipeline-h" title="Challenge → Solution Lifecycle Pipeline" subtitle="Full societal conversion funnel from citizen grievance to production deployment" />

              <div className="mt-5">
                {PIPELINE.map((step, idx) => {
                  let realCount = 0;
                  let realPct = 0;
                  
                  if (backendLive) {
                    const statusKey = step.stage === 'Submitted' ? 'submitted' :
                                      step.stage === 'Validated' ? 'verified' :
                                      step.stage === 'Domain Matched' ? 'assigned' :
                                      step.stage === 'Univ. Assigned' ? 'in_progress' :
                                      step.stage === 'Project Active' ? 'active' :
                                      step.stage === 'Completed' ? 'completed' :
                                      null;
                    
                    if (statusKey) {
                      realCount = realStats?.pipeline?.problems?.[statusKey] ?? realStats?.pipeline?.projects?.[statusKey] ?? 0;
                    }
                    
                    const maxVal = realStats?.pipeline?.problems?.['submitted'] || 1;
                    realPct = maxVal > 0 ? Math.round((realCount / maxVal) * 100) : 0;
                  } else {
                    realCount = step.count;
                    realPct = step.pct;
                  }

                  return (
                    <div key={step.stage} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-xs font-semibold text-ink">
                            <span className="font-mono text-ink-muted mr-1.5">{String(idx + 1).padStart(2, '0')}</span>
                            {step.stage}
                          </span>
                          <span className="font-mono text-xs font-bold text-navy">{realCount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="h-4 w-full rounded-[2px] bg-border/40 overflow-hidden">
                          <div
                            className="h-full rounded-[2px] bg-navy transition-all duration-500"
                            style={{ width: `${realPct}%`, opacity: 0.2 + (realPct / 100) * 0.8 }}
                          ></div>
                        </div>
                      </div>
                      {idx < PIPELINE.length - 1 && (
                        <div className="w-4 text-center text-border text-xs">↓</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SECTION 5 — Projects Requiring Attention (Interactive Directives)
               ══════════════════════════════════════════ */}
            <section id="attention" className="border-2 border-urgent/30 bg-urgent/[0.02] p-5 rounded-[2px] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-urgent/20">
                <div className="flex items-center gap-2">
                  <span className="block h-2.5 w-2.5 rounded-full bg-urgent animate-pulse"></span>
                  <h2 className="font-display text-lg font-bold text-ink">Projects Requiring Immediate State Intervention</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Eyebrow>{displayAttention.length} Cases Flagged</Eyebrow>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {displayAttention.map((p) => (
                  <div key={p.id} className="flex flex-col justify-between rounded-[3px] border border-border bg-white p-4 shadow-xs hover:border-navy transition">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-navy">{p.id}</span>
                        <SeverityBadge level={p.severity} />
                      </div>
                      <h3 className="mt-1.5 text-sm font-semibold text-ink leading-snug">{p.title}</h3>
                      <p className="mt-1 text-xs text-urgent font-medium">{p.reason}</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-muted font-mono">
                        <span>{p.district}</span>
                        <span>·</span>
                        <span className="truncate max-w-[150px]">{p.university}</span>
                        <span>·</span>
                        <span className="text-urgent font-bold">{p.daysSince} days pending</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-[10px] text-ink-muted font-mono">Executive Directive Available</span>
                      <button
                        onClick={() => openCaseFile(p)}
                        className="rounded-[2px] bg-navy text-white px-3 py-1 text-xs font-bold hover:bg-navy-deep transition cursor-pointer flex items-center gap-1"
                      >
                        <span>Open Case File</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SECTION 6 & 7 — Universities + Industry
               ══════════════════════════════════════════ */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* University Performance */}
              <section id="universities" className="border border-border bg-white p-5 rounded-[2px] shadow-xs">
                <SectionHeading id="univ-h" title="University Participation" subtitle="Institutional uptake and solution progress across engineering nodes" />

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted font-mono">
                        <th className="pb-2 pr-3">Institution</th>
                        <th className="pb-2 pr-2 text-right">Chal.</th>
                        <th className="pb-2 pr-2 text-right">Proj.</th>
                        <th className="pb-2 pr-2 text-right">Done</th>
                        <th className="pb-2 pr-2 text-right">Depl.</th>
                        <th className="pb-2 text-right">Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 font-sans">
                      {displayUniversities.map((u) => (
                        <tr key={u.name} className="hover:bg-navy/[0.02]">
                          <td className="py-2.5 pr-3 font-semibold text-ink">{u.name}</td>
                          <td className="py-2.5 pr-2 text-right font-mono">{u.challenges}</td>
                          <td className="py-2.5 pr-2 text-right font-mono text-st-routed font-semibold">{u.projects}</td>
                          <td className="py-2.5 pr-2 text-right font-mono text-st-resolved font-semibold">{u.completed}</td>
                          <td className="py-2.5 pr-2 text-right font-mono text-forest font-bold">{u.deployed}</td>
                          <td className="py-2.5 text-right font-mono text-ink-muted">{u.students}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Industry Engagement */}
              <section id="industry" className="border border-border bg-white p-5 rounded-[2px] flex flex-col shadow-xs">
                <SectionHeading id="ind-h" title="Industry &amp; CSR Co-sponsorship" subtitle="Private-sector funding and corporate field pilots" />

                {/* Summary row */}
                <div className="mt-4 grid grid-cols-3 gap-px bg-border rounded-[2px] overflow-hidden border border-border">
                  <div className="bg-paper px-3 py-3 text-center">
                    <div className="font-mono text-lg font-bold text-navy">₹2.4 Cr</div>
                    <div className="text-[10px] font-bold uppercase text-ink-muted font-mono">CSR Committed</div>
                  </div>
                  <div className="bg-paper px-3 py-3 text-center">
                    <div className="font-mono text-lg font-bold text-forest">43</div>
                    <div className="text-[10px] font-bold uppercase text-ink-muted font-mono">Active Pilots</div>
                  </div>
                  <div className="bg-paper px-3 py-3 text-center">
                    <div className="font-mono text-lg font-bold text-ink">124</div>
                    <div className="text-[10px] font-bold uppercase text-ink-muted font-mono">Industry Mentors</div>
                  </div>
                </div>

                {/* Partners table */}
                <div className="mt-4 flex-1 overflow-x-auto">
                  <Eyebrow>Top Contributing Corporate Partners</Eyebrow>
                  <table className="mt-2 w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted font-mono">
                        <th className="pb-2 pr-3">Partner Entity</th>
                        <th className="pb-2 pr-2 text-right">Projects</th>
                        <th className="pb-2 pr-2 text-right">Funding</th>
                        <th className="pb-2 text-right">Pilots</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {displayIndustries.map((ind) => (
                        <tr key={ind.name} className="hover:bg-navy/[0.02]">
                          <td className="py-2.5 pr-3 font-semibold text-ink">{ind.name}</td>
                          <td className="py-2.5 pr-2 text-right font-mono">{ind.projects}</td>
                          <td className="py-2.5 pr-2 text-right font-mono text-forest font-bold">{ind.funding}</td>
                          <td className="py-2.5 text-right font-mono">{ind.pilots}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* ══════════════════════════════════════════
                SECTION 8 — Social Impact + Innovation Outcomes
               ══════════════════════════════════════════ */}
            <section id="impact" className="border border-forest/30 bg-forest/[0.02] p-5 rounded-[2px] shadow-xs">
              <SectionHeading id="impact-h" title="Measurable Societal Impact &amp; Field Outcomes" subtitle="Quantified societal transformation across Jharkhand's rural and urban talukas" />

              {/* Top-line metrics */}
              <div className="mt-5 grid grid-cols-3 gap-px bg-forest/20 lg:grid-cols-6 rounded-[2px] overflow-hidden border border-forest/20">
                {[
                  { val: realStats?.impactStats?.totalPeopleImpacted ? `${realStats.impactStats.totalPeopleImpacted}+` : '42,000+', label: 'People Impacted' },
                  { val: realStats?.impactStats?.totalVillagesReached || '86', label: 'Villages Reached' },
                  { val: realStats?.impactStats?.totalDeployed || realStats?.kpis?.deployedProjects || '87', label: 'Solutions Deployed' },
                  { val: realStats?.kpis?.completedProjects || '156', label: 'Prototypes Validated' },
                  { val: realStats?.impactStats?.totalStartups || '12', label: 'Startups Incubated' },
                  { val: realStats?.impactStats?.totalPatents || '8', label: 'Patents Filed' },
                ].map((m) => (
                  <div key={m.label} className="bg-white px-4 py-3 text-center hover:bg-paper transition-colors">
                    <div className="font-mono text-xl font-bold text-forest">{m.val}</div>
                    <div className="text-[10px] font-bold uppercase text-ink-muted mt-0.5 font-mono">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Impact by sector */}
              <div className="mt-5 border-t border-forest/15 pt-4">
                <Eyebrow>Impact by Sector (Beneficiaries Reached)</Eyebrow>
                <div className="mt-3 space-y-2">
                  {IMPACT_BY_SECTOR.map((s) => {
                    const maxPeople = 13000;
                    const pct = Math.round((s.people / maxPeople) * 100);
                    return (
                      <div key={s.sector} className="flex items-center gap-3">
                        <span className="w-28 text-xs font-semibold text-ink truncate">{s.sector}</span>
                        <div className="flex-1 h-3 rounded-[2px] bg-forest/10 overflow-hidden">
                          <div className="h-full rounded-[2px] bg-forest/50" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="font-mono text-xs font-bold text-ink w-16 text-right">
                          {s.people.toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SECTION 8B — AI Predictive Risk Engine & Automated Matchmaker
               ══════════════════════════════════════════ */}
            <section id="predictive" className="border border-navy/20 bg-navy/[0.02] p-5 rounded-[2px] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-navy/10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-turmeric-deep text-xl">neurology</span>
                  <h2 className="font-display text-lg font-bold text-navy">
                    AI Predictive Threat Intelligence &amp; Matchmaker
                  </h2>
                </div>
                <span className="text-[10px] font-mono bg-navy text-white px-2 py-0.5 rounded font-bold">
                  MODEL: JH-CIVIC-LLM-V2
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {/* Threat Forecast Card */}
                <div className="p-4 bg-white rounded-[2px] border border-border shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink font-mono flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-urgent">warning</span>
                      <span>Seasonal Risk Modeling (Next 30–45 Days)</span>
                    </span>
                    <span className="text-[10px] font-mono text-urgent font-bold">+34% Surge Risk</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded bg-paper border border-border">
                      <div className="font-bold text-ink flex items-center justify-between">
                        <span>Water Contamination Runoff Surge</span>
                        <span className="font-mono text-urgent font-bold">Dhanbad &amp; Bokaro</span>
                      </div>
                      <p className="text-[11px] text-ink-muted mt-1">
                        High probability of heavy industrial effluent mixing with open peri-urban aquifers due to predicted monsoon drainage overflow.
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-paper border border-border">
                      <div className="font-bold text-ink flex items-center justify-between">
                        <span>Agricultural Blast Blight Alert</span>
                        <span className="font-mono text-st-review font-bold">Santhal Pargana</span>
                      </div>
                      <p className="text-[11px] text-ink-muted mt-1">
                        Humidity anomaly index at 82% indicates potential outbreak in paddy clusters across Dumka &amp; Godda.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Automated University Matchmaker */}
                <div className="p-4 bg-white rounded-[2px] border border-border shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink font-mono flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-forest">auto_awesome</span>
                      <span>AI Matchmaking Recommendations</span>
                    </span>
                    <span className="text-[10px] font-mono text-forest font-bold">Patent &amp; Lab Weighted</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded bg-paper border border-border flex items-center justify-between">
                      <div>
                        <div className="font-bold text-ink">BIT Mesra · Remote Sensing Lab</div>
                        <div className="text-[10px] text-ink-muted">Best for: Arsenic Water Sensor Network (96.4% fit)</div>
                      </div>
                      <button
                        onClick={() => openCaseFile(CHALLENGES[0]!)}
                        className="px-2.5 py-1 bg-navy text-white text-[10px] font-bold rounded-[2px] hover:bg-navy-deep cursor-pointer"
                      >
                        Assign
                      </button>
                    </div>

                    <div className="p-2.5 rounded bg-paper border border-border flex items-center justify-between">
                      <div>
                        <div className="font-bold text-ink">Birsa Agricultural University · Drone Lab</div>
                        <div className="text-[10px] text-ink-muted">Best for: Paddy Blast Sentinel Camera (94.2% fit)</div>
                      </div>
                      <button
                        onClick={() => openCaseFile(CHALLENGES[1]!)}
                        className="px-2.5 py-1 bg-navy text-white text-[10px] font-bold rounded-[2px] hover:bg-navy-deep cursor-pointer"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SECTION 9 — Challenge Case Registry (Interactive Table)
               ══════════════════════════════════════════ */}
            <section id="search" className="border border-border bg-white p-5 rounded-[2px] shadow-xs">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-border gap-2">
                <div>
                  <h2 className="font-display text-lg font-bold text-navy">State Challenge &amp; Grievance Registry</h2>
                  <p className="text-xs text-ink-muted">Search, filter, and execute state directives on crowdsourced civic issues</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportCsv('state-challenge-registry.csv')}
                    className="rounded-[2px] bg-turmeric px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-turmeric-deep transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>Export Registry</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <input
                  type="text"
                  placeholder="Search by Ref. No. or keyword…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-[2px] border border-border bg-paper px-3 py-2 text-xs text-ink placeholder:text-ink-muted/50 focus:border-navy focus:outline-none font-sans"
                />
                <select
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  className="rounded-[2px] border border-border bg-paper px-3 py-2 text-xs text-ink cursor-pointer focus:border-navy focus:outline-none"
                >
                  <option value="All">All Domains</option>
                  {DOMAINS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="rounded-[2px] border border-border bg-paper px-3 py-2 text-xs text-ink cursor-pointer focus:border-navy focus:outline-none"
                >
                  <option value="All">All Districts</option>
                  {DISTRICTS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="rounded-[2px] border border-border bg-paper px-3 py-2 text-xs text-ink cursor-pointer focus:border-navy focus:outline-none"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Results table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted font-mono bg-paper">
                      <th className="py-2.5 px-3">Ref. No.</th>
                      <th className="py-2.5 px-3">Problem Title</th>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">Domain</th>
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Directive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredChallenges.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-ink-muted font-mono">
                          No matching challenges found.
                        </td>
                      </tr>
                    ) : (
                      filteredChallenges.map((ch) => (
                        <tr
                          key={ch.id}
                          onClick={() => openCaseFile(ch)}
                          className="hover:bg-navy/[0.03] transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-3 font-mono text-[11px] font-bold text-navy">{ch.id}</td>
                          <td className="py-3 px-3 font-semibold text-ink max-w-xs truncate">{ch.title}</td>
                          <td className="py-3 px-3 text-ink-muted">{ch.district}</td>
                          <td className="py-3 px-3 text-ink-muted">{ch.domain}</td>
                          <td className="py-3 px-3"><SeverityBadge level={ch.priority} /></td>
                          <td className="py-3 px-3">
                            <span className="rounded-[2px] bg-navy/5 px-2 py-0.5 text-[10px] font-semibold text-navy uppercase font-mono">
                              {ch.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCaseFile(ch);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold bg-navy text-white rounded-[2px] hover:bg-navy-deep cursor-pointer"
                            >
                              Action →
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {backendLive && totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <div className="text-[11px] text-ink-muted font-mono">
                      Page {searchPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSearchPage(p => Math.max(1, p - 1))}
                        disabled={searchPage === 1}
                        className="px-3 py-1 text-xs font-medium border border-border rounded-[2px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-navy/5 cursor-pointer"
                      >
                        Previous
                      </button>
                      <button 
                        onClick={() => setSearchPage(p => Math.min(totalPages, p + 1))}
                        disabled={searchPage === totalPages}
                        className="px-3 py-1 text-xs font-medium border border-border rounded-[2px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-navy/5 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ══════════════════════════════════════════
                SECTION 10 — Reports & Gazette Downloads
               ══════════════════════════════════════════ */}
            <section id="reports" className="border border-border bg-white p-5 rounded-[2px] shadow-xs">
              <SectionHeading id="reports-h" title="Administrative Reports &amp; Cabinet Gazettes" subtitle="Downloadable formal digests and official briefings for executive circulation" />
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  onClick={() => setIsCabinetModalOpen(true)}
                  className="flex items-center justify-between rounded-[2px] border-2 border-turmeric bg-turmeric/10 px-4 py-3 text-xs font-bold text-ink hover:bg-turmeric/20 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-turmeric-deep">description</span>
                    <span>State Cabinet Briefing (Print/PDF)</span>
                  </span>
                  <span className="material-symbols-outlined text-sm">print</span>
                </button>

                {[
                  'Monthly Challenge Audit Report',
                  'District Innovation Performance Digest',
                  'University R&D Output & Patent Report',
                  'Industry CSR Funding Expenditure Report',
                  'Public Societal Impact & Beneficiary Census',
                ].map((r) => (
                  <button
                    key={r}
                    onClick={() => exportCsv(`${r.toLowerCase().replace(/ /g, '-')}.csv`)}
                    className="flex items-center justify-between rounded-[2px] border border-border bg-paper px-4 py-3 text-xs font-medium text-ink hover:bg-navy/[0.03] transition cursor-pointer"
                  >
                    <span>{r}</span>
                    <span className="text-ink-muted text-[11px] font-mono">CSV ↓</span>
                  </button>
                ))}
              </div>
            </section>

          </div>

          {/* ── Footer ── */}
          <footer className="mt-8 border-t border-border bg-white">
            <div className="mx-auto max-w-[1340px] px-6 py-4 text-[11px] text-ink-muted font-sans">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Developed by Team Samadhan Setu · Smart India Hackathon 2026 · PS 26043</span>
                <span>Department of Higher &amp; Technical Education · Government of Jharkhand</span>
                <span className="font-mono">Secure Node: JH-RANCHI-GOV-01 · Time: {currentTime}</span>
              </div>
            </div>
            <div className="bg-navy px-6 py-2.5 text-center text-[11px] text-white/80 font-sans">
              © 2026 Government of Jharkhand. All Rights Reserved. | Official State Innovation &amp; Grievance Command Center
            </div>
          </footer>
        </main>
      </div>

      {/* ═══════════════ MODALS & SLIDE-OVER DRAWER ═══════════════ */}
      {/* 1. Case File Directive Drawer */}
      <CaseFileDrawer
        isOpen={isCaseFileOpen}
        item={caseFileItem}
        onClose={() => setIsCaseFileOpen(false)}
        onActionDispatched={handleActionDispatched}
      />

      {/* 2. Official Cabinet Briefing Modal */}
      <CabinetBriefingModal
        isOpen={isCabinetModalOpen}
        onClose={() => setIsCabinetModalOpen(false)}
        stats={{
          totalProblems: realStats?.kpis?.totalProblems ?? 2438,
          totalProjects: realStats?.kpis?.totalProjects ?? 542,
          completedProjects: realStats?.kpis?.completedProjects ?? 213,
          deployedProjects: realStats?.kpis?.deployedProjects ?? 87,
          totalFunding: realStats?.kpis?.totalFunding ?? 24000000,
          totalUniversities: realStats?.kpis?.totalUniversities ?? 32,
        }}
      />

      {/* 3. Emergency Challenge Broadcast Modal */}
      <EmergencyBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onBroadcastSuccess={handleBroadcastSuccess}
      />
    </div>
  );
}
