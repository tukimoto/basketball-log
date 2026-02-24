import type { Player } from "@/types";
import { cn } from "@/lib/utils";

interface AssistModalProps {
  isOpen: boolean;
  scorerName: string;
  activePlayers: Player[];
  scorerPlayerId: string;
  onSelect: (passerPlayerId: string) => void;
  onSkip: () => void;
}

export default function AssistModal({
  isOpen,
  scorerName,
  activePlayers,
  scorerPlayerId,
  onSelect,
  onSkip,
}: AssistModalProps) {
  if (!isOpen) return null;

  const passers = activePlayers.filter((p) => p.id !== scorerPlayerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface rounded-2xl w-[90%] max-w-sm p-5 shadow-xl">
        <h2 className="text-lg font-bold text-white text-center mb-1">
          アシストを記録
        </h2>
        <p className="text-sm text-white/60 text-center mb-4">
          {scorerName} のシュート成功 — パサーは？
        </p>

        <div className="flex flex-col gap-2 mb-4">
          {passers.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cn(
                "px-4 py-3 rounded-lg font-bold text-sm border-2 transition-all active:scale-95",
                "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/40",
              )}
            >
              #{p.number} {p.name}
            </button>
          ))}
        </div>

        <button
          onClick={onSkip}
          className="w-full py-3 rounded-lg bg-white/10 text-white/60 font-bold text-sm hover:bg-white/20 transition-colors"
        >
          アシストなし
        </button>
      </div>
    </div>
  );
}
