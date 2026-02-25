import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameStore } from "@/stores/gameStore";
import { usePlayerStore } from "@/stores/playerStore";
import HalfCourt from "@/components/court/HalfCourt";
import PlayerPanel from "@/components/game/PlayerPanel";
import ActionPanel from "@/components/game/ActionPanel";
import GameHeader from "@/components/game/GameHeader";
import StatsModal from "@/components/stats/StatsModal";
import LogHistoryModal from "@/components/game/LogHistoryModal";
import QuarterModal from "@/components/game/QuarterModal";
import AssistModal from "@/components/game/AssistModal";
import { useSync } from "@/hooks/useSync";
import { calcPlayerStats, exportCSV } from "@/lib/stats";
import type { Log, Quarter } from "@/types";

export default function GameRecordPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [statsOpen, setStatsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [quarterModalOpen, setQuarterModalOpen] = useState(false);
  const [pendingQuarter, setPendingQuarter] = useState<Quarter | null>(null);

  const [assistPrompt, setAssistPrompt] = useState<{ shotLog: Log } | null>(null);

  const games = useGameStore((s) => s.games);
  const allGamePlayers = useGameStore((s) => s.gamePlayers);
  const allLogs = useGameStore((s) => s.logs);
  const currentQuarter = useGameStore((s) => s.currentQuarter);
  const inputState = useGameStore((s) => s.inputState);
  const inputStep = useGameStore((s) => s.inputStep);

  const setCurrentGame = useGameStore((s) => s.setCurrentGame);
  const setQuarter = useGameStore((s) => s.setQuarter);
  const selectZone = useGameStore((s) => s.selectZone);
  const selectAction = useGameStore((s) => s.selectAction);
  const selectPlayer = useGameStore((s) => s.selectPlayer);
  const addAssistLog = useGameStore((s) => s.addAssistLog);
  const resetInput = useGameStore((s) => s.resetInput);
  const undo = useGameStore((s) => s.undo);
  const getActivePlayers = useGameStore((s) => s.getActivePlayers);
  const getGameLogs = useGameStore((s) => s.getGameLogs);
  const getTeamScore = useGameStore((s) => s.getTeamScore);
  const getGamePlayerIds = useGameStore((s) => s.getGamePlayerIds);
  const updateOpponentScore = useGameStore((s) => s.updateOpponentScore);
  const setOpponentScore = useGameStore((s) => s.setOpponentScore);
  const togglePlayerActive = useGameStore((s) => s.togglePlayerActive);

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

  const activePlayerObjects = useMemo(
    () => players.filter((p) => activePlayerIds.includes(p.id)),
    [players, activePlayerIds],
  );

  const handleSelectPlayer = useCallback(
    (playerId: string) => {
      const wasShotMake = inputState.action === "SHOT" && inputState.result === "MAKE";
      const log = selectPlayer(playerId);
      if (wasShotMake && log) {
        setAssistPrompt({ shotLog: log });
      }
    },
    [inputState.action, inputState.result, selectPlayer],
  );

  const handleAssistSelect = useCallback(
    (passerPlayerId: string) => {
      if (!assistPrompt) return;
      addAssistLog(passerPlayerId, assistPrompt.shotLog.playerId, assistPrompt.shotLog.id);
      setAssistPrompt(null);
    },
    [assistPrompt, addAssistLog],
  );

  const handleAssistSkip = useCallback(() => {
    setAssistPrompt(null);
  }, []);

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

  const handleSubstitution = useCallback(() => {
    setPendingQuarter(currentQuarter);
    setQuarterModalOpen(true);
  }, [currentQuarter]);

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
        onSubstitution={handleSubstitution}
        onOpponentScoreChange={(delta) => updateOpponentScore(id, delta)}
        onOpponentScoreSet={(score) => setOpponentScore(id, score)}
        onUndo={undo}
        onHistoryOpen={() => setHistoryOpen(true)}
        onStatsOpen={() => setStatsOpen(true)}
        onReset={resetInput}
        onBack={() => navigate("/")}
        onEndGame={handleEndGame}
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

      <div className="px-3 py-2 border-b border-white/10 bg-slate-900/70 text-xs text-white/70 flex flex-wrap gap-x-4 gap-y-1">
        <span>入力ステップ: <strong className="text-white">{inputStep}</strong></span>
        <span>ゾーン: <strong className="text-white">{inputState.zoneId ?? "-"}</strong></span>
        <span>アクション: <strong className="text-white">{inputState.action ?? "-"}</strong></span>
        <span>結果: <strong className="text-white">{inputState.result ?? "-"}</strong></span>
        <span>選手: <strong className="text-white">{inputState.playerId ?? "-"}</strong></span>
      </div>

      {gameLogs.length > 0 && (
        <div className="px-3 py-2 border-b border-white/10 bg-slate-900/60 text-xs text-white/60">
          直近ログ: Q{gameLogs[gameLogs.length - 1]!.quarter} / Z{gameLogs[gameLogs.length - 1]!.zoneId ?? "-"} / {gameLogs[gameLogs.length - 1]!.action} / {gameLogs[gameLogs.length - 1]!.result}
        </div>
      )}

      {/* iPad layout (md+): 3-pane */}
      <div className="hidden md:flex flex-1 min-h-0">
        <div className="w-[20%] overflow-y-auto border-r border-white/10">
          <PlayerPanel
            players={players}
            activePlayerIds={activePlayerIds}
            selectedPlayerId={inputState.playerId}
            onSelect={handleSelectPlayer}
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
            onSelect={handleSelectPlayer}
            highlightStep={inputStep === "player"}
            disabled={inputStep !== "player"}
          />
        </div>
      </div>

      <AssistModal
        isOpen={assistPrompt !== null}
        scorerName={
          assistPrompt
            ? (players.find((p) => p.id === assistPrompt.shotLog.playerId)?.name ?? "選手")
            : ""
        }
        activePlayers={activePlayerObjects}
        scorerPlayerId={assistPrompt?.shotLog.playerId ?? ""}
        onSelect={handleAssistSelect}
        onSkip={handleAssistSkip}
      />

      <StatsModal
        isOpen={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={stats}
        teamScore={teamScore}
        opponentName={game.opponentName}
        opponentScore={game.opponentScore}
        onExportCSV={handleExportCSV}
      />

      <LogHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        gameId={id}
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
