import { Link } from "react-router-dom";
import { useGameStore } from "@/stores/gameStore";
import { useSync } from "@/hooks/useSync";
import { Plus, Settings, Trash2, Play, BarChart3, CloudUpload, CloudDownload, Loader2 } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { calcTeamScore } from "@/lib/stats";

export default function HomePage() {
  const { games, logs, deleteGame } = useGameStore();
  const { status, errorMessage, lastPushCounts, lastSynced, pushToCloud, pullFromCloud } = useSync();

  const sortedGames = [...games].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="h-full bg-slate-900 text-white overflow-auto">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">ミニバス スタッツ記録</h1>
            <p className="text-white/50 text-sm mt-1">試合を選択または新規作成</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <button
                onClick={pushToCloud}
                disabled={status === "syncing"}
                className={cn("p-2 rounded-lg transition-colors", status === "syncing" ? "bg-white/5 text-white/30" : "bg-surface hover:bg-surface-light text-white/60 hover:text-white")}
                title="クラウドへ保存"
              >
                {status === "syncing" ? <Loader2 size={18} className="animate-spin" /> : <CloudUpload size={18} />}
              </button>
              <button
                onClick={pullFromCloud}
                disabled={status === "syncing"}
                className={cn("p-2 rounded-lg transition-colors", status === "syncing" ? "bg-white/5 text-white/30" : "bg-surface hover:bg-surface-light text-white/60 hover:text-white")}
                title="クラウドから取得"
              >
                <CloudDownload size={18} />
              </button>
            </div>
            {lastSynced && (
              <span className="text-[10px] text-white/30 hidden md:block">
                {new Date(lastSynced).toLocaleString("ja-JP")}
              </span>
            )}
            <Link
              to="/settings"
              className="p-2 rounded-lg bg-surface hover:bg-surface-light transition-colors"
              title="選手管理"
            >
              <Settings size={20} />
            </Link>
          </div>
        </div>

        {status === "error" && errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-danger/20 border border-danger/40 text-danger text-sm">
            同期エラー: {errorMessage}
          </div>
        )}
        {status === "success" && lastPushCounts && (
          <div className="mb-4 p-3 rounded-lg bg-success/20 border border-success/40 text-success text-sm">
            保存しました (選手: {lastPushCounts.players} / 試合: {lastPushCounts.games} / ログ: {lastPushCounts.logs})
          </div>
        )}

        {/* New game button */}
        <Link
          to="/games/new"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-accent/20 text-accent font-bold hover:bg-accent/30 transition-colors mb-6 border-2 border-dashed border-accent/40"
        >
          <Plus size={20} />
          新しい試合を作成
        </Link>

        {/* Game list */}
        {sortedGames.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <p className="text-lg">試合がありません</p>
            <p className="text-sm mt-2">「新しい試合を作成」から始めましょう</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedGames.map((game) => {
              const gameLogs = logs.filter((l) => l.gameId === game.id);
              const teamScore = calcTeamScore(gameLogs);
              return (
                <div
                  key={game.id}
                  className="bg-surface rounded-xl p-4 flex items-center gap-4 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-lg">vs {game.opponentName}</span>
                      <span className="text-white/40 text-sm">
                        {formatDate(game.gameDate)}
                      </span>
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      {teamScore} - {game.opponentScore}
                      <span className="ml-2 text-white/30">({gameLogs.length} logs)</span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Link
                      to={`/games/${game.id}`}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="スタッツ詳細"
                    >
                      <BarChart3 size={18} />
                    </Link>
                    <Link
                      to={`/games/${game.id}/record`}
                      className="p-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent transition-colors"
                      title="記録を続ける"
                    >
                      <Play size={18} />
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`「vs ${game.opponentName}」を削除しますか？`))
                          deleteGame(game.id);
                      }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-danger/20 text-white/30 hover:text-danger transition-colors"
                      title="削除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
