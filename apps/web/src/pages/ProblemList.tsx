import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Problem } from '@sih/shared-types';
import { apiClient } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { PriorityBadge, StatusBadge } from '../components/Badge.js';

const JHARKHAND_DISTRICTS = [
  'All Districts',
  'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum',
  'Garhwa', 'Giridih', 'Godda', 'Gumla', 'Hazaribagh', 'Jamtara',
  'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur', 'Palamu',
  'Ramgarh', 'Ranchi', 'Sahibganj', 'Seraikela-Kharsawan', 'Simdega', 'West Singhbhum',
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; hex: string; icon: string }> = {
  water: { bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400', hex: '#0284c7', icon: 'water_drop' },
  road: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', hex: '#d97706', icon: 'alt_route' },
  health: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', hex: '#e11d48', icon: 'medical_services' },
  other: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', hex: '#059669', icon: 'eco' },
};

const createCategoryPin = (category: string | null | undefined, priority: string) => {
  const catKey = (category || 'other').toLowerCase();
  const cfg = CATEGORY_COLORS[catKey] || CATEGORY_COLORS['other']!;
  const isHigh = priority === 'high';
  return L.divIcon({
    className: 'custom-cat-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: ${cfg.hex};
        border: 2px solid ${isHigh ? '#ef4444' : '#ffffff'};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg) translate(-6px, -6px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <span class="material-symbols-outlined" style="
          transform: rotate(45deg);
          color: white;
          font-size: 16px;
        ">${cfg.icon}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    apiClient
      .get('/problems', { params: { limit: 100 } })
      .then((res) => {
        setProblems(res.data.data || []);
      })
      .catch((err) => {
        console.error('Failed to load problems:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchDist = (p.location?.district || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchDist) return false;
      }
      // Category
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // District
      if (selectedDistrict !== 'All Districts' && p.location?.district !== selectedDistrict) {
        return false;
      }
      // Priority
      if (selectedPriority !== 'all' && p.priority !== selectedPriority) {
        return false;
      }
      // Status
      if (selectedStatus !== 'all' && p.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [problems, searchQuery, selectedCategory, selectedDistrict, selectedPriority, selectedStatus]);

  // Metric stats
  const stats = useMemo(() => {
    const total = problems.length;
    const verified = problems.filter((p) => p.status === 'verified' || p.status === 'assigned' || p.status === 'in_progress' || p.status === 'resolved').length;
    const inProgress = problems.filter((p) => p.status === 'in_progress').length;
    const resolved = problems.filter((p) => p.status === 'resolved').length;
    return { total, verified, inProgress, resolved };
  }, [problems]);

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-400 mb-3">
              <span className="material-symbols-outlined text-sm">travel_explore</span>
              Jharkhand Civic Observatory
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Citizen Grievances & Civic Innovations
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Browse public civic issues logged across all 24 districts of Jharkhand. Explore issues on the live geographic pin map or review verified incident cards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/problems/new"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Report New Issue
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <p className="text-xs font-medium text-slate-400">Total Reports</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <p className="text-xs font-medium text-slate-400">AI Triaged & Verified</p>
            <p className="text-2xl font-bold text-orange-400 mt-1">{stats.verified}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <p className="text-xs font-medium text-slate-400">Solutions In Action</p>
            <p className="text-2xl font-bold text-sky-400 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <p className="text-xs font-medium text-slate-400">Resolved On Ground</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & View Mode Switcher */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search by keywords, location, or issue description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* District selector & View Switcher */}
          <div className="flex items-center gap-2.5">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              {JHARKHAND_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-base">grid_view</span>
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === 'map'
                    ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-base">map</span>
                Live Map
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills & Priority Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Category:</span>
            {[
              { id: 'all', label: 'All', icon: 'apps' },
              { id: 'water', label: 'Water', icon: 'water_drop' },
              { id: 'road', label: 'Road', icon: 'alt_route' },
              { id: 'health', label: 'Health', icon: 'medical_services' },
              { id: 'other', label: 'Other', icon: 'eco' },
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    active
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">{cat.icon}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Status:</span>
            {['all', 'submitted', 'verified', 'assigned', 'in_progress', 'resolved'].map((st) => {
              const active = selectedStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`capitalize rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    active
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Priority:</span>
            {['all', 'high', 'medium', 'low'].map((p) => {
              const active = selectedPriority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPriority(p)}
                  className={`capitalize rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    active
                      ? 'bg-orange-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading civic reports...</p>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
            <span className="material-symbols-outlined text-2xl">search_off</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Matching Reports Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, district filter, or category criteria.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProblems.map((p) => {
            const catKey = (p.category || 'other').toLowerCase();
            const catCfg = CATEGORY_COLORS[catKey] || CATEGORY_COLORS['other']!;
            return (
              <Link key={p._id} to={`/problems/${p._id}`} className="group block">
                <Card className="h-full flex flex-col justify-between transition-all duration-200 group-hover:border-orange-500/50 group-hover:shadow-md">
                  <div>
                    {/* Card Top Pill Row */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${catCfg.bg} ${catCfg.text}`}>
                        <span className="material-symbols-outlined text-xs">{catCfg.icon}</span>
                        {p.category || 'other'}
                      </span>
                      <div className="flex items-center gap-1">
                        <PriorityBadge priority={p.priority} />
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2">
                      {p.title}
                    </h2>

                    {/* Description excerpt */}
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-orange-500">location_on</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {p.location?.district || 'Jharkhand'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Geographic Pin Map View */
        <div className="relative h-[650px] w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg z-0">
          <MapContainer
            center={[23.6102, 85.2799]}
            zoom={8}
            className="h-full w-full"
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            {filteredProblems.map((p) => {
              const lat = p.location?.lat || 23.3441;
              const lng = p.location?.lng || 85.3096;
              const pinIcon = createCategoryPin(p.category, p.priority);

              return (
                <Marker key={p._id} position={[lat, lng]} icon={pinIcon}>
                  <Popup className="custom-problem-popup">
                    <div className="p-1 space-y-2 max-w-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                          {p.category}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {p.location?.district}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                        {p.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {p.description}
                      </p>
                      <Link
                        to={`/problems/${p._id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 mt-1"
                      >
                        Inspect Full Problem Record
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map floating legend */}
          <div className="absolute bottom-4 left-4 z-[400] rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 border border-slate-200/80 dark:border-slate-800/80 shadow-lg text-xs space-y-1.5">
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
              Legend
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                <span>Water</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Roads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span>Health</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Civic</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
