import type { BoardCharacter, BoardEdge } from "@/data/singlesInfernoS5";
import { layoutImportedCharacters } from "@/lib/storyImport/layout";

const STOP = new Set([
  "The",
  "This",
  "That",
  "They",
  "There",
  "Then",
  "When",
  "What",
  "With",
  "From",
  "Into",
  "Also",
  "After",
  "Before",
  "While",
  "Where",
  "Which",
  "Would",
  "Could",
  "Should",
  "About",
  "Since",
  "Until",
  "Being",
  "Both",
  "Each",
  "Every",
  "Other",
  "Another",
  "Some",
  "Many",
  "Most",
  "Such",
  "Same",
  "Very",
  "Just",
  "Only",
  "Even",
  "Like",
  "Well",
  "Back",
  "Over",
  "Once",
  "Later",
  "Early",
  "Never",
  "Always",
  "Maybe",
  "Perhaps",
  "Because",
  "Although",
  "However",
  "Chapter",
  "Episode",
  "Part",
]);

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "char";
}

function uniqueSlugRows(rows: [string, string][]): [string, string][] {
  const used = new Set<string>();
  return rows.map(([name, base]) => {
    let s = base;
    let n = 0;
    while (used.has(s)) {
      n += 1;
      s = `${base}-${n}`;
    }
    used.add(s);
    return [name, s];
  });
}

function extractNameCandidates(text: string): Map<string, string> {
  /** canonical display -> slug */
  const map = new Map<string, string>();

  const twoPart =
    /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g;
  let m: RegExpExecArray | null;
  const copy = text;
  while ((m = twoPart.exec(copy)) !== null) {
    const full = `${m[1]} ${m[2]}`;
    if (!STOP.has(m[1]) && !STOP.has(m[2])) {
      map.set(full, slug(full));
    }
  }

  const single = /\b([A-Z][a-z]{2,})\b/g;
  while ((m = single.exec(copy)) !== null) {
    const w = m[1];
    if (!STOP.has(w)) {
      const existsTwo = [...map.keys()].some((k) => k.startsWith(w + " "));
      if (!existsTwo && !map.has(w)) {
        map.set(w, slug(w));
      }
    }
  }

  return map;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type HeuristicResult = {
  characters: BoardCharacter[];
  edges: BoardEdge[];
};

const MAX_CHAR = 12;
const MAX_EDGE = 22;

export function extractHeuristicStory(raw: string): HeuristicResult {
  const text = raw.replace(/\s+/g, " ").trim();
  const nameMap = extractNameCandidates(text);
  let entries = uniqueSlugRows([...nameMap.entries()].slice(0, MAX_CHAR));
  if (entries.length < 2) {
    entries = [
      ["Figure A", "figure-a"],
      ["Figure B", "figure-b"],
      ["Figure C", "figure-c"],
    ];
  }

  const slugByDisplay = new Map(entries);
  const displays = new Set(slugByDisplay.keys());

  const pairWeight = new Map<string, number>();

  for (const sent of sentences(text)) {
    const present: string[] = [];
    for (const d of displays) {
      if (sent.includes(d)) present.push(d);
    }
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        const a = present[i];
        const b = present[j];
        const key = a < b ? `${a}|||${b}` : `${b}|||${a}`;
        pairWeight.set(key, (pairWeight.get(key) ?? 0) + 1);
      }
    }
  }

  const sorted = [...pairWeight.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, MAX_EDGE);

  const stubs = entries.map(([name, id], i) => ({
    id,
    name,
    primary: i === 0,
  }));

  let edges: BoardEdge[] = sorted.map(([key]) => {
    const [na, nb] = key.split("|||");
    const ida = slugByDisplay.get(na)!;
    const idb = slugByDisplay.get(nb)!;
    return {
      from: ida,
      to: idb,
      label: "Co-mentioned",
    };
  });

  if (edges.length === 0 && stubs.length >= 2) {
    edges = [];
    for (let i = 0; i < Math.min(stubs.length - 1, 10); i++) {
      edges.push({
        from: stubs[i].id,
        to: stubs[i + 1].id,
        label: "Linked",
      });
    }
  }

  const characters = layoutImportedCharacters(stubs);

  return { characters, edges };
}
