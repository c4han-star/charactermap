import { Button } from "./Button";
import { ConspiracyHeroWall } from "./ConspiracyHeroWall";

export function Hero() {
  return (
    <section
      className="relative z-10 overflow-hidden pb-20 pt-10 sm:pb-28 sm:pt-14 lg:pb-36 lg:pt-16"
      aria-labelledby="hero-heading"
    >
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)] lg:gap-8 xl:gap-16">
          <div className="relative z-10 max-w-xl lg:max-w-none xl:pr-8">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
              AI-powered drama maps
            </p>
            <h1
              id="hero-heading"
              className="font-display text-balance text-[2.65rem] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[3.75rem] xl:text-[4.1rem]"
            >
              See the drama.
              <br />
              <span className="text-accent">Understand everything.</span>
            </h1>
            <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-muted/95 sm:text-lg">
              Alliances, betrayals, crushes, and quiet tension—pinned like a true-crime wall,
              lit like a prestige title sequence.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                href="/demo"
                variant="primary"
                className="home-cta-glow min-h-12 rounded-full px-8 text-base font-semibold tracking-wide"
              >
                Explore demo
                <span aria-hidden className="text-lg leading-none">
                  →
                </span>
              </Button>
              <Button
                href="#live-board"
                variant="secondary"
                className="min-h-12 rounded-full border-white/15 bg-white/[0.04] px-7 text-base text-foreground/95 hover:border-white/25 hover:bg-white/[0.08]"
              >
                <span className="text-accent" aria-hidden>
                  ▶
                </span>
                Watch trailer
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-9 w-9 rounded-full border-2 border-[#0a0908] bg-gradient-to-br from-zinc-600 to-zinc-900 shadow-inner"
                    aria-hidden
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/90">Loved by drama fans</p>
                <p className="text-xs text-muted">★★★★★ · built for screenshots</p>
              </div>
            </div>
          </div>

          <div className="relative z-[5] flex justify-center lg:justify-end lg:pl-4">
            <div className="relative w-full max-w-[560px]">
              <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-accent/[0.08] blur-3xl" />
              <ConspiracyHeroWall />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
