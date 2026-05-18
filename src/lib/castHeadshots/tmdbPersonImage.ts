import { matchScore, profileUrl } from "@/lib/tmdb/matchBoardToSeasonCast";

type PersonResult = {
  id: number;
  name: string;
  original_name?: string | null;
  profile_path: string | null;
};

/** TMDB person search → best `profile_path` when name matches reasonably. */
export async function tmdbPersonSearchProfileUrl(
  apiKey: string,
  query: string,
  minScore = 7,
): Promise<string | null> {
  const q = query.trim();
  if (q.length < 2) return null;
  const url = `https://api.themoviedb.org/3/search/person?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: PersonResult[] };
  const withPhoto = (data.results ?? []).filter((r) => r.profile_path);
  let best: PersonResult | null = null;
  let bestS = -1;
  for (const r of withPhoto) {
    const s = matchScore(q, r);
    if (s > bestS) {
      bestS = s;
      best = r;
    }
  }
  if (!best?.profile_path || bestS < minScore) return null;
  return profileUrl(best.profile_path, "w185");
}
