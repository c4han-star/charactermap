/**
 * Single's Inferno Season 5 — demo relationship graph data.
 *
 * Cast names match widely reported S5 line-ups (e.g. Netflix/Tudum, entertainment press).
 * Per-episode edges are short relationship labels for the UI only — not transcripts.
 * Relationships on the show change week to week — treat this as selectable “story beats.”
 */

export type BoardCharacter = {
  id: string;
  /** Latin / passport-style display */
  name: string;
  primary?: boolean;
  note?: string;
  photoSeed: string;
  rotKey: number;
  /** Base layout coords (scaled in the board component) */
  x: number;
  y: number;
};

export type BoardEdge = {
  from: string;
  to: string;
  /** Short relationship hint shown on the red string */
  label: string;
};

export type EpisodeBoard = {
  id: string;
  /** Shown in episode picker, e.g. "Episode 3" */
  label: string;
  /** One-line mood for the picker */
  blurb: string;
  edges: BoardEdge[];
};

/** Six notable S5 cast members — dense enough for the corkboard without overcrowding. */
export const S5_CHARACTERS_BASE: BoardCharacter[] = [
  {
    id: "heesun",
    name: "Park Hee-sun",
    primary: true,
    note: "S5 · demo board",
    photoSeed: "s5-heesun",
    rotKey: 11,
    x: 420,
    y: 260,
  },
  {
    id: "subeen",
    name: "Lim Su-been",
    photoSeed: "s5-subeen",
    rotKey: 22,
    x: 580,
    y: 120,
  },
  {
    id: "jaejin",
    name: "Kim Jae-jin",
    photoSeed: "s5-jaejin",
    rotKey: 33,
    x: 640,
    y: 320,
  },
  {
    id: "jooyoung",
    name: "Lee Joo-young",
    photoSeed: "s5-jooyoung",
    rotKey: 44,
    x: 520,
    y: 460,
  },
  {
    id: "goeun",
    name: "Kim Go-eun",
    photoSeed: "s5-goeun",
    rotKey: 55,
    x: 240,
    y: 380,
  },
  {
    id: "sungmin",
    name: "Woo Sung-min",
    photoSeed: "s5-sungmin",
    rotKey: 66,
    x: 180,
    y: 160,
  },
];

export const S5_EPISODES: EpisodeBoard[] = [
  {
    id: "ep1",
    label: "Episode 1",
    blurb: "First impressions",
    edges: [
      { from: "heesun", to: "subeen", label: "Romantic interest" },
      { from: "jaejin", to: "jooyoung", label: "Good chemistry" },
      { from: "goeun", to: "sungmin", label: "Date match" },
      { from: "heesun", to: "goeun", label: "Friends" },
      { from: "subeen", to: "jaejin", label: "Banter" },
      { from: "sungmin", to: "subeen", label: "Noticed" },
    ],
  },
  {
    id: "ep2",
    label: "Episode 2",
    blurb: "Letters & tension",
    edges: [
      { from: "heesun", to: "subeen", label: "Circling" },
      { from: "jaejin", to: "jooyoung", label: "Heating up" },
      { from: "goeun", to: "sungmin", label: "Curious" },
      { from: "goeun", to: "heesun", label: "Confiding" },
      { from: "jooyoung", to: "sungmin", label: "Rivals" },
      { from: "subeen", to: "sungmin", label: "Overlap" },
    ],
  },
  {
    id: "ep3",
    label: "Episode 3",
    blurb: "Inferno pressure",
    edges: [
      { from: "heesun", to: "subeen", label: "Push-pull" },
      { from: "jaejin", to: "jooyoung", label: "Mutual pull" },
      { from: "goeun", to: "sungmin", label: "Uncertain" },
      { from: "goeun", to: "jaejin", label: "New angle" },
      { from: "heesun", to: "jaejin", label: "Cordial" },
      { from: "sungmin", to: "jooyoung", label: "Tension" },
    ],
  },
  {
    id: "ep4",
    label: "Episode 4",
    blurb: "Before final picks",
    edges: [
      { from: "heesun", to: "subeen", label: "Crossroads" },
      { from: "jaejin", to: "jooyoung", label: "Strong pair" },
      { from: "goeun", to: "sungmin", label: "Unclear" },
      { from: "goeun", to: "heesun", label: "Support" },
      { from: "subeen", to: "sungmin", label: "Awkward" },
      { from: "heesun", to: "sungmin", label: "Distance" },
    ],
  },
  {
    id: "ep5",
    label: "Episode 5 (finale)",
    blurb: "Final choices · post-show",
    edges: [
      { from: "heesun", to: "subeen", label: "On-off" },
      { from: "jaejin", to: "jooyoung", label: "Still dating" },
      { from: "goeun", to: "sungmin", label: "Split" },
      { from: "goeun", to: "subeen", label: "Friends" },
      { from: "jaejin", to: "heesun", label: "Amicable" },
      { from: "jooyoung", to: "sungmin", label: "Closed" },
    ],
  },
];

export function getS5Episode(id: string): EpisodeBoard {
  return S5_EPISODES.find((e) => e.id === id) ?? S5_EPISODES[0];
}
