import { matchScore, profileUrl } from "@/lib/tmdb/matchBoardToSeasonCast";

type TvSearchResult = {
  id: number;
  name: string;
  original_name?: string | null;
  popularity?: number;
};

type TvSearchJson = { results?: TvSearchResult[] };

type TvCastRow = {
  id: number;
  name: string;
  original_name?: string | null;
  character: string;
  profile_path: string | null;
};

type TvCreditsJson = { cast?: TvCastRow[] };

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s·•:：\-–—'"'「」『』《》]/g, "");
}

/** Pick a TMDB TV row for a user-entered drama title (Chinese / English). */
export function pickBestTvSearchResult(
  userTitle: string,
  results: TvSearchResult[],
): TvSearchResult | null {
  const u = userTitle.trim();
  if (!u || !results.length) return null;
  const nu = normalizeTitle(u);

  let best: TvSearchResult | null = null;
  let bestScore = -1;
  for (const r of results.slice(0, 12)) {
    const n1 = normalizeTitle(r.name);
    const n2 = r.original_name ? normalizeTitle(r.original_name) : "";
    let s = 0;
    if (nu.length >= 2 && (n1.includes(nu) || nu.includes(n1))) s += 80;
    if (nu.length >= 2 && n2 && (n2.includes(nu) || nu.includes(n2))) s += 70;
    s += Math.round((r.popularity ?? 0) * 2);
    s += matchScore(u, { name: r.name, original_name: r.original_name ?? undefined });
    if (s > bestScore) {
      bestScore = s;
      best = r;
    }
  }
  if (bestScore < 8) return null;
  if (!best) return null;
  const bn = normalizeTitle(best.name);
  const on = best.original_name ? normalizeTitle(best.original_name) : "";
  const strongTitle =
    nu.length >= 2 &&
    (bn.includes(nu) ||
      nu.includes(bn) ||
      (on.length > 0 && (on.includes(nu) || nu.includes(on))));
  if (!strongTitle && bestScore < 40) return null;
  return best;
}

/** Strip parenthetical / bracketed bits so 「浣碧（前期）」 still matches 「浣碧」. */
function stripRoleParentheticals(s: string): string {
  return s
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/【[^】]*】/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Han characters from `board` that appear in `text` → weak fuzzy signal. */
function hanCharOverlapScore(board: string, text: string): number {
  const seen = new Set<string>();
  let score = 0;
  for (const ch of board) {
    if (!/[\u4e00-\u9fff]/.test(ch)) continue;
    if (seen.has(ch)) continue;
    seen.add(ch);
    if (text.includes(ch)) score += 8;
  }
  return Math.min(score, 36);
}

function castCreditPhotoScoreCore(boardName: string, row: TvCastRow): number {
  const bn = boardName.trim();
  if (!bn) return 0;
  const chRaw = row.character.replace(/\s+/g, " ").trim();
  const ch = stripRoleParentheticals(chRaw);
  if (bn.length >= 1 && chRaw.includes(bn)) return 100 + Math.min(bn.length, 8);
  if (bn.length >= 1 && ch.includes(bn)) return 98 + Math.min(bn.length, 8);
  const overlap = hanCharOverlapScore(bn, chRaw) || hanCharOverlapScore(bn, ch);
  const tokens = matchScore(bn, {
    name: row.name,
    original_name: row.original_name ?? undefined,
  });
  const chLower = ch.toLowerCase();
  const bnLower = bn.toLowerCase();
  if (bnLower.length >= 3 && chLower.includes(bnLower)) return 95;
  return Math.max(tokens, overlap);
}

/** Score board role name vs TMDB credit `character` + actor names; optional `actorHint` matches real billing name. */
export function castCreditPhotoScore(
  boardName: string,
  row: TvCastRow,
  actorHint?: string,
): number {
  const s0 = castCreditPhotoScoreCore(boardName, row);
  const ah = actorHint?.trim();
  if (!ah || ah === boardName.trim()) return s0;
  return Math.max(s0, castCreditPhotoScoreCore(ah, row));
}

/**
 * Greedy one-to-one: each board member → one cast row with `profile_path`.
 */
export function matchBoardToTvCredits<
  T extends { id: string; name: string; actorName?: string },
>(board: T[], cast: TvCastRow[]): Map<string, TvCastRow> {
  const withPhoto = cast.filter((c) => c.profile_path);
  const pairs: { charId: string; row: TvCastRow; score: number }[] = [];
  for (const b of board) {
    for (const c of withPhoto) {
      pairs.push({
        charId: b.id,
        row: c,
        score: castCreditPhotoScore(b.name, c, b.actorName),
      });
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  const usedChar = new Set<string>();
  const usedCast = new Set<number>();
  const out = new Map<string, TvCastRow>();
  for (const p of pairs) {
    if (p.score < 30) break;
    if (usedChar.has(p.charId) || usedCast.has(p.row.id)) continue;
    usedChar.add(p.charId);
    usedCast.add(p.row.id);
    out.set(p.charId, p.row);
  }
  return out;
}

export async function searchTv(
  apiKey: string,
  query: string,
  language?: "zh" | "en",
): Promise<TvSearchResult[]> {
  const lang = language === "zh" ? "&language=zh-CN" : "";
  const url = `https://api.themoviedb.org/3/search/tv?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query.trim())}${lang}`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as TvSearchJson;
  return data.results ?? [];
}

export async function fetchTvCredits(
  apiKey: string,
  tvId: number,
  language?: "zh" | "en",
): Promise<TvCastRow[]> {
  const lang = language === "zh" ? "&language=zh-CN" : "";
  const url = `https://api.themoviedb.org/3/tv/${tvId}/credits?api_key=${encodeURIComponent(apiKey)}${lang}`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as TvCreditsJson;
  return data.cast ?? [];
}

export function tmdbProfileUrl(profilePath: string): string {
  return profileUrl(profilePath, "w185");
}
