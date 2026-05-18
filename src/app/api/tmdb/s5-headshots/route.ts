import { NextResponse } from "next/server";
import {
  S5_CHARACTERS_BASE,
  S5_TMDB_PERSON_ID_OVERRIDES,
  type S5CharacterId,
} from "@/data/singlesInfernoS5";
import {
  matchBoardCharactersToSeasonCast,
  matchScore,
  profileUrl,
  type TmdbSeasonCredit,
} from "@/lib/tmdb/matchBoardToSeasonCast";

export const runtime = "nodejs";

/** Netflix Single's Inferno on TMDB (series). */
const TMDB_TV_ID = 139798;
const TMDB_SEASON = 5;

type SeasonJson = {
  credits?: { cast?: TmdbSeasonCredit[] };
};

type PersonSearchResult = {
  id: number;
  name: string;
  original_name?: string | null;
  profile_path: string | null;
  known_for?: Array<{ id?: number; media_type?: string }>;
};

async function fetchImageViaPersonSearch(
  apiKey: string,
  boardName: string,
  linksTvId: number,
): Promise<string | null> {
  const queries = [
    boardName,
    boardName.replace(/-/g, " "),
    `${boardName} Single's Inferno`,
  ];
  const deduped = [...new Set(queries)];

  for (const q of deduped) {
    const url = `https://api.themoviedb.org/3/search/person?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 86_400 },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as { results?: PersonSearchResult[] };
    const results = (data.results ?? []).filter((r) => r.profile_path);
    if (!results.length) continue;

    const linked = results.filter((r) =>
      (r.known_for ?? []).some(
        (k) => k.media_type === "tv" && k.id === linksTvId,
      ),
    );
    const pool = linked.length ? linked : results;
    let best: PersonSearchResult | null = null;
    let bestScore = -1;
    for (const r of pool) {
      const s = matchScore(boardName, r);
      if (s > bestScore) {
        bestScore = s;
        best = r;
      }
    }

    const minScore = linked.length ? 4 : 7;
    if (best?.profile_path && bestScore >= minScore) {
      return profileUrl(best.profile_path);
    }
    const firstLinked = linked[0];
    if (firstLinked?.profile_path && matchScore(boardName, firstLinked) >= 3) {
      return profileUrl(firstLinked.profile_path);
    }
  }
  return null;
}

export async function GET() {
  const key = process.env.TMDB_API_KEY?.trim();
  const images: Record<string, string> = {};
  const usedCastIds = new Set<number>();

  let tmdbSeasonFetched = false;
  let tmdbSeasonStatus: number | null = null;

  if (key) {
    const url = `https://api.themoviedb.org/3/tv/${TMDB_TV_ID}/season/${TMDB_SEASON}?api_key=${encodeURIComponent(key)}&append_to_response=credits`;

    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 86_400 },
    });

    tmdbSeasonStatus = res.status;
    if (res.ok) {
      tmdbSeasonFetched = true;
      const json = (await res.json()) as SeasonJson;
      const cast = json.credits?.cast ?? [];
      const byId = new Map<number, TmdbSeasonCredit>();
      for (const row of cast) {
        if (typeof row.id === "number") byId.set(row.id, row);
      }

      for (const ch of S5_CHARACTERS_BASE) {
        const overrideId =
          S5_TMDB_PERSON_ID_OVERRIDES[ch.id as S5CharacterId];
        if (typeof overrideId === "number") {
          const row = byId.get(overrideId);
          if (row?.profile_path) {
            images[ch.id] = profileUrl(row.profile_path);
            usedCastIds.add(row.id);
          }
        }
      }

      const remaining = S5_CHARACTERS_BASE.filter((c) => !images[c.id]);
      if (remaining.length > 0) {
        const castPool = cast.filter(
          (c) => c.profile_path && !usedCastIds.has(c.id),
        );
        const matched = matchBoardCharactersToSeasonCast(remaining, castPool);
        for (const [id, row] of matched) {
          if (row.profile_path) images[id] = profileUrl(row.profile_path);
        }
      }

      const stillMissing = S5_CHARACTERS_BASE.filter((c) => !images[c.id]);
      await Promise.all(
        stillMissing.map(async (ch) => {
          const found = await fetchImageViaPersonSearch(
            key,
            ch.name,
            TMDB_TV_ID,
          );
          if (found) images[ch.id] = found;
        }),
      );
    }
  }

  const tmdbImageCount = Object.keys(images).length;

  return NextResponse.json({
    images,
    source: "themoviedb.org",
    tmdbConfigured: Boolean(key),
    tmdbSeasonFetched,
    tmdbSeasonStatus,
    tmdbImageCount,
    tvId: TMDB_TV_ID,
    season: TMDB_SEASON,
    ...(key && !tmdbSeasonFetched
      ? {
          tmdbWarning:
            "TMDB season request failed; some cast photos may be missing.",
        }
      : {}),
    ...(!key
      ? {
          tmdbWarning:
            "TMDB_API_KEY not set; cast photos are unavailable (no TMDB data).",
        }
      : {}),
  });
}
