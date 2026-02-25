import { X, Trash2, UserCog } from "lucide-react";
import type { Log } from "@/types";
import { usePlayerStore } from "@/stores/playerStore";
import { useGameStore } from "@/stores/gameStore";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface LogHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
}

export default function LogHistoryModal({ isOpen, onClose, gameId }: LogHistoryModalProps) {
  const allLogs = useGameStore((s) => s.logs);
  const deleteLog = useGameStore((s) => s.deleteLog);
  const updateLog = useGameStore((s) => s.updateLog);
  const players = usePlayerStore((s) => s.players);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  const logs = useMemo(() => {
    return allLogs
      .filter((l) => l.gameId === gameId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [allLogs, gameId]);

  if (!isOpen || !gameId) return null;

  const getPlayerName = (id: string) => {
    const p = players.find((p) => p.id === id);
    return p ? `#${p.number} ${p.name}` : "不明";
  };

  const getActionLabel = (log: Log) => {
    switch (log.action) {
      case "SHOT":
        return log.result === "MAKE" ? "シュート成功" : "シュート失敗";
      case "FT":
        return log.result === "MAKE" ? "FT成功" : "FT失敗";
      case "REB":
        return log.result === "OFF" ? "オフェンスリバウンド" : "ディフェンスリバウンド";
      case "AST":
        return "アシスト";
      case "FOUL":
        return "ファウル";
      default:
        return log.action;
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handlePlayerChange = (logId: string, newPlayerId: string) => {
    updateLog(logId, { playerId: newPlayerId });
    setEditingLogId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl flex flex-col border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">入力履歴</h2>
            <p className="text-xs text-white/40">入力ミスを修正または削除できます</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-white/20">
              <p>入力された記録はまだありません</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white/5 hover:bg-white/10 rounded-lg p-3 flex items-center gap-3 transition-colors"
                >
                  <div className="text-xs font-bold text-accent/60 w-6 text-center shrink-0">
                    {log.quarter}Q
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {editingLogId === log.id ? (
                        <select
                          className="bg-primary text-white text-xs p-1 rounded border border-white/20 focus:outline-none focus:ring-1 focus:ring-accent"
                          value={log.playerId}
                          onChange={(e) => handlePlayerChange(log.id, e.target.value)}
                          onBlur={() => setEditingLogId(null)}
                          autoFocus
                        >
                          {players.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.number} {p.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm font-bold text-white truncate">
                          {getPlayerName(log.playerId)}
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                          log.result === "MAKE" ||
                            log.result === "OFF" ||
                            log.action === "AST" ||
                            log.action === "FOUL"
                            ? "bg-success/20 text-success"
                            : "bg-danger/20 text-danger",
                        )}
                      >
                        {getActionLabel(log)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/40">
                      <span>{formatTime(log.timestamp)}</span>
                      {log.zoneId && <span>・ ゾーン{log.zoneId}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditingLogId(log.id === editingLogId ? null : log.id)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        editingLogId === log.id
                          ? "bg-accent text-black"
                          : "text-white/30 hover:bg-white/10 hover:text-white",
                      )}
                      title="選手を変更"
                    >
                      <UserCog size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("この記録を削除しますか？ (シュート成功の場合、紐づくアシストも削除されます)")) {
                          deleteLog(log.id);
                        }
                      }}
                      className="p-2 rounded-lg text-white/30 hover:bg-danger/20 hover:text-danger transition-colors"
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
