import { Button } from "./Button";
import { RelationshipGraphPreview } from "./RelationshipGraphPreview";

export function Hero() {
  return (
    <section
      className="border-b border-border/60 bg-gradient-to-b from-surface/30 to-background"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center lg:gap-16 lg:py-24">
        <div className="max-w-xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">
            While you watch
          </p>
          <h1
            id="hero-heading"
            className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]"
          >
            Stay in the story. We&apos;ll handle the rest.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted sm:text-xl">
            See how every character connects — without spoilers, without leaving your
            show.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button href="/demo" variant="primary" className="min-h-11 px-6 text-base">
              Try Demo
            </Button>
            <Button
              href="/demo?show=singles-inferno"
              variant="secondary"
              className="min-h-11 px-6 text-base"
            >
              Try with Single&apos;s Inferno
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted">
            The faces, the ties, the tension—without tab hunts or ruined twists.
          </p>
        </div>
          <div className="flex justify-center lg:justify-end">
            <RelationshipGraphPreview variant="compact" />
          </div>
      </div>
    </section>
  );
}
