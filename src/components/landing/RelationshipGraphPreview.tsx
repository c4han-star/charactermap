"use client";

import Image from "next/image";
import { Caveat, Special_Elite } from "next/font/google";
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
import {
  getS5Episode,
  S5_CHARACTERS_BASE,
  S5_EPISODES,
  type BoardCharacter,
  type BoardEdge,
} from "@/data/singlesInfernoS5";

const handwritten = Caveat({ subsets: ["latin"], weight: ["400", "600"] });
const typewriter = Special_Elite({ subsets: ["latin"], weight: ["400"] });

const RED = "#ff2d2d";

const GENERIC_CHARACTERS: BoardCharacter[] = [
  {
    id: "a",
    name: "You",
    primary: true,
    note: "POI — links to half the board",
    photoSeed: "inferno-a",
    rotKey: 11,
    x: 420,
    y: 260,
  },
  {
    id: "b",
    name: "Soyeon",
    photoSeed: "inferno-b",
    rotKey: 22,
    x: 580,
    y: 120,
  },
  {
    id: "c",
    name: "Jintaek",
    photoSeed: "inferno-c",
    rotKey: 33,
    x: 640,
    y: 320,
  },
  {
    id: "d",
    name: "Sumin",
    note: "Ep.1 only",
    photoSeed: "inferno-d",
    rotKey: 44,
    x: 520,
    y: 460,
  },
  {
    id: "e",
    name: "Sehoon",
    photoSeed: "inferno-e",
    rotKey: 55,
    x: 240,
    y: 380,
  },
  {
    id: "f",
    name: "Ji-a",
    photoSeed: "inferno-f",
    rotKey: 66,
    x: 180,
    y: 160,
  },
];

const GENERIC_EDGES: BoardEdge[] = [
  { from: "a", to: "b", label: "Mutual pick" },
  { from: "a", to: "c", label: "Tangled" },
  { from: "b", to: "c", label: "Ex-dates" },
  { from: "c", to: "d", label: "Spat" },
  { from: "a", to: "e", label: "Crush" },
  { from: "e", to: "f", label: "Same room" },
  { from: "f", to: "a", label: "Old flame" },
];

function hashRot(key: number): number {
  const x = Math.sin(key * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 10 - 5;
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

function pinXY(
  pos: { x: number; y: number },
  primary: boolean,
): { x: number; y: number } {
  const w = primary ? 152 : 122;
  return { x: pos.x + w / 2, y: pos.y + 14 };
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

export type ImportedGraphPayload = {
  characters: BoardCharacter[];
  edges: BoardEdge[];
};

export type RelationshipGraphPreviewProps = {
  variant?: "compact" | "full";
  className?: string;
  /** generic = placeholder cast; singles-inferno-s5 = fifth season demo + episode picker */
  story?: "generic" | "singles-inferno-s5";
  /** When set, replaces built-in story data and hides the episode picker */
  importedGraph?: ImportedGraphPayload | null;
};

function RelationshipGraphBoardInner({
  variant = "compact",
  className = "",
  story = "generic",
  importedGraph = null,
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
    if (importedGraph?.characters?.length) {
      return scaleCharacters(importedGraph.characters, scale);
    }
    const base =
      story === "singles-inferno-s5" ? S5_CHARACTERS_BASE : GENERIC_CHARACTERS;
    return scaleCharacters(base, scale);
  }, [importedGraph, story, scale]);

  const edges = useMemo(() => {
    if (importedGraph?.characters?.length) {
      return importedGraph.edges ?? [];
    }
    return story === "singles-inferno-s5" && episode
      ? episode.edges
      : GENERIC_EDGES;
  }, [importedGraph, story, episode]);

  const worldW = variant === "full" ? 1180 * scale : 920 * scale;
  const worldH = variant === "full" ? 720 * scale : 520 * scale;

  const initialPositions = useMemo(
    () => Object.fromEntries(characters.map((c) => [c.id, { x: c.x, y: c.y }])),
    [characters],
  );

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [positions, setPositions] = useState(initialPositions);

  useEffect(() => {
    setPositions(initialPositions);
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setSelectedId(null);
    setHoverId(null);
  }, [initialPositions, episodeId, story, importedGraph]);
  const dragRef = useRef<{
    id: string;
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
  const boardRef = useRef<HTMLDivElement>(null);

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
        sag: i * 17 + edge.from.charCodeAt(0),
      })),
    [edges],
  );

  const neighbors = useMemo(() => buildNeighbors(edges), [edges]);

  const setEpisodeInUrl = useCallback(
    (id: string) => {
      setEpisodeId(id);
      const next = new URLSearchParams(searchParams.toString());
      next.set("episode", id);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const onCardPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      const p = positions[id];
      setDraggingId(id);
      dragRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        origX: p.x,
        origY: p.y,
      };
    },
    [positions],
  );

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

  const endPointer = useCallback(() => {
    dragRef.current = null;
    panRef.current = null;
    setDraggingId(null);
  }, []);

  const onBoardPointerDownBg = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-polaroid]")) return;
      if ((e.target as HTMLElement).closest("[data-episode-bar]")) return;
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origPanX: pan.x,
        origPanY: pan.y,
      };
    },
    [pan.x, pan.y],
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((z) => Math.min(1.45, Math.max(0.65, z + delta)));
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

  const showEpisodeBar =
    story === "singles-inferno-s5" && variant === "full" && !importedGraph;

  return (
    <figure
      className={`group relative flex flex-col overflow-hidden rounded-lg border border-[#1a120a] shadow-[0_12px_40px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.04)] ${containerClass} ${className}`}
      aria-label="Investigation-style relationship board with polaroid photos and red string connections."
    >
      {showEpisodeBar ? (
        <div
          data-episode-bar
          className="relative z-[70] flex flex-col gap-2 border-b border-black/35 bg-black/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="min-w-0">
            <p className={`text-[11px] font-medium text-[#e8dcc8] ${typewriter.className}`}>
              Pick how far you&apos;ve watched — the board freezes at that episode (demo data).
            </p>
            {episode ? (
              <p className={`mt-0.5 truncate text-[10px] text-[#a89878] ${typewriter.className}`}>
                {episode.label} · {episode.blurb}
              </p>
            ) : null}
          </div>
          <label className={`flex shrink-0 items-center gap-2 text-[11px] text-[#c9beb0]`}>
            <span className={typewriter.className}>Episode</span>
            <select
              value={episodeId}
              onChange={(e) => setEpisodeInUrl(e.target.value)}
              className={`rounded border border-[#5c4030] bg-[#2a2018] px-2 py-1.5 text-[12px] text-[#f5e6dc] outline-none focus:border-[#ff6b4a] ${typewriter.className}`}
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
          backgroundColor: "#2a1f14",
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 15% 20%, rgba(255,240,200,0.07) 0%, transparent 55%),
            radial-gradient(ellipse 60% 40% at 85% 75%, rgba(0,0,0,0.25) 0%, transparent 50%),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 3px,
              rgba(0,0,0,0.04) 3px,
              rgba(0,0,0,0.04) 4px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              rgba(0,0,0,0.035) 3px,
              rgba(0,0,0,0.035) 4px
            ),
            linear-gradient(168deg, #3d2e1f 0%, #1e1510 48%, #120d09 100%)
          `,
        }}
        onPointerDown={onBoardPointerDownBg}
        onPointerMove={onBoardPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
        onWheel={onWheel}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />

        <div className="relative min-h-[280px] flex-1 overflow-hidden sm:min-h-[320px]">
          <div
            className="absolute left-1/2 top-1/2 will-change-transform"
            style={{
              width: worldW,
              height: worldH,
              marginLeft: -worldW / 2,
              marginTop: -worldH / 2,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <svg
              className="pointer-events-none absolute left-0 top-0 text-[#ff2d2d]"
              width={worldW}
              height={worldH}
              role="presentation"
            >
              <defs>
                <filter id={`${gid}-rough`} x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" />
                </filter>
              </defs>
              {edgeMeta.map(({ from, to, label, sag }, i) => {
                const pA = positions[from];
                const pB = positions[to];
                const c1 = characters.find((c) => c.id === from)!;
                const c2 = characters.find((c) => c.id === to)!;
                const pin1 = pinXY(pA, !!c1.primary);
                const pin2 = pinXY(pB, !!c2.primary);
                const touchesHover =
                  hoverId &&
                  (hoverId === from || hoverId === to);
                const active = Boolean(touchesHover);
                const dimEdge = Boolean(hoverId && !touchesHover);
                const path = curvePathD(pin1.x, pin1.y, pin2.x, pin2.y, sag);
                const ctl = quadControl(pin1.x, pin1.y, pin2.x, pin2.y, sag);
                const p0: Pt = pin1;
                const pC: Pt = ctl;
                const p2: Pt = pin2;
                const mid = quadPoint(p0, pC, p2, 0.52);
                const tang = quadTangent(p0, pC, p2, 0.52);
                const angle = labelRotationDeg(tang.x, tang.y);
                const fs =
                  label.length > 24 ? 13 : label.length > 16 ? 14 : 15;
                const outline = fs >= 14 ? 4 : 3.5;
                return (
                  <g key={`${from}-${to}-${i}-${episodeId}`}>
                    <path
                      d={path}
                      fill="none"
                      stroke={RED}
                      strokeWidth={active ? 3.4 : 2.75}
                      strokeLinecap="round"
                      strokeOpacity={dimEdge ? 0.22 : 1}
                      filter={variant === "full" ? `url(#${gid}-rough)` : undefined}
                    />
                    <g transform={`rotate(${angle}, ${mid.x}, ${mid.y})`}>
                      <text
                        x={mid.x}
                        y={mid.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#f8ecd9"
                        stroke="#180f0a"
                        strokeWidth={outline}
                        strokeLinejoin="round"
                        paintOrder="stroke fill"
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
                  </g>
                );
              })}
              {characters.map((c) => {
                const pin = pinXY(positions[c.id], !!c.primary);
                const hl =
                  hoverId &&
                  (hoverId === c.id || neighbors[hoverId]?.has(c.id));
                return (
                  <g key={`pin-${c.id}`}>
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r={hl ? 5.5 : 4}
                      fill="#1a0a0a"
                      stroke={RED}
                      strokeWidth={hl ? 2 : 1.5}
                    />
                    <circle cx={pin.x} cy={pin.y} r={2} fill="#f5f0e8" />
                  </g>
                );
              })}
            </svg>

            {characters.map((c) => {
              const pos = positions[c.id];
              const rot = rotMap[c.id];
              const primary = !!c.primary;
              const w = primary ? 152 : 122;
              const imgH = primary ? 128 : 102;
              const hl =
                hoverId &&
                (hoverId === c.id || neighbors[hoverId]?.has(c.id));
              const dim =
                hoverId && !hl && hoverId !== c.id ? 0.42 : 1;

              return (
                <div
                  key={c.id}
                  data-polaroid
                  className="absolute select-none"
                  style={{
                    left: pos.x,
                    top: pos.y,
                    transform: `rotate(${rot}deg)`,
                    zIndex:
                      draggingId === c.id ? 50 : primary ? 20 : 10,
                    opacity: dim,
                    transition: "opacity 0.2s ease",
                  }}
                  onPointerDown={(e) => onCardPointerDown(e, c.id)}
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
                    className={`relative cursor-grab active:cursor-grabbing ${handwritten.className}`}
                    style={{
                      width: w,
                      filter: hl
                        ? "drop-shadow(0 10px 22px rgba(255,45,45,0.35))"
                        : "drop-shadow(6px 10px 14px rgba(0,0,0,0.55))",
                    }}
                  >
                    <div
                      className="border border-[#e8e4dc] bg-[#faf8f4] p-2 pb-3"
                      style={{
                        boxShadow:
                          "inset 0 0 0 1px rgba(0,0,0,0.06), 1px 2px 0 rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        className="relative overflow-hidden bg-neutral-800"
                        style={{ height: imgH }}
                      >
                        <Image
                          src={`https://picsum.photos/seed/${c.photoSeed}/${Math.round(w * 2)}/${Math.round(imgH * 2)}`}
                          alt=""
                          width={w}
                          height={imgH}
                          className="h-full w-full object-cover"
                          style={{
                            filter: "grayscale(1) contrast(1.08) brightness(0.95)",
                          }}
                          draggable={false}
                          unoptimized
                        />
                      </div>
                      <p
                        className={`mt-2 text-center text-[15px] leading-tight text-neutral-800 ${handwritten.className} ${primary ? "text-[17px]" : ""}`}
                      >
                        {c.name}
                      </p>
                    </div>

                    {c.note ? (
                      <div
                        className={`absolute -bottom-2 left-1/2 ${typewriter.className}`}
                        style={{
                          width: w + 24,
                          marginLeft: -(w + 24) / 2,
                          transform: `rotate(${hashRot(c.rotKey + 99) * 0.4}deg)`,
                          zIndex: -1,
                        }}
                      >
                        <div
                          className="border border-amber-900/25 bg-[#f4efd9] px-2 py-1.5 text-[9px] leading-snug text-neutral-800 shadow-sm"
                          style={{
                            backgroundImage:
                              "repeating-linear-gradient(transparent, transparent 13px, rgba(0,0,0,0.06) 13px, rgba(0,0,0,0.06) 14px)",
                            clipPath:
                              "polygon(0% 0%, 98% 2%, 100% 88%, 3% 100%, 0% 40%)",
                          }}
                        >
                          {c.note}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selected && (
          <div
            className="pointer-events-auto absolute bottom-3 right-3 max-w-[min(100%-1.5rem,300px)] rounded-md border border-[#3d2918] bg-[#1a1410]/95 p-3 text-left shadow-lg backdrop-blur-sm"
            style={{ color: "#f5f0e8" }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <p className={`text-lg ${handwritten.className}`}>{selected.name}</p>
            <p className={`mt-1 text-[11px] text-[#c4b8a8] ${typewriter.className}`}>
              {neighbors[selected.id]?.size ?? 0} string
              {(neighbors[selected.id]?.size ?? 0) === 1 ? "" : "s"} on the board
              (this episode).
            </p>
            {neighborEdges.length > 0 ? (
              <ul className={`mt-2 space-y-1 border-t border-[#3d2918] pt-2 text-[10px] text-[#d8cbb8] ${typewriter.className}`}>
                {neighborEdges.map((e) => {
                  const other = e.from === selected.id ? e.to : e.from;
                  const otherName = characters.find((x) => x.id === other)?.name ?? other;
                  return (
                    <li key={`${e.from}-${e.to}`}>
                      → {otherName}: {e.label}
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {selected.note ? (
              <p className={`mt-2 text-[10px] text-[#a89880] ${typewriter.className}`}>
                Note: {selected.note}
              </p>
            ) : null}
            <button
              type="button"
              className="mt-2 text-[10px] uppercase tracking-wider text-[#ff6b6b] underline-offset-2 hover:underline"
              onClick={() => setSelectedId(null)}
            >
              Close
            </button>
          </div>
        )}

        <figcaption className="pointer-events-none relative z-[60] border-t border-black/25 bg-black/35 px-3 py-2 text-[11px] text-[#c9beb0]">
          <span className={typewriter.className}>
            Drag photos · Drag empty corkboard to pan · Ctrl/⌘ + scroll to zoom · Red
            string labels = relationship notes for the selected episode (demo)
          </span>
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
          ? "min-h-[min(88vh,860px)] w-full animate-pulse rounded-lg border border-[#1a120a] bg-[#2a1f14]"
          : "h-[380px] w-full max-w-md animate-pulse rounded-lg border border-[#1a120a] bg-[#2a1f14]"
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
