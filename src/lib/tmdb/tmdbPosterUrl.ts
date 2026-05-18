/** Official TMDB image CDN (`poster_path` / `backdrop_path` from API). */
export function tmdbPosterUrl(
  posterPath: string,
  width: "w342" | "w500" | "w780" = "w780",
): string {
  const p = posterPath.startsWith("/") ? posterPath : `/${posterPath}`;
  return `https://image.tmdb.org/t/p/${width}${p}`;
}
