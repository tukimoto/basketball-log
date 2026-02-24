import type { ZoneRebStat } from "@/types";
import {
  VW, VH, PAD_X, PAD_TOP, COURT_W, PPM,
  BX, BY, PAINT_L, PAINT_R, PAINT_B, FT_R,
  RESTRICTED_R, ZONES, threePointPath,
} from "@/components/court/courtGeometry";

interface Props {
  zoneRebStats: ZoneRebStat[];
  title?: string;
}

function fillByCount(total: number, maxTotal: number): string {
  if (total === 0) return "rgba(255,255,255,0.06)";
  const ratio = total / Math.max(maxTotal, 1);
  if (ratio >= 0.6) return "rgba(59,130,246,0.6)";
  if (ratio >= 0.3) return "rgba(59,130,246,0.35)";
  return "rgba(59,130,246,0.2)";
}

export default function CourtRebHeatmap({ zoneRebStats, title }: Props) {
  const byZone = new Map(zoneRebStats.map((z) => [z.zoneId, z]));
  const maxTotal = Math.max(...zoneRebStats.map((z) => z.total), 1);

  return (
    <div className="bg-surface rounded-xl p-4">
      {title && <h3 className="text-sm font-bold text-white mb-3">{title}</h3>}
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full select-none">
        <defs>
          <clipPath id="reb-court-clip">
            <rect x={PAD_X} y={PAD_TOP} width={COURT_W} height={VH} />
          </clipPath>
        </defs>

        <rect x={PAD_X} y={PAD_TOP} width={COURT_W} height={VH - PAD_TOP} rx="3" fill="#1e293b" />

        <g clipPath="url(#reb-court-clip)">
          {ZONES.map((z) => {
            const stat = byZone.get(z.id) ?? { zoneId: z.id, off: 0, def: 0, total: 0 };
            return (
              <g key={z.id}>
                <path
                  d={z.path}
                  fill={fillByCount(stat.total, maxTotal)}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                />
                <text
                  x={z.lx} y={z.ly - 10}
                  textAnchor="middle" dominantBaseline="central"
                  fill="#fff" fontSize="14" fontWeight="800"
                  pointerEvents="none"
                >
                  {stat.total > 0 ? stat.total : "-"}
                </text>
                <text
                  x={z.lx} y={z.ly + 6}
                  textAnchor="middle" dominantBaseline="central"
                  fill="rgba(255,255,255,0.6)" fontSize="10" fontWeight="600"
                  pointerEvents="none"
                >
                  {stat.total > 0 ? `O${stat.off} / D${stat.def}` : ""}
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
        色: 濃い青=リバウンド多 / 薄い青=少 / 灰=0件 — O=ORB, D=DRB
      </p>
    </div>
  );
}
