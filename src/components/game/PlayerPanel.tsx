import { cn } from "@/lib/utils";
import type { Player } from "@/types";

interface PlayerPanelProps {
  players: Player[];
  activePlayerIds: string[];
  selectedPlayerId: string | null;
  onSelect: (playerId: string) => void;
  highlightStep: boolean;
  disabled?: boolean;
}

export default function PlayerPanel({
  players,
  activePlayerIds,
  selectedPlayerId,
  onSelect,
  highlightStep,
  disabled,
}: PlayerPanelProps) {
  const activePlayers = players
    .filter((p) => activePlayerIds.includes(p.id))
    .sort((a, b) => a.number - b.number);

  return (
    <div className={cn("flex flex-col gap-2 p-2 transition-opacity", disabled && "opacity-40 pointer-events-none")}>
      <h3
        className={cn(
          "text-xs font-bold uppercase tracking-wider text-center mb-1",
          highlightStep ? "text-accent" : "text-white/50",
        )}
      >
        選手
      </h3>
      {activePlayers.map((p) => (
        <button
          key={p.id}
          onClick={() => !disabled && onSelect(p.id)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 px-3 py-3 rounded-lg font-bold text-sm transition-all",
            "border-2 active:scale-95",
            selectedPlayerId === p.id
              ? "bg-accent text-black border-accent"
              : highlightStep
                ? "bg-surface-light text-white border-accent/50 hover:border-accent"
                : "bg-surface-light text-white/80 border-transparent hover:bg-surface-light/80",
          )}
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold shrink-0">
            {p.number}
          </span>
          <span className="truncate">{p.name}</span>
        </button>
      ))}
    </div>
  );
}
