import { cn } from "@/lib/utils";
import type { Action, Result } from "@/types";

interface ActionPanelProps {
  selectedAction: Action | null;
  selectedResult: Result | null;
  onSelect: (action: Action, result: Result) => void;
  highlightStep: boolean;
  disabled?: boolean;
}

interface ActionButton {
  action: Action;
  result: Result;
  label: string;
  color: string;
  activeColor: string;
}

const ACTIONS: ActionButton[] = [
  { action: "SHOT", result: "MAKE", label: "シュート成功", color: "bg-success/20 text-success border-success/30", activeColor: "bg-success text-white border-success" },
  { action: "SHOT", result: "MISS", label: "シュート失敗", color: "bg-danger/20 text-danger border-danger/30", activeColor: "bg-danger text-white border-danger" },
  { action: "FT", result: "MAKE", label: "FT 成功", color: "bg-success/20 text-success border-success/30", activeColor: "bg-success text-white border-success" },
  { action: "FT", result: "MISS", label: "FT 失敗", color: "bg-danger/20 text-danger border-danger/30", activeColor: "bg-danger text-white border-danger" },
  { action: "FOUL", result: "PF", label: "ファウル", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", activeColor: "bg-yellow-500 text-black border-yellow-500" },
];

export default function ActionPanel({
  selectedAction,
  selectedResult,
  onSelect,
  highlightStep,
  disabled,
}: ActionPanelProps) {
  const isSelected = (a: ActionButton) =>
    a.action === selectedAction && a.result === selectedResult;

  return (
    <div className={cn("flex flex-col gap-2 p-2 transition-opacity", disabled && "opacity-40 pointer-events-none")}>
      <h3
        className={cn(
          "text-xs font-bold uppercase tracking-wider text-center mb-1",
          highlightStep ? "text-accent" : "text-white/50",
        )}
      >
        アクション
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((a) => (
          <button
            key={`${a.action}-${a.result}`}
            onClick={() => !disabled && onSelect(a.action, a.result)}
            disabled={disabled}
            className={cn(
              "px-2 py-3 rounded-lg font-bold text-xs border-2 transition-all active:scale-95",
              isSelected(a) ? a.activeColor : a.color,
              highlightStep && !isSelected(a) && "ring-1 ring-accent/30",
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
