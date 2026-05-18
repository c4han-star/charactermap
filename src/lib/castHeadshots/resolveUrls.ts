import {
  fetchTvCredits,
  matchBoardToTvCredits,
  pickBestTvSearchResult,
  searchTv,
  tmdbProfileUrl,
} from "@/lib/castHeadshots/fromTmdbTv";
import { fetchGoogleCseFirstImageUrl } from "@/lib/castHeadshots/googleCseImage";
import { tmdbPersonSearchProfileUrl } from "@/lib/castHeadshots/tmdbPersonImage";

export type CastPhotoInput = {
  id: string;
  name: string;
  /** Real billing name when `name` is a fictional role — improves TMDB + Google image search. */
  actorName?: string;
};

export type CastPhotoDiagnostics = {
  tvId: number | null;
  tvName: string | null;
  candidateCount: number;
  creditsCastCount: number;
  tmdbMatchedCount: number;
  tmdbPersonFallbackCount: number;
  googleFallbackCount: number;
};

/** Latin-heavy labels (e.g. "Lee Da Hee") — safe to try TMDB person search when no `actorName`. */
function likelyRealPersonLabel(s: string): boolean {
  const t = s.trim();
  if (t.length < 3 || t.length > 48) return false;
  if (/[\u4e00-\u9fff]/.test(t)) return false;
  return /[a-zA-Z]/.test(t);
}

/** Mostly Hangul (e.g. Korean billing names) — TMDB person search is often accurate. */
function looksHangulHeavy(s: string): boolean {
  const t = s.trim();
  if (t.length < 2 || t.length > 48) return false;
  const letters = t.replace(/\s/g, "");
  if (letters.length < 2) return false;
  const hang = (t.match(/[\uAC00-\uD7A3]/g) ?? []).length;
  if (hang < 2) return false;
  return hang / letters.length >= 0.45;
}

/** Longer pure-Han names (likely real billing names, not 2-char nicknames). */
function looksPureHanBillingName(s: string): boolean {
  const compact = s.replace(/[\s·]/g, "").trim();
  return (
    compact.length >= 4 &&
    compact.length <= 10 &&
    /^[\u4e00-\u9fff]+$/.test(compact)
  );
}

async function mergedTvSearchCandidates(
  apiKey: string,
  showTitle: string,
  language: "zh" | "en",
): Promise<Awaited<ReturnType<typeof searchTv>>> {
  const seen = new Set<number>();
  const out: Awaited<ReturnType<typeof searchTv>> = [];
  const push = (rows: Awaited<ReturnType<typeof searchTv>>) => {
    for (const r of rows) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
  };

  push(await searchTv(apiKey, showTitle, language));
  if (language === "zh") {
    const t = showTitle.trim();
    if (t.length >= 2 && !/^后宫/.test(t)) {
      push(await searchTv(apiKey, `后宫${t}`, "zh"));
    }
    push(await searchTv(apiKey, t, "en"));
  }
  return out;
}

/**
 * Resolve headshot URLs: TMDB TV credits → TMDB person search → optional Google CSE.
 */
export async function resolveCastPhotoUrls(opts: {
  cast: CastPhotoInput[];
  showTitle?: string;
  language?: "zh" | "en";
}): Promise<{
  images: Record<string, string>;
  diagnostics: CastPhotoDiagnostics;
}> {
  const key = process.env.TMDB_API_KEY?.trim();
  const images: Record<string, string> = {};
  const show = opts.showTitle?.trim();
  const lang: "zh" | "en" = opts.language === "en" ? "en" : "zh";

  let tvId: number | null = null;
  let tvName: string | null = null;
  let candidateCount = 0;
  let creditsCastCount = 0;
  let tmdbMatchedCount = 0;
  let tmdbPersonFallbackCount = 0;

  if (key && show && opts.cast.length > 0) {
    const candidates = await mergedTvSearchCandidates(key, show, lang);
    candidateCount = candidates.length;
    const tv = pickBestTvSearchResult(show, candidates);
    if (tv?.id) {
      tvId = tv.id;
      tvName = tv.name ?? null;
      const rows = await fetchTvCredits(key, tv.id, lang);
      creditsCastCount = rows.length;
      const matched = matchBoardToTvCredits(opts.cast, rows);
      tmdbMatchedCount = matched.size;
      for (const [id, row] of matched) {
        if (row.profile_path) images[id] = tmdbProfileUrl(row.profile_path);
      }
    }
  }

  if (key) {
    for (const c of opts.cast) {
      if (images[c.id]) continue;
      const a = c.actorName?.trim();
      let u: string | null = null;
      if (a && a.length >= 2) {
        u = await tmdbPersonSearchProfileUrl(key, a);
      } else if (likelyRealPersonLabel(c.name)) {
        u = await tmdbPersonSearchProfileUrl(key, c.name);
      } else if (looksHangulHeavy(c.name)) {
        u = await tmdbPersonSearchProfileUrl(key, c.name.trim(), 8);
      } else if (looksPureHanBillingName(c.name)) {
        u = await tmdbPersonSearchProfileUrl(key, c.name.trim(), 10);
      }
      if (u) {
        images[c.id] = u;
        tmdbPersonFallbackCount += 1;
      }
    }
  }

  let googleFallbackCount = 0;
  const gKey = process.env.GOOGLE_CSE_API_KEY?.trim();
  const gCx = process.env.GOOGLE_CSE_CX?.trim();

  if (gKey && gCx) {
    for (const c of opts.cast) {
      if (images[c.id]) continue;
      const display =
        c.actorName?.trim() && c.actorName.trim().length >= 2
          ? c.actorName.trim()
          : c.name;
      const q =
        show && lang === "zh"
          ? `${display} ${show} 剧照`
          : show
            ? `${display} ${show} TV still`
            : lang === "zh"
              ? `${display} 演员 剧照`
              : `${display} actor headshot`;
      const u = await fetchGoogleCseFirstImageUrl(q);
      if (u) {
        images[c.id] = u;
        googleFallbackCount += 1;
      }
    }
  }

  return {
    images,
    diagnostics: {
      tvId,
      tvName,
      candidateCount,
      creditsCastCount,
      tmdbMatchedCount,
      tmdbPersonFallbackCount,
      googleFallbackCount,
    },
  };
}
