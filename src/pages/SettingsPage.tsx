import { useState } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { api } from "@/api/client";
import BackLink from "@/components/common/BackLink";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateGrade, getGradeLabel, calculateGraduationYearFromGrade } from "@/lib/academicYear";

export default function SettingsPage() {
  const { players, add, update, remove } = usePlayerStore();
  const [newNumber, setNewNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState<number>(6);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNumber, setEditNumber] = useState("");
  const [editName, setEditName] = useState("");
  const [editGrade, setEditGrade] = useState<number>(6);

  const sorted = [...players].sort((a, b) => {
    // 学年降順 → 背番号昇順
    const gradeA = calculateGrade(a.graduationYear);
    const gradeB = calculateGrade(b.graduationYear);
    if (gradeA !== gradeB) return gradeB - gradeA;
    return a.number - b.number;
  });

  const handleAdd = () => {
    const num = parseInt(newNumber, 10);
    if (isNaN(num) || newName.trim() === "") return;
    const graduationYear = calculateGraduationYearFromGrade(newGrade);
    add(num, newName.trim(), graduationYear);
    setNewNumber("");
    setNewName("");
    setNewGrade(6);
  };

  const startEdit = (id: string) => {
    const p = players.find((pl) => pl.id === id);
    if (!p) return;
    setEditId(id);
    setEditNumber(String(p.number));
    setEditName(p.name);
    setEditGrade(calculateGrade(p.graduationYear));
  };

  const saveEdit = () => {
    if (!editId) return;
    const num = parseInt(editNumber, 10);
    if (isNaN(num) || editName.trim() === "") return;
    const graduationYear = calculateGraduationYearFromGrade(editGrade);
    update(editId, { number: num, name: editName.trim(), graduationYear });
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
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(Number(e.target.value))}
                className="w-24 shrink-0 px-2 py-2.5 rounded-lg bg-surface-light border border-white/10 text-white focus:outline-none focus:border-accent appearance-none text-center"
              >
                <option value={6}>6年生</option>
                <option value={5}>5年生</option>
                <option value={4}>4年生</option>
                <option value={3}>3年生</option>
                <option value={2}>2年生</option>
                <option value={1}>1年生</option>
                <option value={0}>未就学児</option>
              </select>
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
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(Number(e.target.value))}
                    className="w-24 shrink-0 px-1 py-1.5 rounded bg-surface-light border border-white/10 text-white text-sm focus:outline-none focus:border-accent appearance-none text-center"
                  >
                    <option value={6}>6年生</option>
                    <option value={5}>5年生</option>
                    <option value={4}>4年生</option>
                    <option value={3}>3年生</option>
                    <option value={2}>2年生</option>
                    <option value={1}>1年生</option>
                    <option value={0}>未就学児</option>
                    <option value={7}>OB/OG</option>
                  </select>
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
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{p.name}</div>
                    <div className="text-xs text-white/50 mt-0.5">
                      {getGradeLabel(calculateGrade(p.graduationYear))}
                    </div>
                  </div>
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
