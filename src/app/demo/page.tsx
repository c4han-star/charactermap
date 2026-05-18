import Image from "next/image";
import Link from "next/link";
import { DemoMapSection } from "@/components/demo/DemoMapSection";

type DemoPageProps = {
  searchParams: Promise<{ show?: string | string[] }>;
};

export const metadata = {
  title: "Demo | Drama Relationship Map",
  description:
    "Visualize alliances, betrayals, and tension—AI-powered relationship maps for any drama or reality show.",
};

const packagedHref = "/demo?show=singles-inferno&episode=ep1";

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const sp = await searchParams;
  const raw = sp.show;
  const show = Array.isArray(raw) ? raw[0] : raw;
  const isSinglesInferno = show === "singles-inferno";
  const universe = isSinglesInferno ? "singles-inferno" : "generic";

  return (
    <div className="relative flex min-h-screen flex-col bg-[#060608] text-foreground">
      <div className="demo-atmosphere" aria-hidden />
      <div className="demo-atmosphere-vignette" aria-hidden />
      <div className="demo-atmosphere-noise" aria-hidden />

      <header className="relative z-10 border-b border-white/[0.06] bg-[#060608]/40 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="font-display text-sm font-semibold tracking-tight text-foreground/95 transition-colors hover:text-white"
          >
            Drama Relationship Map
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        <div className="pointer-events-none absolute left-1/2 top-[28%] h-[min(520px,55vh)] w-[min(900px,90vw)] -translate-x-1/2 -translate-y-1/2">
          <div className="demo-line-texture h-full w-full" aria-hidden />
        </div>

        <div className="relative mx-auto max-w-3xl px-5 pb-6 pt-16 text-center sm:px-8 sm:pt-20">
          <h1 className="font-display text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[3.5rem] lg:leading-[1.08]">
            Visualize the Chaos
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
            Generate AI-powered relationship maps for dramas, reality shows, and fandom
            universes.
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted/80">
            See alliances, betrayals, tension, and romance unfold.
          </p>
        </div>

        <div className="relative mx-auto mt-4 max-w-xl px-5 pb-6 text-center sm:px-8">
          {isSinglesInferno ? (
            <Link
              href="/demo"
              className="text-sm text-muted/90 underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              ← Build your own show
            </Link>
          ) : (
            <p className="text-sm text-muted/85">
              Curated showcase:{" "}
              <Link
                href={packagedHref}
                className="font-medium text-foreground/90 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Single&apos;s Inferno S5
              </Link>
              <span className="text-muted/70"> · timeline & full cast</span>
            </p>
          )}
        </div>

        <div className="relative w-full max-w-none px-3 pb-16 sm:px-5 sm:pb-24 lg:px-8">
          <DemoMapSection universe={universe} />
        </div>

        {isSinglesInferno ? (
          <div className="relative z-10 mx-auto max-w-4xl px-5 pb-20 sm:px-8">
            <div
              className="overflow-hidden rounded-2xl ring-1 ring-white/10"
              role="status"
            >
              <div className="relative aspect-[21/9] max-h-48 sm:max-h-56">
                <Image
                  src="/images/singles-inferno-poster.png"
                  alt="Single's Inferno key art."
                  fill
                  className="object-cover object-[center_22%]"
                  sizes="(max-width: 768px) 100vw, 896px"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-[#060608] via-[#060608]/88 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-center px-6 sm:px-10">
                  <p className="font-display text-lg font-semibold text-foreground sm:text-xl">
                    Single&apos;s Inferno
                  </p>
                  <p className="mt-1.5 text-sm text-muted">
                    Scrub the timeline—ties shift with each episode.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <footer className="relative z-10 border-t border-white/[0.06] py-10">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-5 text-center text-xs text-muted sm:flex-row sm:px-8 sm:text-left">
            <p>Drama Relationship Map</p>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link href="/" className="transition-colors hover:text-foreground">
                Home
              </Link>
              <Link href="/about" className="transition-colors hover:text-foreground">
                About
              </Link>
              <Link href="/contact" className="transition-colors hover:text-foreground">
                Contact
              </Link>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
}
