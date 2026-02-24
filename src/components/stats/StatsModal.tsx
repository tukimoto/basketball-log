import { X, Download } from "lucide-react";
import type { PlayerStats } from "@/types";
import { cn } from "@/lib/utils";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats[];
  teamScore: number;
  opponentName: string;
  opponentScore: number;
  onExportCSV: () => void;
}

export default function StatsModal({
  isOpen,
  onClose,
  stats,
  teamScore,
  opponentName,
  opponentScore,
  onExportCSV,
}: StatsModalProps) {
  if (!isOpen) return null;

  const totalReb = stats.reduce((s, p) => s + p.offReb + p.defReb, 0);
  const totalAst = stats.reduce((s, p) => s + p.assists, 0);
  const totalFouls = stats.reduce((s, p) => s + p.fouls, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">スタッツ</h2>
            <p className="text-sm text-white/50">
              自チーム {teamScore} - {opponentScore} {opponentName}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-sm font-bold hover:bg-accent/30 transition-colors"
            >
              <Download size={14} />
              CSV
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Team summary */}
        <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{teamScore}</div>
            <div className="text-xs text-white/50">合計得点</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalReb}</div>
            <div className="text-xs text-white/50">リバウンド</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalAst}</div>
            <div className="text-xs text-white/50">アシスト</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalFouls}</div>
            <div className="text-xs text-white/50">ファウル</div>
          </div>
        </div>

        {/* Player table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/50 text-xs uppercase border-b border-white/10">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">名前</th>
                <th className="text-center p-3">PTS</th>
                <th className="text-center p-3">FG</th>
                <th className="text-center p-3">FG%</th>
                <th className="text-center p-3">FT</th>
                <th className="text-center p-3">FT%</th>
                <th className="text-center p-3">ORB</th>
                <th className="text-center p-3">DRB</th>
                <th className="text-center p-3">AST</th>
                <th className="text-center p-3">PF</th>
              </tr>
            </thead>
            <tbody>
              {stats
                .filter((s) => s.points > 0 || s.offReb + s.defReb > 0 || s.assists > 0 || s.fouls > 0 || s.shotMade + s.shotMiss > 0)
                .sort((a, b) => b.points - a.points)
                .map((s) => (
                  <tr key={s.playerId} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 font-bold text-white">{s.playerNumber}</td>
                    <td className="p-3 text-white">{s.playerName}</td>
                    <td className="p-3 text-center font-bold text-white">{s.points}</td>
                    <td className="p-3 text-center text-white/70">
                      {s.shotMade}/{s.shotMade + s.shotMiss}
                    </td>
                    <td className={cn("p-3 text-center font-bold", s.fgPercent >= 50 ? "text-success" : "text-white/70")}>
                      {s.fgPercent.toFixed(1)}%
                    </td>
                    <td className="p-3 text-center text-white/70">
                      {s.ftMade}/{s.ftMade + s.ftMiss}
                    </td>
                    <td className="p-3 text-center text-white/70">{s.ftPercent.toFixed(1)}%</td>
                    <td className="p-3 text-center text-white/70">{s.offReb}</td>
                    <td className="p-3 text-center text-white/70">{s.defReb}</td>
                    <td className="p-3 text-center text-purple-300 font-bold">{s.assists}</td>
                    <td className={cn("p-3 text-center", s.fouls >= 5 ? "text-danger font-bold" : "text-white/70")}>
                      {s.fouls}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
