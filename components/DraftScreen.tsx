import type { GameMode, Player, Position, Roster, SpinResult } from "../types";
import {
  eligibleSlotsForPlayer,
  getEligibleCombos,
  getPlayersForCombo,
} from "../lib/gameLogic";
import { useEffect, useRef, useState } from "react";

import BaseballField from "./BaseballField";
import { POSITIONS } from "../types";
import PlayerCard from "./PlayerCard";
import SlotMachine from "./SlotMachine";
import teamAbbrev from "../util/teamAbbrev";

interface Props {
  players: Player[];
  mode: GameMode;
  onComplete: (roster: Roster) => void;
}

const TOTAL_ROUNDS = 10;

export default function DraftScreen({ players, mode, onComplete }: Props) {
  const [round, setRound] = useState(0);
  const [roster, setRoster] = useState<Roster>({});
  const [usedCombos, setUsedCombos] = useState<string[]>([]);

  const [spunCombo, setSpunCombo] = useState<SpinResult | null>(null);
  const [options, setOptions] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Player | null>(null);
  const [slotTarget, setSlotTarget] = useState<Position | null>(null);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const combos = getEligibleCombos(players, usedCombos);
  const availableSlots = selected
    ? eligibleSlotsForPlayer(selected, roster)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    setSelected(null);
    setSlotTarget(null);
  }, [round]);

  function handleLand(combo: SpinResult) {
    setSpunCombo(combo);
    setOptions(getPlayersForCombo(players, combo));
    setSelected(null);
    setSlotTarget(null);
    setQuery("");
    setSearchOpen(false);
  }

  function handleSelectPlayer(p: Player) {
    setSelected(p);
    const slots = eligibleSlotsForPlayer(p, roster);
    setSlotTarget(slots.length === 1 ? slots[0] : null);
  }

  function handleSearch(value: string) {
    setQuery(value);
    setSelected(null);
    setSlotTarget(null);
    if (value.trim().length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    const q = value.toLowerCase();
    const results = players
      .filter(
        (p) =>
          p.decade === spunCombo?.decade &&
          p.team === spunCombo?.team &&
          p.name.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const aS = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bS = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return aS !== bS ? aS - bS : a.name.localeCompare(b.name);
      });
    setSearchResults(results);
    setSearchOpen(results.length > 0);
  }

  function handleSelectFromSearch(p: Player) {
    setSelected(p);
    setQuery(p.name);
    setSearchOpen(false);
    setOptions([p]);
    setSpunCombo({ decade: p.decade, team: p.team });
    const slots = eligibleSlotsForPlayer(p, roster);
    setSlotTarget(slots.length === 1 ? slots[0] : null);
  }

  function handleSlotClick(pos: Position) {
    setSlotTarget(pos);
  }

  function handleConfirm() {
    if (!selected || !slotTarget) return;
    const newRoster = { ...roster, [slotTarget]: selected };
    const comboKey = `${selected.decade}__${selected.team}`;
    const newUsed = usedCombos.includes(comboKey)
      ? usedCombos
      : [...usedCombos, comboKey];

    setRoster(newRoster);
    setUsedCombos(newUsed);
    setSpunCombo(null);
    setOptions([]);
    setSelected(null);
    setSlotTarget(null);
    setQuery("");

    const nextRound = round + 1;
    if (nextRound >= TOTAL_ROUNDS) onComplete(newRoster);
    else setRound(nextRound);
  }

  return (
    <div className="draft-screen">
      <div className="round-header">
        <span className="round-num">
          Round {round + 1} of {TOTAL_ROUNDS}
        </span>
        <span className="round-pos">
          {Object.keys(roster).length} / {TOTAL_ROUNDS} slots filled
        </span>
      </div>

      <div className="draft-layout">
        {/* LEFT: field on top, controls below */}
        <div className="draft-controls-col">
          <SlotMachine
            combos={combos}
            onLand={handleLand}
            position="any"
            round={round}
          />

          {spunCombo && (
            <div className="search-section" ref={searchRef}>
              <p className="search-label">
                Search {spunCombo.decade} {spunCombo.team}:
              </p>
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input
                  ref={inputRef}
                  className="search-input"
                  type="text"
                  placeholder="Search by name…"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setSearchOpen(true);
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    className="search-clear"
                    onClick={() => {
                      setQuery("");
                      setSearchResults([]);
                      setSearchOpen(false);
                      inputRef.current?.focus();
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              {searchOpen && searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map((p) => (
                    <button
                      key={`${p.name}-${p.season ?? p.decade}-${p.team}`}
                      className="search-result-row"
                      onClick={() => handleSelectFromSearch(p)}
                    >
                      <span className="sr-name">{p.name}</span>
                      <span className="sr-meta">
                        {p.season} · {p.team}
                      </span>
                      {mode === "classic" && (
                        <span className="sr-stat">
                          {p.sp
                            ? `ERA ${p.era?.toFixed(2) ?? "—"}`
                            : `OPS+ ${p.ops_plus ?? "—"}`}
                        </span>
                      )}
                    </button>
                  ))}
                  <p className="search-hint">
                    {spunCombo.decade} {spunCombo.team} only
                  </p>
                </div>
              )}
              {query.length >= 2 && searchResults.length === 0 && (
                <p className="search-empty">No players found for "{query}"</p>
              )}
            </div>
          )}

          {selected && availableSlots.length > 0 && (
            <div className="slot-assign">
              <div className="slot-assign-header">
                <span className="slot-assign-name">{selected.name}</span>
                <span className="slot-assign-meta">
                  {selected.season} · {selected.team}
                </span>
              </div>
              <p className="slot-assign-prompt">
                {slotTarget
                  ? `Placing at ${slotTarget} — tap another slot to change`
                  : "Tap a highlighted slot on the field"}
              </p>
              {slotTarget && (
                <button
                  className="btn-primary confirm-btn-full"
                  onClick={handleConfirm}
                >
                  Add {selected.name} as {slotTarget} →
                </button>
              )}
            </div>
          )}

          {spunCombo && options.length > 0 && (
            <div className="pick-section">
              <div className="player-grid">
                {options.map((p) => (
                  <PlayerCard
                    key={`${p.name}-${p.season ?? p.decade}-${p.team}`}
                    player={p}
                    selected={
                      selected?.name === p.name &&
                      selected?.season === p.season &&
                      selected?.team === p.team
                    }
                    blind={mode === "blindpick"}
                    onClick={() => handleSelectPlayer(p)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="draft-left-col">
          <div className="draft-field-col">
            <BaseballField
              roster={roster}
              eligibleSlots={availableSlots}
              selectedSlot={slotTarget}
              onSlotClick={handleSlotClick}
            />
            {selected && availableSlots.length === 0 && (
              <p className="field-no-slots">
                No open slots for this player. Pick someone else.
              </p>
            )}
          </div>
          <div className="draft-roster-col">
            <p className="roster-col-label">Lineup</p>
            {POSITIONS.map((pos) => {
              const p = roster[pos];
              return (
                <div
                  key={pos}
                  className={`roster-card ${p ? "filled" : "empty"}`}
                >
                  <span className="roster-card-pos">{pos}</span>
                  {p ? (
                    <div className="roster-card-info">
                      <span className="roster-card-name">{p.name}</span>
                      <span className="roster-card-meta">
                        {p.season} · {teamAbbrev[p.team] || p.team} ·{" "}
                        {p.pos.join("/")}
                      </span>
                      <span className="roster-card-stat">
                        {p.sp
                          ? `ERA+ ${p.era_plus ?? "—"}`
                          : `OPS+ ${p.ops_plus ?? "—"}`}
                      </span>
                    </div>
                  ) : (
                    <span className="roster-card-empty">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
