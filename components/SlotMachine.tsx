import { useEffect, useRef, useState } from "react";

import type { SpinResult } from "../types";

interface Props {
  combos: SpinResult[];
  onLand: (result: SpinResult) => void;
  position: string;
  round: number;
}

export default function SlotMachine({
  combos,
  onLand,
  position,
  round,
}: Props) {
  const [spinning, setSpinning] = useState(false);
  const [display, setDisplay] = useState("Press SPIN to draft");
  const [landed, setLanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when round changes
  useEffect(() => {
    setDisplay("Press SPIN to draft");
    setLanded(false);
    setSpinning(false);
  }, [round]);

  function spin() {
    if (spinning || landed) return;
    if (combos.length === 0) {
      setDisplay("No players available for this position");
      return;
    }
    setSpinning(true);

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

  return (
    <div className="slot-machine">
      <div className="slot-label">Spin for a team · pick any player</div>
      <div
        className={`slot-display ${spinning ? "spinning" : ""} ${landed ? "landed" : ""}`}
      >
        {display}
      </div>
      {!landed && (
        <button
          className={`btn-spin ${spinning ? "disabled" : ""}`}
          onClick={spin}
          disabled={spinning}
        >
          {spinning ? "Spinning…" : "⚾ SPIN"}
        </button>
      )}
      {combos.length === 0 && !landed && (
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--red)",
            marginTop: "0.5rem",
          }}
        >
          Debug: 0 combos for {position} — check players.json pos field
        </p>
      )}
    </div>
  );
}
