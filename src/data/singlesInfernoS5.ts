/**
 * Single's Inferno Season 5 — relationship graph demo data.
 *
 * Includes the full on-camera line-up: **5 hosts + 15 singles** (public cast lists).
 * Coordinates are a 5×4 grid on a 1500×1200 logical board. Edges are **illustrative**
 * demo beats per episode, not transcripts. AI (when enabled) must only use ids from
 * `S5_CHARACTER_IDS` for edges.
 */

/** Maps to the fixed edge visual system in RelationshipGraphPreview. */
export type RelationshipEdgeType =
  | "romance"
  | "betrayal"
  | "alliance"
  | "crush"
  | "conflict"
  | "fake_friend"
  | "hidden"
  | "default";

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
  /** 0–100 “how much plot energy” — dossier feel */
  chaosScore?: number;
  /** Short dossier line, e.g. conflict center */
  role?: string;
  /** Real performer name (optional); improves TMDB cast / person photo when `name` is a fictional role. */
  actorName?: string;
  /** Resolved headshot URL (custom cast / TMDB); when set, overrides picsum + S5 TMDB map. */
  photoUrl?: string;
};

export type BoardEdge = {
  from: string;
  to: string;
  /** Short relationship hint on the string */
  label: string;
  /** Drives stroke color, weight, dash, motion in the fixed renderer */
  relType?: RelationshipEdgeType;
};

export type EpisodeBoard = {
  id: string;
  /** Shown in timeline picker */
  label: string;
  blurb: string;
  edges: BoardEdge[];
};

/** Fixed node ids — AI / imports must only reference these for S5 edges. */
export const S5_CHARACTER_IDS = [
  "hongjin",
  "kyuhyun",
  "dahee",
  "hanhae",
  "dex",
  "heesun",
  "goeun",
  "yejin",
  "mingee",
  "minasue",
  "subeen",
  "jooyoung",
  "haeun",
  "hyunjae",
  "seungil",
  "hyeonwoo",
  "jaejin",
  "sungmin",
  "sunghun",
  "igeon",
] as const;

export type S5CharacterId = (typeof S5_CHARACTER_IDS)[number];

/**
 * Optional: map a fixed board `id` to a TMDB **person** id (number in the person profile URL)
 * when automatic name matching picks the wrong contestant, or TMDB has no usable photo under another spelling.
 * Example: open themoviedb.org/person/12345 → use `12345`.
 */
export const S5_TMDB_PERSON_ID_OVERRIDES: Partial<Record<S5CharacterId, number>> =
  {};

/** 5×4 grid: row 0 hosts, rows 1–3 singles (left→right, top→bottom). */
export const S5_CHARACTERS_BASE: BoardCharacter[] = [
  {
    id: "hongjin",
    name: "Hong Jin-kyung",
    role: "Host",
    chaosScore: 42,
    photoSeed: "s5-hongjin",
    rotKey: 1,
    x: 40,
    y: 36,
  },
  {
    id: "kyuhyun",
    name: "KYUHYUN",
    role: "Host",
    chaosScore: 44,
    photoSeed: "s5-kyuhyun",
    rotKey: 2,
    x: 358,
    y: 36,
  },
  {
    id: "dahee",
    name: "Lee Da-hee",
    role: "Host",
    chaosScore: 41,
    photoSeed: "s5-dahee",
    rotKey: 3,
    x: 676,
    y: 36,
  },
  {
    id: "hanhae",
    name: "HANHAE",
    role: "Host",
    chaosScore: 46,
    photoSeed: "s5-hanhae",
    rotKey: 4,
    x: 994,
    y: 36,
  },
  {
    id: "dex",
    name: "Dex",
    role: "Host · S2 alum",
    chaosScore: 48,
    photoSeed: "s5-dex",
    rotKey: 5,
    x: 1312,
    y: 36,
  },
  {
    id: "heesun",
    name: "Park Hee-sun",
    primary: true,
    note: "S5 · full cast board",
    role: "Contestant",
    chaosScore: 88,
    photoSeed: "s5-heesun",
    rotKey: 11,
    x: 40,
    y: 324,
  },
  {
    id: "goeun",
    name: "Kim Go-eun",
    role: "Contestant",
    chaosScore: 72,
    photoSeed: "s5-goeun",
    rotKey: 12,
    x: 358,
    y: 324,
  },
  {
    id: "yejin",
    name: "Ham Ye-jin",
    role: "Contestant",
    chaosScore: 68,
    photoSeed: "s5-yejin",
    rotKey: 13,
    x: 676,
    y: 324,
  },
  {
    id: "mingee",
    name: "Kim Min-gee",
    role: "Contestant",
    chaosScore: 79,
    photoSeed: "s5-mingee",
    rotKey: 14,
    x: 994,
    y: 324,
  },
  {
    id: "minasue",
    name: "Choi Mina-sue",
    role: "Contestant",
    chaosScore: 74,
    photoSeed: "s5-minasue",
    rotKey: 15,
    x: 1312,
    y: 324,
  },
  {
    id: "subeen",
    name: "Lim Su-been",
    role: "Contestant",
    chaosScore: 76,
    photoSeed: "s5-subeen",
    rotKey: 21,
    x: 40,
    y: 612,
  },
  {
    id: "jooyoung",
    name: "Lee Joo-young",
    role: "Contestant",
    chaosScore: 71,
    photoSeed: "s5-jooyoung",
    rotKey: 22,
    x: 358,
    y: 612,
  },
  {
    id: "haeun",
    name: "Lee Ha-eun",
    role: "Contestant · late entry",
    chaosScore: 70,
    photoSeed: "s5-haeun",
    rotKey: 23,
    x: 676,
    y: 612,
  },
  {
    id: "hyunjae",
    name: "Youn Hyun-jae",
    role: "Contestant",
    chaosScore: 73,
    photoSeed: "s5-hyunjae",
    rotKey: 24,
    x: 994,
    y: 612,
  },
  {
    id: "seungil",
    name: "Song Seung-il",
    role: "Contestant",
    chaosScore: 67,
    photoSeed: "s5-seungil",
    rotKey: 25,
    x: 1312,
    y: 612,
  },
  {
    id: "hyeonwoo",
    name: "Shin Hyeon-woo",
    role: "Contestant",
    chaosScore: 75,
    photoSeed: "s5-hyeonwoo",
    rotKey: 31,
    x: 40,
    y: 900,
  },
  {
    id: "jaejin",
    name: "Kim Jae-jin",
    role: "Contestant",
    chaosScore: 62,
    photoSeed: "s5-jaejin",
    rotKey: 32,
    x: 358,
    y: 900,
  },
  {
    id: "sungmin",
    name: "Woo Sung-min",
    role: "Contestant",
    chaosScore: 84,
    photoSeed: "s5-sungmin",
    rotKey: 33,
    x: 676,
    y: 900,
  },
  {
    id: "sunghun",
    name: "Lee Sung-hun",
    role: "Contestant",
    chaosScore: 69,
    photoSeed: "s5-sunghun",
    rotKey: 34,
    x: 994,
    y: 900,
  },
  {
    id: "igeon",
    name: "Jo I-geon",
    role: "Contestant",
    chaosScore: 66,
    photoSeed: "s5-igeon",
    rotKey: 35,
    x: 1312,
    y: 900,
  },
];

export const S5_EPISODES: EpisodeBoard[] = [
  {
    id: "ep1",
    label: "Episode 1",
    blurb: "First impressions",
    edges: [
      { from: "heesun", to: "subeen", label: "Romantic interest", relType: "romance" },
      { from: "jaejin", to: "jooyoung", label: "Good chemistry", relType: "romance" },
      { from: "goeun", to: "hyunjae", label: "Curious", relType: "crush" },
      { from: "yejin", to: "seungil", label: "Icebreaker", relType: "default" },
      { from: "mingee", to: "hyeonwoo", label: "Athlete banter", relType: "alliance" },
      { from: "minasue", to: "sungmin", label: "Noticed", relType: "crush" },
      { from: "haeun", to: "igeon", label: "Late arrivals", relType: "hidden" },
      { from: "hongjin", to: "heesun", label: "Panel tease", relType: "alliance" },
      { from: "kyuhyun", to: "goeun", label: "Commentary", relType: "default" },
      { from: "dahee", to: "subeen", label: "Shipping energy", relType: "default" },
      { from: "hanhae", to: "sungmin", label: "Jokes", relType: "default" },
      { from: "dex", to: "jooyoung", label: "Veteran read", relType: "alliance" },
    ],
  },
  {
    id: "ep2",
    label: "Episode 2",
    blurb: "Letters & tension",
    edges: [
      { from: "heesun", to: "subeen", label: "Circling", relType: "romance" },
      { from: "jaejin", to: "jooyoung", label: "Heating up", relType: "romance" },
      { from: "goeun", to: "sunghun", label: "New line", relType: "crush" },
      { from: "yejin", to: "hyeonwoo", label: "Friction", relType: "conflict" },
      { from: "mingee", to: "haeun", label: "Support", relType: "alliance" },
      { from: "minasue", to: "jaejin", label: "Awkward overlap", relType: "fake_friend" },
      { from: "hyunjae", to: "seungil", label: "Bros", relType: "alliance" },
      { from: "seungil", to: "subeen", label: "Glances", relType: "crush" },
      { from: "hongjin", to: "dex", label: "Host chemistry", relType: "alliance" },
      { from: "kyuhyun", to: "yejin", label: "Playful roast", relType: "default" },
      { from: "dahee", to: "mingee", label: "Girl talk", relType: "alliance" },
      { from: "hanhae", to: "igeon", label: "Competitive vibe", relType: "conflict" },
    ],
  },
  {
    id: "ep3",
    label: "Episode 3",
    blurb: "Inferno pressure",
    edges: [
      { from: "heesun", to: "subeen", label: "Push-pull", relType: "romance" },
      { from: "jaejin", to: "jooyoung", label: "Mutual pull", relType: "romance" },
      { from: "goeun", to: "sungmin", label: "Uncertain", relType: "crush" },
      { from: "goeun", to: "jaejin", label: "New angle", relType: "hidden" },
      { from: "heesun", to: "jaejin", label: "Cordial", relType: "alliance" },
      { from: "sungmin", to: "jooyoung", label: "Tension", relType: "conflict" },
      { from: "hyeonwoo", to: "seungil", label: "Rival energy", relType: "conflict" },
      { from: "minasue", to: "haeun", label: "Alliance", relType: "alliance" },
      { from: "yejin", to: "hyunjae", label: "Curious", relType: "crush" },
      { from: "hongjin", to: "minasue", label: "Panel hype", relType: "default" },
      { from: "dahee", to: "heesun", label: "Empathy", relType: "alliance" },
      { from: "dex", to: "sunghun", label: "Side-eye", relType: "fake_friend" },
    ],
  },
  {
    id: "ep4",
    label: "Episode 4",
    blurb: "Before final picks",
    edges: [
      { from: "heesun", to: "subeen", label: "Crossroads", relType: "romance" },
      { from: "jaejin", to: "jooyoung", label: "Strong pair", relType: "alliance" },
      { from: "goeun", to: "sungmin", label: "Unclear", relType: "crush" },
      { from: "goeun", to: "heesun", label: "Support", relType: "alliance" },
      { from: "subeen", to: "sungmin", label: "Awkward", relType: "conflict" },
      { from: "heesun", to: "sungmin", label: "Distance", relType: "betrayal" },
      { from: "mingee", to: "hyunjae", label: "Respect", relType: "alliance" },
      { from: "igeon", to: "haeun", label: "Late-game spark", relType: "romance" },
      { from: "sunghun", to: "yejin", label: "Quiet line", relType: "hidden" },
      { from: "kyuhyun", to: "jaejin", label: "Advice", relType: "default" },
      { from: "hanhae", to: "hyeonwoo", label: "Banter", relType: "default" },
      { from: "hongjin", to: "seungil", label: "Laugh track", relType: "default" },
    ],
  },
  {
    id: "ep5",
    label: "Episode 5 (finale)",
    blurb: "Final choices · post-show",
    edges: [
      { from: "heesun", to: "subeen", label: "On-off", relType: "romance" },
      { from: "jaejin", to: "jooyoung", label: "Still dating", relType: "alliance" },
      { from: "goeun", to: "sungmin", label: "Split", relType: "betrayal" },
      { from: "goeun", to: "subeen", label: "Friends", relType: "alliance" },
      { from: "jaejin", to: "heesun", label: "Amicable", relType: "default" },
      { from: "jooyoung", to: "sungmin", label: "Closed", relType: "conflict" },
      { from: "hyunjae", to: "mingee", label: "Mutual respect", relType: "alliance" },
      { from: "haeun", to: "igeon", label: "Open question", relType: "crush" },
      { from: "dex", to: "dahee", label: "Host wrap", relType: "alliance" },
      { from: "hongjin", to: "minasue", label: "Final roast", relType: "default" },
      { from: "sunghun", to: "hyeonwoo", label: "Handshake", relType: "default" },
      { from: "seungil", to: "yejin", label: "Soft landing", relType: "default" },
    ],
  },
];

export function getS5Episode(id: string): EpisodeBoard {
  return S5_EPISODES.find((e) => e.id === id) ?? S5_EPISODES[0];
}
