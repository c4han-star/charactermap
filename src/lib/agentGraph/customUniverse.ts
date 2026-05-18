import type {
  BoardCharacter,
  BoardEdge,
  RelationshipEdgeType,
} from "@/data/singlesInfernoS5";

const REL_TYPES = new Set<RelationshipEdgeType>([
  "romance",
  "betrayal",
  "alliance",
  "crush",
  "conflict",
  "fake_friend",
  "hidden",
  "default",
]);

function normalizeRelType(t: string | undefined): RelationshipEdgeType {
  if (t && REL_TYPES.has(t as RelationshipEdgeType)) {
    return t as RelationshipEdgeType;
  }
  return "default";
}

/** Stable ids for custom-show LLM output (merge-safe, URL-safe). */
export const CUSTOM_SHOW_ID_RE = /^[a-z][a-z0-9_-]{1,23}$/;

function rotKeyFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 10000;
}

/**
 * Scatter on the same logical plane as {@link GENERIC_CHARACTERS} (narrow board),
 * used when the preview is not in spaced-cast mode (small custom casts).
 */
export function layoutCustomScatter(
  n: number,
  boardW: number,
  boardH: number,
): { x: number; y: number }[] {
  if (n <= 0) return [];
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const padX = 48;
  const padY = 36;
  const cellW = (boardW - padX * 2) / cols;
  const cellH = (boardH - padY * 2) / rows;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    out.push({
      x: Math.round(padX + col * cellW + (cellW - 152) / 2),
      y: Math.round(padY + row * cellH),
    });
  }
  return out;
}

export function buildCustomShowUserPrompt(opts: {
  title: string;
  premise: string;
  language: "zh" | "en";
  maxCast: number;
}): string {
  const { title, premise, language, maxCast } = opts;
  const langLine =
    language === "zh"
      ? "边 label：简短中文（每条约 12 字内）。episodeSummary、confidenceNote 也用中文。"
      : "Edge labels: max 4 English words. episodeSummary and confidenceNote in English.";

  const hi = Math.min(Math.max(maxCast, 4), 18);
  return `You are building a RELATIONSHIP MAP for a TV series or film the user describes.

SHOW TITLE: ${title}
STORY / EPISODE SCOPE (may be empty): ${premise || "(none)"}

Rules (critical):
- Output ONLY valid JSON (no markdown fences). Top-level keys: characters, edges, episodeSummary, confidenceNote.
- characters: array of 4 to ${hi} people (main + supporting). Each object MUST have:
  - "id": lowercase Latin slug, 2–24 chars, match pattern [a-z][a-z0-9_-]* only (no spaces).
  - "name": display name (any language).
  - optional "role": very short archetype or job.
  - optional "chaosScore": integer 0–100 (plot energy / messiness).
  - optional "primary": true for exactly ONE protagonist anchor (if unsure, pick the clearest lead).
  - optional "note": one short dossier line.
  - optional "actorName": real performer as usually billed (any language); use when "name" is a fictional role or nickname so TMDB can match cast photos. Omit if unsure.
- edges: 4 to 14 undirected relationships. Each: { "from": "<id>", "to": "<id>", "label": "<string>", "relType": one of romance | betrayal | alliance | crush | conflict | fake_friend | hidden | default }.
- from/to MUST be ids from your characters array only. Never invent ids not in that list.
- If knowledge is shaky, say so in confidenceNote and use weaker relTypes (hidden/default).
- Entertainment-safe: no real-world criminal accusations unless widely reported public fact.

${langLine}`;
}

function normalizeCustomEdges(
  raw: unknown,
  allowed: ReadonlySet<string>,
  maxEdges = 22,
): BoardEdge[] {
  if (!Array.isArray(raw)) return [];
  const out: BoardEdge[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    const from = typeof e.from === "string" ? e.from.trim().toLowerCase() : "";
    const to = typeof e.to === "string" ? e.to.trim().toLowerCase() : "";
    if (!allowed.has(from) || !allowed.has(to) || from === to) continue;
    const label =
      typeof e.label === "string" ? e.label.trim().slice(0, 40) : "Link";
    if (!label) continue;
    out.push({
      from,
      to,
      label,
      relType: normalizeRelType(
        typeof e.relType === "string" ? e.relType : undefined,
      ),
    });
    if (out.length >= maxEdges) break;
  }
  return out;
}

export function normalizeCustomLlmPayload(parsed: Record<string, unknown>): {
  characters: BoardCharacter[];
  edges: BoardEdge[];
  episodeSummary: string;
  confidenceNote: string;
} | null {
  const rawChars = parsed.characters;
  if (!Array.isArray(rawChars)) return null;

  const drafts: BoardCharacter[] = [];
  const seen = new Set<string>();

  for (const raw of rawChars) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim().toLowerCase() : "";
    const name = typeof o.name === "string" ? o.name.trim() : "";
    if (!CUSTOM_SHOW_ID_RE.test(id) || name.length < 1 || name.length > 80) {
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);

    const role =
      typeof o.role === "string" ? o.role.trim().slice(0, 100) : undefined;
    const note =
      typeof o.note === "string" ? o.note.trim().slice(0, 220) : undefined;
    const actorNameRaw =
      typeof o.actorName === "string" ? o.actorName.trim().slice(0, 80) : "";
    const actorName =
      actorNameRaw.length >= 2 ? actorNameRaw : undefined;
    let chaosScore: number | undefined;
    if (typeof o.chaosScore === "number" && Number.isFinite(o.chaosScore)) {
      chaosScore = Math.max(0, Math.min(100, Math.round(o.chaosScore)));
    }

    drafts.push({
      id,
      name,
      role: role || undefined,
      note: note || undefined,
      actorName,
      chaosScore,
      primary: o.primary === true,
      photoSeed: `custom-${id}`,
      rotKey: rotKeyFromId(id),
      x: 0,
      y: 0,
    });
  }

  if (drafts.length < 3 || drafts.length > 22) return null;

  const primaries = drafts.filter((c) => c.primary);
  if (primaries.length === 0) {
    let bestI = 0;
    let bestCs = -1;
    for (let i = 0; i < drafts.length; i++) {
      const cs = drafts[i].chaosScore ?? 0;
      if (cs >= bestCs) {
        bestCs = cs;
        bestI = i;
      }
    }
    drafts[bestI] = { ...drafts[bestI], primary: true };
  } else if (primaries.length > 1) {
    let bestI = drafts.findIndex((c) => c.primary);
    let bestCs = drafts[bestI]?.chaosScore ?? -1;
    for (let i = 0; i < drafts.length; i++) {
      if (!drafts[i].primary) continue;
      const cs = drafts[i].chaosScore ?? 0;
      if (cs > bestCs) {
        bestCs = cs;
        bestI = i;
      }
    }
    for (let i = 0; i < drafts.length; i++) {
      drafts[i] = { ...drafts[i], primary: i === bestI };
    }
  }

  const allowed = new Set(drafts.map((c) => c.id));
  let edges = normalizeCustomEdges(parsed.edges, allowed);

  if (edges.length < 2) {
    const [a, b] = [drafts[0]?.id, drafts[1]?.id];
    if (a && b && a !== b) {
      edges = [
        {
          from: a,
          to: b,
          label: "关系待细化",
          relType: "default",
        },
      ];
    } else {
      return null;
    }
  }

  const scatter = layoutCustomScatter(drafts.length, 920, 720);
  const characters = drafts.map((c, i) => ({
    ...c,
    x: scatter[i]?.x ?? 80,
    y: scatter[i]?.y ?? 80,
  }));

  const episodeSummary =
    typeof parsed.episodeSummary === "string"
      ? parsed.episodeSummary.trim().slice(0, 1200)
      : "";
  const confidenceNote =
    typeof parsed.confidenceNote === "string"
      ? parsed.confidenceNote.trim().slice(0, 800)
      : "";

  return { characters, edges, episodeSummary, confidenceNote };
}
