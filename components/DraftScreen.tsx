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
import { createPortal } from "react-dom";

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

  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

  const [sortStat, setSortStat] = useState<string>("war");

  const [rerollsUsed, setRerollsUsed] = useState(0);
  const [movingFrom, setMovingFrom] = useState<Position | null>(null);
  const MAX_REROLLS = 2;

  const combos = getEligibleCombos(players, usedCombos);
  const availableSlots = selected
    ? eligibleSlotsForPlayer(selected, roster)
    : movingFrom && roster[movingFrom]
      ? eligibleSlotsForPlayer(
          roster[movingFrom]!,
          Object.fromEntries(
            Object.entries(roster).filter(([k]) => k !== movingFrom),
          ) as Roster,
        ).filter((s) => s !== movingFrom)
      : [];

  function updateDropdownPos() {
    if (inputRef.current) {
      setDropdownRect(inputRef.current.getBoundingClientRect());
    }
  }

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
    setMovingFrom(null);
  }, [round]);

  function handleLand(combo: SpinResult) {
    setSpunCombo(combo);
    setOptions(getPlayersForCombo(players, combo));
    setSelected(null);
    setSlotTarget(null);
    setMovingFrom(null);
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
    setSearchResults(results.slice(0, 8));
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
    // If we have a player selected from the spin, assign them
    if (selected) {
      setSlotTarget(pos);
      return;
    }

    // Rearrange mode: clicking a filled slot selects it for moving
    if (roster[pos] && movingFrom === null) {
      setMovingFrom(pos);
      return;
    }

    // Clicking the same slot deselects
    if (movingFrom === pos) {
      setMovingFrom(null);
      return;
    }

    // Clicking an eligible empty slot moves the player there
    if (movingFrom && roster[movingFrom] && !roster[pos]) {
      const player = roster[movingFrom];
      const eligibleSlots = eligibleSlotsForPlayer(player!, {
        ...roster,
        [movingFrom]: undefined,
      });
      if (eligibleSlots.includes(pos)) {
        const newRoster = { ...roster };
        newRoster[pos] = player;
        delete newRoster[movingFrom];
        setRoster(newRoster);
      }
      setMovingFrom(null);
      return;
    }

    // Clicking another filled slot switches selection
    if (movingFrom && roster[pos]) {
      setMovingFrom(pos);
    }
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

      {/* ── DESKTOP layout ── */}
      <div className="draft-layout desktop-only">
        <div className="draft-left-col">
          <div className="draft-field-col">
            <BaseballField
              roster={roster}
              eligibleSlots={availableSlots}
              selectedSlot={slotTarget}
              movingFrom={movingFrom}
              onSlotClick={handleSlotClick}
            />
            {movingFrom && roster[movingFrom] && (
              <div className="slot-assign" style={{ marginTop: "0.5rem" }}>
                <div className="slot-assign-header">
                  <span className="slot-assign-name">
                    {roster[movingFrom]!.name}
                  </span>
                  <span className="slot-assign-meta">
                    Moving from {movingFrom} — tap an amber slot to place, or
                    cancel below
                  </span>
                </div>
                <button
                  className="btn-secondary"
                  style={{
                    marginTop: "0.25rem",
                    fontSize: "0.8rem",
                    padding: "6px 14px",
                  }}
                  onClick={() => setMovingFrom(null)}
                >
                  Cancel move
                </button>
              </div>
            )}
            {selected && availableSlots.length === 0 && (
              <p className="field-no-slots">
                No open slots for this player. Pick someone else.
              </p>
            )}
          </div>

          <div className="draft-controls-col">
            <SlotMachine
              combos={combos}
              onLand={handleLand}
              onReroll={() => setRerollsUsed((r) => r + 1)}
              rerollsUsed={rerollsUsed}
              maxRerolls={MAX_REROLLS}
              position="any"
              round={round}
            />

            {spunCombo && (
              <div className="search-section" ref={searchRef}>
                <div className="search-filter-row">
                  <div className="search-input-wrap" style={{ flex: 1 }}>
                    <span className="search-icon">🔍</span>
                    <input
                      ref={inputRef}
                      className="search-input"
                      type="text"
                      placeholder={`Search ${spunCombo.decade} ${spunCombo.team}…`}
                      value={query}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => {
                        updateDropdownPos();
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
                  <div className="sort-select-wrap">
                    <select
                      className="sort-select"
                      value={sortStat}
                      onChange={(e) => setSortStat(e.target.value)}
                    >
                      <option value="ops_plus">OPS+</option>
                      <option value="hr">HR</option>
                      <option value="ba">AVG</option>
                      <option value="obp">OBP</option>
                      <option value="slg">SLG</option>
                      <option value="rbi">RBI</option>
                      <option value="era_plus">ERA+</option>
                      <option value="k9">K/9</option>
                      <option value="whip">WHIP ↑</option>
                    </select>
                    <svg
                      className="sort-chevron"
                      viewBox="0 0 10 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 1l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                {query.length >= 2 && searchResults.length === 0 && (
                  <p className="search-empty">No players found for "{query}"</p>
                )}
              </div>
            )}

            {searchOpen &&
              searchResults.length > 0 &&
              dropdownRect &&
              createPortal(
                <div
                  className="search-dropdown"
                  style={{
                    position: "fixed",
                    top: dropdownRect.bottom + 4,
                    left: dropdownRect.left,
                    width: dropdownRect.width,
                    zIndex: 9999,
                  }}
                >
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
                  {spunCombo && (
                    <p className="search-hint">
                      {spunCombo.decade} {spunCombo.team} only
                    </p>
                  )}
                </div>,
                document.body,
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
                  {[...options]
                    .sort((a, b) => {
                      const getVal = (p: Player): number | null => {
                        const stat = sortStat as keyof Player;
                        const v = p[stat];
                        return typeof v === "number" ? v : null;
                      };
                      const aVal = getVal(a);
                      const bVal = getVal(b);
                      if (aVal === null && bVal === null) return 0;
                      if (aVal === null) return 1;
                      if (bVal === null) return -1;
                      // ERA and WHIP: lower is better → ascending
                      if (sortStat === "era" || sortStat === "whip")
                        return aVal - bVal;
                      return bVal - aVal;
                    })
                    .map((p) => (
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
                      {p.season} · {p.team}
                    </span>
                    <span className="roster-card-stat">
                      {p.sp
                        ? `ERA ${p.era?.toFixed(2) ?? "—"} · ERA+ ${p.era_plus ?? "—"}`
                        : `OPS+ ${p.ops_plus ?? "—"} · ${p.hr ?? "—"} HR`}
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

      {/* ── MOBILE layout ── */}
      <div className="mobile-only mobile-draft">
        <SlotMachine
          combos={combos}
          onLand={handleLand}
          onReroll={() => setRerollsUsed((r) => r + 1)}
          rerollsUsed={rerollsUsed}
          maxRerolls={MAX_REROLLS}
          position="any"
          round={round}
        />

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
                  updateDropdownPos();
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
            {query.length >= 2 && searchResults.length === 0 && (
              <p className="search-empty">No players found for "{query}"</p>
            )}
          </div>
        )}

        {searchOpen &&
          searchResults.length > 0 &&
          dropdownRect &&
          createPortal(
            <div
              className="search-dropdown"
              style={{
                position: "fixed",
                top: dropdownRect.bottom + 4,
                left: dropdownRect.left,
                width: dropdownRect.width,
                zIndex: 9999,
              }}
            >
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
              {spunCombo && (
                <p className="search-hint">
                  {spunCombo.decade} {spunCombo.team} only
                </p>
              )}
            </div>,
            document.body,
          )}

        {/* Mobile slot picker — for drafting OR rearranging */}
        {selected && availableSlots.length > 0 && (
          <div className="mobile-slot-picker">
            <div className="slot-assign-header">
              <span className="slot-assign-name">{selected.name}</span>
              <span className="slot-assign-meta">
                {selected.season} · {selected.team}
              </span>
            </div>
            <p className="slot-assign-prompt">Choose a position:</p>
            <div className="mobile-slot-buttons">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  className={`mobile-slot-btn ${slotTarget === slot ? "active" : ""}`}
                  onClick={() => setSlotTarget(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
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

        {/* Mobile rearrange mode */}
        {!selected && movingFrom && roster[movingFrom] && (
          <div className="mobile-slot-picker">
            <div className="slot-assign-header">
              <span className="slot-assign-name">
                {roster[movingFrom]!.name}
              </span>
              <span className="slot-assign-meta">
                Currently at {movingFrom} — choose a new position
              </span>
            </div>
            <div className="mobile-slot-buttons">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  className="mobile-slot-btn"
                  onClick={() => {
                    const player = roster[movingFrom];
                    const newRoster = { ...roster };
                    newRoster[slot] = player;
                    delete newRoster[movingFrom];
                    setRoster(newRoster);
                    setMovingFrom(null);
                  }}
                >
                  {slot}
                </button>
              ))}
              <button
                className="mobile-slot-btn"
                style={{
                  borderColor: "var(--chalk-dim)",
                  color: "var(--chalk-dim)",
                }}
                onClick={() => setMovingFrom(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {selected && availableSlots.length === 0 && (
          <p className="field-no-slots">
            No open slots for this player. Pick someone else.
          </p>
        )}

        {/* Mobile mini roster — tap filled slot to move */}
        <div className="mobile-roster">
          {POSITIONS.map((pos) => {
            const p = roster[pos];
            const isMovingThis = movingFrom === pos;
            return (
              <div
                key={pos}
                className={`mobile-roster-slot ${p ? "filled" : "empty"} ${isMovingThis ? "moving" : ""}`}
                onClick={() => {
                  if (!p || selected || isMovingThis) return;
                  if (movingFrom === pos) return;
                  setMovingFrom(pos);
                }}
                style={{
                  cursor:
                    p && !selected && !isMovingThis ? "pointer" : "default",
                }}
              >
                <span className="mobile-roster-pos">{pos}</span>
                {p && (
                  <span className="mobile-roster-name">
                    {p.name
                      .split(" ")
                      .filter(Boolean)
                      .map((w, i, a) =>
                        i === 0 || i === a.length - 1 ? w[0] : null,
                      )
                      .filter(Boolean)
                      .join(".") + "."}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
