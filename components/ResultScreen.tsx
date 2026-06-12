import type { Position, Roster, SimResult } from "../types";

import { POSITIONS } from "../types";
import { buildShareText } from "../lib/gameLogic";

interface Props {
  roster: Roster;
  result: SimResult;
  onReset: () => void;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="score-bar-val">{value}</span>
    </div>
  );
}

export default function ResultScreen({ roster, result, onReset }: Props) {
  const { wins, losses, offenseScore, pitchingScore, warScore, message } =
    result;
  const isPerfect = wins === 162;

  function handleCopy() {
    navigator.clipboard
      .writeText(buildShareText(roster, result))
      .catch(() => {});
  }

  return (
    <div className="result-screen">
      {/* Record */}
      <div className={`result-hero ${isPerfect ? "perfect" : ""}`}>
        <div className="result-record">
          <span className="record-wins">{wins}</span>
          <span className="record-dash">–</span>
          <span className="record-losses">{losses}</span>
        </div>
        <p className="result-message">{message}</p>
      </div>

      {/* Stat bars */}
      <div className="result-bars">
        <ScoreBar label="Offense" value={offenseScore} />
        <ScoreBar label="Pitching" value={pitchingScore} />
        <ScoreBar label="WAR" value={warScore} />
      </div>

      {/* Lineup */}
      <div className="result-roster">
        <h3 className="roster-heading">Your Lineup</h3>
        <div className="roster-grid">
          {POSITIONS.map((pos: Position) => {
            const p = roster[pos];
            return (
              <div
                key={pos}
                className={`roster-slot-result ${p ? "filled" : "empty"}`}
              >
                <span className="roster-pos">{pos}</span>
                {p ? (
                  <>
                    <span className="roster-player-name">{p.name}</span>
                    <span className="roster-player-meta">
                      {p.decade} · {p.team}
                    </span>
                  </>
                ) : (
                  <span className="roster-empty">—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="result-actions">
        <button className="btn-secondary" onClick={handleCopy}>
          Copy result
        </button>
        <button className="btn-primary" onClick={onReset}>
          Draft again
        </button>
      </div>
    </div>
  );
}
