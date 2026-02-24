import { cn } from "@/lib/utils";
import {
  VW, VH, PAD_X, PAD_TOP, COURT_W, PPM,
  BX, BY, PAINT_L, PAINT_R, PAINT_B, FT_R,
  RESTRICTED_R, ZONES, threePointPath,
} from "./courtGeometry";

interface HalfCourtProps {
  selectedZoneId: number | null;
  onZoneClick: (zoneId: number) => void;
  disabled?: boolean;
}

export default function HalfCourt({ selectedZoneId, onZoneClick, disabled }: HalfCourtProps) {
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-full select-none" style={{ touchAction: "none" }}>
      <defs>
        <clipPath id="court-clip">
          <rect x={PAD_X} y={PAD_TOP} width={COURT_W} height={VH} />
        </clipPath>
      </defs>

      <rect x={PAD_X} y={PAD_TOP} width={COURT_W} height={VH - PAD_TOP} rx="3" fill="#c08030" />

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

      <line x1={PAD_X} y1={PAD_TOP} x2={PAD_X + COURT_W} y2={PAD_TOP} stroke="#fff" strokeWidth="2" />
      <line x1={PAD_X} y1={PAD_TOP} x2={PAD_X} y2={VH} stroke="#fff" strokeWidth="2" />
      <line x1={PAD_X + COURT_W} y1={PAD_TOP} x2={PAD_X + COURT_W} y2={VH} stroke="#fff" strokeWidth="2" />

      <rect x={PAINT_L} y={PAD_TOP} width={PAINT_R - PAINT_L} height={PAINT_B - PAD_TOP} fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx={BX} cy={PAINT_B} r={FT_R} fill="none" stroke="#fff" strokeWidth="1.5" />
      <path d={threePointPath()} fill="none" stroke="#fff" strokeWidth="1.5" />

      <path
        d={`M${BX - RESTRICTED_R},${PAD_TOP} A${RESTRICTED_R},${RESTRICTED_R} 0 0,0 ${BX + RESTRICTED_R},${PAD_TOP}`}
        fill="none" stroke="#fff" strokeWidth="1.5"
        transform={`translate(0,${BY - PAD_TOP})`}
      />

      <line x1={BX - 0.9 * PPM} y1={PAD_TOP + 1.2 * PPM} x2={BX + 0.9 * PPM} y2={PAD_TOP + 1.2 * PPM} stroke="#fff" strokeWidth="2.5" />
      <circle cx={BX} cy={BY} r={0.225 * PPM} fill="none" stroke="#ff5522" strokeWidth="2.5" />

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
