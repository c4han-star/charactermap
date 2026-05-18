"use client";

import Image from "next/image";
import { Anton, Special_Elite } from "next/font/google";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { toPng } from "html-to-image";
import {
  getS5Episode,
  S5_CHARACTERS_BASE,
  S5_EPISODES,
  type BoardCharacter,
  type BoardEdge,
  type RelationshipEdgeType,
} from "@/data/singlesInfernoS5";

const typewriter = Special_Elite({ subsets: ["latin"], weight: ["400"] });
const posterHead = Anton({ subsets: ["latin"], weight: "400" });

const RED = "#ff0505";

/** Hosts allowed by `next.config` `images.remotePatterns` — other URLs use `<img>`. */
function polaroidSrcUsesNextImageRemoteWhitelist(src: string): boolean {
  return (
    src.startsWith("https://picsum.photos/") ||
    src.startsWith("https://image.tmdb.org/") ||
    src.startsWith("https://upload.wikimedia.org/")
  );
}

function getFullscreenElement(): Element | null {
  const d = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

/** SVG fractal noise — tiled for cast-concrete grit (kept low-contrast). */
const CEMENT_NOISE_DATA_URL =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'><filter id='c'><feTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' seed='7' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#c)'/></svg>`,
  );

/** Base cast-card spec (width drives pin math + fit bbox). */
const POSTER_BASE = { w: 152, header: 25, imgH: 114, pinCy: 9 } as const;

type PosterDims = {
  w: number;
  header: number;
  imgH: number;
  pinCy: number;
};

/** Footer + chrome below photo scales ~with card width; tuned so base matches legacy 252px stack. */
function posterOuterHeight(d: PosterDims): number {
  const footerBlock = Math.round(103 * (d.w / POSTER_BASE.w));
  return 10 + d.header + d.imgH + footerBlock;
}

function characterPosterImportance(
  c: BoardCharacter,
): "primary" | "secondary" | "default" {
  if (c.primary) return "primary";
  const role = (c.role ?? "").toLowerCase();
  if (role.includes("host")) return "secondary";
  return "default";
}

function posterDimsFor(c: BoardCharacter): PosterDims {
  const tier = characterPosterImportance(c);
  const mul = tier === "primary" ? 1.1 : tier === "secondary" ? 0.9 : 1;
  const r = (n: number) => Math.max(28, Math.round(n * mul));
  return {
    w: r(POSTER_BASE.w),
    header: r(POSTER_BASE.header),
    imgH: r(POSTER_BASE.imgH),
    pinCy: r(POSTER_BASE.pinCy),
  };
}

/** Approx. total card height at base width (legacy); used only as fallback when id missing from layout map. */
const POSTER_OUTER_H_REF = posterOuterHeight({
  w: POSTER_BASE.w,
  header: POSTER_BASE.header,
  imgH: POSTER_BASE.imgH,
  pinCy: POSTER_BASE.pinCy,
});

const ZOOM_MIN = 0.35;
const ZOOM_MAX = 1.45;
const FIT_PAD = 32;

function pinXY(
  pos: { x: number; y: number } | undefined,
  dims: Pick<PosterDims, "w" | "pinCy">,
): { x: number; y: number } {
  const px = pos?.x ?? 0;
  const py = pos?.y ?? 0;
  return { x: px + dims.w / 2, y: py + dims.pinCy };
}

function computeFitPanZoom(opts: {
  vpW: number;
  vpH: number;
  layout: Record<string, { x: number; y: number }>;
  variant: "full" | "compact";
  posterBounds: (id: string) => { w: number; outerH: number };
}): { pan: { x: number; y: number }; zoom: number } {
  const { vpW, vpH, layout, variant, posterBounds } = opts;
  const ids = Object.keys(layout);
  if (ids.length === 0 || vpW < 20 || vpH < 20) {
    return { pan: { x: 0, y: 0 }, zoom: 1 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const id of ids) {
    const p = layout[id];
    if (!p) continue;
    const { w: pw, outerH } = posterBounds(id);
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y - 16);
    maxX = Math.max(maxX, p.x + pw + 8);
    maxY = Math.max(maxY, p.y + outerH + 8);
  }
  if (!Number.isFinite(minX)) {
    return { pan: { x: 0, y: 0 }, zoom: 1 };
  }

  if (variant === "full") {
    minY = Math.min(minY, 8);
    maxY = Math.max(maxY, 70);
  }

  const pad = FIT_PAD;
  minX -= pad;
  maxX += pad;
  minY -= pad;
  maxY += pad;

  const bw = Math.max(120, maxX - minX);
  const bh = Math.max(120, maxY - minY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  let z = Math.min((vpW - 12) / bw, (vpH - 12) / bh);
  z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

  return {
    pan: { x: vpW / 2 - z * cx, y: vpH / 2 - z * cy },
    zoom: z,
  };
}

/** Crime-board strings: thin saturated reds (reference), shape = dash / pulse. */
function edgeVisual(
  relType: RelationshipEdgeType | undefined,
): {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  strokeOpacity?: number;
  pulse?: boolean;
  filter?: "rough";
} {
  switch (relType ?? "default") {
    case "romance":
      return { stroke: "#ff2d55", strokeWidth: 1.75 };
    case "betrayal":
      return {
        stroke: "#8b0000",
        strokeWidth: 2.05,
        strokeDasharray: "6 4",
      };
    case "alliance":
      return { stroke: "#b71c1c", strokeWidth: 1.85, strokeDasharray: "1 0" };
    case "crush":
      return {
        stroke: "#ff5252",
        strokeWidth: 1.55,
        strokeDasharray: "9 7",
        strokeOpacity: 0.92,
      };
    case "conflict":
      return { stroke: "#ff0000", strokeWidth: 2.1, pulse: true };
    case "fake_friend":
      return {
        stroke: "#c62828",
        strokeWidth: 1.45,
        strokeDasharray: "2 5",
        strokeOpacity: 0.5,
      };
    case "hidden":
      return {
        stroke: "#4a0000",
        strokeWidth: 1.4,
        strokeDasharray: "4 5",
        strokeOpacity: 0.62,
      };
    default:
      return { stroke: RED, strokeWidth: 1.8 };
  }
}

function relTypeLabel(t: RelationshipEdgeType | undefined): string {
  switch (t ?? "default") {
    case "romance":
      return "Romance";
    case "betrayal":
      return "Betrayal";
    case "alliance":
      return "Alliance";
    case "crush":
      return "Crush";
    case "conflict":
      return "Conflict";
    case "fake_friend":
      return "Shaky";
    case "hidden":
      return "Hidden";
    default:
      return "Link";
  }
}

/** Same 2×3 grid as S5 (wider gaps, centered). */
const GENERIC_CHARACTERS: BoardCharacter[] = [
  {
    id: "a",
    name: "You",
    primary: true,
    note: "POI — links to half the board",
    photoSeed: "inferno-a",
    rotKey: 11,
    x: 274,
    y: 36,
  },
  {
    id: "b",
    name: "Soyeon",
    photoSeed: "inferno-b",
    rotKey: 22,
    x: 514,
    y: 36,
  },
  {
    id: "c",
    name: "Jintaek",
    photoSeed: "inferno-c",
    rotKey: 33,
    x: 754,
    y: 36,
  },
  {
    id: "d",
    name: "Sumin",
    note: "Ep.1 only",
    photoSeed: "inferno-d",
    rotKey: 44,
    x: 274,
    y: 364,
  },
  {
    id: "e",
    name: "Sehoon",
    photoSeed: "inferno-e",
    rotKey: 55,
    x: 514,
    y: 364,
  },
  {
    id: "f",
    name: "Ji-a",
    photoSeed: "inferno-f",
    rotKey: 66,
    x: 754,
    y: 364,
  },
];

const GENERIC_EDGES: BoardEdge[] = [
  { from: "a", to: "b", label: "Mutual pick", relType: "romance" },
  { from: "a", to: "c", label: "Tangled", relType: "conflict" },
  { from: "b", to: "c", label: "Ex-dates", relType: "betrayal" },
  { from: "c", to: "d", label: "Spat", relType: "conflict" },
  { from: "a", to: "e", label: "Crush", relType: "crush" },
  { from: "e", to: "f", label: "Same room", relType: "alliance" },
  { from: "f", to: "a", label: "Old flame", relType: "hidden" },
];

/** Slight tilt only — default view stays readable without manual straightening. */
function hashRot(key: number): number {
  const x = Math.sin(key * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 3.2 - 1.6;
}

function scaleCharacters(base: BoardCharacter[], scale: number): BoardCharacter[] {
  return base.map((c) => ({
    ...c,
    x: c.x * scale,
    y: c.y * scale,
  }));
}

function quadControl(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sagIndex: number,
): Pt {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const h = 18 + (sagIndex % 7) * 4;
  const flip = sagIndex % 2 === 0 ? 1 : -1;
  return {
    x: mx + nx * h * flip,
    y: my + ny * h * flip,
  };
}

function curvePathD(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sagIndex: number,
): string {
  const { x: cx, y: cy } = quadControl(x1, y1, x2, y2, sagIndex);
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

type Pt = { x: number; y: number };

function quadPoint(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function quadTangent(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
    y: 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
  };
}

function labelRotationDeg(dx: number, dy: number): number {
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (deg > 90) deg -= 180;
  if (deg < -90) deg += 180;
  return deg;
}

function buildNeighbors(edges: BoardEdge[]): Record<string, Set<string>> {
  const m: Record<string, Set<string>> = {};
  for (const { from, to } of edges) {
    if (!m[from]) m[from] = new Set();
    if (!m[to]) m[to] = new Set();
    m[from].add(to);
    m[to].add(from);
  }
  return m;
}

type CastBBox = { x: number; y: number; w: number; h: number };

/** True if boxes overlap or edge-to-edge clearance is strictly less than gap. */
function castBoxesTooClose(a: CastBBox, b: CastBBox, gap: number): boolean {
  return !(
    a.x + a.w + gap <= b.x ||
    b.x + b.w + gap <= a.x ||
    a.y + a.h + gap <= b.y ||
    b.y + b.h + gap <= a.y
  );
}

function castBoxInBounds(
  r: CastBBox,
  worldW: number,
  worldH: number,
  pad: number,
): boolean {
  return (
    r.x >= pad &&
    r.y >= pad &&
    r.x + r.w <= worldW - pad &&
    r.y + r.h <= worldH - pad
  );
}

/**
 * Hero anchored at board center; everyone else on one or two elliptical rings with
 * guaranteed clearance vs hero and each other (axis-aligned, no card rotation).
 */
function computeSpacedHeroCastLayout(opts: {
  characters: BoardCharacter[];
  mainCharacterId: string;
  worldW: number;
  worldH: number;
}): Record<string, { x: number; y: number }> {
  const { characters, mainCharacterId, worldW, worldH } = opts;
  const gap = Math.max(52, Math.round(Math.min(worldW, worldH) * 0.042));
  const edge = Math.max(28, Math.round(Math.min(worldW, worldH) * 0.022));

  const hero = characters.find((c) => c.id === mainCharacterId) ?? characters[0];
  const heroDims = posterDimsFor({ ...hero, primary: true });
  const heroH = posterOuterHeight(heroDims);
  const hw = heroDims.w;
  const hh = heroH;

  const hcX = worldW / 2;
  const hcY = worldH / 2;
  const heroTL = { x: Math.round(hcX - hw / 2), y: Math.round(hcY - hh / 2) };
  const heroBox: CastBBox = { x: heroTL.x, y: heroTL.y, w: hw, h: hh };

  const others = characters.filter((c) => c.id !== mainCharacterId);
  if (others.length === 0) {
    return { [hero.id]: heroTL };
  }

  const aspect = worldH / worldW;
  const maxHeroHalf = Math.hypot(hw / 2, hh / 2);
  let minR = maxHeroHalf + gap * 1.25;
  for (const c of others) {
    const d = posterDimsFor(c);
    const oh = posterOuterHeight(d);
    const half = Math.hypot(d.w / 2, oh / 2);
    minR = Math.max(minR, maxHeroHalf + half + gap * 1.1);
  }

  const RStep = Math.max(12, Math.round(Math.min(worldW, worldH) * 0.011));

  function trySingleRing(R: number): Record<string, { x: number; y: number }> | null {
    const out: Record<string, { x: number; y: number }> = {
      [mainCharacterId]: heroTL,
    };
    const boxes: CastBBox[] = [heroBox];
    const n = others.length;
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
      const ccx = hcX + R * Math.cos(ang);
      const ccy = hcY + R * aspect * Math.sin(ang);
      const ch = others[i];
      const d = posterDimsFor(ch);
      const oh = posterOuterHeight(d);
      const x = Math.round(ccx - d.w / 2);
      const y = Math.round(ccy - oh / 2);
      const box: CastBBox = { x, y, w: d.w, h: oh };
      if (!castBoxInBounds(box, worldW, worldH, edge)) return null;
      for (const b of boxes) {
        if (castBoxesTooClose(box, b, gap)) return null;
      }
      boxes.push(box);
      out[ch.id] = { x, y };
    }
    return out;
  }

  for (let k = 0; k < 520; k++) {
    const layout = trySingleRing(minR + k * RStep);
    if (layout) return layout;
  }

  const n1 = Math.ceil(others.length / 2);
  const innerRing = others.slice(0, n1);
  const outerRing = others.slice(n1);
  let maxSpan = 0;
  for (const c of others) {
    const d = posterDimsFor(c);
    const oh = posterOuterHeight(d);
    maxSpan = Math.max(maxSpan, d.w, oh);
  }
  const ringStep = Math.max(maxSpan + gap * 2, minR * 0.35);

  for (let i = 0; i < 220; i++) {
    const Rin = minR + i * (RStep * 0.55);
    for (let j = 0; j < 220; j++) {
      const Rout = Rin + ringStep + j * (RStep * 0.65);
      const boxes: CastBBox[] = [heroBox];
      const out: Record<string, { x: number; y: number }> = {
        [mainCharacterId]: heroTL,
      };
      const placeRing = (
        ring: BoardCharacter[],
        R: number,
        phase: number,
      ): boolean => {
        const m = ring.length;
        for (let k = 0; k < m; k++) {
          const ang = phase + (2 * Math.PI * k) / m;
          const ccx = hcX + R * Math.cos(ang);
          const ccy = hcY + R * aspect * Math.sin(ang);
          const ch = ring[k];
          const d = posterDimsFor(ch);
          const oh = posterOuterHeight(d);
          const x = Math.round(ccx - d.w / 2);
          const y = Math.round(ccy - oh / 2);
          const box: CastBBox = { x, y, w: d.w, h: oh };
          if (!castBoxInBounds(box, worldW, worldH, edge)) return false;
          for (const b of boxes) {
            if (castBoxesTooClose(box, b, gap)) return false;
          }
          boxes.push(box);
          out[ch.id] = { x, y };
        }
        return true;
      };
      const stagger =
        innerRing.length > 0 && outerRing.length > 0
          ? Math.PI / Math.max(innerRing.length, outerRing.length)
          : 0;
      if (!placeRing(innerRing, Rin, -Math.PI / 2)) continue;
      if (!placeRing(outerRing, Rout, -Math.PI / 2 + stagger)) continue;
      return out;
    }
  }

  return Object.fromEntries(
    characters.map((c) =>
      c.id === mainCharacterId
        ? [c.id, heroTL]
        : [c.id, { x: c.x, y: c.y }],
    ),
  );
}

export type OverrideGraphPayload = {
  characters: BoardCharacter[];
  edges: BoardEdge[];
};

export type RelationshipGraphPreviewProps = {
  variant?: "compact" | "full";
  className?: string;
  /** generic = placeholder cast; singles-inferno-s5 = fifth season demo + timeline picker */
  story?: "generic" | "singles-inferno-s5";
  /** When set, replaces built-in episode edges / base character text for this render. */
  overrideGraph?: OverrideGraphPayload | null;
  /** Timeline bar explains AI-sourced edges vs static demo. */
  aiOverlay?: boolean;
};

function RelationshipGraphBoardInner({
  variant = "compact",
  className = "",
  story = "generic",
  overrideGraph = null,
  aiOverlay = false,
}: RelationshipGraphPreviewProps) {
  const gid = useId().replace(/:/g, "");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const scale = variant === "full" ? 1 : 0.82;

  const episodeFromUrl = searchParams.get("episode");
  const validEpisode =
    story === "singles-inferno-s5" &&
    episodeFromUrl &&
    S5_EPISODES.some((e) => e.id === episodeFromUrl)
      ? episodeFromUrl
      : "ep1";

  const [episodeId, setEpisodeId] = useState(validEpisode);

  useEffect(() => {
    setEpisodeId(validEpisode);
  }, [validEpisode]);

  const episode = useMemo(
    () => (story === "singles-inferno-s5" ? getS5Episode(episodeId) : null),
    [story, episodeId],
  );

  const characters = useMemo(() => {
    if (overrideGraph?.characters?.length) {
      return scaleCharacters(overrideGraph.characters, scale);
    }
    const base =
      story === "singles-inferno-s5" ? S5_CHARACTERS_BASE : GENERIC_CHARACTERS;
    return scaleCharacters(base, scale);
  }, [story, scale, overrideGraph]);

  const edges = useMemo(() => {
    if (overrideGraph?.edges?.length) {
      return overrideGraph.edges;
    }
    return story === "singles-inferno-s5" && episode
      ? episode.edges
      : GENERIC_EDGES;
  }, [story, episode, overrideGraph]);

  /** S5 full cast (20) uses a wider / taller logical board than the 6-card generic demo. */
  const s5WideBoard =
    story === "singles-inferno-s5" ||
    Boolean(overrideGraph && overrideGraph.characters.length > 6);
  const worldW = s5WideBoard
    ? (variant === "full" ? 1500 : 1180) * scale
    : (variant === "full" ? 1180 : 920) * scale;
  const worldH = s5WideBoard ? 1200 * scale : 720 * scale;

  /** Packed cast: algorithmic ring layout with guaranteed gaps (generic 6-card demo unchanged). */
  const spacedCastLayout = s5WideBoard || characters.length > 6;

  /** Spotlight card: highest chaosScore, else first `primary` contestant. */
  const mainCharacterId = useMemo(() => {
    let bestId = characters[0]?.id ?? "";
    let bestScore = -1;
    for (const c of characters) {
      const s = c.chaosScore;
      if (typeof s === "number" && s > bestScore) {
        bestScore = s;
        bestId = c.id;
      }
    }
    if (bestScore >= 0) return bestId;
    const p = characters.find((c) => c.primary);
    return p?.id ?? bestId;
  }, [characters]);

  const initialPositions = useMemo(() => {
    if (!spacedCastLayout) {
      return Object.fromEntries(
        characters.map((c) => [c.id, { x: c.x, y: c.y }]),
      );
    }
    return computeSpacedHeroCastLayout({
      characters,
      mainCharacterId,
      worldW,
      worldH,
    });
  }, [characters, mainCharacterId, worldW, worldH, spacedCastLayout]);

  const posterBoundsById = useMemo(() => {
    const m: Record<string, { w: number; outerH: number; dims: PosterDims }> = {};
    for (const c of characters) {
      const dims = posterDimsFor(
        c.id === mainCharacterId ? { ...c, primary: true } : c,
      );
      m[c.id] = {
        w: dims.w,
        outerH: posterOuterHeight(dims),
        dims,
      };
    }
    return m;
  }, [characters, mainCharacterId]);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [positions, setPositions] = useState(initialPositions);
  const positionsRef = useRef(positions);

  const resolvedPositions = useMemo(() => {
    const m: Record<string, { x: number; y: number }> = {};
    for (const c of characters) {
      m[c.id] =
        positions[c.id] ??
        initialPositions[c.id] ?? {
          x: typeof c.x === "number" ? c.x : 40,
          y: typeof c.y === "number" ? c.y : 40,
        };
    }
    return m;
  }, [characters, positions, initialPositions]);

  positionsRef.current = resolvedPositions;

  const viewportRef = useRef<HTMLDivElement | null>(null);

  const applyFitToViewport = useCallback(
    (layout: Record<string, { x: number; y: number }>) => {
      const el = viewportRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vw = r.width;
      const vh = r.height;
      const next = computeFitPanZoom({
        vpW: vw,
        vpH: vh,
        layout,
        variant,
        posterBounds: (id) => {
          const b = posterBoundsById[id];
          return b
            ? { w: b.w, outerH: b.outerH }
            : { w: POSTER_BASE.w, outerH: POSTER_OUTER_H_REF };
        },
      });
      setPan(next.pan);
      setZoom(next.zoom);
    },
    [variant, posterBoundsById],
  );

  useEffect(() => {
    setPositions(initialPositions);
    setSelectedId(null);
    setHoverId(null);
    const scheduleFit = (layout: Record<string, { x: number; y: number }>) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => applyFitToViewport(layout));
      });
    };
    scheduleFit(initialPositions);
    const el = viewportRef.current;
    const ro = new ResizeObserver(() => {
      scheduleFit(positionsRef.current);
    });
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [initialPositions, episodeId, story, overrideGraph, variant, applyFitToViewport]);
  const dragRef = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const panRef = useRef<{
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
  } | null>(null);
  /** Touch points currently down on the board background (not on cards), for two-finger pan. */
  const boardTouchRef = useRef(new Map<number, { x: number; y: number }>());
  const twoFingerPanRef = useRef<{
    origPanX: number;
    origPanY: number;
    startMidX: number;
    startMidY: number;
  } | null>(null);
  /** Removes `window` pointer listeners used for board touch tracking (see attachBoardTouchWindowListeners). */
  const boardTouchWindowCleanupRef = useRef<(() => void) | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const fullscreenFigureRef = useRef<HTMLElement | null>(null);
  const [isBoardFullscreen, setIsBoardFullscreen] = useState(false);

  const rotMap = useMemo(
    () =>
      Object.fromEntries(
        characters.map((c) => [c.id, hashRot(c.rotKey)]),
      ),
    [characters],
  );

  const edgeMeta = useMemo(
    () =>
      edges.map((edge, i) => ({
        ...edge,
        relType: edge.relType ?? "default",
        sag: i * 17 + edge.from.charCodeAt(0),
      })),
    [edges],
  );

  /** TMDB profile URLs keyed by board id (S5 demo only); empty object = fetched, no key. */
  const [s5TmdbImages, setS5TmdbImages] = useState<Record<string, string> | null>(
    null,
  );

  useEffect(() => {
    if (story !== "singles-inferno-s5") {
      setS5TmdbImages(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/tmdb/s5-headshots");
        if (!r.ok) {
          if (!cancelled) setS5TmdbImages({});
          return;
        }
        const data = (await r.json()) as { images?: Record<string, string> };
        if (!cancelled) setS5TmdbImages(data.images ?? {});
      } catch {
        if (!cancelled) setS5TmdbImages({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [story]);

  useEffect(() => {
    const sync = () => {
      const root = fullscreenFigureRef.current;
      setIsBoardFullscreen(Boolean(root && getFullscreenElement() === root));
    };
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggleBoardFullscreen = useCallback(async () => {
    const root = fullscreenFigureRef.current;
    if (!root || variant !== "full") return;
    try {
      const d = document as Document & { webkitExitFullscreen?: () => Promise<void> };
      if (getFullscreenElement() === root) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await d.webkitExitFullscreen?.();
      } else if (root.requestFullscreen) {
        await root.requestFullscreen();
      } else {
        const wk = (root as unknown as { webkitRequestFullscreen?: () => void })
          .webkitRequestFullscreen;
        wk?.();
      }
    } catch {
      // User denied, unsupported, or insecure context.
    }
  }, [variant]);

  const [exporting, setExporting] = useState(false);

  const exportBoardPng = useCallback(async () => {
    if (!boardRef.current || variant !== "full") return;
    setExporting(true);
    try {
      const dataUrl = await toPng(boardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.download = "drama-relationship-board.png";
      a.href = dataUrl;
      a.click();
    } catch {
      // External images (e.g. picsum) may block canvas in some browsers.
    } finally {
      setExporting(false);
    }
  }, [variant]);

  const neighbors = useMemo(() => buildNeighbors(edges), [edges]);

  const showTmdbPhotoCredit = useMemo(() => {
    if (story !== "singles-inferno-s5" || !s5TmdbImages) return false;
    return Object.values(s5TmdbImages).some((u) => {
      if (typeof u !== "string") return false;
      return u.includes("image.tmdb.org");
    });
  }, [story, s5TmdbImages]);

  const setEpisodeInUrl = useCallback(
    (id: string) => {
      setEpisodeId(id);
      const next = new URLSearchParams(searchParams.toString());
      next.set("episode", id);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const attachBoardTouchWindowListeners = useCallback(() => {
    if (boardTouchWindowCleanupRef.current) return;

    const onMove = (ev: PointerEvent) => {
      if (!boardTouchRef.current.has(ev.pointerId)) return;
      boardTouchRef.current.set(ev.pointerId, {
        x: ev.clientX,
        y: ev.clientY,
      });
      const tf = twoFingerPanRef.current;
      if (tf && boardTouchRef.current.size >= 2) {
        const vals = [...boardTouchRef.current.values()];
        const midX = (vals[0].x + vals[1].x) / 2;
        const midY = (vals[0].y + vals[1].y) / 2;
        setPan({
          x: tf.origPanX + (midX - tf.startMidX),
          y: tf.origPanY + (midY - tf.startMidY),
        });
        if (ev.cancelable) ev.preventDefault();
      }
    };

    function detach() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      boardTouchWindowCleanupRef.current = null;
    }

    function onUp(ev: PointerEvent) {
      if (!boardTouchRef.current.has(ev.pointerId)) return;
      boardTouchRef.current.delete(ev.pointerId);
      try {
        boardRef.current?.releasePointerCapture(ev.pointerId);
      } catch {
        /* noop */
      }
      if (boardTouchRef.current.size < 2) {
        twoFingerPanRef.current = null;
      }
      if (boardTouchRef.current.size === 0) {
        detach();
      }
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    boardTouchWindowCleanupRef.current = detach;
  }, []);

  useEffect(
    () => () => {
      boardTouchWindowCleanupRef.current?.();
      boardTouchRef.current.clear();
      twoFingerPanRef.current = null;
    },
    [],
  );

  const onCardPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      const p = resolvedPositions[id];
      setDraggingId(id);
      dragRef.current = {
        id,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origX: p.x,
        origY: p.y,
      };
    },
    [resolvedPositions],
  );

  const onCardPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    dragRef.current = null;
    setDraggingId(null);
  }, []);

  const onBoardPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragRef.current) {
        const { id, startX, startY, origX, origY } = dragRef.current;
        const dx = (e.clientX - startX) / zoom;
        const dy = (e.clientY - startY) / zoom;
        setPositions((prev) => ({
          ...prev,
          [id]: { x: origX + dx, y: origY + dy },
        }));
        return;
      }

      if (panRef.current && boardRef.current) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        setPan({
          x: panRef.current.origPanX + dx,
          y: panRef.current.origPanY + dy,
        });
      }
    },
    [zoom],
  );

  const handleBoardPointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "touch" && panRef.current) {
      panRef.current = null;
    }
  }, []);

  const handleBoardPointerLeave = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    panRef.current = null;
  }, []);

  const onBoardPointerDownBg = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-polaroid]")) return;
      if ((e.target as HTMLElement).closest("[data-episode-bar]")) return;
      if ((e.target as HTMLElement).closest("[data-export-bar]")) return;

      if (e.pointerType === "touch") {
        if (!boardTouchRef.current.has(e.pointerId) && boardTouchRef.current.size >= 2) {
          return;
        }
        boardTouchRef.current.set(e.pointerId, {
          x: e.clientX,
          y: e.clientY,
        });
        attachBoardTouchWindowListeners();
        if (boardTouchRef.current.size >= 2) {
          const pts = [...boardTouchRef.current.values()];
          const midX = (pts[0].x + pts[1].x) / 2;
          const midY = (pts[0].y + pts[1].y) / 2;
          twoFingerPanRef.current = {
            origPanX: pan.x,
            origPanY: pan.y,
            startMidX: midX,
            startMidY: midY,
          };
          panRef.current = null;
        }
        return;
      }

      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origPanX: pan.x,
        origPanY: pan.y,
      };
    },
    [pan.x, pan.y, attachBoardTouchWindowListeners],
  );

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const onWheelNative = (ev: WheelEvent) => {
      if (ev.ctrlKey || ev.metaKey) {
        ev.preventDefault();
        const delta = ev.deltaY > 0 ? -0.08 : 0.08;
        setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)));
        return;
      }
      ev.preventDefault();
      setPan((p) => ({
        x: p.x - ev.deltaX,
        y: p.y - ev.deltaY,
      }));
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, []);

  const selected = selectedId
    ? characters.find((c) => c.id === selectedId)
    : null;

  const neighborEdges = selectedId
    ? edges.filter((e) => e.from === selectedId || e.to === selectedId)
    : [];

  const containerClass =
    variant === "full"
      ? "min-h-[min(88vh,860px)] w-full"
      : "w-full max-w-md";

  const fullscreenFigureClass =
    variant === "full"
      ? "fullscreen:h-[100dvh] fullscreen:max-h-[100dvh] fullscreen:w-full fullscreen:max-w-none fullscreen:rounded-none fullscreen:shadow-none"
      : "";

  const showEpisodeBar = story === "singles-inferno-s5" && variant === "full";

  return (
    <figure
      ref={fullscreenFigureRef}
      className={`group relative flex flex-col overflow-hidden rounded-md border-2 border-zinc-950 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_0_0_1px_rgba(255,255,255,0.04)] ${containerClass} ${fullscreenFigureClass} ${className}`}
      aria-label="Relationship board: cast cards linked by red strings."
    >
      {showEpisodeBar ? (
        <div
          data-episode-bar
          className="relative z-[70] flex flex-col gap-2 border-b border-red-950/60 bg-zinc-950/95 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="min-w-0">
            <p className={`text-[11px] font-medium text-zinc-200 ${typewriter.className}`}>
              {aiOverlay
                ? "This episode’s strings are inferred by the model from public sources — they may differ from the broadcast or your memory; treat the show as canonical."
                : "Timeline — scrub episodes; strings and colors follow the fixed visual system (built-in demo)."}
            </p>
            {episode ? (
              <p className={`mt-0.5 truncate text-[10px] text-red-200/70 ${typewriter.className}`}>
                {episode.label} · {episode.blurb}
              </p>
            ) : null}
          </div>
          <label className={`flex shrink-0 items-center gap-2 text-[11px] text-zinc-400`}>
            <span className={typewriter.className}>Episode</span>
            <select
              value={episodeId}
              onChange={(e) => setEpisodeInUrl(e.target.value)}
              className={`rounded border border-red-900/50 bg-black px-2 py-1.5 text-[12px] text-zinc-100 outline-none focus:border-red-500 ${typewriter.className}`}
            >
              {S5_EPISODES.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <div
        ref={boardRef}
        className="relative flex min-h-0 flex-1 cursor-grab touch-none flex-col active:cursor-grabbing"
        style={{
          backgroundColor: "#2a2c2f",
          backgroundImage: `
            radial-gradient(ellipse 125% 65% at 90% 8%, rgba(230, 236, 242, 0.08) 0%, transparent 40%),
            radial-gradient(ellipse 90% 80% at 8% 92%, rgba(0, 0, 0, 0.32) 0%, transparent 48%),
            radial-gradient(ellipse 70% 55% at 48% 42%, rgba(120, 128, 138, 0.1) 0%, transparent 52%),
            radial-gradient(ellipse 45% 35% at 72% 68%, rgba(0, 0, 0, 0.12) 0%, transparent 50%),
            linear-gradient(176deg, #3c3f44 0%, #32353a 30%, #282a2f 58%, #1c1d21 100%)
          `,
        }}
        onPointerDown={onBoardPointerDownBg}
        onPointerMove={onBoardPointerMove}
        onPointerUp={handleBoardPointerUp}
        onPointerCancel={handleBoardPointerUp}
        onPointerLeave={handleBoardPointerLeave}
      >
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            backgroundImage: `url("${CEMENT_NOISE_DATA_URL}")`,
            backgroundSize: "112px 112px",
            opacity: 0.07,
            mixBlendMode: "soft-light",
          }}
          aria-hidden
        />
        {variant === "full" ? (
          <div
            data-export-bar
            className="pointer-events-auto absolute right-2 top-2 z-[75] flex flex-col items-end gap-1.5"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => void toggleBoardFullscreen()}
              aria-pressed={isBoardFullscreen}
              title={isBoardFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen board"}
              className={`rounded border border-red-700/80 bg-black/90 px-2.5 py-1.5 text-[11px] text-red-50 shadow-lg backdrop-blur-sm transition-colors hover:border-red-400 hover:text-white ${typewriter.className}`}
            >
              {isBoardFullscreen ? "Exit fullscreen" : "Fullscreen"}
            </button>
            <button
              type="button"
              onClick={() => void exportBoardPng()}
              disabled={exporting}
              className={`rounded border border-red-700/80 bg-black/90 px-2.5 py-1.5 text-[11px] text-red-50 shadow-lg backdrop-blur-sm transition-colors hover:border-red-400 hover:text-white disabled:opacity-50 ${typewriter.className}`}
            >
              {exporting ? "Exporting…" : "Export PNG"}
            </button>
          </div>
        ) : null}

        <div
          ref={viewportRef}
          className="relative z-[2] min-h-[280px] flex-1 overflow-hidden sm:min-h-[320px]"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute left-0 top-0 isolate will-change-transform"
              style={{
                width: worldW,
                height: worldH,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
              }}
            >
            <svg
              className="pointer-events-none absolute left-0 top-0 z-[5]"
              width={worldW}
              height={worldH}
              role="presentation"
            >
              <defs>
                <radialGradient id={`${gid}-hub3d`} cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#fff1f2" />
                  <stop offset="35%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#7f1d1d" />
                </radialGradient>
                <filter id={`${gid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="1.2" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Master hub — full board only */}
              {variant === "full" ? (
                <>
                  <g opacity={0.14} stroke="#ff0000" strokeWidth={1}>
                    {characters.map((c) => {
                      const dims = posterBoundsById[c.id]?.dims;
                      const pin = pinXY(
                        resolvedPositions[c.id],
                        dims ?? { w: POSTER_BASE.w, pinCy: POSTER_BASE.pinCy },
                      );
                      return (
                        <line
                          key={`hubline-${c.id}`}
                          x1={worldW / 2}
                          y1={46}
                          x2={pin.x}
                          y2={pin.y}
                        />
                      );
                    })}
                  </g>
                  <circle
                    cx={worldW / 2}
                    cy={46}
                    r={11}
                    fill={`url(#${gid}-hub3d)`}
                    stroke="#1a0505"
                    strokeWidth={1.5}
                    filter={`url(#${gid}-glow)`}
                  />
                  <circle cx={worldW / 2} cy={46} r={3.5} fill="#fff5f5" opacity="0.35" />
                </>
              ) : null}
              {edgeMeta.map(({ from, to, sag, relType }, i) => {
                const pA = resolvedPositions[from];
                const pB = resolvedPositions[to];
                if (!pA || !pB) return null;
                const dFrom =
                  posterBoundsById[from]?.dims ?? {
                    w: POSTER_BASE.w,
                    pinCy: POSTER_BASE.pinCy,
                  };
                const dTo =
                  posterBoundsById[to]?.dims ?? {
                    w: POSTER_BASE.w,
                    pinCy: POSTER_BASE.pinCy,
                  };
                const pin1 = pinXY(pA, dFrom);
                const pin2 = pinXY(pB, dTo);
                const touchesHover =
                  hoverId &&
                  (hoverId === from || hoverId === to);
                const active = Boolean(touchesHover);
                const dimEdge = Boolean(hoverId && !touchesHover);
                const path = curvePathD(pin1.x, pin1.y, pin2.x, pin2.y, sag);
                const ev = edgeVisual(relType);
                const baseOpacity = ev.strokeOpacity ?? 1;
                const strokeOpacity = dimEdge ? 0.22 : baseOpacity;
                const wActive = active ? ev.strokeWidth + 0.45 : ev.strokeWidth;
                return (
                  <path
                    key={`${from}-${to}-${i}-${episodeId}`}
                    d={path}
                    fill="none"
                    stroke={ev.stroke}
                    strokeWidth={wActive}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={ev.strokeDasharray}
                    strokeOpacity={strokeOpacity}
                    className={ev.pulse && !dimEdge ? "path-edge-pulse" : undefined}
                  />
                );
              })}
            </svg>

            <svg
              className="pointer-events-none absolute left-0 top-0 z-[18]"
              width={worldW}
              height={worldH}
              role="presentation"
            >
              <defs>
                <filter id={`${gid}-labelShadow`} x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.55" />
                </filter>
              </defs>
              {edgeMeta.map(({ from, to, label, sag }, i) => {
                const pA = resolvedPositions[from];
                const pB = resolvedPositions[to];
                if (!pA || !pB) return null;
                const dFrom =
                  posterBoundsById[from]?.dims ?? {
                    w: POSTER_BASE.w,
                    pinCy: POSTER_BASE.pinCy,
                  };
                const dTo =
                  posterBoundsById[to]?.dims ?? {
                    w: POSTER_BASE.w,
                    pinCy: POSTER_BASE.pinCy,
                  };
                const pin1 = pinXY(pA, dFrom);
                const pin2 = pinXY(pB, dTo);
                const touchesHover =
                  hoverId &&
                  (hoverId === from || hoverId === to);
                const active = Boolean(touchesHover);
                const dimEdge = Boolean(hoverId && !touchesHover);
                const ctl = quadControl(pin1.x, pin1.y, pin2.x, pin2.y, sag);
                const p0: Pt = pin1;
                const pC: Pt = ctl;
                const p2: Pt = pin2;
                const mid = quadPoint(p0, pC, p2, 0.52);
                const tang = quadTangent(p0, pC, p2, 0.52);
                const angle = labelRotationDeg(tang.x, tang.y);
                const fs =
                  label.length > 24 ? 12 : label.length > 16 ? 13 : 14;
                const padX = 10;
                const padY = 6;
                const rectW = Math.min(
                  280,
                  Math.max(44, label.length * fs * 0.58 + padX * 2),
                );
                const rectH = fs + padY * 2;
                const rx = 5;
                const labelOpacity = dimEdge ? 0.35 : active ? 1 : 0.95;
                return (
                  <g
                    key={`edge-label-${from}-${to}-${i}-${episodeId}`}
                    opacity={labelOpacity}
                    transform={`rotate(${angle}, ${mid.x}, ${mid.y})`}
                  >
                    <rect
                      x={mid.x - rectW / 2}
                      y={mid.y - rectH / 2}
                      width={rectW}
                      height={rectH}
                      rx={rx}
                      ry={rx}
                      fill="rgba(6, 6, 8, 0.92)"
                      stroke="rgba(220, 38, 38, 0.55)"
                      strokeWidth={1}
                      filter={`url(#${gid}-labelShadow)`}
                    />
                    <text
                      x={mid.x}
                      y={mid.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#f8fafc"
                      style={{
                        fontFamily:
                          "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
                        fontSize: fs,
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>

            <svg
              className="pointer-events-none absolute left-0 top-0 z-[22]"
              width={worldW}
              height={worldH}
              role="presentation"
            >
              <defs>
                <linearGradient id={`${gid}-pinHead`} x1="18%" y1="12%" x2="88%" y2="92%">
                  <stop offset="0%" stopColor="#b35663" />
                  <stop offset="35%" stopColor="#7a2e38" />
                  <stop offset="100%" stopColor="#3d1519" />
                </linearGradient>
                <linearGradient id={`${gid}-pinHeadHero`} x1="12%" y1="8%" x2="92%" y2="95%">
                  <stop offset="0%" stopColor="#fde68a" />
                  <stop offset="45%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
                <filter id={`${gid}-pinHover`} x="-35%" y="-35%" width="170%" height="170%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.8" floodColor="#000" floodOpacity="0.35" />
                </filter>
              </defs>
              {characters.map((c) => {
                const dims =
                  posterBoundsById[c.id]?.dims ?? {
                    w: POSTER_BASE.w,
                    pinCy: POSTER_BASE.pinCy,
                  };
                const pin = pinXY(resolvedPositions[c.id], dims);
                const pinScale = dims.w / POSTER_BASE.w;
                const hl =
                  hoverId &&
                  (hoverId === c.id || neighbors[hoverId]?.has(c.id));
                const isHeroPin = c.id === mainCharacterId;
                const rx = (hl ? 4.85 : 4.35) * pinScale;
                const ry = (hl ? 3.15 : 2.85) * pinScale;
                return (
                  <g
                    key={`pin-${c.id}`}
                    filter={hl ? `url(#${gid}-pinHover)` : undefined}
                  >
                    {/* metal needle — slightly offset so string anchor stays readable */}
                    <line
                      x1={pin.x}
                      y1={pin.y}
                      x2={pin.x + 0.4}
                      y2={pin.y + 10.5}
                      stroke="#1a1b1f"
                      strokeWidth={1.25}
                      strokeLinecap="round"
                      opacity={0.55}
                    />
                    <line
                      x1={pin.x}
                      y1={pin.y}
                      x2={pin.x + 0.25}
                      y2={pin.y + 10}
                      stroke="#8b8c94"
                      strokeWidth={0.55}
                      strokeLinecap="round"
                      opacity={0.85}
                    />
                    <ellipse
                      cx={pin.x}
                      cy={pin.y - 2.65}
                      rx={rx}
                      ry={ry}
                      fill={
                        isHeroPin
                          ? `url(#${gid}-pinHeadHero)`
                          : `url(#${gid}-pinHead)`
                      }
                      stroke={isHeroPin ? "#92400e" : "#241014"}
                      strokeWidth={0.42}
                    />
                    <ellipse
                      cx={pin.x - 1.25}
                      cy={pin.y - 4.1}
                      rx={1.05}
                      ry={0.52}
                      fill="#f4f4f5"
                      opacity={hl ? 0.26 : 0.16}
                    />
                  </g>
                );
              })}
            </svg>

            {characters.map((c) => {
              const pos = resolvedPositions[c.id];
              const isHero = c.id === mainCharacterId;
              const rot = (spacedCastLayout || isHero) ? 0 : rotMap[c.id];
              const dims =
                posterBoundsById[c.id]?.dims ?? {
                  w: POSTER_BASE.w,
                  header: POSTER_BASE.header,
                  imgH: POSTER_BASE.imgH,
                  pinCy: POSTER_BASE.pinCy,
                };
              const { w, header, imgH } = dims;
              const ty = w / POSTER_BASE.w;
              const hl =
                hoverId &&
                (hoverId === c.id || neighbors[hoverId]?.has(c.id));
              const dim =
                hoverId && !hl && hoverId !== c.id ? 0.38 : 1;
              const cardFilter =
                hl && isHero
                  ? "drop-shadow(0 0 28px rgba(255,0,0,0.45)) drop-shadow(0 0 26px rgba(251,191,36,0.65))"
                  : hl
                    ? "drop-shadow(0 0 28px rgba(255,0,0,0.45))"
                    : isHero
                      ? "drop-shadow(0 0 36px rgba(251,191,36,0.88)) drop-shadow(0 16px 34px rgba(0,0,0,0.78))"
                      : "drop-shadow(0 14px 28px rgba(0,0,0,0.75))";
              const overrideSrc = c.photoUrl?.trim() || null;
              const tmdbSrc =
                story === "singles-inferno-s5" && s5TmdbImages?.[c.id]
                  ? s5TmdbImages[c.id]
                  : null;
              const polaroidSrc =
                overrideSrc ??
                tmdbSrc ??
                `https://picsum.photos/seed/${c.photoSeed}/${Math.round(w * 2)}/${Math.round(imgH * 2)}`;

              return (
                <div
                  key={c.id}
                  data-polaroid
                  className="absolute select-none"
                  style={{
                    left: pos.x,
                    top: pos.y,
                    transform: `rotate(${rot}deg)`,
                    zIndex: draggingId === c.id ? 50 : 12,
                    opacity: dim,
                    transition: "opacity 0.2s ease",
                  }}
                  onPointerDown={(e) => onCardPointerDown(e, c.id)}
                  onPointerUp={onCardPointerUp}
                  onPointerCancel={onCardPointerUp}
                  onMouseEnter={() => setHoverId(c.id)}
                  onMouseLeave={() =>
                    setHoverId((h) => (h === c.id ? null : h))
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId((s) => (s === c.id ? null : c.id));
                  }}
                >
                  <div
                    className="relative cursor-grab font-sans active:cursor-grabbing"
                    style={{
                      width: w,
                      filter: cardFilter,
                    }}
                  >
                    <div
                      className={
                        isHero
                          ? "relative border-[6px] border-amber-400 bg-gradient-to-b from-amber-50 via-white to-amber-50 shadow-[0_20px_48px_rgba(146,64,14,0.45)]"
                          : "relative border-[5px] border-white bg-white shadow-[0_16px_40px_rgba(0,0,0,0.9)]"
                      }
                      style={{
                        boxShadow: isHero
                          ? "inset 0 0 0 2px rgba(251,191,36,0.55), 0 20px 52px rgba(0,0,0,0.82)"
                          : "inset 0 0 0 1px rgba(0,0,0,0.08), 0 18px 48px rgba(0,0,0,0.85)",
                      }}
                    >
                      <div
                        className={
                          isHero
                            ? `bg-gradient-to-b from-amber-100 to-amber-50/95 pb-0.5 pt-1 text-center ${posterHead.className}`
                            : `bg-white pb-0.5 pt-1 text-center ${posterHead.className}`
                        }
                        style={{ minHeight: header }}
                      >
                        <div
                          className="leading-none text-black"
                          style={{ fontSize: `${Math.round(21 * ty)}px` }}
                        >
                          CAST
                        </div>
                        <div
                          className="mt-0.5 font-semibold tracking-[0.22em] text-neutral-700"
                          style={{ fontSize: `${Math.max(5, Math.round(6.5 * ty))}px` }}
                        >
                          RELATIONSHIP MAP
                        </div>
                      </div>

                      <div
                        className={
                          isHero
                            ? "relative mx-1.5 mb-1 overflow-hidden bg-neutral-950 ring-2 ring-amber-500/90"
                            : "relative mx-1.5 mb-1 overflow-hidden bg-neutral-950 ring-1 ring-neutral-800"
                        }
                        style={{ height: imgH }}
                      >
                        {polaroidSrcUsesNextImageRemoteWhitelist(polaroidSrc) ? (
                        <Image
                          src={polaroidSrc}
                          alt=""
                          width={w}
                          height={imgH}
                          className="h-full w-full object-cover"
                          style={{
                            filter:
                              "grayscale(1) contrast(1.25) brightness(0.88) saturate(0.85)",
                          }}
                          draggable={false}
                          unoptimized
                        />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element -- arbitrary image CDNs (e.g. Google CSE)
                          <img
                            src={polaroidSrc}
                            alt=""
                            width={Math.round(w)}
                            height={Math.round(imgH)}
                            className="h-full w-full object-cover"
                            style={{
                              filter:
                                "grayscale(1) contrast(1.25) brightness(0.88) saturate(0.85)",
                            }}
                            draggable={false}
                            referrerPolicy="no-referrer"
                          />
                        )}
                        {c.id === mainCharacterId ? (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div
                              className="-rotate-[14deg] border-[3px] border-red-700 px-2 py-1 text-center font-black uppercase leading-[1.05] tracking-[0.12em] text-red-600 opacity-[0.92] shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                              style={{
                                borderStyle: "double",
                                fontSize: `${Math.max(7, Math.round(9 * ty))}px`,
                              }}
                            >
                              <span className="block">MAIN</span>
                              <span className="mt-0.5 block">CHARACTER</span>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div
                        className={
                          isHero
                            ? "flex flex-col border-t border-amber-300 bg-amber-50/95 px-2 py-1.5"
                            : "flex flex-col border-t border-neutral-300 bg-neutral-100 px-2 py-1.5"
                        }
                        style={{ minHeight: Math.round(76 * ty) }}
                      >
                        <p
                          className="text-center font-bold uppercase leading-tight tracking-[0.12em] text-neutral-950"
                          style={{ fontSize: `${Math.max(8, Math.round(10 * ty))}px` }}
                        >
                          {c.name}
                        </p>
                        <div
                          className={`mt-1 flex min-h-[30px] flex-col justify-start space-y-0.5 text-center ${typewriter.className}`}
                        >
                          {c.role ? (
                            <p
                              className="uppercase tracking-wider text-red-900/80"
                              style={{ fontSize: `${Math.max(7, Math.round(8 * ty))}px` }}
                            >
                              {c.role}
                            </p>
                          ) : (
                            <span className="block min-h-[10px]" aria-hidden />
                          )}
                          {c.chaosScore != null ? (
                            <p
                              className="text-neutral-700"
                              style={{ fontSize: `${Math.max(7, Math.round(9 * ty))}px` }}
                            >
                              THREAT INDEX {c.chaosScore}
                            </p>
                          ) : (
                            <span className="block min-h-[11px]" aria-hidden />
                          )}
                        </div>
                        <div className="mt-1 min-h-[22px] border-t border-neutral-200/90 pt-1">
                          {c.note ? (
                            <p
                              className={`line-clamp-2 text-left leading-snug text-neutral-600 ${typewriter.className}`}
                              style={{ fontSize: `${Math.max(6, Math.round(7 * ty))}px` }}
                            >
                              {c.note}
                            </p>
                          ) : (
                            <span className="block min-h-[14px]" aria-hidden />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {selected && (
          <div
            className="pointer-events-auto absolute bottom-3 right-3 max-w-[min(100%-1.5rem,300px)] rounded-md border border-red-900/50 bg-black/95 p-3 text-left shadow-xl shadow-black/80 backdrop-blur-sm"
            style={{ color: "#f4f4f5" }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <p className={`text-lg font-semibold uppercase tracking-wide text-white ${posterHead.className}`}>
              {selected.name}
            </p>
            <p className={`mt-1 text-[11px] text-zinc-400 ${typewriter.className}`}>
              {selected.role ? (
                <span className="block text-red-200/90">{selected.role}</span>
              ) : null}
              {selected.chaosScore != null ? (
                <span className="block">Threat index {selected.chaosScore}</span>
              ) : null}
              <span className="mt-1 block">
                {(neighbors[selected.id]?.size ?? 0)} string
                {(neighbors[selected.id]?.size ?? 0) === 1 ? "" : "s"}{" "}
                {story === "singles-inferno-s5" ? "(this episode)." : "on the board."}
              </span>
            </p>
            {neighborEdges.length > 0 ? (
              <ul className={`mt-2 space-y-1 border-t border-red-950/60 pt-2 text-[10px] text-zinc-300 ${typewriter.className}`}>
                {neighborEdges.map((e) => {
                  const other = e.from === selected.id ? e.to : e.from;
                  const otherName = characters.find((x) => x.id === other)?.name ?? other;
                  return (
                    <li key={`${e.from}-${e.to}`}>
                      → {otherName} ({relTypeLabel(e.relType)}): {e.label}
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {selected.note ? (
              <p className={`mt-2 text-[10px] text-zinc-500 ${typewriter.className}`}>
                Note: {selected.note}
              </p>
            ) : null}
            <button
              type="button"
              className="mt-2 text-[10px] uppercase tracking-wider text-red-400 underline-offset-2 hover:underline"
              onClick={() => setSelectedId(null)}
            >
              Close
            </button>
          </div>
        )}

        <figcaption className="pointer-events-none relative z-[60] border-t border-red-950/40 bg-black/80 px-3 py-2 text-[10px] leading-snug text-zinc-500 sm:text-[11px]">
          <span className={typewriter.className}>
            Relationship board · Fullscreen · cast cards · drag cards · pan background · two-finger on touch screen, or two-finger trackpad scroll on canvas · Ctrl/⌘ + scroll to zoom ·
            red strings = ties (dash / pulse encode type) · edge labels on dark pills · full preview adds
            hub pin + faint radial lines · AI only supplies JSON when enabled
          </span>
          {showTmdbPhotoCredit ? (
            <span className={`mt-1.5 block ${typewriter.className}`}>
              Cast photos:{" "}
              <a
                href="https://www.themoviedb.org/"
                target="_blank"
                rel="noreferrer"
                className="pointer-events-auto text-zinc-400 underline decoration-zinc-600 underline-offset-2 hover:text-zinc-300"
              >
                TMDB
              </a>{" "}
              (API; not endorsed by TMDB).
            </span>
          ) : null}
        </figcaption>
      </div>
    </figure>
  );
}

function BoardSkeleton({ variant }: { variant?: "compact" | "full" }) {
  return (
    <div
      className={
        variant === "full"
          ? "min-h-[min(88vh,860px)] w-full animate-pulse rounded-md border-2 border-zinc-950 bg-gradient-to-br from-[#3c3f44] via-[#2a2c30] to-[#1a1b1e]"
          : "h-[380px] w-full max-w-md animate-pulse rounded-md border-2 border-zinc-950 bg-gradient-to-br from-[#3c3f44] via-[#2a2c30] to-[#1a1b1e]"
      }
      aria-hidden
    />
  );
}

export function RelationshipGraphPreview(props: RelationshipGraphPreviewProps) {
  return (
    <Suspense fallback={<BoardSkeleton variant={props.variant} />}>
      <RelationshipGraphBoardInner {...props} />
    </Suspense>
  );
}
