import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import LocationPickerMap from '../components/forms/LocationPickerMap.js';
import PhotoUploadZone from '../components/forms/PhotoUploadZone.js';

const JHARKHAND_DISTRICTS = [
  'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum',
  'Garhwa', 'Giridih', 'Godda', 'Gumla', 'Hazaribagh', 'Jamtara',
  'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur', 'Palamu',
  'Ramgarh', 'Ranchi', 'Sahibganj', 'Seraikela-Kharsawan', 'Simdega', 'West Singhbhum',
];

const CATEGORY_OPTIONS = [
  { value: 'water', label: 'Water & Sanitation', icon: 'water_drop', desc: 'Contamination, supply scarcity, drainage overflow' },
  { value: 'road', label: 'Road & Infrastructure', icon: 'alt_route', desc: 'Potholes, broken bridges, cave-ins, lighting' },
  { value: 'health', label: 'Health & Sanitation', icon: 'medical_services', desc: 'Epidemic risks, PHC shortages, biomedical waste' },
  { value: 'other', label: 'Civic & Environmental', icon: 'eco', desc: 'Deforestation, illegal dumps, public safety' },
];

export default function SubmitProblem() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('water');
  const [district, setDistrict] = useState('Ranchi');
  const [lat, setLat] = useState(23.3441);
  const [lng, setLng] = useState(85.3096);
  const [address, setAddress] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || title.length < 5) {
      setError('Please provide a descriptive title (at least 5 characters).');
      return;
    }
    if (!description.trim() || description.length < 15) {
      setError('Please provide detailed description (at least 15 characters) so AI can accurately triage.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('district', district);
      formData.append('location', JSON.stringify({
        lat,
        lng,
        district,
        address: address.trim() || undefined,
      }));

      // Append files for multer upload
      photos.forEach((file) => {
        formData.append('photos', file);
      });

      await apiClient.post('/problems', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmitted(true);
      setTimeout(() => navigate('/problems'), 1800);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit the report. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-700 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-sm">psychology</span>
            AI-Powered Civic Redressal Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Report a Civic Issue in Jharkhand
          </h1>
          <p className="mt-2 text-sm text-orange-100">
            Submit on-ground civic challenges. Our NVIDIA AI automatically deduplicates, classifies, and dispatches directly to State Universities for technical solutions funded by Corporate CSR.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-15 pointer-events-none">
          <span className="material-symbols-outlined text-[200px]">campaign</span>
        </div>
      </div>

      <Card>
        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Civic Report Successfully Lodged!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Your grievance has been submitted to the Jharkhand State AI Triage Queue. Coordinates and photos have been indexed. Redirecting to Civic Explorer...
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-orange-600 dark:text-orange-400 animate-pulse">
              <span className="material-symbols-outlined text-sm">sync</span>
              Routing to public explorer...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-700 dark:text-rose-400 flex items-start gap-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Category selection */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2.5">
                <span className="material-symbols-outlined text-orange-500 text-sm">category</span>
                Select Issue Domain
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CATEGORY_OPTIONS.map((opt) => {
                  const selected = category === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCategory(opt.value)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? 'border-orange-500 bg-orange-500/10 shadow-sm ring-1 ring-orange-500/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        selected ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${selected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <span className="material-symbols-outlined text-orange-500 text-sm">title</span>
                  Report Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Severely contaminated drinking well causing illness in Ward 4"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <span className="material-symbols-outlined text-orange-500 text-sm">description</span>
                  Detailed Description & Ground Impact
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain the problem in detail — exact location, duration, number of residents affected, severity, and any hazards..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* District & Landmark row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <span className="material-symbols-outlined text-orange-500 text-sm">map</span>
                  Jharkhand District
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {JHARKHAND_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d} District
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <span className="material-symbols-outlined text-orange-500 text-sm">near_me</span>
                  Landmark / Village / Ward (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Panchayat Bhavan, Morabadi"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Interactive Leaflet Location Pin Picker */}
            <LocationPickerMap
              lat={lat}
              lng={lng}
              district={district}
              onChange={(coords) => {
                setLat(coords.lat);
                setLng(coords.lng);
                if (coords.district) setDistrict(coords.district);
              }}
            />

            {/* Photo Upload Zone */}
            <PhotoUploadZone
              files={photos}
              onChange={setPhotos}
              maxFiles={4}
            />

            {/* Form Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/problems')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20 px-6 py-2.5 text-sm font-semibold rounded-xl inline-flex items-center gap-2"
              >
                <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
                  {loading ? 'sync' : 'send'}
                </span>
                {loading ? 'Submitting to AI Triage...' : 'Transmit Civic Report'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
