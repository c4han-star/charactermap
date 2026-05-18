/**
 * Decorative “investigation board” for the homepage hero — not the interactive graph.
 */
export function ConspiracyHeroWall() {
  return (
    <div
      className="relative mx-auto aspect-[4/3] w-full max-w-[min(100%,560px)] select-none overflow-visible sm:aspect-[5/4]"
      aria-hidden
    >
      {/* Cork / archive wall */}
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#1c1410] via-[#12100e] to-[#0a0908] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-white/[0.06]" />
      <div className="absolute inset-0 rounded-[2rem] opacity-[0.07] mix-blend-overlay [background-image:url('data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E')]" />

      {/* Red strings (SVG) */}
      <svg
        className="absolute inset-0 h-full w-full overflow-visible text-accent"
        viewBox="0 0 400 360"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          d="M72 118 C120 80 200 200 280 92"
          className="home-string-pulse"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeOpacity="0.55"
        />
        <path
          d="M310 210 C240 180 160 260 95 245"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        <path
          d="M200 48 C205 120 195 220 188 300"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeOpacity="0.35"
        />
      </svg>

      {/* Polaroid cluster */}
      <Polaroid
        className="left-[6%] top-[10%] w-[28%] -rotate-[9deg]"
        tone="from-rose-900/40 to-zinc-900"
        caption="Ex-lovers"
      />
      <Polaroid
        className="right-[8%] top-[14%] w-[26%] rotate-[7deg]"
        tone="from-slate-800 to-zinc-950"
        caption="Rivals"
      />
      <Polaroid
        className="bottom-[12%] left-[18%] w-[30%] rotate-[4deg]"
        tone="from-amber-950/50 to-stone-950"
        caption="Crush"
      />

      {/* Sticky notes */}
      <Sticky className="right-[14%] top-[38%] rotate-[11deg] border-amber-200/20 bg-amber-950/35 text-amber-100/90">
        Who’s lying?
      </Sticky>
      <Sticky className="left-[40%] top-[6%] -rotate-[6deg] border-yellow-200/15 bg-yellow-950/30 text-yellow-100/85">
        Love triangle
      </Sticky>

      {/* Center chaos tag */}
      <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <span className="rounded-full border border-accent/50 bg-accent/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-accent shadow-[0_0_24px_-4px_rgba(220,38,38,0.5)]">
          Center of chaos
        </span>
        <span className="mt-2 h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_2px_rgba(220,38,38,0.55)] animate-pulse" />
      </div>

      {/* Soft blue alliance hint (small) */}
      <div className="absolute bottom-[22%] right-[22%] h-16 w-16 rounded-full bg-sky-500/10 blur-2xl" />
      {/* Pink romance glow */}
      <div className="absolute left-[32%] top-[48%] h-20 w-20 rounded-full bg-pink-500/10 blur-2xl" />
    </div>
  );
}

function Polaroid({
  className,
  tone,
  caption,
}: {
  className: string;
  tone: string;
  caption: string;
}) {
  return (
    <div
      className={`absolute z-[5] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.85)] ${className}`}
    >
      <div className="rounded-sm border border-white/90 bg-white p-[6%] pb-[14%] shadow-inner">
        <div
          className={`aspect-square w-full rounded-[2px] bg-gradient-to-br ${tone} ring-1 ring-black/20`}
        />
        <p className="mt-[5%] text-center font-[family-name:var(--font-geist-sans)] text-[9px] font-medium uppercase tracking-wider text-zinc-600 sm:text-[10px]">
          {caption}
        </p>
      </div>
    </div>
  );
}

function Sticky({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute z-[6] max-w-[38%] border px-2 py-1.5 font-[family-name:var(--font-playfair),serif] text-[10px] italic shadow-md sm:px-3 sm:py-2 sm:text-xs ${className}`}
    >
      {children}
    </div>
  );
}
