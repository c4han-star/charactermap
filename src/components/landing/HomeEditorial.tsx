const pillars = [
  {
    title: "Visual storyboards",
    body: "Polaroid energy, color-coded strings, and tension you can scan in one glance—no spreadsheet soul.",
    icon: <IconBoard />,
  },
  {
    title: "Timelines that move",
    body: "Scrub the beat of the season; ties and heat shift with the episode you’re on.",
    icon: <IconTimeline />,
  },
  {
    title: "Share the chaos",
    body: "Frame the wall, export a still, drop it in the group chat—built for viral screenshots.",
    icon: <IconExport />,
  },
] as const;

const steps = [
  { n: "01", title: "Pick a show", body: "Curated tiles or your own title—then open the live board." },
  { n: "02", title: "AI maps the drama", body: "Structured cast + ties rendered in our cinematic corkboard." },
  { n: "03", title: "Explore & export", body: "Scrub timelines, read the overlay, grab a PNG when it hits." },
] as const;

export function HomeEditorial() {
  return (
    <section
      className="relative z-10 border-t border-white/[0.05] py-20 sm:py-28"
      aria-labelledby="obsessed-heading"
    >
      <div className="home-editorial-fade absolute inset-0 opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <h2
          id="obsessed-heading"
          className="font-display max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-[2.75rem]"
        >
          Why drama fans{" "}
          <span className="text-accent">can’t look away</span>
        </h2>
        <p className="mt-4 max-w-xl text-muted">
          Emotional mapping—not graph software. Built for obsession, not productivity.
        </p>

        <ul className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-8 lg:gap-12">
          {pillars.map((p) => (
            <li key={p.title} className="group relative">
              <div className="mb-5 inline-flex rounded-2xl border border-accent/40 p-3 text-accent transition-colors group-hover:border-accent group-hover:bg-accent/10">
                {p.icon}
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-24 border-t border-white/[0.06] pt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">How it unfolds</p>
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-6">
            {steps.map((s) => (
              <li key={s.n} className="relative flex gap-4 md:block">
                <span
                  className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/50 text-sm font-semibold text-accent"
                  aria-hidden
                >
                  {s.n}
                </span>
                <div>
                  <h3 className="font-medium text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function IconBoard() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 14 L12 9 L16 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="9" cy="11" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconTimeline() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 18h16M4 18V6M8 14l3-4 4 5 5-8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconExport() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v10m0 0l-4-4m4 4l4-4M6 18h12"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
