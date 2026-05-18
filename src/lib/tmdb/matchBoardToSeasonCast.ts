/** Any TMDB row with display names (season cast or search/person result). */
export type TmdbNamedProfile = {
  name: string;
  original_name?: string | null;
};

export type TmdbSeasonCredit = TmdbNamedProfile & {
  id: number;
  profile_path: string | null;
};

function tokenize(s: string): string[] {
  const out = new Set<string>();
  for (const raw of s.toLowerCase().split(/[\s,]+/).filter(Boolean)) {
    for (const piece of raw.split(/[-·']/)) {
      const t = piece.replace(/[^a-z0-9\u3131-\u318E\uAC00-\uD7A3]/gi, "");
      if (t.length >= 2) out.add(t);
      const merged = raw.replace(/[-·']/g, "").replace(/[^a-z0-9\u3131-\u318E\uAC00-\uD7A3]/gi, "");
      if (merged.length >= 3) out.add(merged);
    }
  }
  return [...out];
}

function displayNameVariants(display: string): string[] {
  const v = new Set<string>([display, display.replace(/-/g, " ")]);
  const parts = display.trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length >= 2) {
    v.add([...parts].reverse().join(" "));
    const [family, ...rest] = parts;
    if (rest.length)
      v.add(`${rest.join(" ")} ${family}`);
  }
  return [...v];
}

/** Heuristic score: higher = more likely same person (romanization / order variants). */
export function matchScore(
  boardDisplayName: string,
  person: TmdbNamedProfile,
): number {
  let best = 0;
  for (const variant of displayNameVariants(boardDisplayName)) {
    const pool = `${person.name} ${person.original_name ?? ""}`.toLowerCase();
    let score = 0;
    for (const t of tokenize(variant)) {
      if (pool.includes(t)) score += Math.min(t.length, 10);
    }
    const lettersOnly = variant.toLowerCase().replace(/[^a-z]/g, "");
    const poolLetters = pool.replace(/[^a-z]/g, "");
    if (lettersOnly.length >= 5 && poolLetters.includes(lettersOnly)) score += 18;
    best = Math.max(best, score);
  }
  return best;
}

/**
 * One-to-one greedy match: each board character → at most one cast row with a profile image.
 */
export function matchBoardCharactersToSeasonCast<
  T extends { id: string; name: string },
>(board: T[], cast: TmdbSeasonCredit[], minScore = 5): Map<string, TmdbSeasonCredit> {
  const withPhoto = cast.filter((c) => c.profile_path);
  const pairs: { charId: string; cast: TmdbSeasonCredit; score: number }[] = [];
  for (const b of board) {
    for (const c of withPhoto) {
      pairs.push({ charId: b.id, cast: c, score: matchScore(b.name, c) });
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  const usedChar = new Set<string>();
  const usedCast = new Set<number>();
  const out = new Map<string, TmdbSeasonCredit>();
  for (const p of pairs) {
    if (p.score < minScore) break;
    if (usedChar.has(p.charId) || usedCast.has(p.cast.id)) continue;
    usedChar.add(p.charId);
    usedCast.add(p.cast.id);
    out.set(p.charId, p.cast);
  }
  return out;
}

export function profileUrl(profilePath: string, width: "w185" | "w342" = "w185"): string {
  return `https://image.tmdb.org/t/p/${width}${profilePath}`;
}
