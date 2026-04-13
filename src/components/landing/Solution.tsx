const features = [
  {
    title: "See the full picture",
    body: "Understand how everyone is connected at a glance.",
  },
  {
    title: "Stay spoiler-safe",
    body: "Only see what's been revealed so far.",
  },
  {
    title: "Tap and understand",
    body: "Instantly know who a character is and how they matter.",
  },
] as const;

export function Solution() {
  return (
    <section
      className="border-b border-border/60 py-16 sm:py-20"
      aria-labelledby="solution-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="solution-heading"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Everything, right when you need it
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          No homework. No spoilers. Just the people in this moment.
        </p>
        <ol className="mt-10 space-y-4">
          {features.map((f, i) => (
            <li
              key={f.title}
              className="flex gap-4 rounded-lg border border-transparent px-1 py-3 transition-colors hover:border-border hover:bg-surface/40 sm:gap-5 sm:px-4"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-elevated text-xs font-semibold text-muted"
                aria-hidden
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-medium text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
