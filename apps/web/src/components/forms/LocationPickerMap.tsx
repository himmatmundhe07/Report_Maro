import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default leaflet marker icon asset path issues with custom SVG divIcon
const createCustomPin = () => {
  return L.divIcon({
    className: 'custom-location-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        background: radial-gradient(circle, #f97316 0%, #ea580c 70%, #c2410c 100%);
        border: 2.5px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg) translate(-8px, -8px);
        box-shadow: 0 4px 14px rgba(234, 88, 12, 0.45), 0 2px 6px rgba(0,0,0,0.3);
      ">
        <span class="material-symbols-outlined" style="
          transform: rotate(45deg);
          color: white;
          font-size: 18px;
          font-variation-settings: 'FILL' 1;
        ">location_on</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
};

// District center coordinates for auto-detection
const DISTRICT_CENTERS: Record<string, [number, number]> = {
  'Garhwa': [24.1611, 83.8105],
  'Palamu': [24.0416, 84.0700],
  'Latehar': [23.7437, 84.4984],
  'Chatra': [24.2144, 84.8718],
  'Hazaribagh': [23.9961, 85.3670],
  'Koderma': [24.4697, 85.5946],
  'Giridih': [24.1873, 86.3094],
  'Ramgarh': [23.6300, 85.5147],
  'Bokaro': [23.6693, 85.9875],
  'Dhanbad': [23.7957, 86.4304],
  'Lohardaga': [23.4356, 84.6784],
  'Gumla': [23.0440, 84.5422],
  'Simdega': [22.6143, 84.5098],
  'Ranchi': [23.3441, 85.3096],
  'Khunti': [23.0742, 85.2787],
  'West Singhbhum': [22.5539, 85.8142],
  'Seraikela-Kharsawan': [22.7006, 85.9818],
  'East Singhbhum': [22.8046, 86.2029],
  'Deoghar': [24.4826, 86.6974],
  'Dumka': [24.2678, 87.2494],
  'Godda': [24.8291, 87.2120],
  'Sahibganj': [25.2425, 87.6433],
  'Pakur': [24.6341, 87.8492],
  'Jamtara': [23.9629, 86.8016],
};

function getNearestDistrict(lat: number, lng: number): string {
  let nearest = 'Ranchi';
  let minDistance = Infinity;
  for (const [name, center] of Object.entries(DISTRICT_CENTERS)) {
    const dLat = lat - center[0];
    const dLng = lng - center[1];
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      nearest = name;
    }
  }
  return nearest;
}

// Controller component to handle map clicks & pan
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Controller component to smoothly pan map when coords change externally
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.panTo([lat, lng], { animate: true, duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

export interface LocationPickerMapProps {
  lat: number;
  lng: number;
  district: string;
  onChange: (coords: { lat: number; lng: number; district?: string }) => void;
}

export default function LocationPickerMap({ lat, lng, district, onChange }: LocationPickerMapProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const customIcon = useMemo(() => createCustomPin(), []);

  const handleSelectLocation = (newLat: number, newLng: number) => {
    const nearestDistrict = getNearestDistrict(newLat, newLng);
    onChange({ lat: Number(newLat.toFixed(6)), lng: Number(newLng.toFixed(6)), district: nearestDistrict });
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser');
      return;
    }
    setGpsLoading(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const nearestDistrict = getNearestDistrict(userLat, userLng);
        onChange({
          lat: Number(userLat.toFixed(6)),
          lng: Number(userLng.toFixed(6)),
          district: nearestDistrict,
        });
        setGpsLoading(false);
        setGpsSuccess(true);
        setTimeout(() => setGpsSuccess(false), 3000);
      },
      (err) => {
        setGpsLoading(false);
        setErrorMsg(err.message || 'Unable to retrieve location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-orange-500 text-sm">explore</span>
          Incident Geographic Pin
        </label>
        <button
          type="button"
          onClick={handleUseGps}
          disabled={gpsLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
        >
          <span className={`material-symbols-outlined text-sm ${gpsLoading ? 'animate-spin' : ''}`}>
            {gpsLoading ? 'sync' : 'my_location'}
          </span>
          {gpsLoading ? 'Detecting...' : gpsSuccess ? 'GPS Locked' : 'Use Current GPS'}
        </button>
      </div>

      <div className="relative h-64 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-900 z-0">
        <MapContainer
          center={[lat || 23.3441, lng || 85.3096]}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full"
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
          <MapClickHandler onLocationSelect={handleSelectLocation} />
          <MapRecenter lat={lat} lng={lng} />
          <Marker
            position={[lat, lng]}
            icon={customIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                handleSelectLocation(pos.lat, pos.lng);
              },
            }}
          />
        </MapContainer>

        <div className="absolute bottom-2 left-2 right-2 z-[400] flex items-center justify-between rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shadow-md">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="material-symbols-outlined text-emerald-500 text-sm">pin_drop</span>
            <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
            <span>District:</span>
            <span>{district}</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">error</span>
          {errorMsg}
        </p>
      )}
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Click anywhere on the map or drag the pin to set the precise incident location.
      </p>
    </div>
  );
}
