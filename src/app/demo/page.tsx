import Image from "next/image";
import Link from "next/link";
import { DemoStorySection } from "@/components/demo/DemoStorySection";
import { Button } from "@/components/landing/Button";
import { MarketingShell } from "@/components/landing/MarketingShell";

type DemoPageProps = {
  searchParams: Promise<{ show?: string | string[] }>;
};

export const metadata = {
  title: "Demo | Character Relationship Tracker",
  description:
    "Try Single's Inferno—messy relationships, spoiler-safe through Episode 1.",
};

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const sp = await searchParams;
  const raw = sp.show;
  const show = Array.isArray(raw) ? raw[0] : raw;
  const isSinglesInferno = show === "singles-inferno";

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingShell>
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <nav className="text-sm text-muted">
            <Link
              href="/"
              className="transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]"
            >
              ← Home
            </Link>
          </nav>

          <header className="mt-8 max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Demo</h1>
            <p className="mt-3 text-muted">
              Step in like you opened a panel mid-episode—the cast and connections will
              appear here as we wire in the full experience.
            </p>
          </header>

          {isSinglesInferno ? (
            <div
              className="mt-8 overflow-hidden rounded-xl border border-border"
              role="status"
            >
              <div className="relative aspect-[21/9] max-h-44 sm:max-h-52">
                <Image
                  src="/images/singles-inferno-poster.png"
                  alt="Single's Inferno key art."
                  fill
                  className="object-cover object-[center_20%]"
                  sizes="(max-width: 768px) 100vw, 1152px"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-center px-5 sm:px-8">
                  <p className="text-base font-semibold text-foreground sm:text-lg">
                    Single&apos;s Inferno
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Episode 1 — we only show what you&apos;ve earned so far.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <section
            className="mt-10"
            aria-labelledby="graph-board-title"
          >
            <h2
              id="graph-board-title"
              className="text-sm font-medium text-foreground"
            >
              The map
            </h2>
            <p className="mt-2 max-w-prose text-sm text-muted">
              Drag the polaroids, pan the corkboard, follow the red string. Import your own
              story text or a link to auto-build a board, or use the Single&apos;s Inferno
              episode picker.
            </p>
            <div className="mt-6">
              <DemoStorySection />
            </div>
          </section>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button href="/demo?show=singles-inferno&episode=ep1" variant="primary">
              Open Single&apos;s Inferno
            </Button>
            <Button href="/" variant="secondary">
              Back to home
            </Button>
          </div>
        </div>
      </MarketingShell>
    </div>
  );
}
