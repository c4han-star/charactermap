import Image from "next/image";
import Link from "next/link";

function demoPrefill(seedTitle: string, seedPremise: string) {
  const p = new URLSearchParams();
  p.set("title", seedTitle);
  if (seedPremise.trim()) p.set("premise", seedPremise.trim());
  return `/demo?${p.toString()}`;
}

const singlesHref = "/demo?show=singles-inferno&episode=ep1";

/** Mood photography (Unsplash) — atmospheric, not show IP. */
const secondaryUniverses = [
  {
    key: "glory",
    label: "The Glory",
    tagline: "Revenge that never sleeps",
    href: demoPrefill(
      "The Glory",
      "Netflix Korean revenge drama: school bullies, victims, allies, and schemes — one season arc.",
    ),
    image:
      "https://images.unsplash.com/photo-1534809027769-b00d750a6bba?auto=format&fit=crop&w=900&q=80",
    grade: "from-stone-950/90 via-zinc-950/50 to-transparent",
    accent: "shadow-[inset_0_0_80px_-20px_rgba(127,29,29,0.45)]",
    stagger: "lg:translate-y-3",
    minH: "min-h-[200px] sm:min-h-[220px]",
  },
  {
    key: "heart",
    label: "Heart Signal",
    tagline: "Love triangle chaos",
    href: demoPrefill(
      "Heart Signal",
      "Korean dating reality: cast members, panelists, and evolving love lines across the season.",
    ),
    image:
      "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=900&q=80",
    grade: "from-fuchsia-950/70 via-rose-950/40 to-transparent",
    accent: "shadow-[inset_0_0_100px_-30px_rgba(236,72,153,0.35)]",
    stagger: "lg:-translate-y-1",
    minH: "min-h-[210px] sm:min-h-[240px]",
  },
  {
    key: "transit",
    label: "Transit Love",
    tagline: "Exes under one roof",
    href: demoPrefill(
      "Transit Love 2",
      "Korean dating show where former couples live together; focus on unresolved ties and new attractions.",
    ),
    image:
      "https://images.unsplash.com/photo-1474487548417-781cb7142046?auto=format&fit=crop&w=900&q=80",
    grade: "from-slate-950/85 via-blue-950/35 to-transparent",
    accent: "shadow-[inset_0_0_90px_-25px_rgba(30,58,138,0.4)]",
    stagger: "lg:translate-y-2",
    minH: "min-h-[180px] sm:min-h-[200px]",
  },
  {
    key: "kpop",
    label: "K-pop universe",
    tagline: "Alliances in neon",
    href: demoPrefill(
      "Street Woman Fighter",
      "Korean dance survival show: competing street dance crews, judges, eliminations, and alliances.",
    ),
    image:
      "https://images.unsplash.com/photo-1501281668665-6791a5dc1c5f?auto=format&fit=crop&w=900&q=80",
    grade: "from-violet-950/80 via-fuchsia-950/45 to-transparent",
    accent: "shadow-[inset_0_0_100px_-20px_rgba(168,85,247,0.45)]",
    stagger: "lg:-translate-y-2",
    minH: "min-h-[200px] sm:min-h-[220px]",
  },
  {
    key: "hp",
    label: "Harry Potter",
    tagline: "Houses at war",
    href: demoPrefill(
      "Harry Potter",
      "Wizarding world core cast: Hogwarts houses, Order of the Phoenix, Death Eaters, and key bonds.",
    ),
    image:
      "https://images.unsplash.com/photo-1448375240587-893517b2c2f7?auto=format&fit=crop&w=900&q=80",
    grade: "from-emerald-950/75 via-zinc-950/50 to-transparent",
    accent: "shadow-[inset_0_0_90px_-30px_rgba(5,46,22,0.5)]",
    stagger: "lg:translate-y-4",
    minH: "min-h-[195px] sm:min-h-[215px]",
  },
] as const;

function UniverseStringBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-[42%] h-[min(120%,920px)] w-[min(140%,1200px)] -translate-x-1/2 -translate-y-1/2 text-accent/[0.14]"
      viewBox="0 0 800 520"
      fill="none"
      aria-hidden
    >
      <path
        className="universe-line-drift"
        d="M40 420 C180 200 320 380 520 80 M120 480 C400 300 520 420 720 200 M60 120 C280 80 400 200 640 360"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M700 400 C520 280 380 320 100 180"
        stroke="currentColor"
        strokeWidth="0.85"
        strokeOpacity="0.5"
      />
    </svg>
  );
}

export function FeaturedUniverses() {
  return (
    <section
      className="relative z-10 overflow-hidden border-t border-white/[0.05] py-16 sm:py-24"
      aria-labelledby="universes-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_60%,rgba(120,30,40,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent"
        aria-hidden
      />
      <UniverseStringBackdrop />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex max-w-3xl flex-col gap-4 sm:max-w-none sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent/90">
              Suggested boards
            </p>
            <h2
              id="universes-heading"
              className="font-display mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-[2.75rem] md:leading-[1.1]"
            >
              Pick your obsession
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted sm:text-right">
            One flagship board pulls you in; the rest are different emotional temperatures—each
            opens the live demo so you can start mapping immediately.
          </p>
        </div>

        {/* Desktop: editorial grid · Mobile: featured + horizontal rail */}
        <div className="mt-14 flex flex-col gap-5 lg:mt-16 lg:grid lg:grid-cols-12 lg:gap-6 lg:gap-y-5">
          {/* —— Featured: Single's Inferno —— */}
          <Link
            href={singlesHref}
            className="group relative isolate order-1 overflow-hidden rounded-[1.75rem] ring-1 ring-white/[0.1] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] transition-[transform,box-shadow,ring-color] duration-700 ease-out hover:shadow-[0_50px_140px_-36px_rgba(220,38,38,0.22)] hover:ring-accent/35 lg:col-span-7 lg:row-span-2 lg:min-h-[min(72vh,560px)]"
          >
            <Image
              src="/images/singles-inferno-poster.png"
              alt=""
              fill
              priority
              className="object-cover object-[center_22%] transition-[transform,filter] duration-[1.1s] ease-out group-hover:scale-[1.05] group-hover:brightness-110"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/25 via-transparent to-sky-950/20 opacity-80 mix-blend-soft-light" />
            <div className="universe-card-grain absolute inset-0" />
            <div className="pointer-events-none absolute -right-16 top-0 h-2/3 w-2/3 rounded-full bg-accent/15 blur-[100px]" />
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
            </div>

            {/* Corner “pins” */}
            <div className="pointer-events-none absolute left-5 top-5 flex gap-2 opacity-70">
              <span className="h-2.5 w-2.5 rounded-full bg-red-700 shadow-[0_0_12px_rgba(220,38,38,0.8)] ring-2 ring-black/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-400 shadow ring-2 ring-black/40" />
            </div>

            <div className="absolute inset-x-0 bottom-0 z-[1] flex flex-col justify-end p-6 sm:p-8 md:p-10">
              <span className="mb-4 inline-flex w-fit items-center rounded-full border border-accent/55 bg-accent/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent shadow-[0_0_24px_-4px_rgba(220,38,38,0.55)]">
                Recommended
              </span>
              <h3 className="font-display max-w-[14ch] text-4xl font-semibold leading-[0.95] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] sm:text-5xl md:text-6xl lg:text-[3.35rem]">
                Single&apos;s Inferno
              </h3>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
                Full S5 timeline on a living conspiracy wall—strings redraw as you scrub the
                season.
              </p>
              <span className="mt-6 inline-flex translate-y-1 items-center gap-2 text-sm font-medium text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                Enter the board <span aria-hidden className="text-accent">→</span>
              </span>
            </div>
          </Link>

          {/* —— Secondaries: desktop grid —— */}
          <div className="order-3 hidden min-h-0 lg:order-2 lg:col-span-5 lg:row-span-2 lg:grid lg:grid-cols-2 lg:gap-x-4 lg:gap-y-4">
            {secondaryUniverses.map((card, i) => (
              <SecondaryCard key={card.key} card={card} index={i} />
            ))}
          </div>

          {/* —— Secondaries: mobile horizontal rail —— */}
          <div className="home-card-rail order-2 flex gap-3 overflow-x-auto pb-2 pt-1 [-webkit-overflow-scrolling:touch] lg:hidden">
            {secondaryUniverses.map((card, i) => (
              <SecondaryCard key={card.key} card={card} index={i} layout="rail" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SecondaryCard({
  card,
  index,
  layout = "grid",
}: {
  card: (typeof secondaryUniverses)[number];
  index: number;
  layout?: "grid" | "rail";
}) {
  const transitFull = card.key === "transit" ? "lg:col-span-2" : "";

  return (
    <Link
      href={card.href}
      className={`group relative isolate overflow-hidden rounded-2xl ring-1 ring-white/[0.08] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.9)] transition-[transform,box-shadow,ring-color] duration-500 ease-out hover:z-[2] hover:shadow-[0_32px_70px_-24px_rgba(220,38,38,0.18)] hover:ring-accent/30 ${
        layout === "rail"
          ? `w-[min(46vw,220px)] shrink-0 snap-start ${card.minH}`
          : `${card.minH} ${card.stagger} ${transitFull}`
      }`}
    >
      <Image
        src={card.image}
        alt=""
        fill
        className="object-cover transition-[transform,filter] duration-[900ms] ease-out group-hover:scale-110 group-hover:brightness-105"
        sizes={layout === "rail" ? "220px" : "(max-width: 1280px) 40vw, 260px"}
      />
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${card.grade}`}
        aria-hidden
      />
      <div className={`pointer-events-none absolute inset-0 ${card.accent}`} aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
      <div className="universe-card-grain absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-accent/15" />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[1] p-4 sm:p-5">
        <h3 className="font-display text-xl font-semibold tracking-tight text-white drop-shadow-md sm:text-2xl">
          {card.label}
        </h3>
        <p className="mt-1.5 text-xs font-medium uppercase tracking-wider text-white/55 sm:text-sm sm:normal-case sm:tracking-normal sm:text-white/75">
          {card.tagline}
        </p>
        <span className="mt-3 inline-flex translate-y-1 items-center gap-1 text-[11px] font-medium text-white/90 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Dive in <span aria-hidden>→</span>
        </span>
      </div>

      {/* subtle index tick for rhythm (hidden from SR as decorative) */}
      <span
        className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] text-white/20"
        aria-hidden
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </Link>
  );
}
