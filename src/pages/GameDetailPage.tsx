import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useGameStore } from "@/stores/gameStore";
import { usePlayerStore } from "@/stores/playerStore";
import BackLink from "@/components/common/BackLink";
import { calcPlayerStats, calcTeamScore, calcZoneStats, calcZoneStatsByPlayer, calcZoneRebStats, calcZoneRebStatsByPlayer, exportCSV } from "@/lib/stats";
import { formatDate, cn } from "@/lib/utils";
import { Play, Download } from "lucide-react";
import CourtFGHeatmap from "@/components/stats/CourtFGHeatmap";
import CourtRebHeatmap from "@/components/stats/CourtRebHeatmap";

type AnalysisTab = "fg" | "reb" | "ast";

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { games, logs, getGamePlayerIds } = useGameStore();
  const { players } = usePlayerStore();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("team");
  const [activeTab, setActiveTab] = useState<AnalysisTab>("fg");

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

  const teamZoneStats = useMemo(() => calcZoneStats(gameLogs), [gameLogs]);
  const selectedPlayerZoneStats = useMemo(() => {
    if (selectedPlayerId === "team") return teamZoneStats;
    return calcZoneStatsByPlayer(gameLogs, selectedPlayerId);
  }, [gameLogs, selectedPlayerId, teamZoneStats]);

  const teamZoneRebStats = useMemo(() => calcZoneRebStats(gameLogs), [gameLogs]);
  const selectedPlayerZoneRebStats = useMemo(() => {
    if (selectedPlayerId === "team") return teamZoneRebStats;
    return calcZoneRebStatsByPlayer(gameLogs, selectedPlayerId);
  }, [gameLogs, selectedPlayerId, teamZoneRebStats]);

  const selectedFg = useMemo(() => {
    if (selectedPlayerId === "team") {
      const made = teamZoneStats.reduce((s, z) => s + z.made, 0);
      const att = teamZoneStats.reduce((s, z) => s + z.attempts, 0);
      return att > 0 ? (made / att) * 100 : 0;
    }
    const ps = stats.find((s) => s.playerId === selectedPlayerId);
    return ps?.fgPercent ?? 0;
  }, [selectedPlayerId, teamZoneStats, stats]);

  const assistLogs = useMemo(() => {
    const astLogs = gameLogs.filter((l) => l.action === "AST");
    if (selectedPlayerId === "team") return astLogs;
    return astLogs.filter(
      (l) => l.passerPlayerId === selectedPlayerId || l.scorerPlayerId === selectedPlayerId,
    );
  }, [gameLogs, selectedPlayerId]);

  const playerMap = useMemo(() => {
    const m = new Map<string, { name: string; number: number }>();
    for (const p of players) m.set(p.id, { name: p.name, number: p.number });
    return m;
  }, [players]);

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

  const tabs: { key: AnalysisTab; label: string }[] = [
    { key: "fg", label: "FG%" },
    { key: "reb", label: "REB" },
    { key: "ast", label: "AST" },
  ];

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
                  <th className="text-center p-3">AST</th>
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
                      <td className="p-3 text-center text-purple-300 font-bold">{s.assists}</td>
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

        {/* Player selector + tabs */}
        <div className="mt-6">
          <div className="bg-surface rounded-xl p-4 mb-3 flex flex-wrap items-center gap-3">
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="bg-slate-800 text-white text-sm font-bold rounded-lg px-3 py-2 border border-white/20 focus:border-accent focus:outline-none"
            >
              <option value="team">チーム全体</option>
              {gamePlayers
                .sort((a, b) => a.number - b.number)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name}
                  </option>
                ))}
            </select>
            {activeTab === "fg" && (
              <span className="text-sm text-white/70">
                FG%: <span className="font-bold text-accent">{selectedFg.toFixed(1)}%</span>
              </span>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mb-3">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors",
                  activeTab === t.key
                    ? "bg-accent text-black"
                    : "bg-surface text-white/60 hover:bg-surface-light",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "fg" && (
            <CourtFGHeatmap zoneStats={selectedPlayerZoneStats} title="ゾーン別 FG% ヒートマップ" />
          )}
          {activeTab === "reb" && (
            <CourtRebHeatmap zoneRebStats={selectedPlayerZoneRebStats} title="ゾーン別 リバウンド分布" />
          )}
          {activeTab === "ast" && (
            <div className="bg-surface rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3">アシスト一覧</h3>
              {assistLogs.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-6">アシスト記録なし</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {assistLogs.map((l) => {
                    const passer = l.passerPlayerId ? playerMap.get(l.passerPlayerId) : null;
                    const scorer = l.scorerPlayerId ? playerMap.get(l.scorerPlayerId) : null;
                    return (
                      <div
                        key={l.id}
                        className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3"
                      >
                        <span className="text-xs text-white/40">Q{l.quarter}</span>
                        <span className="text-sm font-bold text-purple-300">
                          #{passer?.number ?? "?"} {passer?.name ?? "不明"}
                        </span>
                        <span className="text-white/40">→</span>
                        <span className="text-sm font-bold text-white">
                          #{scorer?.number ?? "?"} {scorer?.name ?? "不明"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-white/40 mt-3">
                合計 {assistLogs.length} 件のアシスト
              </p>
            </div>
          )}
        </div>

        {/* Log count */}
        <div className="mt-4 text-center text-white/30 text-sm">
          合計 {gameLogs.length} 件のログ
        </div>
      </div>
    </div>
  );
}
