import { useState, useMemo } from 'react';

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

interface DistrictSvgCoord {
  id: string;
  name: string;
  division: string;
  center: [number, number]; // [cx, cy] for labels
  path: string; // SVG path
}

// Stylized yet geographically representative vector geometry for the 24 districts of Jharkhand
// Coordinates projected onto a 660x480 coordinate space
const DISTRICT_PATHS: DistrictSvgCoord[] = [
  // ── PALAMU DIVISION (North-West) ──
  {
    id: 'garhwa',
    name: 'Garhwa',
    division: 'Palamu',
    center: [55, 110],
    path: 'M 30,70 L 80,60 L 90,130 L 60,170 L 25,140 Z',
  },
  {
    id: 'palamu',
    name: 'Palamu',
    division: 'Palamu',
    center: [125, 125],
    path: 'M 80,60 L 160,70 L 175,130 L 140,175 L 90,130 Z',
  },
  {
    id: 'latehar',
    name: 'Latehar',
    division: 'Palamu',
    center: [140, 195],
    path: 'M 90,130 L 140,175 L 185,170 L 195,230 L 120,240 L 60,170 Z',
  },

  // ── NORTH CHOTANAGPUR DIVISION (North-Central & Coal Belt) ──
  {
    id: 'chatra',
    name: 'Chatra',
    division: 'North Chotanagpur',
    center: [210, 115],
    path: 'M 160,70 L 245,65 L 260,120 L 230,165 L 175,130 Z',
  },
  {
    id: 'koderma',
    name: 'Koderma',
    division: 'North Chotanagpur',
    center: [285, 80],
    path: 'M 245,65 L 320,60 L 335,105 L 260,120 Z',
  },
  {
    id: 'hazaribagh',
    name: 'Hazaribagh',
    division: 'North Chotanagpur',
    center: [265, 160],
    path: 'M 230,165 L 260,120 L 335,105 L 340,160 L 305,200 L 235,195 Z',
  },
  {
    id: 'giridih',
    name: 'Giridih',
    division: 'North Chotanagpur',
    center: [375, 120],
    path: 'M 320,60 L 420,70 L 440,140 L 380,175 L 335,105 Z',
  },
  {
    id: 'ramgarh',
    name: 'Ramgarh',
    division: 'North Chotanagpur',
    center: [280, 225],
    path: 'M 235,195 L 305,200 L 325,235 L 265,255 L 225,230 Z',
  },
  {
    id: 'bokaro',
    name: 'Bokaro',
    division: 'North Chotanagpur',
    center: [360, 205],
    path: 'M 305,200 L 380,175 L 420,200 L 395,245 L 325,235 Z',
  },
  {
    id: 'dhanbad',
    name: 'Dhanbad',
    division: 'North Chotanagpur',
    center: [435, 195],
    path: 'M 380,175 L 460,165 L 485,210 L 420,225 L 420,200 Z',
  },

  // ── SANTHAL PARGANA DIVISION (North-East) ──
  {
    id: 'deoghar',
    name: 'Deoghar',
    division: 'Santhal Pargana',
    center: [450, 110],
    path: 'M 420,70 L 480,80 L 490,145 L 440,140 Z',
  },
  {
    id: 'dumka',
    name: 'Dumka',
    division: 'Santhal Pargana',
    center: [520, 140],
    path: 'M 480,80 L 550,90 L 565,160 L 515,185 L 460,165 L 490,145 Z',
  },
  {
    id: 'jamtara',
    name: 'Jamtara',
    division: 'Santhal Pargana',
    center: [485, 195],
    path: 'M 460,165 L 515,185 L 505,225 L 465,220 Z',
  },
  {
    id: 'godda',
    name: 'Godda',
    division: 'Santhal Pargana',
    center: [550, 85],
    path: 'M 515,40 L 585,55 L 590,115 L 550,90 Z',
  },
  {
    id: 'sahibganj',
    name: 'Sahibganj',
    division: 'Santhal Pargana',
    center: [610, 60],
    path: 'M 585,55 L 645,45 L 655,95 L 605,105 L 590,115 Z',
  },
  {
    id: 'pakur',
    name: 'Pakur',
    division: 'Santhal Pargana',
    center: [600, 140],
    path: 'M 590,115 L 605,105 L 645,130 L 630,175 L 565,160 Z',
  },

  // ── SOUTH CHOTANAGPUR DIVISION (Central & South-West) ──
  {
    id: 'lohardaga',
    name: 'Lohardaga',
    division: 'South Chotanagpur',
    center: [170, 260],
    path: 'M 140,230 L 195,230 L 205,280 L 145,285 Z',
  },
  {
    id: 'ranchi',
    name: 'Ranchi',
    division: 'South Chotanagpur',
    center: [260, 285],
    path: 'M 195,230 L 265,255 L 335,270 L 320,330 L 235,335 L 205,280 Z',
  },
  {
    id: 'gumla',
    name: 'Gumla',
    division: 'South Chotanagpur',
    center: [135, 335],
    path: 'M 120,240 L 145,285 L 200,320 L 175,395 L 90,360 L 95,290 Z',
  },
  {
    id: 'simdega',
    name: 'Simdega',
    division: 'South Chotanagpur',
    center: [150, 425],
    path: 'M 90,360 L 175,395 L 210,410 L 180,470 L 105,455 Z',
  },
  {
    id: 'khunti',
    name: 'Khunti',
    division: 'South Chotanagpur',
    center: [265, 360],
    path: 'M 235,335 L 320,330 L 310,385 L 230,385 L 200,320 Z',
  },

  // ── KOLHAN DIVISION (South-East) ──
  {
    id: 'seraikela',
    name: 'Seraikela Kharsawan',
    division: 'Kolhan',
    center: [375, 345],
    path: 'M 320,330 L 395,285 L 435,325 L 400,380 L 325,370 Z',
  },
  {
    id: 'east_singhbhum',
    name: 'East Singhbhum',
    division: 'Kolhan',
    center: [465, 350],
    path: 'M 435,325 L 515,310 L 530,375 L 470,410 L 420,380 Z',
  },
  {
    id: 'west_singhbhum',
    name: 'West Singhbhum',
    division: 'Kolhan',
    center: [305, 425],
    path: 'M 230,385 L 310,385 L 400,380 L 395,445 L 290,475 L 210,410 Z',
  },
];

const DIVISIONS = ['All Divisions', 'South Chotanagpur', 'North Chotanagpur', 'Kolhan', 'Santhal Pargana', 'Palamu'];

export default function JharkhandMap({
  districts,
  selectedDistrict,
  onSelectDistrict,
}: JharkhandMapProps) {
  const [activeDivision, setActiveDivision] = useState('All Divisions');
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictGeoData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Map district data by name
  const districtMap = useMemo(() => {
    const map = new Map<string, DistrictGeoData>();
    districts.forEach((d) => {
      map.set(d.name.toLowerCase().trim(), d);
    });
    return map;
  }, [districts]);

  // Color generator based on intensity
  const getHeatColor = (total: number, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) return '#1E3A8A'; // Deep Navy highlight
    if (isHovered) return '#F59E0B'; // Vibrant Amber on hover

    if (total >= 280) return '#DC2626'; // Red - Critical
    if (total >= 200) return '#EA580C'; // Orange - High
    if (total >= 140) return '#D97706'; // Turmeric - Medium
    if (total >= 80) return '#0D9488'; // Teal - Low
    return '#059669'; // Green - Stable
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2px] border border-border p-4 relative select-none">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-turmeric-deep text-lg">public</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
              Jharkhand Geospatial Command Map
            </h3>
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5">
            Real-time choropleth telemetry across 24 administrative districts
          </p>
        </div>

        {/* Division Selector */}
        <div className="flex items-center gap-1 bg-paper p-1 rounded-[3px] border border-border text-[11px]">
          {DIVISIONS.map((div) => (
            <button
              key={div}
              type="button"
              onClick={() => setActiveDivision(div)}
              className={`px-2 py-1 rounded-[2px] font-medium transition-colors ${
                activeDivision === div
                  ? 'bg-navy text-white shadow-xs font-bold'
                  : 'text-ink-muted hover:text-navy hover:bg-white'
              }`}
            >
              {div === 'All Divisions' ? 'All (24)' : div.replace(' Chotanagpur', ' CN')}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 flex items-center justify-center p-2 min-h-[380px] overflow-hidden">
        <svg
          viewBox="0 0 660 480"
          className="w-full h-full max-h-[440px] drop-shadow-sm transition-all"
        >
          {/* Subtle State Grid / Latitude-Longitude lines */}
          <defs>
            <pattern id="stateGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
            </pattern>
            <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#stateGrid)" opacity="0.4" />

          {/* District Polygons */}
          <g filter="url(#mapGlow)">
            {DISTRICT_PATHS.map((item) => {
              const matched = districtMap.get(item.name.toLowerCase().trim()) || {
                name: item.name,
                total: 120,
                breakdown: {},
              };
              const isSelected = selectedDistrict.name.toLowerCase() === item.name.toLowerCase();
              const isHovered = hoveredDistrict?.name.toLowerCase() === item.name.toLowerCase();
              const fillColor = getHeatColor(matched.total, isSelected, isHovered);
              const isDimmed = activeDivision !== 'All Divisions' && item.division !== activeDivision;

              return (
                <g
                  key={item.id}
                  className="cursor-pointer transition-all duration-200"
                  opacity={isDimmed ? 0.25 : 1}
                  onClick={() => onSelectDistrict(matched)}
                  onMouseEnter={(e) => {
                    setHoveredDistrict(matched);
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => {
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredDistrict(null)}
                >
                  <path
                    d={item.path}
                    fill={fillColor}
                    fillOpacity={isSelected ? 0.95 : isHovered ? 0.9 : 0.75}
                    stroke={isSelected ? '#0F172A' : '#FFFFFF'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    strokeLinejoin="round"
                    className="hover:scale-[1.01] origin-center transition-transform"
                  />

                  {/* District Center Pin / Indicator */}
                  <circle
                    cx={item.center[0]}
                    cy={item.center[1] - 4}
                    r={isSelected ? 3.5 : 2}
                    fill={isSelected ? '#F59E0B' : '#FFFFFF'}
                  />

                  {/* District Name Label */}
                  <text
                    x={item.center[0]}
                    y={item.center[1] + 8}
                    textAnchor="middle"
                    fill={isSelected || isHovered ? '#FFFFFF' : '#0F172A'}
                    fontSize={isSelected ? '10px' : '8.5px'}
                    fontWeight={isSelected ? 'bold' : '600'}
                    fontFamily="monospace"
                    className="pointer-events-none select-none drop-shadow-sm"
                  >
                    {item.name}
                  </text>

                  {/* District Count Badge */}
                  <text
                    x={item.center[0]}
                    y={item.center[1] + 18}
                    textAnchor="middle"
                    fill={isSelected || isHovered ? '#FEF08A' : '#334155'}
                    fontSize="7.5px"
                    fontWeight="bold"
                    fontFamily="monospace"
                    className="pointer-events-none select-none"
                  >
                    {matched.total}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover Telemetry Floating Tooltip */}
        {hoveredDistrict && (
          <div
            className="fixed z-50 pointer-events-none bg-navy-deep text-white text-xs p-2.5 rounded-[3px] border border-turmeric shadow-xl min-w-[170px]"
            style={{
              left: `${tooltipPos.x + 15}px`,
              top: `${tooltipPos.y - 45}px`,
            }}
          >
            <div className="flex items-center justify-between border-b border-white/20 pb-1 mb-1.5 font-bold font-mono">
              <span className="text-turmeric">{hoveredDistrict.name}</span>
              <span className="bg-white/10 px-1 py-0.5 rounded text-[10px]">
                {hoveredDistrict.total} Issues
              </span>
            </div>
            <div className="text-[10px] space-y-0.5 text-white/80">
              <div className="flex justify-between">
                <span>Distress Level:</span>
                <span
                  className={
                    hoveredDistrict.total >= 250
                      ? 'text-urgent font-bold'
                      : hoveredDistrict.total >= 180
                        ? 'text-turmeric font-bold'
                        : 'text-forest font-bold'
                  }
                >
                  {hoveredDistrict.total >= 250 ? 'CRITICAL' : hoveredDistrict.total >= 180 ? 'HIGH' : 'MODERATE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span>Active Field Nodes</span>
              </div>
              <div className="pt-1 text-[9px] text-turmeric-light italic">
                Click to drill into district case files →
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border text-[11px] text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink uppercase font-mono text-[10px]">Distress Heatmap:</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#059669]"></span>
              <span>Low (&lt;120)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D97706]"></span>
              <span>Moderate (120–199)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#EA580C]"></span>
              <span>High (200–279)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626] animate-pulse"></span>
              <span>Critical (280+)</span>
            </span>
          </div>
        </div>

        <div className="font-mono text-[10px] text-navy font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">touch_app</span>
          <span>Click any district to filter Challenge Registry</span>
        </div>
      </div>
    </div>
  );
}
