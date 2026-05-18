import Image from "next/image";
import { Button } from "./Button";

export function DemoSection() {
  return (
    <section
      id="live-board"
      className="relative z-10 border-t border-white/[0.05] py-20 sm:py-28"
      aria-labelledby="demo-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.03] to-transparent" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-[1.5rem] ring-1 ring-white/[0.08] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-stretch">
            <div className="relative aspect-[16/10] w-full min-h-[220px] lg:min-h-[380px]">
              <Image
                src="/images/singles-inferno-poster.png"
                alt="Single's Inferno: cast in a bright tropical setting."
                fill
                className="object-cover object-[center_22%]"
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050506] via-[#050506]/35 to-transparent lg:bg-gradient-to-r lg:from-[#050506] lg:via-[#050506]/45 lg:to-transparent"
                aria-hidden
              />
            </div>
            <div className="flex flex-col justify-center bg-gradient-to-br from-zinc-950/90 to-black px-8 py-10 sm:p-12 lg:pl-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Live board
              </p>
              <h2
                id="demo-heading"
                className="font-display mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Watch the wall move
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                Single&apos;s Inferno S5 ships with a timeline scrub—strings, rivalries, and
                romance redraw themselves as you slide through the season.
              </p>
              <div className="mt-9">
                <Button
                  href="/demo?show=singles-inferno&episode=ep1"
                  variant="primary"
                  className="home-cta-glow min-h-12 rounded-full px-9 text-base font-semibold"
                >
                  Open the board
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
