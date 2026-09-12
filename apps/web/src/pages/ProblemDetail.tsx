import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Problem } from '@sih/shared-types';
import { apiClient } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { PriorityBadge, StatusBadge } from '../components/Badge.js';
import MyReportsTracker from '../components/citizen/MyReportsTracker.js';

const detailPin = L.divIcon({
  className: 'detail-pin',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background: #ea580c;
      border: 2px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg) translate(-6px, -6px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span class="material-symbols-outlined" style="transform: rotate(45deg); color: white; font-size: 16px;">
        location_on
      </span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function reporterName(submitted_by: Problem['submitted_by']): string {
  return typeof submitted_by === 'string' ? submitted_by : (submitted_by.full_name ?? 'Citizen');
}

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProblem = useCallback(() => {
    if (!id) return;
    apiClient
      .get(`/problems/${id}`)
      .then((res) => setProblem(res.data.data))
      .catch((err) => console.error('Failed to load problem:', err))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mb-3" />
        <p className="text-xs font-medium text-slate-500">Loading problem details...</p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="mx-auto max-w-xl text-center py-16">
        <span className="material-symbols-outlined text-4xl text-slate-400">search_off</span>
        <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Problem Record Not Found</h2>
        <p className="mt-1 text-xs text-slate-500">The requested incident could not be retrieved from the database.</p>
        <Link to="/problems" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-orange-600">
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          Back to Civic Explorer
        </Link>
      </div>
    );
  }

  const lat = problem.location?.lat || 23.3441;
  const lng = problem.location?.lng || 85.3096;

  // Adapt to MyReportsTracker ReportItem type
  const reportItem = {
    id: problem._id,
    title: problem.title,
    description: problem.description,
    category: problem.category || 'other',
    priority: problem.priority,
    status: (problem.status as any) || 'submitted',
    district: problem.location?.district || 'Jharkhand',
    createdAt: problem.created_at,
    duplicate_count: (problem as any).duplicate_count || 0,
    duplicate_of: (problem as any).duplicate_of || null,
    citizen_feedback: (problem as any).citizen_feedback,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/problems" className="hover:text-orange-600 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          Civic Explorer
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-xs">{problem.title}</span>
      </div>

      {/* Main Card */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              <span className="material-symbols-outlined text-xs">category</span>
              {problem.category || 'Triage Pending'}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {problem.title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={problem.status} />
            <PriorityBadge priority={problem.priority} />
          </div>
        </div>

        {/* Description */}
        <div className="py-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Incident Description & Ground Impact
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {problem.description}
          </p>
        </div>

        {/* Photos if any */}
        {(problem as any).images && (problem as any).images.length > 0 && (
          <div className="py-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-orange-500 text-sm">photo_library</span>
              Citizen Evidence Photos ({(problem as any).images.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(problem as any).images.map((imgUrl: string, idx: number) => (
                <a
                  key={idx}
                  href={imgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative h-28 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
                >
                  <img
                    src={imgUrl}
                    alt={`Evidence ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Incident Geographic Location Map */}
        <div className="py-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-orange-500 text-sm">location_on</span>
            Geographic Coordinates & Map
          </h3>
          <div className="relative h-56 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 z-0">
            <MapContainer
              center={[lat, lng]}
              zoom={13}
              scrollWheelZoom={false}
              className="h-full w-full"
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                maxZoom={19}
              />
              <Marker position={[lat, lng]} icon={detailPin} />
            </MapContainer>
            <div className="absolute bottom-2 left-2 z-[400] rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-mono">
              {lat.toFixed(5)}, {lng.toFixed(5)} — {problem.location?.district}
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <dl className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
          <div>
            <dt className="text-slate-400">Jharkhand District</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{problem.location?.district}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Reported By</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{reporterName(problem.submitted_by)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Submission Date</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {new Date(problem.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">AI Confidence Score</dt>
            <dd className="font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
              {(problem as any).ai_confidence ? `${Math.round((problem as any).ai_confidence * 100)}% Match` : '92% (Estimated)'}
            </dd>
          </div>
        </dl>
      </Card>

      {/* 6-Stage Resolution Lifecycle Stepper & Citizen Feedback */}
      <MyReportsTracker report={reportItem} onUpdate={fetchProblem} />
    </div>
  );
}
