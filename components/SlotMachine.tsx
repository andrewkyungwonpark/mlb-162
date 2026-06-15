import { useEffect, useRef, useState } from "react";

import type { SpinResult } from "../types";

interface Props {
  combos: SpinResult[];
  onLand: (result: SpinResult) => void;
  onReroll?: () => void;
  rerollsUsed?: number;
  maxRerolls?: number;
  position: string;
  round: number;
}

export default function SlotMachine({
  combos,
  onLand,
  onReroll,
  rerollsUsed = 0,
  maxRerolls = 2,
  position,
  round,
}: Props) {
  const [spinning, setSpinning] = useState(false);
  const [display, setDisplay] = useState("Press SPIN to draft");
  const [landed, setLanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rerollsLeft = maxRerolls - rerollsUsed;

  // Reset when round changes
  useEffect(() => {
    setDisplay("Press SPIN to draft");
    setLanded(false);
    setSpinning(false);
  }, [round]);

  function doSpin() {
    if (spinning) return;
    if (combos.length === 0) {
      setDisplay("No players available for this position");
      return;
    }
    setSpinning(true);
    setLanded(false);

    const target = combos[Math.floor(Math.random() * combos.length)];
    let ticks = 0;
    const totalTicks = 20 + Math.floor(Math.random() * 10);

    intervalRef.current = setInterval(() => {
      const fake = combos[Math.floor(Math.random() * combos.length)];
      setDisplay(`${fake.decade} ${fake.team}`);
      ticks++;

      if (ticks >= totalTicks) {
        clearInterval(intervalRef.current!);
        setDisplay(`${target.decade} ${target.team}`);
        setSpinning(false);
        setLanded(true);
        onLand(target);
      }
    }, 75);
  }

  function handleReroll() {
    if (rerollsLeft <= 0 || spinning) return;
    onReroll?.();
    doSpin();
  }

  return (
    <div className="slot-machine">
      <div className="slot-label">Spin for a team · pick any player</div>
      <div
        className={`slot-display ${spinning ? "spinning" : ""} ${landed ? "landed" : ""}`}
      >
        {display}
      </div>

      {!landed && !spinning && (
        <button className="btn-spin" onClick={doSpin}>
          ⚾ SPIN
        </button>
      )}

      {spinning && (
        <button className="btn-spin disabled" disabled>
          Spinning…
        </button>
      )}

      {landed && !spinning && (
        <div className="spin-actions">
          <button
            className={`btn-reroll ${rerollsLeft <= 0 ? "disabled" : ""}`}
            onClick={handleReroll}
            disabled={rerollsLeft <= 0}
          >
            🔄 Reroll {rerollsLeft > 0 ? `(${rerollsLeft} left)` : "(0 left)"}
          </button>
        </div>
      )}

      {combos.length === 0 && !landed && (
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--red)",
            marginTop: "0.5rem",
          }}
        >
          No combos available — check players.json
        </p>
      )}
    </div>
  );
}
