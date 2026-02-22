import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useGameStore } from "@/stores/gameStore";
import { usePlayerStore } from "@/stores/playerStore";
import BackLink from "@/components/common/BackLink";
import { calcPlayerStats, calcTeamScore, exportCSV } from "@/lib/stats";
import { formatDate, cn } from "@/lib/utils";
import { Play, Download } from "lucide-react";

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { games, logs, getGamePlayerIds } = useGameStore();
  const { players } = usePlayerStore();

  const game = games.find((g) => g.id === id);

  const gameLogs = useMemo(
    () => logs.filter((l) => l.gameId === id),
    [logs, id],
  );

  const gamePlayerIds = useMemo(
    () => (id ? getGamePlayerIds(id) : []),
    [id, getGamePlayerIds],
  );

  const gamePlayers = useMemo(
    () => players.filter((p) => gamePlayerIds.includes(p.id)),
    [players, gamePlayerIds],
  );

  const teamScore = useMemo(() => calcTeamScore(gameLogs), [gameLogs]);
  const stats = useMemo(
    () => calcPlayerStats(gameLogs, gamePlayers),
    [gameLogs, gamePlayers],
  );

  if (!game || !id) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-white">
        <p className="text-white/50">試合が見つかりません</p>
      </div>
    );
  }

  const handleExport = () => {
    exportCSV(stats, `${game.gameDate}_vs_${game.opponentName}`);
  };

  return (
    <div className="h-full bg-slate-900 text-white overflow-auto">
      <div className="max-w-3xl mx-auto p-6">
        <BackLink to="/" />

        {/* Game info */}
        <div className="mt-4 mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">vs {game.opponentName}</h1>
            <p className="text-white/50 text-sm mt-1">{formatDate(game.gameDate)}</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-bold">{teamScore}</span>
              <span className="text-white/30 text-xl">-</span>
              <span className="text-3xl font-bold text-white/60">
                {game.opponentScore}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-surface hover:bg-surface-light text-white/80 text-sm font-bold transition-colors"
            >
              <Download size={16} />
              CSV
            </button>
            <Link
              to={`/games/${id}/record`}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent text-sm font-bold transition-colors"
            >
              <Play size={16} />
              記録
            </Link>
          </div>
        </div>

        {/* Stats table */}
        <div className="bg-surface rounded-xl overflow-hidden">
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
                  <th className="text-center p-3">REB</th>
                  <th className="text-center p-3">PF</th>
                </tr>
              </thead>
              <tbody>
                {stats
                  .sort((a, b) => b.points - a.points)
                  .map((s) => (
                    <tr
                      key={s.playerId}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="p-3 font-bold">{s.playerNumber}</td>
                      <td className="p-3">{s.playerName}</td>
                      <td className="p-3 text-center font-bold">{s.points}</td>
                      <td className="p-3 text-center text-white/70">
                        {s.shotMade}/{s.shotMade + s.shotMiss}
                      </td>
                      <td
                        className={cn(
                          "p-3 text-center font-bold",
                          s.fgPercent >= 50 ? "text-success" : "text-white/70",
                        )}
                      >
                        {(s.shotMade + s.shotMiss > 0) ? s.fgPercent.toFixed(1) + "%" : "-"}
                      </td>
                      <td className="p-3 text-center text-white/70">
                        {s.ftMade}/{s.ftMade + s.ftMiss}
                      </td>
                      <td className="p-3 text-center text-white/70">
                        {(s.ftMade + s.ftMiss > 0) ? s.ftPercent.toFixed(1) + "%" : "-"}
                      </td>
                      <td className="p-3 text-center text-white/70">{s.offReb}</td>
                      <td className="p-3 text-center text-white/70">{s.defReb}</td>
                      <td className="p-3 text-center text-white/70">
                        {s.offReb + s.defReb}
                      </td>
                      <td
                        className={cn(
                          "p-3 text-center",
                          s.fouls >= 5
                            ? "text-danger font-bold"
                            : "text-white/70",
                        )}
                      >
                        {s.fouls}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Log count */}
        <div className="mt-4 text-center text-white/30 text-sm">
          合計 {gameLogs.length} 件のログ
        </div>
      </div>
    </div>
  );
}
