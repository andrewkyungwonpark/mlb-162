import "../styles/App.css";

import type { EraMode, GameMode, GamePhase, Player, Roster } from "../types";
import { useEffect, useMemo, useState } from "react";

import DraftScreen from "../components/DraftScreen";
import { ERA_MODES } from "../types";
import ResultScreen from "../components/ResultScreen";
import type { SimResult } from "../types";
import StartScreen from "../components/StartScreen";
import { simulate } from "../lib/gameLogic";

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<GamePhase>("start");
  const [mode, setMode] = useState<GameMode>("classic");
  const [eraMode, setEraMode] = useState<EraMode>("all");
  const [roster, setRoster] = useState<Roster>({});
  const [result, setResult] = useState<SimResult | null>(null);

  useEffect(() => {
    fetch("/players.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Player[]) => {
        setPlayers(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // Filter player pool by selected era mode
  const filteredPlayers = useMemo(() => {
    const config = ERA_MODES.find((e) => e.id === eraMode)!;
    return players.filter((p) => {
      const season = (p as Player & { season?: number }).season ?? 2012;
      return season >= config.startYear && season <= config.endYear;
    });
  }, [players, eraMode]);

  function handleStart() {
    setRoster({});
    setResult(null);
    setPhase("draft");
  }

  function handleDraftComplete(finalRoster: Roster) {
    setRoster(finalRoster);
    setResult(simulate(finalRoster));
    setPhase("result");
  }

  function handleReset() {
    setPhase("start");
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-ball">⚾</div>
        <p>Loading players…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen">
        <p className="error-text">Failed to load players: {error}</p>
        <p>Make sure players.json is in the public/ folder.</p>
      </div>
    );
  }

  const eraConfig = ERA_MODES.find((e) => e.id === eraMode)!;

  return (
    <div className="app">
      <header className="app-header">
        <span className="header-logo">
          162–0 <span className="header-version">v1.1</span>
        </span>{" "}
        {phase !== "start" && (
          <div className="header-right">
            <span className="header-era">{eraConfig.label}</span>
            <button className="header-reset" onClick={handleReset}>
              ← New draft
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        {phase === "start" && (
          <StartScreen
            mode={mode}
            onModeChange={setMode}
            eraMode={eraMode}
            onEraModeChange={setEraMode}
            onStart={handleStart}
            playerCount={filteredPlayers.length}
          />
        )}
        {phase === "draft" && (
          <DraftScreen
            players={filteredPlayers}
            mode={mode}
            onComplete={handleDraftComplete}
          />
        )}
        {phase === "result" && result && (
          <ResultScreen roster={roster} result={result} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}
