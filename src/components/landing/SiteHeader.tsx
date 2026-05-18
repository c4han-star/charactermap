import Link from "next/link";
import { Button } from "./Button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050506]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:h-16 sm:px-8">
        <Link
          href="/"
          className="font-display text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-white sm:text-base"
        >
          Drama Relationship Map
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            href="/demo"
            variant="primary"
            className="rounded-full py-2.5 text-xs font-semibold tracking-wide sm:text-sm"
          >
            Try demo
          </Button>
          <details className="group relative">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-foreground transition-colors hover:border-white/20 hover:bg-white/[0.08] [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Open menu</span>
              <span className="flex flex-col gap-1.5" aria-hidden>
                <span className="h-px w-4 bg-current" />
                <span className="h-px w-4 bg-current" />
                <span className="h-px w-4 bg-current" />
              </span>
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-xl border border-white/10 bg-zinc-950/95 py-2 shadow-2xl ring-1 ring-black/60 backdrop-blur-md">
              <Link
                href="/about"
                className="block px-4 py-2.5 text-sm text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block px-4 py-2.5 text-sm text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground"
              >
                Contact
              </Link>
              <Link
                href="/demo"
                className="block px-4 py-2.5 text-sm text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground"
              >
                Full demo
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
