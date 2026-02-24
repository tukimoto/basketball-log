import type { ZoneRebStat } from "@/types";
import { cn } from "@/lib/utils";

interface ZoneRebHeatmapProps {
  zoneRebStats: ZoneRebStat[];
  title?: string;
}

function bgClassByCount(total: number, maxTotal: number): string {
  if (total === 0) return "bg-white/5";
  const ratio = total / Math.max(maxTotal, 1);
  if (ratio >= 0.6) return "bg-blue-500/55";
  if (ratio >= 0.3) return "bg-blue-500/35";
  return "bg-blue-500/20";
}

export default function ZoneRebHeatmap({ zoneRebStats, title }: ZoneRebHeatmapProps) {
  const byZone = new Map(zoneRebStats.map((z) => [z.zoneId, z]));
  const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const maxTotal = Math.max(...zoneRebStats.map((z) => z.total), 1);

  return (
    <div className="bg-surface rounded-xl p-4">
      {title && <h3 className="text-sm font-bold text-white mb-3">{title}</h3>}
      <div className="grid grid-cols-3 gap-2">
        {ids.map((id) => {
          const z = byZone.get(id) ?? { zoneId: id, off: 0, def: 0, total: 0 };
          return (
            <div
              key={id}
              className={cn(
                "rounded-lg border border-white/10 p-2 text-center min-h-20 flex flex-col items-center justify-center",
                bgClassByCount(z.total, maxTotal),
              )}
            >
              <div className="text-xs text-white/70">Z{id}</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {z.total > 0 ? z.total : "-"}
              </div>
              <div className="text-[10px] text-white/60">
                {z.total > 0 ? `O${z.off} / D${z.def}` : ""}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-white/40 mt-2">
        色: 濃い青=リバウンド多 / 薄い青=少 / 灰=0件 — O=ORB, D=DRB
      </p>
    </div>
  );
}
