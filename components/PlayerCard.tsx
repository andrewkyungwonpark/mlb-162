import type { Player } from "../types";

interface Props {
  player: Player;
  selected: boolean;
  blind: boolean;
  onClick: () => void;
}

function fmt(n: number | null, decimals = 3): string {
  if (n === null) return "—";
  if (decimals === 0) return String(Math.round(n));
  return n.toFixed(decimals).replace(/^0\./, ".");
}

export default function PlayerCard({
  player,
  selected,
  blind,
  onClick,
}: Props) {
  return (
    <button
      className={`player-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="player-card-header">
        <span className="player-name">{player.name}</span>
        <span className="player-meta">
          {player.season} · {player.team} · {player.pos.join("/")}
        </span>
      </div>

      {!blind && (
        <div className="player-stats">
          {player.sp ? (
            <>
              <Stat
                label="ERA"
                value={fmt(player.era, 2)}
                highlight={!!player.era && player.era < 2.5}
              />
              <Stat label="K/9" value={fmt(player.k9, 1)} />
              <Stat label="BB/9" value={fmt(player.bb9, 1)} />
              <Stat
                label="WHIP"
                value={fmt(player.whip, 2)}
                highlight={!!player.whip && player.whip < 1.0}
              />
              <Stat
                label="ERA+"
                value={fmt(player.era_plus, 0)}
                highlight={!!player.era_plus && player.era_plus > 150}
              />
              {/* <Stat
                label="WAR"
                value={fmt(player.war, 1)}
                highlight={!!player.war && player.war >= 7}
              /> */}
            </>
          ) : (
            <>
              <Stat
                label="AVG"
                value={fmt(player.ba)}
                highlight={!!player.ba && player.ba > 0.33}
              />
              <Stat label="OBP" value={fmt(player.obp)} />
              <Stat label="SLG" value={fmt(player.slg)} />
              <Stat
                label="HR"
                value={fmt(player.hr, 0)}
                highlight={!!player.hr && player.hr >= 40}
              />
              <Stat label="RBI" value={fmt(player.rbi, 0)} />
              <Stat
                label="OPS+"
                value={fmt(player.ops_plus, 0)}
                highlight={!!player.ops_plus && player.ops_plus > 160}
              />
              {/* <Stat
                label="WAR"
                value={fmt(player.war, 1)}
                highlight={!!player.war && player.war >= 7}
              /> */}
            </>
          )}
        </div>
      )}

      {blind && (
        <div className="player-stats blind-mode">
          <span className="blind-hint">
            {player.sp ? "SP" : player.pos.join(" / ")}
          </span>
        </div>
      )}
    </button>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <span className={`stat-pill ${highlight ? "hot" : ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </span>
  );
}
