/**
 * Optional image fallback via Google Programmable Search (Custom Search JSON API).
 *
 * Setup (one-time, free tier ~100 queries/day per key):
 * 1. Google Cloud Console → enable "Custom Search API" → create API key.
 * 2. https://programmablesearchengine.google.com/ → New search engine → enable "Image search"
 *    (and "Search the entire web" if you want general web images).
 * 3. Copy the "Search engine ID" (cx).
 *
 * Env: `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_CX`
 *
 * @see https://developers.google.com/custom-search/v1/overview
 */

const CSE_ENDPOINT = "https://www.googleapis.com/customsearch/v1";

export async function fetchGoogleCseFirstImageUrl(
  query: string,
): Promise<string | null> {
  const key = process.env.GOOGLE_CSE_API_KEY?.trim();
  const cx = process.env.GOOGLE_CSE_CX?.trim();
  const q = query.trim();
  if (!key || !cx || q.length < 2) return null;

  const params = new URLSearchParams({
    key,
    cx,
    q,
    searchType: "image",
    num: "8",
    safe: "active",
  });

  const res = await fetch(`${CSE_ENDPOINT}?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    items?: Array<{ link?: string; mime?: string; title?: string }>;
  };

  for (const it of data.items ?? []) {
    const link = it.link;
    if (typeof link !== "string" || !link.startsWith("https://")) continue;
    const lower = link.toLowerCase();
    if (lower.endsWith(".svg") || lower.includes(".svg?")) continue;
    const mime = typeof it.mime === "string" ? it.mime : "";
    if (mime && !mime.startsWith("image/")) continue;
    return link;
  }
  return null;
}
