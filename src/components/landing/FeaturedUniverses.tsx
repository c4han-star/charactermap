import Image from "next/image";
import Link from "next/link";

function demoPrefill(seedTitle: string, seedPremise: string) {
  const p = new URLSearchParams();
  p.set("title", seedTitle);
  if (seedPremise.trim()) p.set("premise", seedPremise.trim());
  return `/demo?${p.toString()}`;
}

const singlesHref = "/demo?show=singles-inferno&episode=ep1";

const mediaCards = [
  {
    key: "singles",
    label: "Single's Inferno",
    tagline: "Recommended · S5 timeline",
    href: singlesHref,
    variant: "poster" as const,
  },
  {
    key: "glory",
    label: "The Glory",
    tagline: "Revenge web",
    href: demoPrefill(
      "The Glory",
      "Netflix Korean revenge drama: school bullies, victims, allies, and schemes — one season arc.",
    ),
    variant: "gradient" as const,
    gradient: "from-stone-900 via-zinc-950 to-black",
    glow: "from-rose-600/20",
  },
  {
    key: "heart",
    label: "Heart Signal",
    tagline: "Dating lab",
    href: demoPrefill(
      "Heart Signal",
      "Korean dating reality: cast members, panelists, and evolving love lines across the season.",
    ),
    variant: "gradient" as const,
    gradient: "from-rose-950 via-purple-950/80 to-zinc-950",
    glow: "from-pink-500/25",
  },
  {
    key: "transit",
    label: "Transit Love",
    tagline: "Exes under one roof",
    href: demoPrefill(
      "Transit Love 2",
      "Korean dating show where former couples live together; focus on unresolved ties and new attractions.",
    ),
    variant: "gradient" as const,
    gradient: "from-slate-900 via-indigo-950/50 to-black",
    glow: "from-sky-500/15",
  },
  {
    key: "kpop",
    label: "K-pop universe",
    tagline: "Crews & collabs",
    href: demoPrefill(
      "Street Woman Fighter",
      "Korean dance survival show: competing street dance crews, judges, eliminations, and alliances.",
    ),
    variant: "gradient" as const,
    gradient: "from-fuchsia-950 via-violet-950 to-black",
    glow: "from-fuchsia-500/20",
  },
  {
    key: "hp",
    label: "Harry Potter",
    tagline: "Faction map",
    href: demoPrefill(
      "Harry Potter",
      "Wizarding world core cast: Hogwarts houses, Order of the Phoenix, Death Eaters, and key bonds.",
    ),
    variant: "gradient" as const,
    gradient: "from-emerald-950/80 via-slate-950 to-black",
    glow: "from-emerald-500/15",
  },
] as const;

export function FeaturedUniverses() {
  return (
    <section
      className="relative z-10 border-t border-white/[0.05] py-16 sm:py-24"
      aria-labelledby="universes-heading"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Suggested boards
            </p>
            <h2
              id="universes-heading"
              className="font-display mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              Pick your obsession
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted sm:text-right">
            Tap a tile—each opens the live demo. Single&apos;s Inferno is our full showcase;
            others arrive with a head start on the form.
          </p>
        </div>

        <div className="home-card-rail mt-12 flex gap-4 overflow-x-auto pb-4 pt-1 [scrollbar-width:thin]">
          {mediaCards.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className={`group relative shrink-0 snap-start overflow-hidden rounded-2xl ring-1 ring-white/[0.08] transition-all duration-500 hover:z-[2] hover:scale-[1.03] hover:shadow-[0_28px_80px_-24px_rgba(0,0,0,0.85)] hover:ring-accent/40 ${
                card.key === "singles"
                  ? "aspect-[3/4] w-[min(280px,78vw)] sm:w-[300px]"
                  : "aspect-[2/3] w-[min(200px,55vw)] sm:w-[220px]"
              }`}
            >
              {card.variant === "poster" ? (
                <>
                  <Image
                    src="/images/singles-inferno-poster.png"
                    alt=""
                    fill
                    className="object-cover object-[center_25%] transition-transform duration-700 group-hover:scale-105"
                    sizes="300px"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="pointer-events-none absolute inset-0 bg-accent/10 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-100" />
                </>
              ) : (
                <>
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`}
                    aria-hidden
                  />
                  <div
                    className={`absolute -right-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-gradient-to-br ${card.glow} blur-3xl opacity-70`}
                    aria-hidden
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_45%)]" />
                </>
              )}

              <div className="absolute inset-x-0 bottom-0 z-[1] p-4 sm:p-5">
                {card.key === "singles" ? (
                  <span className="mb-2 inline-block rounded-full border border-accent/50 bg-accent/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                    Recommended
                  </span>
                ) : null}
                <h3 className="font-display text-xl font-semibold text-white drop-shadow-md sm:text-2xl">
                  {card.label}
                </h3>
                <p className="mt-1 text-sm text-white/70">{card.tagline}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-white/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Open board <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
