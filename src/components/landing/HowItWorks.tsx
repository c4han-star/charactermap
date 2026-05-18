const steps = [
  "Open the demo — pick the recommended Single's Inferno board or a suggested title, or type any show",
  "On packaged Single's Inferno, scrub the timeline; on custom boards, generate then refine",
  "Export a shareable still from the fixed cinematic renderer",
] as const;

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="how-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="how-heading"
          className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          How it works
        </h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
                aria-hidden
              >
                {index + 1}
              </span>
              <p className="pt-1 font-medium text-foreground">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
