import { useState, useMemo, useEffect } from "react";
import type { Player, Quarter } from "@/types";
import { cn } from "@/lib/utils";

interface QuarterModalProps {
  isOpen: boolean;
  targetQuarter: Quarter;
  allGamePlayers: Player[];
  previousActiveIds: string[];
  onConfirm: (activePlayerIds: string[]) => void;
  onCancel: () => void;
}

const QUARTER_LABELS: Record<number, string> = {
  1: "第1クォーター",
  2: "第2クォーター",
  3: "第3クォーター",
  4: "第4クォーター",
  5: "延長戦",
};

export default function QuarterModal({
  isOpen,
  targetQuarter,
  allGamePlayers,
  previousActiveIds,
  onConfirm,
  onCancel,
}: QuarterModalProps) {
  const [selected, setSelected] = useState<string[]>(previousActiveIds);

  useEffect(() => {
    if (isOpen) {
      setSelected(previousActiveIds);
    }
  }, [isOpen, previousActiveIds, targetQuarter]);

  const sorted = useMemo(
    () => [...allGamePlayers].sort((a, b) => a.number - b.number),
    [allGamePlayers],
  );

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-surface rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">
            {QUARTER_LABELS[targetQuarter]}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            出場する5名を選んでください（{selected.length}/5）
          </p>
        </div>

        <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
          {sorted.map((p) => {
            const isActive = selected.includes(p.id);
            const wasPrevious = previousActiveIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left",
                  isActive
                    ? "bg-accent/20 border-accent text-white"
                    : "bg-surface-light border-transparent text-white/70 hover:border-white/20",
                )}
              >
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white text-sm font-bold shrink-0">
                  {p.number}
                </span>
                <span className="font-bold flex-1">{p.name}</span>
                {wasPrevious && !isActive && (
                  <span className="text-[10px] text-white/30 bg-white/10 px-2 py-0.5 rounded">前Q</span>
                )}
                {isActive && (
                  <span className="text-xs font-bold text-accent">出場</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg bg-white/10 text-white/60 font-bold hover:bg-white/15 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={selected.length !== 5}
            className={cn(
              "flex-1 py-3 rounded-lg font-bold transition-all",
              selected.length === 5
                ? "bg-accent text-black hover:bg-amber-400"
                : "bg-white/10 text-white/30 cursor-not-allowed",
            )}
          >
            決定
          </button>
        </div>
      </div>
    </div>
  );
}
