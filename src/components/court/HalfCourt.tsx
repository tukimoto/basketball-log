import { cn } from "@/lib/utils";

interface HalfCourtProps {
  selectedZoneId: number | null;
  onZoneClick: (zoneId: number) => void;
  disabled?: boolean;
}

/*
 * 9-zone court — ring/distance-based, cropped to 3PT area.
 *
 * Ring 1 (closest):  Zone 1  — ゴール下
 * Ring 2 (paint):    Zone 2 (左), Zone 3 (正面), Zone 4 (右)
 * Ring 3 (mid/3P):   Zone 5 (左コーナー), Zone 6 (左ウイング),
 *                    Zone 7 (トップ), Zone 8 (右ウイング), Zone 9 (右コーナー)
 */

const VW = 400;
const PAD_X = 16;
const PAD_TOP = 8;
const COURT_W = VW - PAD_X * 2;
const PPM = COURT_W / 15;

const BX = VW / 2;
const BY = PAD_TOP + 1.575 * PPM;

const R1 = 1.5 * PPM;
const R2 = 4.2 * PPM;
const R3 = 7.0 * PPM;

// Crop the view to just past the 3PT arc
const VH = BY + R3 + 1.8 * PPM;

const PAINT_HW = (4.9 / 2) * PPM;
const PAINT_L = BX - PAINT_HW;
const PAINT_R = BX + PAINT_HW;
const PAINT_B = PAD_TOP + 5.8 * PPM;
const FT_R = 1.8 * PPM;
const THREE_PT_R = 6.75 * PPM;
const RESTRICTED_R = 1.25 * PPM;
const THREE_CORNER_X_L = PAD_X + 0.9 * PPM;
const THREE_CORNER_X_R = VW - PAD_X - 0.9 * PPM;

function px(deg: number, r: number) {
  return BX + r * Math.cos((deg * Math.PI) / 180);
}
function py(deg: number, r: number) {
  return BY + r * Math.sin((deg * Math.PI) / 180);
}

function sectorPath(a1: number, a2: number, rInner: number, rOuter: number): string {
  const p1i = { x: px(a1, rInner), y: py(a1, rInner) };
  const p2i = { x: px(a2, rInner), y: py(a2, rInner) };
  const p1o = { x: px(a1, rOuter), y: py(a1, rOuter) };
  const p2o = { x: px(a2, rOuter), y: py(a2, rOuter) };
  const large = a2 - a1 > 180 ? 1 : 0;
  return [
    `M${p1i.x},${p1i.y}`,
    `A${rInner},${rInner} 0 ${large},1 ${p2i.x},${p2i.y}`,
    `L${p2o.x},${p2o.y}`,
    `A${rOuter},${rOuter} 0 ${large},0 ${p1o.x},${p1o.y}`,
    "Z",
  ].join(" ");
}

const zone1Path = `M${BX - R1},${BY} A${R1},${R1} 0 1,1 ${BX + R1},${BY} A${R1},${R1} 0 1,1 ${BX - R1},${BY} Z`;

const R2_ANGLES = [
  { id: 4, a1: -10, a2: 53 },
  { id: 3, a1: 53,  a2: 127 },
  { id: 2, a1: 127, a2: 190 },
];

const R3_ANGLES = [
  { id: 9, a1: -10, a2: 30 },
  { id: 8, a1: 30,  a2: 70 },
  { id: 7, a1: 70,  a2: 110 },
  { id: 6, a1: 110, a2: 150 },
  { id: 5, a1: 150, a2: 190 },
];

interface ZoneDef {
  id: number;
  path: string;
  lx: number;
  ly: number;
}

function buildZones(): ZoneDef[] {
  const zones: ZoneDef[] = [];

  zones.push({ id: 1, path: zone1Path, lx: BX, ly: BY + 8 });

  for (const s of R2_ANGLES) {
    const mid = (s.a1 + s.a2) / 2;
    const mr = (R1 + R2) / 2;
    zones.push({ id: s.id, path: sectorPath(s.a1, s.a2, R1, R2), lx: px(mid, mr), ly: py(mid, mr) });
  }

  for (const s of R3_ANGLES) {
    const mid = (s.a1 + s.a2) / 2;
    const mr = (R2 + R3) / 2;
    zones.push({ id: s.id, path: sectorPath(s.a1, s.a2, R2, R3), lx: px(mid, mr), ly: py(mid, mr) });
  }

  return zones;
}

const ZONES = buildZones();

export default function HalfCourt({ selectedZoneId, onZoneClick, disabled }: HalfCourtProps) {
  const arcStartY = (x: number) => {
    const dx = x - BX;
    if (Math.abs(dx) > THREE_PT_R) return BY;
    return BY + Math.sqrt(THREE_PT_R * THREE_PT_R - dx * dx);
  };

  const threePointPath = [
    `M${THREE_CORNER_X_L},${PAD_TOP}`,
    `L${THREE_CORNER_X_L},${arcStartY(THREE_CORNER_X_L)}`,
    `A${THREE_PT_R},${THREE_PT_R} 0 0,0 ${THREE_CORNER_X_R},${arcStartY(THREE_CORNER_X_R)}`,
    `L${THREE_CORNER_X_R},${PAD_TOP}`,
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-full select-none" style={{ touchAction: "none" }}>
      <defs>
        <clipPath id="court-clip">
          <rect x={PAD_X} y={PAD_TOP} width={COURT_W} height={VH} />
        </clipPath>
      </defs>

      {/* Court floor */}
      <rect x={PAD_X} y={PAD_TOP} width={COURT_W} height={VH - PAD_TOP} rx="3" fill="#c08030" />

      {/* Clickable zones */}
      <g clipPath="url(#court-clip)">
        {ZONES.map((z) => {
          const isSelected = selectedZoneId === z.id;
          return (
            <g key={z.id} onClick={() => !disabled && onZoneClick(z.id)} className={cn(!disabled && "cursor-pointer")}>
              <path
                d={z.path}
                fill={isSelected ? "rgba(245,158,11,0.45)" : "rgba(255,255,255,0.04)"}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
                className={cn("transition-colors duration-100", !disabled && "hover:fill-[rgba(245,158,11,0.22)]")}
              />
              <text
                x={z.lx} y={z.ly}
                textAnchor="middle" dominantBaseline="central"
                fill={isSelected ? "#fff" : "rgba(255,255,255,0.55)"}
                fontSize="15" fontWeight="700"
                pointerEvents="none"
              >
                {z.id}
              </text>
            </g>
          );
        })}
      </g>

      {/* ── Court markings ── */}

      {/* Baseline */}
      <line x1={PAD_X} y1={PAD_TOP} x2={PAD_X + COURT_W} y2={PAD_TOP} stroke="#fff" strokeWidth="2" />
      {/* Sidelines */}
      <line x1={PAD_X} y1={PAD_TOP} x2={PAD_X} y2={VH} stroke="#fff" strokeWidth="2" />
      <line x1={PAD_X + COURT_W} y1={PAD_TOP} x2={PAD_X + COURT_W} y2={VH} stroke="#fff" strokeWidth="2" />

      {/* Paint */}
      <rect x={PAINT_L} y={PAD_TOP} width={PAINT_R - PAINT_L} height={PAINT_B - PAD_TOP} fill="none" stroke="#fff" strokeWidth="2" />

      {/* FT circle */}
      <circle cx={BX} cy={PAINT_B} r={FT_R} fill="none" stroke="#fff" strokeWidth="1.5" />

      {/* 3PT line */}
      <path d={threePointPath} fill="none" stroke="#fff" strokeWidth="1.5" />

      {/* Restricted area */}
      <path
        d={`M${BX - RESTRICTED_R},${PAD_TOP} A${RESTRICTED_R},${RESTRICTED_R} 0 0,0 ${BX + RESTRICTED_R},${PAD_TOP}`}
        fill="none" stroke="#fff" strokeWidth="1.5"
        transform={`translate(0,${BY - PAD_TOP})`}
      />

      {/* Backboard */}
      <line x1={BX - 0.9 * PPM} y1={PAD_TOP + 1.2 * PPM} x2={BX + 0.9 * PPM} y2={PAD_TOP + 1.2 * PPM} stroke="#fff" strokeWidth="2.5" />

      {/* Basket ring */}
      <circle cx={BX} cy={BY} r={0.225 * PPM} fill="none" stroke="#ff5522" strokeWidth="2.5" />

      {/* Paint hash marks */}
      {[1, 2, 3].map((i) => {
        const markY = PAD_TOP + (PAINT_B - PAD_TOP) * (0.55 + i * 0.12);
        return (
          <g key={`hash-${i}`}>
            <line x1={PAINT_L - 6} y1={markY} x2={PAINT_L} y2={markY} stroke="#fff" strokeWidth="1.5" />
            <line x1={PAINT_R} y1={markY} x2={PAINT_R + 6} y2={markY} stroke="#fff" strokeWidth="1.5" />
          </g>
        );
      })}
    </svg>
  );
}
