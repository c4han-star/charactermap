const pains = [
  {
    title: "Too many faces to remember",
    body: "Someone walks back in and you hit pause—wait, who is that again?",
  },
  {
    title: "Relationships that change every episode",
    body: "Crushes, rivalries, and alliances keep shifting under your feet.",
  },
  {
    title: "Looking things up breaks the experience",
    body: "You reach for your phone and suddenly you’re reading ahead—or losing the mood.",
  },
] as const;

export function Problem() {
  return (
    <section className="border-b border-border/60 py-16 sm:py-20" aria-labelledby="problem-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="problem-heading"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Ever paused just to figure out who someone is?
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Pause. Rewind. Glance at your phone. It happens to everyone.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {pains.map((item) => (
            <li
              key={item.title}
              className="rounded-lg border border-border bg-surface/50 p-5 transition-colors hover:border-zinc-600 hover:bg-surface"
            >
              <h3 className="font-medium text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
