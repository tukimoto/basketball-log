import type { ZoneStat } from "@/types";
import { cn } from "@/lib/utils";

interface ZoneHeatmapProps {
  zoneStats: ZoneStat[];
  title?: string;
}

function bgClassByPercent(percent: number, attempts: number): string {
  if (attempts === 0) return "bg-white/5";
  if (percent >= 70) return "bg-emerald-500/55";
  if (percent >= 50) return "bg-emerald-500/35";
  if (percent >= 30) return "bg-amber-500/35";
  return "bg-red-500/35";
}

export default function ZoneHeatmap({ zoneStats, title }: ZoneHeatmapProps) {
  const byZone = new Map(zoneStats.map((z) => [z.zoneId, z]));
  const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="bg-surface rounded-xl p-4">
      {title && <h3 className="text-sm font-bold text-white mb-3">{title}</h3>}
      <div className="grid grid-cols-3 gap-2">
        {ids.map((id) => {
          const z = byZone.get(id) ?? {
            zoneId: id,
            made: 0,
            miss: 0,
            attempts: 0,
            fgPercent: 0,
          };
          return (
            <div
              key={id}
              className={cn(
                "rounded-lg border border-white/10 p-2 text-center min-h-20 flex flex-col items-center justify-center",
                bgClassByPercent(z.fgPercent, z.attempts),
              )}
            >
              <div className="text-xs text-white/70">Z{id}</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {z.attempts > 0 ? `${z.fgPercent.toFixed(0)}%` : "-"}
              </div>
              <div className="text-[10px] text-white/60">
                {z.made}/{z.attempts}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-white/40 mt-2">
        色: 高確率=緑 / 中間=黄 / 低確率=赤 / 試投なし=灰
      </p>
    </div>
  );
}
