import Link from "next/link";

function demoPrefill(seedTitle: string, seedPremise: string) {
  const p = new URLSearchParams();
  p.set("title", seedTitle);
  if (seedPremise.trim()) p.set("premise", seedPremise.trim());
  return `/demo?${p.toString()}`;
}

/** Display label, one-line pitch, and LLM seed strings (English for the demo API). */
const suggestedBoards = [
  {
    label: "Heart Signal",
    line: "Korean dating panel show — opens the demo with a starter prompt.",
    seedTitle: "Heart Signal",
    seedPremise:
      "Korean dating reality: cast members, panelists, and evolving love lines across the season.",
  },
  {
    label: "Transit Love / EXchange",
    line: "Exes under one roof — pre-filled for a reunion-drama style map.",
    seedTitle: "Transit Love 2",
    seedPremise:
      "Korean dating show where former couples live together; focus on unresolved ties and new attractions.",
  },
  {
    label: "The Glory",
    line: "Revenge drama — strong character web, good for testing the renderer.",
    seedTitle: "The Glory",
    seedPremise:
      "Netflix Korean revenge drama: school bullies, victims, allies, and schemes — one season arc.",
  },
  {
    label: "K-pop universe",
    line: "Crew rivalries and collabs — concrete dance-comp seed for the model.",
    seedTitle: "Street Woman Fighter",
    seedPremise:
      "Korean dance survival show: competing street dance crews, judges, eliminations, and alliances.",
  },
  {
    label: "Harry Potter",
    line: "Fiction web — factions, friendships, and rivalries in one pass.",
    seedTitle: "Harry Potter",
    seedPremise:
      "Wizarding world core cast: Hogwarts houses, Order of the Phoenix, Death Eaters, and key bonds.",
  },
] as const;

const singlesHref = "/demo?show=singles-inferno&episode=ep1";

export function FeaturedUniverses() {
  return (
    <section
      className="border-b border-border/60 py-16 sm:py-20"
      aria-labelledby="suggested-boards-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-xs font-medium tracking-wide text-muted">Try it</p>
        <h2
          id="suggested-boards-heading"
          className="font-display mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          Suggested boards
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Open the live demo for any tile.{" "}
          <span className="text-foreground">Single&apos;s Inferno</span> is the packaged
          Season&nbsp;5 showcase (timeline + curated cast) — our best reference. Other picks
          pre-fill the generator; add your LLM keys in{" "}
          <code className="text-foreground">.env.local</code>, then tap{" "}
          <span className="text-foreground">Generate</span>.
        </p>

        <div className="mt-10 space-y-8">
          <Link
            href={singlesHref}
            className="group block rounded-2xl border-2 border-accent bg-gradient-to-br from-accent-muted/80 to-surface/60 p-6 shadow-sm transition-colors hover:border-accent-hover hover:from-accent-muted sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Recommended
            </p>
            <h3 className="font-display mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Single&apos;s Inferno
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Season&nbsp;5 demo board with episode timeline and polished cast layout — the
              clearest example of how the corkboard looks at full quality. No custom title
              required.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent group-hover:underline">
              Open packaged demo
              <span aria-hidden>→</span>
            </span>
          </Link>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedBoards.map((b) => (
              <li key={b.label}>
                <Link
                  href={demoPrefill(b.seedTitle, b.seedPremise)}
                  className="flex h-full flex-col rounded-xl border border-border bg-surface/50 p-5 transition-colors hover:border-zinc-500 hover:bg-surface"
                >
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {b.label}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{b.line}</p>
                  <span className="mt-4 text-sm font-medium text-foreground/90">
                    Open demo <span aria-hidden>→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
