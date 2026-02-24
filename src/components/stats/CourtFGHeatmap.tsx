import type { ZoneStat } from "@/types";
import {
  VW, VH, PAD_X, PAD_TOP, COURT_W, PPM,
  BX, BY, PAINT_L, PAINT_R, PAINT_B, FT_R,
  RESTRICTED_R, ZONES, threePointPath,
} from "@/components/court/courtGeometry";

interface Props {
  zoneStats: ZoneStat[];
  title?: string;
}

function fillByPercent(percent: number, attempts: number): string {
  if (attempts === 0) return "rgba(255,255,255,0.06)";
  if (percent >= 70) return "rgba(16,185,129,0.6)";
  if (percent >= 50) return "rgba(16,185,129,0.35)";
  if (percent >= 30) return "rgba(245,158,11,0.4)";
  return "rgba(239,68,68,0.4)";
}

export default function CourtFGHeatmap({ zoneStats, title }: Props) {
  const byZone = new Map(zoneStats.map((z) => [z.zoneId, z]));

  return (
    <div className="bg-surface rounded-xl p-4">
      {title && <h3 className="text-sm font-bold text-white mb-3">{title}</h3>}
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full select-none">
        <defs>
          <clipPath id="fg-court-clip">
            <rect x={PAD_X} y={PAD_TOP} width={COURT_W} height={VH} />
          </clipPath>
        </defs>

        <rect x={PAD_X} y={PAD_TOP} width={COURT_W} height={VH - PAD_TOP} rx="3" fill="#1e293b" />

        <g clipPath="url(#fg-court-clip)">
          {ZONES.map((z) => {
            const stat = byZone.get(z.id) ?? { zoneId: z.id, made: 0, miss: 0, attempts: 0, fgPercent: 0 };
            return (
              <g key={z.id}>
                <path
                  d={z.path}
                  fill={fillByPercent(stat.fgPercent, stat.attempts)}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                />
                <text
                  x={z.lx} y={z.ly - 10}
                  textAnchor="middle" dominantBaseline="central"
                  fill="#fff" fontSize="14" fontWeight="800"
                  pointerEvents="none"
                >
                  {stat.attempts > 0 ? `${stat.fgPercent.toFixed(0)}%` : "-"}
                </text>
                <text
                  x={z.lx} y={z.ly + 6}
                  textAnchor="middle" dominantBaseline="central"
                  fill="rgba(255,255,255,0.6)" fontSize="10" fontWeight="600"
                  pointerEvents="none"
                >
                  {stat.made}/{stat.attempts}
                </text>
              </g>
            );
          })}
        </g>

        {/* Court lines */}
        <line x1={PAD_X} y1={PAD_TOP} x2={PAD_X + COURT_W} y2={PAD_TOP} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1={PAD_X} y1={PAD_TOP} x2={PAD_X} y2={VH} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1={PAD_X + COURT_W} y1={PAD_TOP} x2={PAD_X + COURT_W} y2={VH} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <rect x={PAINT_L} y={PAD_TOP} width={PAINT_R - PAINT_L} height={PAINT_B - PAD_TOP} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <circle cx={BX} cy={PAINT_B} r={FT_R} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <path d={threePointPath()} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <path
          d={`M${BX - RESTRICTED_R},${PAD_TOP} A${RESTRICTED_R},${RESTRICTED_R} 0 0,0 ${BX + RESTRICTED_R},${PAD_TOP}`}
          fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"
          transform={`translate(0,${BY - PAD_TOP})`}
        />
        <line x1={BX - 0.9 * PPM} y1={PAD_TOP + 1.2 * PPM} x2={BX + 0.9 * PPM} y2={PAD_TOP + 1.2 * PPM} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        <circle cx={BX} cy={BY} r={0.225 * PPM} fill="none" stroke="#ff5522" strokeWidth="2" />
      </svg>
      <p className="text-[10px] text-white/40 mt-2">
        色: 高確率=緑 / 中間=黄 / 低確率=赤 / 試投なし=灰
      </p>
    </div>
  );
}
