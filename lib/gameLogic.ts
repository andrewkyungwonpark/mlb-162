import type { Player, Position, Roster, SimResult, SpinResult } from "../types";

// ── Position helpers ─────────────────────────────────────────────────────────

export function normalisedPos(p: Player): string[] {
  const raw = p.pos as unknown as string[] | string | undefined;
  if (!raw) return [];
  if (Array.isArray(raw))
    return raw.map((s) =>
      String(s)
        .replace(/[^A-Z0-9]/g, "")
        .toUpperCase(),
    );
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return parsed.map((s) =>
          String(s)
            .replace(/[^A-Z0-9]/g, "")
            .toUpperCase(),
        );
    } catch {}
    return [raw.replace(/[^A-Z0-9]/g, "").toUpperCase()];
  }
  return [];
}

// Returns which open roster slots a player can fill
export function eligibleSlotsForPlayer(
  player: Player,
  roster: Roster,
): Position[] {
  const pos = normalisedPos(player);
  const allPositions: Position[] = [
    "C",
    "1B",
    "2B",
    "3B",
    "SS",
    "LF",
    "CF",
    "RF",
    "DH",
    "SP",
  ];

  return allPositions.filter((slot) => {
    if (roster[slot]) return false; // already filled
    if (slot === "SP") return player.sp;
    if (slot === "DH") return !player.sp; // any non-pitcher can DH
    return pos.includes(slot);
  });
}

// ── Spin logic ───────────────────────────────────────────────────────────────

export function getEligibleCombos(
  players: Player[],
  usedCombos: string[], // "decade__team" already used this draft
): SpinResult[] {
  const seen = new Set<string>();
  const combos: SpinResult[] = [];

  for (const p of players) {
    const key = `${p.decade}__${p.team}`;
    if (seen.has(key)) continue;
    if (usedCombos.includes(key)) continue;
    seen.add(key);
    combos.push({ decade: p.decade, team: p.team });
  }
  return combos;
}

export function getPlayersForCombo(
  players: Player[],
  combo: SpinResult,
): Player[] {
  return players
    .filter((p) => p.decade === combo.decade && p.team === combo.team)
    .sort((a, b) => (b.war ?? 0) - (a.war ?? 0));
}

// ── Simulation ───────────────────────────────────────────────────────────────

export function simulate(roster: Roster): SimResult {
  const battingPositions: Position[] = [
    "C",
    "1B",
    "2B",
    "3B",
    "SS",
    "LF",
    "CF",
    "RF",
    "DH",
  ];
  const batters = battingPositions
    .map((p) => roster[p])
    .filter((p): p is Player => !!p);
  const pitcher = roster["SP"];

  const avgOPSPlus = avg(batters.map((p) => p.ops_plus ?? 100));
  const avgBA = avg(batters.map((p) => p.ba ?? 0.25));
  const avgHR = avg(batters.map((p) => p.hr ?? 10));

  const offenseScore = Math.min(
    100,
    ((avgOPSPlus - 70) / 160) * 50 + (avgHR / 45) * 25 + (avgBA / 0.32) * 25,
  );

  const era = pitcher?.era ?? 4.5;
  const k9 = pitcher?.k9 ?? 7.0;
  const eraPlus = pitcher?.era_plus ?? Math.round((4.2 / era) * 100);

  const pitchingScore = Math.min(
    100,
    ((eraPlus - 70) / 200) * 60 + (k9 / 14) * 40,
  );

  const allPlayers = [...batters, ...(pitcher ? [pitcher] : [])];
  const avgWAR = avg(allPlayers.map((p) => p.war ?? 3.5));
  const warScore = Math.min(100, (avgWAR / 11) * 100);

  const total = offenseScore * 0.4 + pitchingScore * 0.35 + warScore * 0.25;
  const wins = recordFromScore(total);

  return {
    wins,
    losses: 162 - wins,
    offenseScore: Math.round(offenseScore),
    pitchingScore: Math.round(pitchingScore),
    warScore: Math.round(warScore),
    total: Math.round(total),
    message: resultMessage(wins),
  };
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function recordFromScore(score: number): number {
  if (score >= 96) return 162;
  if (score >= 90) return Math.round(148 + (score - 90) * 2.3);
  if (score >= 75) return Math.round(115 + (score - 75) * 2.2);
  if (score >= 55) return Math.round(75 + (score - 55) * 2.0);
  return Math.round(40 + score * 0.64);
}

function resultMessage(wins: number): string {
  if (wins === 162) return "Perfect season. An all-time lineup for the ages.";
  if (wins >= 150) return "A historically dominant squad — legendary.";
  if (wins >= 130) return "World Series contenders every single year.";
  if (wins >= 110) return "A strong playoff team with star power.";
  if (wins >= 90) return "Solid squad. A playoff bubble team.";
  if (wins >= 81) return ".500 ball. A few pieces away from contention.";
  return "This roster has some gaps. Draft again for glory.";
}

export function buildShareText(roster: Roster, result: SimResult): string {
  const lines = [
    `162-0 MLB Draft — ${result.wins}-${result.losses}`,
    "",
    ...Object.entries(roster).map(
      ([pos, p]) => `${pos}: ${p ? `${p.name} (${p.decade} ${p.team})` : "—"}`,
    ),
    "",
    `Offense: ${result.offenseScore} | Pitching: ${result.pitchingScore} | WAR: ${result.warScore}`,
    "",
    "Play at 162-0.com",
  ];
  return lines.join("\n");
}
