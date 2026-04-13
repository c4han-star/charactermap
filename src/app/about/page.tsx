import Link from "next/link";
import { MarketingShell } from "@/components/landing/MarketingShell";

export const metadata = {
  title: "About | Character Relationship Tracker",
  description: "Who is who—and how they connect—without leaving the episode.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingShell>
        <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
          <Link
            href="/"
            className="text-sm text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]"
          >
            ← Home
          </Link>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">About</h1>
          <p className="mt-4 text-muted">
            Character Relationship Tracker is for the moment you freeze on a face in
            the crowd and need context—without spoilers or a dozen open tabs.
          </p>
          <p className="mt-4 text-muted">
            It belongs beside the show: quick, clear, and tuned to how far you&apos;ve
            watched.
          </p>
        </article>
      </MarketingShell>
    </div>
  );
}
