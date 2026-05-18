import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <Link
            href="/about"
            className="transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]"
          >
            Contact
          </Link>
        </nav>
        <p className="text-xs text-muted sm:text-right">
          Emotional mapping · detective energy · built for screenshots.
        </p>
      </div>
    </footer>
  );
}
