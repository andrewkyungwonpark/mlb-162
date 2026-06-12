export interface Player {
  name: string;
  team: string;
  decade: string;
  season: number;
  pos: string[];
  sp: boolean;
  ba: number | null;
  obp: number | null;
  slg: number | null;
  hr: number | null;
  rbi: number | null;
  sb: number | null;
  war: number | null;
  ops_plus: number | null;
  wrc_plus: number | null;
  era: number | null;
  whip: number | null;
  k9: number | null;
  bb9: number | null;
  era_plus: number | null;
  fip: number | null;
}

export type EraMode = "all" | "window1" | "window2" | "window3" | "window4";

export interface EraModeConfig {
  id: EraMode;
  label: string;
  years: string;
  startYear: number;
  endYear: number;
  desc: string;
}

export const ERA_MODES: EraModeConfig[] = [
  {
    id: "all",
    label: "2008–Present",
    years: "2008–2025",
    startYear: 2008,
    endYear: 2025,
    desc: "The full modern era",
  },
  {
    id: "window1",
    label: "2008–2012",
    years: "2008–2012",
    startYear: 2008,
    endYear: 2012,
    desc: "Pre-analytics, traditional scouting",
  },
  {
    id: "window2",
    label: "2013–2017",
    years: "2013–2017",
    startYear: 2013,
    endYear: 2017,
    desc: "Sabermetrics go brrrrr",
  },
  {
    id: "window3",
    label: "2018–2021",
    years: "2018–2021",
    startYear: 2018,
    endYear: 2021,
    desc: "Launch angle peak, shortened 2020",
  },
  {
    id: "window4",
    label: "2022–2025",
    years: "2022–2025",
    startYear: 2022,
    endYear: 2025,
    desc: "Pitch clock, shift ban, Ohtani era",
  },
];

export type GameMode = "classic" | "blindpick";
export type GamePhase = "start" | "draft" | "result";

export type Position =
  | "C"
  | "1B"
  | "2B"
  | "3B"
  | "SS"
  | "LF"
  | "CF"
  | "RF"
  | "DH"
  | "SP";

export const POSITIONS: Position[] = [
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

export interface Roster {
  C?: Player;
  "1B"?: Player;
  "2B"?: Player;
  "3B"?: Player;
  SS?: Player;
  LF?: Player;
  CF?: Player;
  RF?: Player;
  DH?: Player;
  SP?: Player;
}

export interface SpinResult {
  decade: string;
  team: string;
}

export interface SimResult {
  wins: number;
  losses: number;
  offenseScore: number;
  pitchingScore: number;
  warScore: number;
  total: number;
  message: string;
}
