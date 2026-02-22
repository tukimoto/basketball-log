import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameStore } from "@/stores/gameStore";
import { usePlayerStore } from "@/stores/playerStore";
import HalfCourt from "@/components/court/HalfCourt";
import PlayerPanel from "@/components/game/PlayerPanel";
import ActionPanel from "@/components/game/ActionPanel";
import GameHeader from "@/components/game/GameHeader";
import StatsModal from "@/components/stats/StatsModal";
import QuarterModal from "@/components/game/QuarterModal";
import { useSync } from "@/hooks/useSync";
import { calcPlayerStats, exportCSV } from "@/lib/stats";
import type { Quarter } from "@/types";

export default function GameRecordPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [statsOpen, setStatsOpen] = useState(false);
  const [quarterModalOpen, setQuarterModalOpen] = useState(false);
  const [pendingQuarter, setPendingQuarter] = useState<Quarter | null>(null);

  const store = useGameStore();
  const {
    games,
    gamePlayers: allGamePlayers,
    logs: allLogs,
    currentQuarter,
    inputState,
    inputStep,
    setCurrentGame,
    setQuarter,
    selectZone,
    selectAction,
    selectPlayer,
    resetInput,
    undo,
    getActivePlayers,
    getGameLogs,
    getTeamScore,
    getGamePlayerIds,
    updateOpponentScore,
    togglePlayerActive,
  } = store;

  const { players } = usePlayerStore();
  const { pushToCloud } = useSync();

  const game = games.find((g) => g.id === id);

  useEffect(() => {
    if (id) setCurrentGame(id);
    return () => setCurrentGame(null);
  }, [id, setCurrentGame]);

  const activePlayerIds = useMemo(
    () => (id ? getActivePlayers(id, currentQuarter) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, currentQuarter, allGamePlayers],
  );

  const gameLogs = useMemo(
    () => (id ? getGameLogs(id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, allLogs],
  );

  const teamScore = useMemo(
    () => (id ? getTeamScore(id) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, allLogs],
  );

  const gamePlayerIds = useMemo(
    () => (id ? getGamePlayerIds(id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, allGamePlayers],
  );

  const gamePlayerObjects = useMemo(
    () => players.filter((p) => gamePlayerIds.includes(p.id)),
    [players, gamePlayerIds],
  );

  const stats = useMemo(
    () => calcPlayerStats(gameLogs, gamePlayerObjects),
    [gameLogs, gamePlayerObjects],
  );

  const handleNextQuarter = useCallback(() => {
    if (currentQuarter >= 5) return;
    const next = (currentQuarter + 1) as Quarter;
    setPendingQuarter(next);
    setQuarterModalOpen(true);
  }, [currentQuarter]);

  const handleQuarterSwitch = useCallback(
    (q: Quarter) => {
      if (!id) return;
      const active = getActivePlayers(id, q);
      if (active.length === 0) {
        setPendingQuarter(q);
        setQuarterModalOpen(true);
      } else {
        setQuarter(q);
      }
    },
    [id, getActivePlayers, setQuarter],
  );

  const handleQuarterConfirm = useCallback(
    (selectedIds: string[]) => {
      if (!id || !pendingQuarter) return;
      for (const pid of gamePlayerIds) {
        const shouldBeActive = selectedIds.includes(pid);
        const isCurrentlyActive = getActivePlayers(id, pendingQuarter).includes(pid);
        if (shouldBeActive !== isCurrentlyActive) {
          togglePlayerActive(id, pid, pendingQuarter);
        }
      }
      setQuarter(pendingQuarter);
      setQuarterModalOpen(false);
      setPendingQuarter(null);
    },
    [id, pendingQuarter, gamePlayerIds, getActivePlayers, togglePlayerActive, setQuarter],
  );

  const handleEndGame = useCallback(async () => {
    if (!id) return;
    if (confirm("試合を終了してスタッツ画面に移動しますか？")) {
      await pushToCloud();
      navigate(`/games/${id}`);
    }
  }, [id, navigate, pushToCloud]);

  const handleExportCSV = () => {
    if (!game) return;
    exportCSV(stats, `${game.gameDate}_vs_${game.opponentName}`);
  };

  if (!game || !id) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-white/50 mb-4">試合が見つかりません</p>
          <button onClick={() => navigate("/")} className="text-accent underline">
            ホームへ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      <GameHeader
        opponentName={game.opponentName}
        teamScore={teamScore}
        opponentScore={game.opponentScore}
        currentQuarter={currentQuarter}
        onQuarterChange={handleQuarterSwitch}
        onNextQuarter={handleNextQuarter}
        onOpponentScoreChange={(delta) => updateOpponentScore(id, delta)}
        onUndo={undo}
        onStatsOpen={() => setStatsOpen(true)}
        onReset={resetInput}
        onBack={() => navigate("/")}
        onEndGame={handleEndGame}
        inputStep={inputStep}
      />

      {activePlayerIds.length === 0 && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center">
          <span className="text-yellow-400 text-sm font-bold">
            {currentQuarter}Qの出場選手が未設定です。
          </span>
          <button
            onClick={() => {
              setPendingQuarter(currentQuarter);
              setQuarterModalOpen(true);
            }}
            className="ml-2 text-accent underline text-sm"
          >
            設定する
          </button>
        </div>
      )}

      {/* iPad layout (md+): 3-pane */}
      <div className="hidden md:flex flex-1 min-h-0">
        <div className="w-[20%] overflow-y-auto border-r border-white/10">
          <PlayerPanel
            players={players}
            activePlayerIds={activePlayerIds}
            selectedPlayerId={inputState.playerId}
            onSelect={selectPlayer}
            highlightStep={inputStep === "player"}
            disabled={inputStep !== "player"}
          />
        </div>
        <div className="w-[50%] flex items-center justify-center p-3">
          <HalfCourt
            selectedZoneId={inputState.zoneId}
            onZoneClick={selectZone}
            disabled={inputStep !== "zone"}
          />
        </div>
        <div className="w-[30%] overflow-y-auto border-l border-white/10">
          <ActionPanel
            selectedAction={inputState.action}
            selectedResult={inputState.result}
            onSelect={selectAction}
            highlightStep={inputStep === "action"}
            disabled={inputStep !== "action"}
          />
        </div>
      </div>

      {/* Mobile layout (< md): stacked */}
      <div className="flex md:hidden flex-col flex-1 min-h-0">
        <div className="h-[40%] flex items-center justify-center p-2">
          <HalfCourt
            selectedZoneId={inputState.zoneId}
            onZoneClick={selectZone}
            disabled={inputStep !== "zone"}
          />
        </div>
        <div className="h-[30%] overflow-y-auto border-y border-white/10">
          <ActionPanel
            selectedAction={inputState.action}
            selectedResult={inputState.result}
            onSelect={selectAction}
            highlightStep={inputStep === "action"}
            disabled={inputStep !== "action"}
          />
        </div>
        <div className="h-[30%] overflow-y-auto">
          <PlayerPanel
            players={players}
            activePlayerIds={activePlayerIds}
            selectedPlayerId={inputState.playerId}
            onSelect={selectPlayer}
            highlightStep={inputStep === "player"}
            disabled={inputStep !== "player"}
          />
        </div>
      </div>

      <StatsModal
        isOpen={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={stats}
        teamScore={teamScore}
        opponentName={game.opponentName}
        opponentScore={game.opponentScore}
        onExportCSV={handleExportCSV}
      />

      <QuarterModal
        isOpen={quarterModalOpen}
        targetQuarter={pendingQuarter ?? currentQuarter}
        allGamePlayers={gamePlayerObjects}
        previousActiveIds={activePlayerIds}
        onConfirm={handleQuarterConfirm}
        onCancel={() => {
          setQuarterModalOpen(false);
          setPendingQuarter(null);
        }}
      />
    </div>
  );
}
