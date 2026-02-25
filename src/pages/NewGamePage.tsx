import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/stores/gameStore";
import { usePlayerStore } from "@/stores/playerStore";
import BackLink from "@/components/common/BackLink";
import { todayISO, cn } from "@/lib/utils";

export default function NewGamePage() {
  const navigate = useNavigate();
  const { createGame, setGamePlayers } = useGameStore();
  const { players } = usePlayerStore();

  const [opponentName, setOpponentName] = useState("");
  const [gameDate, setGameDate] = useState(todayISO());
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [activePlayerIds, setActivePlayerIds] = useState<string[]>([]);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.number - b.number),
    [players],
  );

  const toggleSelected = (id: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
    setActivePlayerIds((prev) => prev.filter((p) => p !== id));
  };

  const toggleActive = (id: string) => {
    if (!selectedPlayerIds.includes(id)) return;
    setActivePlayerIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const canStart =
    opponentName.trim() !== "" &&
    selectedPlayerIds.length >= 5 &&
    activePlayerIds.length === 5;

  const handleStart = () => {
    const game = createGame(opponentName.trim(), gameDate);
    setGamePlayers(game.id, selectedPlayerIds, activePlayerIds);
    navigate(`/games/${game.id}/record`);
  };

  return (
    <div className="h-full bg-slate-900 text-white overflow-auto">
      <div className="max-w-2xl mx-auto p-6">
        <BackLink to="/" />

        <h1 className="text-2xl font-bold mt-4 mb-6">新しい試合</h1>

        {/* Game info */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm text-white/60 mb-1">対戦相手</label>
            <input
              type="text"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              placeholder="チーム名を入力"
              className="w-full px-4 py-3 rounded-lg bg-surface border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">試合日</label>
            <input
              type="date"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-surface border border-white/10 text-white focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Player selection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold">ベンチ入りメンバー</h2>
            {players.length > 0 && (
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedPlayerIds(players.map(p => p.id))}
                  className="text-xs text-accent hover:underline"
                >
                  全員選択
                </button>
                <button
                  onClick={() => {
                    setSelectedPlayerIds([]);
                    setActivePlayerIds([]);
                  }}
                  className="text-xs text-white/50 hover:underline"
                >
                  選択解除
                </button>
              </div>
            )}
          </div>
          <p className="text-sm text-white/50 mb-4">
            選手を選択し、先発5名を指定してください
            （選択: {selectedPlayerIds.length}名 / 先発: {activePlayerIds.length}/5名）
          </p>

          {players.length === 0 ? (
            <div className="text-center py-8 text-white/30 bg-surface rounded-xl">
              <p>登録済みの選手がいません</p>
              <button
                onClick={() => navigate("/settings")}
                className="text-accent underline mt-2"
              >
                選手を登録する
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {sortedPlayers.map((p) => {
                const isSelected = selectedPlayerIds.includes(p.id);
                const isActive = activePlayerIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "rounded-lg p-3 border-2 transition-all",
                      isActive
                        ? "bg-accent/20 border-accent"
                        : isSelected
                          ? "bg-surface-light border-primary-light"
                          : "bg-surface border-transparent",
                    )}
                  >
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => toggleSelected(p.id)}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
                          isSelected ? "bg-accent border-accent" : "border-white/30",
                        )}
                      >
                        {isSelected && (
                          <span className="text-black text-xs font-bold">✓</span>
                        )}
                      </div>
                      <span className="font-bold text-white">#{p.number}</span>
                      <span className="text-white/80 truncate">{p.name}</span>
                    </div>
                    {isSelected && (
                      <button
                        onClick={() => toggleActive(p.id)}
                        className={cn(
                          "mt-2 w-full py-1 rounded text-xs font-bold transition-colors",
                          isActive
                            ? "bg-accent text-black"
                            : "bg-white/10 text-white/50 hover:bg-white/20",
                        )}
                      >
                        {isActive ? "先発" : "先発に指定"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-lg transition-all",
            canStart
              ? "bg-accent text-black hover:bg-amber-400 active:scale-[0.98]"
              : "bg-white/10 text-white/30 cursor-not-allowed",
          )}
        >
          記録開始
        </button>
      </div>
    </div>
  );
}
