import { useState } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { api } from "@/api/client";
import BackLink from "@/components/common/BackLink";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { players, add, update, remove } = usePlayerStore();
  const [newNumber, setNewNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNumber, setEditNumber] = useState("");
  const [editName, setEditName] = useState("");

  const sorted = [...players].sort((a, b) => a.number - b.number);

  const handleAdd = () => {
    const num = parseInt(newNumber, 10);
    if (isNaN(num) || newName.trim() === "") return;
    add(num, newName.trim());
    setNewNumber("");
    setNewName("");
  };

  const startEdit = (id: string) => {
    const p = players.find((pl) => pl.id === id);
    if (!p) return;
    setEditId(id);
    setEditNumber(String(p.number));
    setEditName(p.name);
  };

  const saveEdit = () => {
    if (!editId) return;
    const num = parseInt(editNumber, 10);
    if (isNaN(num) || editName.trim() === "") return;
    update(editId, { number: num, name: editName.trim() });
    setEditId(null);
  };

  const cancelEdit = () => setEditId(null);

  return (
    <div className="h-full bg-slate-900 text-white overflow-auto">
      <div className="max-w-lg mx-auto p-6">
        <BackLink to="/" />
        <h1 className="text-2xl font-bold mt-4 mb-6">選手管理</h1>

        {/* Add new player */}
        <div className="bg-surface rounded-xl p-4 mb-6">
          <h2 className="text-sm font-bold text-white/60 uppercase mb-3">選手を追加</h2>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="背番号"
                className="w-20 shrink-0 px-3 py-2.5 rounded-lg bg-surface-light border border-white/10 text-white text-center placeholder:text-white/30 focus:outline-none focus:border-accent"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="名前を入力"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-surface-light border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-accent"
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.98]",
                newNumber && newName.trim()
                  ? "bg-accent text-black"
                  : "bg-white/10 text-white/40",
              )}
            >
              <Plus size={16} />
              追加
            </button>
          </div>
        </div>

        {/* Player list */}
        <div className="space-y-2">
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              選手がまだ登録されていません
            </div>
          ) : (
            sorted.map((p) =>
              editId === p.id ? (
                <div
                  key={p.id}
                  className="bg-surface rounded-xl p-3 flex items-center gap-2 border-2 border-accent"
                >
                  <input
                    type="number"
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    className="w-16 px-2 py-1.5 rounded bg-surface-light border border-white/10 text-white text-center text-sm focus:outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    className="flex-1 px-2 py-1.5 rounded bg-surface-light border border-white/10 text-white text-sm focus:outline-none focus:border-accent"
                  />
                  <button onClick={saveEdit} className="p-1.5 rounded bg-success/20 text-success hover:bg-success/30">
                    <Check size={16} />
                  </button>
                  <button onClick={cancelEdit} className="p-1.5 rounded bg-white/10 text-white/50 hover:bg-white/20">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  key={p.id}
                  className="bg-surface rounded-xl p-3 flex items-center gap-3 group"
                >
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold shrink-0">
                    {p.number}
                  </span>
                  <span className="flex-1 font-bold truncate">{p.name}</span>
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(p.id)}
                      className="p-1.5 rounded bg-white/10 text-white/50 hover:bg-white/20 hover:text-white"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`${p.name} を削除しますか？`)) {
                          remove(p.id);
                          try {
                            await api.players.remove(p.id);
                          } catch (err) {
                            console.error("Failed to delete player from DB:", err);
                          }
                        }
                      }}
                      className="p-1.5 rounded bg-white/10 text-white/30 hover:bg-danger/20 hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
}
