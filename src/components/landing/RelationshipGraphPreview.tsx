"use client";

import { useId } from "react";

type PreviewNode = {
  id: string;
  cx: number;
  cy: number;
  label: string;
  primary?: boolean;
};

const nodes: PreviewNode[] = [
  { id: "a", cx: 120, cy: 88, label: "You", primary: true },
  { id: "b", cx: 220, cy: 36, label: "A" },
  { id: "c", cx: 268, cy: 120, label: "B" },
  { id: "d", cx: 200, cy: 188, label: "C" },
  { id: "e", cx: 52, cy: 160, label: "D" },
  { id: "f", cx: 36, cy: 56, label: "E" },
];

const edges: [string, string][] = [
  ["a", "b"],
  ["a", "c"],
  ["b", "c"],
  ["c", "d"],
  ["a", "e"],
  ["e", "f"],
  ["f", "a"],
];

export function RelationshipGraphPreview() {
  const gid = useId().replace(/:/g, "");

  return (
    <figure
      className="group relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]"
      aria-label="Preview: people from the show as circles, lines show who is connected up to your place in the story."
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent-muted/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <svg
        viewBox="0 0 300 220"
        className="relative block h-auto w-full text-foreground"
        role="img"
      >
        <defs>
          <filter id={`${gid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {edges.map(([from, to], i) => {
          const n1 = nodes.find((n) => n.id === from)!;
          const n2 = nodes.find((n) => n.id === to)!;
          return (
            <line
              key={i}
              x1={n1.cx}
              y1={n1.cy}
              x2={n2.cx}
              y2={n2.cy}
              stroke="currentColor"
              strokeOpacity={0.22}
              strokeWidth={1.5}
              className="transition-[stroke-opacity] duration-300 group-hover:stroke-opacity-40"
            />
          );
        })}

        {nodes.map((n) => (
          <g key={n.id}>
            <circle
              cx={n.cx}
              cy={n.cy}
              r={n.primary ? 14 : 10}
              fill={n.primary ? "var(--accent)" : "var(--surface-elevated)"}
              stroke="currentColor"
              strokeOpacity={n.primary ? 0.35 : 0.25}
              strokeWidth={1}
              filter={`url(#${gid}-glow)`}
            />
            <text
              x={n.cx}
              y={n.cy + (n.primary ? 32 : 26)}
              textAnchor="middle"
              className="fill-muted text-[10px] font-medium tracking-wide"
              style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="border-t border-border px-4 py-2.5 text-xs text-muted">
        Who knows who—only up to where you are in the episode.
      </figcaption>
    </figure>
  );
}
