import Link from "next/link";
import { Button } from "./Button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]"
        >
          Character Relationship Tracker
        </Link>
        <nav className="flex items-center gap-2">
          <Button href="/demo" variant="primary" className="py-2 text-xs sm:text-sm">
            Try Demo
          </Button>
        </nav>
      </div>
    </header>
  );
}
