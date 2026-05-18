import Image from "next/image";
import { Button } from "./Button";

export function DemoSection() {
  return (
    <section
      id="demo"
      className="border-b border-border/60 py-16 sm:py-20"
      aria-labelledby="demo-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-stretch">
            <div className="relative aspect-video w-full min-h-[200px] lg:min-h-[360px]">
              <Image
                src="/images/singles-inferno-poster.png"
                alt="Single's Inferno key art: cast in a bright tropical setting."
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority={false}
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent lg:bg-gradient-to-r lg:from-background lg:via-background/40 lg:to-transparent"
                aria-hidden
              />
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12 lg:pl-10">
              <p className="text-xs font-medium uppercase tracking-widest text-accent">
                Live universe
              </p>
              <h2
                id="demo-heading"
                className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
              >
                See the drama unfold
              </h2>
              <p className="mt-4 max-w-xl text-muted">
                Single&apos;s Inferno S5 ships with a timeline scrub, typed relationship
                strings, and export — the same conspiracy-board look every time.
              </p>
              <div className="mt-8">
                <Button
                  href="/demo?show=singles-inferno&episode=ep1"
                  variant="primary"
                  className="min-h-12 px-8 text-base"
                >
                  Open the board
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted">
                More curated shows and fiction maps roll in as we ship Phase 1.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
