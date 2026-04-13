import Link from "next/link";
import { MarketingShell } from "@/components/landing/MarketingShell";

export const metadata = {
  title: "Contact | Character Relationship Tracker",
  description: "Contact the Character Relationship Tracker team.",
};

export default function ContactPage() {
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
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">Contact</h1>
          <p className="mt-4 text-muted">
            For partnerships, research access, or product questions, reach the team at
            the address you use for this prototype (replace with your production inbox).
          </p>
          <p className="mt-6 text-sm text-muted">
            Tip: wire this block to your support form or mailto link when you go live.
          </p>
        </article>
      </MarketingShell>
    </div>
  );
}
