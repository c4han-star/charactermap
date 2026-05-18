import Image from "next/image";
import Link from "next/link";
import { DemoMapSection } from "@/components/demo/DemoMapSection";
import { Button } from "@/components/landing/Button";
import { MarketingShell } from "@/components/landing/MarketingShell";

type DemoPageProps = {
  searchParams: Promise<{ show?: string | string[] }>;
};

export const metadata = {
  title: "Demo | AI Drama Relationship Map",
  description:
    "Generate a corkboard relationship graph for any TV show you describe, with optional Single's Inferno S5 demo data.",
};

const packagedExample = {
  id: "singles-inferno" as const,
  title: "Single's Inferno S5",
  blurb: "Single's Inferno (Korean dating show) — fixed cast, five-episode timeline (no custom LLM call).",
  href: "/demo?show=singles-inferno&episode=ep1",
};

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const sp = await searchParams;
  const raw = sp.show;
  const show = Array.isArray(raw) ? raw[0] : raw;
  const isSinglesInferno = show === "singles-inferno";
  const universe = isSinglesInferno ? "singles-inferno" : "generic";

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
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Demo
            </h1>
            <p className="mt-3 text-muted">
              Type any series title and optional notes — the board below calls your LLM
              (<code className="text-foreground">DEEPSEEK_API_KEY</code> or{" "}
              <code className="text-foreground">OPENAI_API_KEY</code> in{" "}
              <code className="text-foreground">.env.local</code>
              ) and builds a fresh graph. Single&apos;s Inferno S5 is only a packaged
              example with a timeline scrubber, not the main workflow.
            </p>
          </header>

          <section className="mt-10" aria-labelledby="graph-board-title">
            <h2
              id="graph-board-title"
              className="text-sm font-medium text-foreground"
            >
              Interactive board
            </h2>
            <p className="mt-2 max-w-prose text-sm text-muted">
              Start with <span className="text-foreground">Your show</span> to generate
              from scratch. Pink = romance, blue = alliance, red = conflict / betrayal,
              dashed = crush or hidden ties. Want a reference board? Use the packaged
              example below.
            </p>
            <div className="mt-6">
              <DemoMapSection universe={universe} />
            </div>
          </section>

          <section
            className="mt-10 border-t border-border pt-8"
            aria-labelledby="packaged-example"
          >
            <h2
              id="packaged-example"
              className="text-sm font-medium text-foreground"
            >
              Packaged example
            </h2>
            <p className="mt-2 max-w-prose text-sm text-muted">
              One curated demo you can open without typing a title — useful to see the
              timeline scrubber and edge styles on a full cast.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <Link
                href={packagedExample.href}
                className={`block max-w-md rounded-lg border px-4 py-3 text-sm transition-colors ${
                  isSinglesInferno
                    ? "border-accent bg-accent-muted"
                    : "border-border bg-surface/50 hover:border-zinc-600"
                }`}
              >
                <span className="font-medium text-foreground">{packagedExample.title}</span>
                <span className="mt-0.5 block text-xs text-muted sm:text-sm">
                  {packagedExample.blurb}
                </span>
              </Link>
              {isSinglesInferno ? (
                <Link
                  href="/demo"
                  className="text-sm text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  ← Use your own show (clear demo URL)
                </Link>
              ) : null}
            </div>
          </section>

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
                    Scrub the timeline — ties and colors update per episode (demo).
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-3">
            <Button href="/" variant="secondary">
              Back to home
            </Button>
          </div>
        </div>
      </MarketingShell>
    </div>
  );
}
