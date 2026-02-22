import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { usePlayerStore } from "@/stores/playerStore";
import { useGameStore } from "@/stores/gameStore";
import { useSync } from "@/hooks/useSync";
import HomePage from "@/pages/HomePage";
import NewGamePage from "@/pages/NewGamePage";
import GameRecordPage from "@/pages/GameRecordPage";
import GameDetailPage from "@/pages/GameDetailPage";
import SettingsPage from "@/pages/SettingsPage";

export default function App() {
  const loadPlayers = usePlayerStore((s) => s.load);
  const loadGames = useGameStore((s) => s.load);
  const { pullFromCloud } = useSync();

  useEffect(() => {
    loadPlayers();
    loadGames();
    if (navigator.onLine) {
      void pullFromCloud();
    }
  }, [loadPlayers, loadGames, pullFromCloud]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/games/new" element={<NewGamePage />} />
        <Route path="/games/:id" element={<GameDetailPage />} />
        <Route path="/games/:id/record" element={<GameRecordPage />} />
      </Routes>
    </BrowserRouter>
  );
}
