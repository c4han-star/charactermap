import {
  S5_CHARACTERS_BASE,
  type BoardCharacter,
  type BoardEdge,
  type RelationshipEdgeType,
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

export type AiCharacterPatch = {
  id: string;
  displayName?: string;
  name?: string;
  role?: string;
  chaosScore?: number;
};

export function mergeS5Characters(patches: AiCharacterPatch[]): BoardCharacter[] {
  const byId: Record<string, AiCharacterPatch> = {};
  for (const p of patches) {
    if (p && typeof p.id === "string") byId[p.id] = p;
  }
  return S5_CHARACTERS_BASE.map((c) => {
    const p = byId[c.id];
    if (!p) return { ...c };
    const nextName =
      (typeof p.displayName === "string" && p.displayName.trim()) ||
      (typeof p.name === "string" && p.name.trim()) ||
      c.name;
    const nextRole =
      typeof p.role === "string" && p.role.trim() ? p.role.trim() : c.role;
    const cs = p.chaosScore;
    const nextChaos =
      typeof cs === "number" && Number.isFinite(cs) && cs >= 0 && cs <= 100
        ? Math.round(cs)
        : c.chaosScore;
    return {
      ...c,
      name: nextName,
      role: nextRole,
      chaosScore: nextChaos,
    };
  });
}

export function normalizeS5Edges(
  raw: unknown,
  allowed: ReadonlySet<string>,
  maxEdges = 22,
): BoardEdge[] {
  if (!Array.isArray(raw)) return [];
  const out: BoardEdge[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    const from = typeof e.from === "string" ? e.from : "";
    const to = typeof e.to === "string" ? e.to : "";
    if (!allowed.has(from) || !allowed.has(to) || from === to) continue;
    const label =
      typeof e.label === "string" ? e.label.trim().slice(0, 36) : "Link";
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
