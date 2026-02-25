import { cn } from "@/lib/utils";
import { Undo2, BarChart3, Minus, Plus, ChevronRight, ArrowLeft, Flag, History } from "lucide-react";
import type { Quarter } from "@/types";
import { useState, useEffect } from "react";

interface GameHeaderProps {
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  currentQuarter: Quarter;
  onQuarterChange: (q: Quarter) => void;
  onNextQuarter: () => void;
  onSubstitution: () => void;
  onOpponentScoreChange: (delta: number) => void;
  onOpponentScoreSet: (score: number) => void;
  onUndo: () => void;
  onHistoryOpen: () => void;
  onStatsOpen: () => void;
  onReset: () => void;
  onBack: () => void;
  onEndGame: () => void;
  inputStep: string;
}

const QUARTERS: { value: Quarter; label: string }[] = [
  { value: 1, label: "1Q" },
  { value: 2, label: "2Q" },
  { value: 3, label: "3Q" },
  { value: 4, label: "4Q" },
  { value: 5, label: "OT" },
];

export default function GameHeader({
  opponentName,
  teamScore,
  opponentScore,
  currentQuarter,
  onQuarterChange,
  onNextQuarter,
  onSubstitution,
  onOpponentScoreChange,
  onOpponentScoreSet,
  onUndo,
  onHistoryOpen,
  onStatsOpen,
  onReset,
  onBack,
  onEndGame,
  inputStep,
}: GameHeaderProps) {
  const [isEditingOpponentScore, setIsEditingOpponentScore] = useState(false);
  const [editingScore, setEditingScore] = useState(opponentScore.toString());

  useEffect(() => {
    setEditingScore(opponentScore.toString());
  }, [opponentScore]);

  const handleScoreSubmit = () => {
    const val = parseInt(editingScore, 10);
    if (!isNaN(val)) {
      onOpponentScoreSet(val);
    }
    setIsEditingOpponentScore(false);
  };

  return (
    <header className="bg-primary px-3 py-2 flex items-center gap-2 shrink-0 flex-wrap">
      {/* Back button */}
      <button
        onClick={onBack}
        className="p-1.5 rounded bg-white/10 text-white/70 hover:bg-white/20 active:scale-90 transition-all"
        title="戻る"
      >
        <ArrowLeft size={16} />
      </button>

      {/* Quarter selector */}
      <div className="flex gap-1">
        {QUARTERS.map((q) => (
          <button
            key={q.value}
            onClick={() => onQuarterChange(q.value)}
            className={cn(
              "px-2 py-1 rounded text-xs font-bold transition-colors",
              currentQuarter === q.value
                ? "bg-accent text-black"
                : "bg-white/10 text-white/70 hover:bg-white/20",
            )}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Next quarter button */}
      {currentQuarter < 5 && (
        <button
          onClick={onNextQuarter}
          className="flex items-center gap-0.5 px-2 py-1 rounded text-xs font-bold bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
          title={`${currentQuarter + 1}Qへ`}
        >
          次Q
          <ChevronRight size={14} />
        </button>
      )}
      <button
        onClick={onSubstitution}
        className="px-2 py-1 rounded text-xs font-bold bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
        title="現在Qの選手交代"
      >
        交代
      </button>

      {/* Scoreboard */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="text-center">
          <div className="text-[10px] text-white/50 uppercase">自チーム</div>
          <div className="text-xl font-bold text-white tabular-nums">{teamScore}</div>
        </div>
        <div className="text-white/30 text-sm font-bold">-</div>
        <div className="text-center">
          <div className="text-[10px] text-white/50 uppercase truncate max-w-[60px]">
            {opponentName}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpponentScoreChange(-1)}
              className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 active:scale-90"
            >
              <Minus size={12} />
            </button>
            {isEditingOpponentScore ? (
              <input
                type="number"
                className="w-12 h-6 bg-white/20 text-white font-bold rounded text-center focus:outline-none focus:ring-1 focus:ring-accent"
                value={editingScore}
                onChange={(e) => setEditingScore(e.target.value)}
                onBlur={handleScoreSubmit}
                onKeyDown={(e) => e.key === "Enter" && handleScoreSubmit()}
                autoFocus
              />
            ) : (
              <span
                onClick={() => setIsEditingOpponentScore(true)}
                className="text-xl font-bold text-white tabular-nums min-w-[2ch] text-center cursor-pointer hover:text-accent transition-colors"
                title="タップして直接入力"
              >
                {opponentScore}
              </span>
            )}
            <button
              onClick={() => onOpponentScoreChange(1)}
              className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 active:scale-90"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Step indicator (desktop only) */}
      <div className="hidden md:flex items-center gap-1 ml-3">
        {(["zone", "action", "player"] as const).map((step) => (
          <span
            key={step}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
              inputStep === step ? "bg-accent text-black" : "bg-white/10 text-white/40",
            )}
          >
            {step === "zone" ? "ゾーン" : step === "action" ? "アクション" : "選手"}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-1 ml-2">
        <button
          onClick={onReset}
          className="px-2 py-1.5 rounded text-xs text-white/60 hover:bg-white/10 transition-colors"
        >
          リセット
        </button>
        <button
          onClick={onUndo}
          className="p-1.5 rounded bg-white/10 text-white/80 hover:bg-white/20 active:scale-90 transition-all"
          title="直前を取り消し"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={onHistoryOpen}
          className="p-1.5 rounded bg-white/10 text-white/80 hover:bg-white/20 active:scale-90 transition-all"
          title="入力履歴"
        >
          <History size={16} />
        </button>
        <button
          onClick={onStatsOpen}
          className="p-1.5 rounded bg-white/10 text-white/80 hover:bg-white/20 active:scale-90 transition-all"
          title="スタッツ"
        >
          <BarChart3 size={16} />
        </button>
        <button
          onClick={onEndGame}
          className="flex items-center gap-1 px-2 py-1.5 rounded bg-danger/20 text-danger text-xs font-bold hover:bg-danger/30 active:scale-95 transition-all"
          title="試合終了"
        >
          <Flag size={14} />
          <span className="hidden md:inline">試合終了</span>
        </button>
      </div>
    </header>
  );
}
