const pains = [
  {
    title: "Too many threads at once",
    body: "Crushes, exes, alliances, and beef — it’s hard to hold the whole picture in your head.",
  },
  {
    title: "The story keeps moving",
    body: "Every episode rewires who trusts who. Static recap articles don’t feel like the show.",
  },
  {
    title: "You want the vibe, not a spreadsheet",
    body: "You’re here for emotional chaos and clarity — not productivity software.",
  },
] as const;

export function Problem() {
  return (
    <section className="border-b border-border/60 py-16 sm:py-20" aria-labelledby="problem-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="problem-heading"
          className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Who’s tied to who — right now?
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Reality and fandom drama are dense. You want a wall you can stare at, not another
          tab rabbit hole.
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
