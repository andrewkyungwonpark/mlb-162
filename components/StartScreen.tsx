import type { EraMode, GameMode } from "../types";

import { ERA_MODES } from "../types";

interface Props {
  mode: GameMode;
  onModeChange: (m: GameMode) => void;
  eraMode: EraMode;
  onEraModeChange: (e: EraMode) => void;
  onStart: () => void;
  playerCount: number;
}

export default function StartScreen({
  mode,
  onModeChange,
  eraMode,
  onEraModeChange,
  onStart,
  playerCount,
}: Props) {
  return (
    <div className="start-screen">
      <div className="logo-block">
        <h1 className="game-title">162–0</h1>
        <p className="game-sub">
          Draft MLB players from 2008 to present.
          <br />
          Can your lineup go undefeated?
        </p>
      </div>

      <div className="how-it-works">
        <div className="step">
          <span className="step-num">01</span>
          <span>Spin a random franchise + season each round</span>
        </div>
        <div className="step">
          <span className="step-num">02</span>
          <span>Pick one player to fill that lineup spot</span>
        </div>
        <div className="step">
          <span className="step-num">03</span>
          <span>Build a full ten-man lineup and simulate the season</span>
        </div>
      </div>

      {/* ── Era mode ── */}
      <div className="era-section">
        <p className="mode-label">Era</p>
        <div className="era-grid era-grid-3">
          {ERA_MODES.map((e) => (
            <button
              key={e.id}
              className={`era-card ${eraMode === e.id ? "active" : ""}`}
              onClick={() => onEraModeChange(e.id)}
            >
              <span className="era-name">{e.label}</span>
              <span className="era-years">{e.years}</span>
              <span className="era-desc">{e.desc}</span>
            </button>
          ))}
        </div>
        <p className="era-pool-count">{playerCount} players in pool</p>
      </div>

      {/* ── Stat visibility mode ── */}
      <div className="mode-section">
        <p className="mode-label">Stats</p>
        <div className="mode-cards">
          <button
            className={`mode-card ${mode === "classic" ? "active" : ""}`}
            onClick={() => onModeChange("classic")}
          >
            <span className="mode-name">Classic</span>
            <span className="mode-desc">Full stats visible</span>
          </button>
          <button
            className={`mode-card ${mode === "blindpick" ? "active" : ""}`}
            onClick={() => onModeChange("blindpick")}
          >
            <span className="mode-name">Ball Knower</span>
            <span className="mode-desc">
              No stats — trust your ball knowledge
            </span>
          </button>
        </div>
      </div>

      <button className="btn-primary btn-xl" onClick={onStart}>
        Start Drafting
      </button>

      <p className="positions-row">
        C · 1B · 2B · 3B · SS · LF · CF · RF · DH · SP
      </p>
    </div>
  );
}
