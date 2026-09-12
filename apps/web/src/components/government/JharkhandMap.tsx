import { useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import type { Layer, LeafletMouseEvent, PathOptions } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { jharkhandDistrictsGeoJson } from '../../data/jharkhandDistricts';

/* ─────────────────────────────────────────────────────────
   Type definitions
   ───────────────────────────────────────────────────────── */

export interface DistrictGeoData {
  name: string;
  total: number;
  breakdown: Record<string, number>;
  division?: string;
  hq?: string;
  critical?: number;
}

interface JharkhandMapProps {
  districts: DistrictGeoData[];
  selectedDistrict: DistrictGeoData;
  onSelectDistrict: (district: DistrictGeoData) => void;
}

/* ─────────────────────────────────────────────────────────
   Jharkhand Administrative Geodata & Metadata
   ───────────────────────────────────────────────────────── */

interface DistrictMeta {
  division: string;
  hq: string;
  center: [number, number];
  hindi: string;
  densityTier: 'Critical' | 'High' | 'Medium' | 'Low' | 'Stable';
}

const DISTRICT_METADATA: Record<string, DistrictMeta> = {
  'Garhwa': { division: 'Palamu', hq: 'Garhwa', center: [24.1611, 83.8105], hindi: 'गढ़वा', densityTier: 'Medium' },
  'Palamu': { division: 'Palamu', hq: 'Medininagar', center: [24.0416, 84.0700], hindi: 'पलामू', densityTier: 'High' },
  'Latehar': { division: 'Palamu', hq: 'Latehar', center: [23.7437, 84.4984], hindi: 'लातेहार', densityTier: 'Low' },
  'Chatra': { division: 'North Chotanagpur', hq: 'Chatra', center: [24.2144, 84.8718], hindi: 'चतरा', densityTier: 'Low' },
  'Hazaribagh': { division: 'North Chotanagpur', hq: 'Hazaribagh', center: [23.9961, 85.3670], hindi: 'हज़ारीबाग़', densityTier: 'High' },
  'Koderma': { division: 'North Chotanagpur', hq: 'Koderma', center: [24.4697, 85.5946], hindi: 'कोडरमा', densityTier: 'Low' },
  'Giridih': { division: 'North Chotanagpur', hq: 'Giridih', center: [24.1873, 86.3094], hindi: 'गिरिडीह', densityTier: 'High' },
  'Ramgarh': { division: 'North Chotanagpur', hq: 'Ramgarh', center: [23.6300, 85.5147], hindi: 'रामगढ़', densityTier: 'Medium' },
  'Bokaro': { division: 'North Chotanagpur', hq: 'Bokaro Steel City', center: [23.6693, 85.9875], hindi: 'बोकारो', densityTier: 'High' },
  'Dhanbad': { division: 'North Chotanagpur', hq: 'Dhanbad', center: [23.7957, 86.4304], hindi: 'धनबाद', densityTier: 'Critical' },
  'Lohardaga': { division: 'South Chotanagpur', hq: 'Lohardaga', center: [23.4356, 84.6784], hindi: 'लोहरदगा', densityTier: 'Low' },
  'Gumla': { division: 'South Chotanagpur', hq: 'Gumla', center: [23.0440, 84.5422], hindi: 'गुमला', densityTier: 'Low' },
  'Simdega': { division: 'South Chotanagpur', hq: 'Simdega', center: [22.6143, 84.5098], hindi: 'सिमडेगा', densityTier: 'Stable' },
  'Ranchi': { division: 'South Chotanagpur', hq: 'Ranchi', center: [23.3441, 85.3096], hindi: 'राँची', densityTier: 'Critical' },
  'Khunti': { division: 'South Chotanagpur', hq: 'Khunti', center: [23.0742, 85.2787], hindi: 'खूँटी', densityTier: 'Low' },
  'West Singhbhum': { division: 'Kolhan', hq: 'Chaibasa', center: [22.5539, 85.8142], hindi: 'पश्चिमी सिंहभूम', densityTier: 'Medium' },
  'Seraikela-Kharsawan': { division: 'Kolhan', hq: 'Seraikela', center: [22.7006, 85.9818], hindi: 'सरायकेला खरसावां', densityTier: 'Medium' },
  'East Singhbhum': { division: 'Kolhan', hq: 'Jamshedpur', center: [22.8046, 86.2029], hindi: 'पूर्वी सिंहभूम', densityTier: 'Critical' },
  'Deoghar': { division: 'Santhal Pargana', hq: 'Deoghar', center: [24.4826, 86.6974], hindi: 'देवघर', densityTier: 'High' },
  'Dumka': { division: 'Santhal Pargana', hq: 'Dumka', center: [24.2678, 87.2494], hindi: 'दुमका', densityTier: 'Medium' },
  'Godda': { division: 'Santhal Pargana', hq: 'Godda', center: [24.8291, 87.2120], hindi: 'गोड्डा', densityTier: 'Medium' },
  'Sahibganj': { division: 'Santhal Pargana', hq: 'Sahibganj', center: [25.2425, 87.6433], hindi: 'साहिबगंज', densityTier: 'High' },
  'Pakur': { division: 'Santhal Pargana', hq: 'Pakur', center: [24.6334, 87.8491], hindi: 'पाकुड़', densityTier: 'Low' },
  'Jamtara': { division: 'Santhal Pargana', hq: 'Jamtara', center: [23.9592, 86.8047], hindi: 'जामताड़ा', densityTier: 'Medium' },
};

/* Known Critical Hotspot Nodes across Jharkhand */
const INCIDENT_HOTSPOTS: Array<{ id: string; name: string; district: string; coords: [number, number]; intensity: number; domain: string }> = [
  { id: 'h1', name: 'Jharia Underground Mine Fire Corridor', district: 'Dhanbad', coords: [23.7420, 86.4150], intensity: 0.98, domain: 'Environment & Coal' },
  { id: 'h2', name: 'Dhurwa Dam Infiltration Sector', district: 'Ranchi', coords: [23.3100, 85.2800], intensity: 0.92, domain: 'Water Supply' },
  { id: 'h3', name: 'Kadma Industrial Heavy Effluent Node', district: 'East Singhbhum', coords: [22.7800, 86.1600], intensity: 0.95, domain: 'Industrial Pollution' },
  { id: 'h4', name: 'Ganga Bank Arsenic Intrusion Belt', district: 'Sahibganj', coords: [25.2300, 87.6200], intensity: 0.88, domain: 'Groundwater Arsenic' },
  { id: 'h5', name: 'Deoghar Temple Pilgrim Access Arterial', district: 'Deoghar', coords: [24.4900, 86.7000], intensity: 0.84, domain: 'Urban Congestion' },
  { id: 'h6', name: 'Koel-Karo Drought Agritech Sector', district: 'Palamu', coords: [24.0800, 84.1100], intensity: 0.82, domain: 'Drought & Irrigation' },
  { id: 'h7', name: 'Bokaro Thermal Ash Disposal Pond', district: 'Bokaro', coords: [23.7800, 85.8500], intensity: 0.79, domain: 'Fly Ash Contamination' },
  { id: 'h8', name: 'Chaibasa Iron Ore Haulage Grid', district: 'West Singhbhum', coords: [22.5600, 85.8300], intensity: 0.76, domain: 'Road Infrastructure' },
  { id: 'h9', name: 'Giridih Parasnath Eco-Vulnerable Buffer', district: 'Giridih', coords: [23.9600, 86.1300], intensity: 0.74, domain: 'Forest Depletion' },
  { id: 'h10', name: 'Netarhat Micro-Hydro Failure Node', district: 'Latehar', coords: [23.4800, 84.2600], intensity: 0.70, domain: 'Renewable Power' },
];

/* Geographic Bounding Boxes for Smooth Fly-To Navigation */
const DIVISION_BOUNDS: Record<string, L.LatLngBoundsExpression> = {
  'All Divisions': [[21.8, 83.2], [25.4, 87.9]],
  'Palamu': [[23.4, 83.3], [24.6, 84.9]],
  'North Chotanagpur': [[23.4, 84.8], [24.7, 86.8]],
  'South Chotanagpur': [[22.4, 84.1], [23.7, 85.9]],
  'Kolhan': [[21.9, 85.0], [23.2, 86.9]],
  'Santhal Pargana': [[23.8, 86.4], [25.4, 87.9]],
};

const DIVISIONS = [
  'All Divisions',
  'Palamu',
  'North Chotanagpur',
  'South Chotanagpur',
  'Kolhan',
  'Santhal Pargana',
];

const BASE_TILES = {
  positron: {
    name: 'Carto Positron (Command Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
  dark: {
    name: 'Dark Matter (War Room Dark)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
  satellite: {
    name: 'Satellite Hybrid (Tactical Aerial)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
  },
  osm: {
    name: 'OpenStreetMap (Civil Infrastructure)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
};

/* ─────────────────────────────────────────────────────────
   Map Controller Component (Handles camera movements)
   ───────────────────────────────────────────────────────── */

function MapController({
  activeDivision,
  selectedDistrict,
}: {
  activeDivision: string;
  selectedDistrict: DistrictGeoData | null;
}) {
  const map = useMap();

  useMemo(() => {
    if (!map) return;
    if (selectedDistrict && DISTRICT_METADATA[selectedDistrict.name]) {
      const meta = DISTRICT_METADATA[selectedDistrict.name]!;
      map.flyTo(meta.center, 9.2, { duration: 1.1 });
    } else if (activeDivision && DIVISION_BOUNDS[activeDivision]) {
      const bounds = DIVISION_BOUNDS[activeDivision]!;
      map.flyToBounds(bounds, { padding: [25, 25], duration: 1.1 });
    }
  }, [map, activeDivision, selectedDistrict]);

  return null;
}

/* ─────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────── */

export default function JharkhandMap({
  districts,
  selectedDistrict,
  onSelectDistrict,
}: JharkhandMapProps) {
  const [activeDivision, setActiveDivision] = useState('All Divisions');
  const [baseLayerKey, setBaseLayerKey] = useState<keyof typeof BASE_TILES>('positron');
  const [viewMode, setViewMode] = useState<'choropleth' | 'hotspots'>('choropleth');
  const [hoveredDistrictName, setHoveredDistrictName] = useState<string | null>(null);

  /* Lookup Map for Fast Matching by normalized name */
  const districtLookup = useMemo(() => {
    const map = new Map<string, DistrictGeoData>();
    districts.forEach((d) => {
      const norm = d.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      map.set(norm, d);
    });
    return map;
  }, [districts]);

  /* Helper to get clean telemetry for any district name */
  const getDistrictTelemetry = useCallback(
    (rawName: string): DistrictGeoData => {
      const norm = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const found = districtLookup.get(norm);
      if (found) return found;

      // Fuzzy normalization fallbacks
      if (norm.includes('koderma') || norm.includes('kodarma')) return districtLookup.get('koderma') || districtLookup.get('kodarma') || { name: 'Koderma', total: 110, breakdown: {} };
      if (norm.includes('sahibganj') || norm.includes('sahebganj')) return districtLookup.get('sahibganj') || districtLookup.get('sahebganj') || { name: 'Sahibganj', total: 215, breakdown: {} };
      if (norm.includes('seraikela')) return districtLookup.get('seraikelakharsawan') || districtLookup.get('seraikela') || { name: 'Seraikela-Kharsawan', total: 160, breakdown: {} };
      if (norm.includes('eastsingh')) return districtLookup.get('eastsinghbhum') || districtLookup.get('eastsinghbum') || { name: 'East Singhbhum', total: 290, breakdown: {} };
      if (norm.includes('westsingh')) return districtLookup.get('westsinghbhum') || districtLookup.get('westsinghbum') || { name: 'West Singhbhum', total: 195, breakdown: {} };

      return {
        name: rawName,
        total: 125,
        breakdown: { 'Water Supply': 42, 'Roads & Works': 38, 'Power': 25, 'Agritech': 20 },
      };
    },
    [districtLookup]
  );

  /* Color calculation based on grievance density */
  const getDistrictColor = useCallback(
    (rawName: string, isSelected: boolean, isHovered: boolean) => {
      if (isSelected) return '#1E3A8A'; // Deep Imperial Navy
      if (isHovered) return '#F59E0B'; // Vibrant Golden Amber on hover

      const data = getDistrictTelemetry(rawName);
      const total = data.total;

      if (total >= 280) return '#DC2626'; // Red - Critical
      if (total >= 200) return '#EA580C'; // Orange - Severe
      if (total >= 140) return '#D97706'; // Turmeric - High
      if (total >= 80) return '#0D9488'; // Teal - Moderate
      return '#059669'; // Emerald - Stable
    },
    [getDistrictTelemetry]
  );

  /* GeoJSON Polygon Styling */
  const geoJsonStyle = useCallback(
    (feature: GeoJSON.Feature | undefined): PathOptions => {
      if (!feature || !feature.properties) return {};
      const name: string = feature.properties.name || feature.properties.official_name || '';
      const meta = DISTRICT_METADATA[name] || DISTRICT_METADATA[feature.properties.official_name];
      const isSelected = selectedDistrict.name.toLowerCase() === name.toLowerCase();
      const isHovered = hoveredDistrictName === name;
      const isDimmed = activeDivision !== 'All Divisions' && meta && meta.division !== activeDivision;

      const fillColor = getDistrictColor(name, isSelected, isHovered);

      return {
        fillColor,
        weight: isSelected ? 3.5 : isHovered ? 2.5 : 1.2,
        opacity: isDimmed ? 0.35 : 1,
        color: isSelected ? '#1E3A8A' : isHovered ? '#B45309' : '#334155',
        dashArray: isSelected ? '' : '1',
        fillOpacity: isDimmed ? 0.15 : isSelected ? 0.85 : isHovered ? 0.8 : 0.65,
      };
    },
    [selectedDistrict.name, hoveredDistrictName, activeDivision, getDistrictColor]
  );

  /* Feature Event Handlers (Click, Hover) */
  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: Layer) => {
      const name: string = feature.properties?.name || feature.properties?.official_name || 'Jharkhand District';
      const meta = DISTRICT_METADATA[name] || {
        division: 'Jharkhand State',
        hq: name,
        center: [23.6, 85.3] as [number, number],
        hindi: feature.properties?.name_hi || name,
        densityTier: 'Medium' as const,
      };
      const tele = getDistrictTelemetry(name);

      layer.on({
        mouseover: (e: LeafletMouseEvent) => {
          setHoveredDistrictName(name);
          const target = e.target;
          target.setStyle({
            weight: 2.8,
            color: '#D97706',
            fillOpacity: 0.82,
          });
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            target.bringToFront();
          }
        },
        mouseout: (e: LeafletMouseEvent) => {
          setHoveredDistrictName(null);
          const target = e.target;
          const isSelected = selectedDistrict.name.toLowerCase() === name.toLowerCase();
          const fillColor = getDistrictColor(name, isSelected, false);
          target.setStyle({
            weight: isSelected ? 3.5 : 1.2,
            color: isSelected ? '#1E3A8A' : '#334155',
            fillColor,
            fillOpacity: isSelected ? 0.85 : 0.65,
          });
        },
        click: () => {
          onSelectDistrict(tele);
        },
      });

      // Bind rich hover tooltip
      const tooltipHtml = `
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; padding: 4px 6px; min-width: 170px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 5px;">
            <div>
              <span style="font-size: 13px; font-weight: 700; color: #0F172A;">${name}</span>
              <span style="font-size: 11px; color: #64748B; margin-left: 4px;">(${meta.hindi})</span>
            </div>
            <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; background: #EEF2F6; color: #1E3A8A; padding: 1px 4px; border-radius: 2px;">${meta.division}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; font-size: 11px;">
            <div style="background: #F8FAFC; padding: 3px 5px; border-radius: 2px;">
              <div style="color: #64748B; font-size: 9px; text-transform: uppercase;">Total Cases</div>
              <div style="font-weight: 800; color: #0F172A; font-family: monospace;">${tele.total}</div>
            </div>
            <div style="background: #FEF2F2; padding: 3px 5px; border-radius: 2px;">
              <div style="color: #991B1B; font-size: 9px; text-transform: uppercase;">Critical Tier</div>
              <div style="font-weight: 800; color: #DC2626; font-family: monospace;">${Math.round(tele.total * 0.32)}</div>
            </div>
          </div>
          <div style="font-size: 10px; color: #475569; display: flex; align-items: center; justify-content: space-between;">
            <span>Headquarters:</span>
            <span style="font-weight: 600; color: #0F172A;">${meta.hq}</span>
          </div>
          <div style="margin-top: 5px; font-size: 9px; color: #1E3A8A; text-align: center; font-weight: 600; border-top: 1px dashed #CBD5E1; padding-top: 3px;">
            Click to filter Statewide Command HUD
          </div>
        </div>
      `;

      layer.bindTooltip(tooltipHtml, {
        sticky: true,
        direction: 'auto',
        className: 'custom-leaflet-tooltip',
      });
    },
    [getDistrictTelemetry, onSelectDistrict, selectedDistrict.name, getDistrictColor]
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-[2px] border border-border shadow-xs overflow-hidden relative select-none">
      {/* ── MAP COMMAND CONTROL BAR ── */}
      <div className="p-3 bg-paper/60 border-b border-border flex flex-wrap items-center justify-between gap-2.5 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-turmeric-deep text-xl">map</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono flex items-center gap-1.5">
              <span>Jharkhand GIS Command Center</span>
              <span className="px-1.5 py-0.2 bg-forest/10 text-forest border border-forest/20 text-[9px] font-bold rounded-[2px]">
                24 Districts Live
              </span>
            </h3>
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5">
            Real-time geospatial vector choropleth and incident cluster intelligence
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-white border border-border rounded-[2px] p-0.5 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('choropleth')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-[2px] transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'choropleth'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="material-symbols-outlined text-xs">grid_view</span>
              <span>Choropleth Heat</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('hotspots')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-[2px] transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'hotspots'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="material-symbols-outlined text-xs text-urgent">radar</span>
              <span>Incident Hotspots</span>
            </button>
          </div>

          {/* Base Tile Selector */}
          <select
            value={baseLayerKey}
            onChange={(e) => setBaseLayerKey(e.target.value as keyof typeof BASE_TILES)}
            aria-label="Select Base Map Tile Layer"
            className="text-[11px] font-medium bg-white border border-border rounded-[2px] px-2 py-1 text-ink focus:outline-none focus:border-navy cursor-pointer"
          >
            <option value="positron">🗺️ Carto Positron (Command)</option>
            <option value="dark">🌑 Dark Matter (War Room)</option>
            <option value="satellite">🛰️ Satellite Hybrid</option>
            <option value="osm">🏛️ OpenStreetMap</option>
          </select>

          {/* Reset View Button */}
          <button
            type="button"
            onClick={() => {
              setActiveDivision('All Divisions');
              onSelectDistrict({
                name: 'Ranchi',
                total: 312,
                critical: 128,
                division: 'South Chotanagpur',
                breakdown: { 'Water Supply': 94, 'Urban Roads': 82, 'Power Distribution': 65, 'Healthcare': 45, 'Agritech': 26 },
              });
            }}
            title="Reset to Full Jharkhand State Bounds"
            className="px-2 py-1 bg-white hover:bg-paper text-ink-muted hover:text-navy border border-border rounded-[2px] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <span className="material-symbols-outlined text-xs">restart_alt</span>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── DIVISION QUICK FOCUS BAR ── */}
      <div className="px-3 py-1.5 bg-paper/30 border-b border-border flex items-center gap-1.5 overflow-x-auto text-[11px] z-10 scrollbar-none">
        <span className="text-[10px] font-mono uppercase font-bold text-ink-muted shrink-0 mr-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-navy">explore</span>
          <span>Focus:</span>
        </span>
        {DIVISIONS.map((div) => (
          <button
            key={div}
            type="button"
            onClick={() => setActiveDivision(div)}
            className={`px-2 py-0.5 rounded-[2px] font-medium text-[11px] shrink-0 transition-colors cursor-pointer ${
              activeDivision === div
                ? 'bg-navy text-white font-bold shadow-2xs'
                : 'text-ink-muted hover:text-navy hover:bg-white border border-transparent hover:border-border'
            }`}
          >
            {div === 'All Divisions' ? 'Statewide (24)' : div.replace(' Chotanagpur', ' CN')}
          </button>
        ))}
      </div>

      {/* ── LEAFLET GIS MAP CONTAINER ── */}
      <div className="relative flex-1 min-h-[480px] w-full bg-[#F1F5F9]">
        <MapContainer
          center={[23.6102, 85.2799]}
          zoom={7.8}
          minZoom={7.0}
          maxZoom={12}
          maxBounds={[
            [21.5, 82.5],
            [25.8, 88.5],
          ]}
          scrollWheelZoom={true}
          attributionControl={false}
          className="w-full h-full z-0"
        >
          {/* Base Layer */}
          <TileLayer
            url={BASE_TILES[baseLayerKey].url}
            attribution={BASE_TILES[baseLayerKey].attribution}
          />

          {/* Camera Controller */}
          <MapController activeDivision={activeDivision} selectedDistrict={selectedDistrict} />

          {/* 24-District GeoJSON Boundary Layer */}
          <GeoJSON
            key={`${baseLayerKey}-${activeDivision}-${selectedDistrict.name}-${viewMode}`}
            data={jharkhandDistrictsGeoJson}
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />

          {/* Incident Density Heatmap Layer Mode */}
          {viewMode === 'hotspots' && (
            <>
              {INCIDENT_HOTSPOTS.map((spot) => (
                <div key={spot.id}>
                  {/* Outer Heat Halo */}
                  <CircleMarker
                    center={spot.coords}
                    radius={32 * spot.intensity}
                    pathOptions={{
                      fillColor: '#DC2626',
                      fillOpacity: 0.22,
                      stroke: false,
                    }}
                  />
                  {/* Mid Heat Pulse */}
                  <CircleMarker
                    center={spot.coords}
                    radius={18 * spot.intensity}
                    pathOptions={{
                      fillColor: '#EA580C',
                      fillOpacity: 0.5,
                      stroke: false,
                    }}
                  />
                  {/* Core Hotspot Dot */}
                  <CircleMarker
                    center={spot.coords}
                    radius={6}
                    pathOptions={{
                      fillColor: '#FEF08A',
                      fillOpacity: 1,
                      color: '#DC2626',
                      weight: 2,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                      <div className="text-xs p-1">
                        <div className="font-bold text-ink">{spot.name}</div>
                        <div className="text-[10px] text-urgent font-mono font-semibold">
                          Domain: {spot.domain}
                        </div>
                        <div className="text-[10px] text-ink-muted mt-0.5">
                          District: {spot.district} · Severity: {Math.round(spot.intensity * 100)}%
                        </div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                </div>
              ))}
            </>
          )}
        </MapContainer>

        {/* ── FLOATING HUD: SELECTED DISTRICT TELEMETRY OVERLAY ── */}
        <div className="absolute top-3 left-3 z-[400] max-w-xs bg-white/95 backdrop-blur-md p-3 rounded-[3px] border border-border shadow-md pointer-events-auto">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-border">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
                <h4 className="text-xs font-bold text-ink font-mono uppercase tracking-wide">
                  {selectedDistrict.name} District
                </h4>
                {DISTRICT_METADATA[selectedDistrict.name] && (
                  <span className="text-[10px] text-ink-muted">
                    ({DISTRICT_METADATA[selectedDistrict.name]!.hindi})
                  </span>
                )}
              </div>
              <p className="text-[10px] text-ink-muted font-mono mt-0.5">
                {selectedDistrict.division || DISTRICT_METADATA[selectedDistrict.name]?.division || 'Jharkhand State'} Division
              </p>
            </div>
            <span className="px-1.5 py-0.5 bg-navy/10 text-navy font-mono font-bold text-[9px] rounded-[2px]">
              HQ: {selectedDistrict.hq || DISTRICT_METADATA[selectedDistrict.name]?.hq || selectedDistrict.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2.5">
            <div className="p-1.5 bg-paper rounded-[2px] border border-border/80">
              <span className="text-[9px] font-mono text-ink-muted block uppercase">Open Challenges</span>
              <span className="text-sm font-mono font-bold text-ink">{selectedDistrict.total}</span>
            </div>
            <div className="p-1.5 bg-urgent/5 rounded-[2px] border border-urgent/20">
              <span className="text-[9px] font-mono text-urgent block uppercase">Critical Priority</span>
              <span className="text-sm font-mono font-bold text-urgent">
                {selectedDistrict.critical || Math.round(selectedDistrict.total * 0.35)}
              </span>
            </div>
          </div>

          {/* Mini Sector Distribution Bar */}
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-ink-muted block uppercase font-bold">Top Civic Domains</span>
            <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden flex">
              <div style={{ width: '38%' }} className="bg-navy" title="Water Infrastructure (38%)" />
              <div style={{ width: '30%' }} className="bg-turmeric" title="Roads & Transport (30%)" />
              <div style={{ width: '20%' }} className="bg-forest" title="Agritech (20%)" />
              <div style={{ width: '12%' }} className="bg-urgent" title="Healthcare & Energy (12%)" />
            </div>
          </div>
        </div>

        {/* ── FLOATING HUD: TELEMETRY COLOR LEGEND ── */}
        <div className="absolute bottom-3 right-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-[3px] border border-border shadow-md pointer-events-auto">
          <div className="text-[10px] font-mono font-bold text-ink uppercase mb-1.5 flex items-center justify-between gap-3">
            <span>Complaint Density Scale</span>
            <span className="text-[9px] text-ink-muted font-normal">Per District</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[1px] bg-[#059669]" />
              <span>&lt;80</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[1px] bg-[#0D9488]" />
              <span>80-139</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[1px] bg-[#D97706]" />
              <span>140-199</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[1px] bg-[#EA580C]" />
              <span>200-279</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[1px] bg-[#DC2626]" />
              <span>280+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
