/** TMDB `image.tmdb.org` width tokens (posters & backdrops). */
export type TmdbImageWidth = "w342" | "w500" | "w780" | "w1280";

/** Official CDN path for any `file_path` from `/tv|movie/{id}/images`. */
export function tmdbImageUrl(filePath: string, width: TmdbImageWidth = "w1280"): string {
  const p = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `https://image.tmdb.org/t/p/${width}${p}`;
}

/** Poster-style assets (same CDN; default width kept for older call sites). */
export function tmdbPosterUrl(
  posterPath: string,
  width: TmdbImageWidth = "w780",
): string {
  return tmdbImageUrl(posterPath, width);
}
