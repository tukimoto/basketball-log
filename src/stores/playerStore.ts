import { create } from "zustand";
import type { Player } from "@/types";
import { storage } from "@/lib/storage";
import { generateId } from "@/lib/utils";

const STORAGE_KEY = "players";

interface PlayerStore {
  players: Player[];
  load: () => void;
  add: (number: number, name: string) => Player;
  update: (id: string, data: Partial<Pick<Player, "number" | "name">>) => void;
  remove: (id: string) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  players: [],

  load() {
    const saved = storage.get<Player[]>(STORAGE_KEY);
    if (saved) set({ players: saved });
  },

  add(number, name) {
    const player: Player = {
      id: generateId(),
      number,
      name,
      createdAt: Date.now(),
    };
    const next = [...get().players, player];
    storage.set(STORAGE_KEY, next);
    set({ players: next });
    return player;
  },

  update(id, data) {
    const next = get().players.map((p) =>
      p.id === id ? { ...p, ...data } : p,
    );
    storage.set(STORAGE_KEY, next);
    set({ players: next });
  },

  remove(id) {
    const next = get().players.filter((p) => p.id !== id);
    storage.set(STORAGE_KEY, next);
    set({ players: next });
  },
}));
