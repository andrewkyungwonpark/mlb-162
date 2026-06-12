import type { Player, Position, Roster } from "../types";

interface Props {
  roster: Roster;
  eligibleSlots: Position[];
  selectedSlot: Position | null;
  onSlotClick: (pos: Position) => void;
}

interface SlotDef {
  pos: Position;
  x: number;
  y: number;
}

// HP=(200,390), foul lines to (0,185) and (400,185)
// Bases sit ON foul lines at t=0.44:
// 3B=(112,300), 1B=(288,300), 2B=(200,264), mound=(200,314)
const SLOTS: SlotDef[] = [
  { pos: "CF", x: 200, y: 48 },
  { pos: "LF", x: 68, y: 118 },
  { pos: "RF", x: 332, y: 118 },
  { pos: "SS", x: 150, y: 240 },
  { pos: "2B", x: 250, y: 240 },
  { pos: "3B", x: 68, y: 302 },
  { pos: "1B", x: 332, y: 302 },
  { pos: "SP", x: 200, y: 290 },
  { pos: "C", x: 200, y: 400 },
  { pos: "DH", x: 40, y: 365 },
];

function shortName(p: Player): string {
  const pts = p.name.split(" ");
  return pts.length === 1 ? p.name : `${pts[0][0]}. ${pts.slice(1).join(" ")}`;
}

export default function BaseballField({
  roster,
  eligibleSlots,
  selectedSlot,
  onSlotClick,
}: Props) {
  return (
    <div className="baseball-field-wrap">
      <svg
        viewBox="0 0 400 420"
        xmlns="http://www.w3.org/2000/svg"
        className="baseball-field-svg"
        role="img"
        aria-label="Baseball field"
      >
        {/* OUTFIELD GRASS */}
        {/* r=201 exactly connects (0,185) to (400,185) */}
        <path d="M 200 388 L 0 185 A 201 201 0 0 1 400 185 Z" fill="#2e8b35" />

        {/* Foul lines: HP(200,390) → (0,185) and (400,185) */}
        <line
          x1="200"
          y1="390"
          x2="0"
          y2="185"
          stroke="#fff"
          strokeWidth="2"
          opacity="0.6"
        />
        <line
          x1="200"
          y1="390"
          x2="400"
          y2="185"
          stroke="#fff"
          strokeWidth="2"
          opacity="0.6"
        />

        {/* HOME PLATE DIRT */}
        <circle cx="200" cy="387" r="26" fill="#c89050" />

        {/* INFIELD GRASS — 2B(200,264), 1B(288,300), HP(200,390), 3B(112,300) */}
        <path d="M 200 388 L 112 300 A 88 88 0 0 1 288 300 Z" fill="#2e8b35" />

        {/* Base paths */}
        <polygon
          points="200,212 288,300 200,388 112,300"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
        />
        {/* PITCHER'S MOUND — center=(200,314) */}
        <circle
          cx="200"
          cy="314"
          r="20"
          fill="#c89050"
          stroke="#a07040"
          strokeWidth="1.5"
        />
        <circle cx="200" cy="314" r="5" fill="#a07040" />

        {/* BASES */}
        <rect
          x="193"
          y="205"
          width="14"
          height="14"
          transform="rotate(45 200 212)"
          fill="#fff"
        />
        {/* 1B (288,300) */}
        <rect
          x="281"
          y="293"
          width="14"
          height="14"
          transform="rotate(45 288 300)"
          fill="#fff"
        />
        {/* 3B (112,300) */}
        <rect
          x="105"
          y="293"
          width="14"
          height="14"
          transform="rotate(45 112 300)"
          fill="#fff"
        />

        {/* Home plate */}
        <polygon points="191,380 209,380 209,388 200,396 191,388" fill="#fff" />

        {/* Batter's boxes */}
        <rect
          x="177"
          y="378"
          width="12"
          height="20"
          fill="none"
          stroke="#fff"
          strokeWidth="1"
          opacity="0.5"
        />
        <rect
          x="211"
          y="378"
          width="12"
          height="20"
          fill="none"
          stroke="#fff"
          strokeWidth="1"
          opacity="0.5"
        />

        {/* POSITION SLOTS */}
        {SLOTS.map(({ pos, x, y }) => {
          const player = roster[pos];
          const isEligible = eligibleSlots.includes(pos);
          const isSelected = selectedSlot === pos;
          const isFilled = !!player;

          let fill = "rgba(8,20,40,0.82)";
          let stroke = "rgba(255,255,255,0.20)";
          let textCol = "rgba(255,255,255,0.50)";
          let sw = 1;

          if (isSelected) {
            fill = "rgba(245,166,35,0.96)";
            stroke = "#f5a623";
            textCol = "#0a1628";
            sw = 2;
          } else if (isEligible) {
            fill = "rgba(245,166,35,0.16)";
            stroke = "#f5a623";
            textCol = "#f5a623";
            sw = 1.5;
          } else if (isFilled) {
            fill = "rgba(10,22,45,0.93)";
            stroke = "rgba(245,166,35,0.40)";
            textCol = "#f0ece0";
            sw = 1;
          }

          const w = 64;
          const h = isFilled ? 40 : 30;

          return (
            <g
              key={pos}
              style={{ cursor: isEligible ? "pointer" : "default" }}
              onClick={() => isEligible && onSlotClick(pos)}
            >
              {isEligible && !isSelected && (
                <rect
                  x={x - w / 2 - 4}
                  y={y - h / 2 - 4}
                  width={w + 8}
                  height={h + 8}
                  rx="9"
                  fill="none"
                  stroke="#f5a623"
                  strokeWidth="1"
                  opacity="0.3"
                />
              )}
              <rect
                x={x - w / 2}
                y={y - h / 2}
                width={w}
                height={h}
                rx="6"
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
              <text
                x={x}
                y={isFilled ? y - 4 : y + 5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fontFamily="'Barlow Condensed',sans-serif"
                fill={isFilled ? "rgba(245,166,35,0.8)" : textCol}
                letterSpacing="0.06em"
              >
                {pos}
              </text>
              {isFilled && (
                <text
                  x={x}
                  y={y + 11}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="'Barlow Condensed',sans-serif"
                  fill={textCol}
                  fontWeight="600"
                >
                  {shortName(player)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
