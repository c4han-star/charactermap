"use client";

import { useState } from "react";
import type { ImportedGraphPayload } from "@/components/landing/RelationshipGraphPreview";

type StoryImportPanelProps = {
  onImported: (graph: ImportedGraphPayload) => void;
  onClear: () => void;
  hasImport: boolean;
};

export function StoryImportPanel({
  onImported,
  onClear,
  hasImport,
}: StoryImportPanelProps) {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHint(null);
    try {
      const res = await fetch("/api/story-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, url }),
      });
      const data = (await res.json()) as {
        graph?: ImportedGraphPayload;
        error?: string;
        hint?: string;
      };
      if (!res.ok || !data.graph) {
        throw new Error(data.error ?? "Request failed");
      }
      onImported(data.graph);
      if (data.hint) setHint(data.hint);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface/30 p-4 sm:p-5">
      <h3 className="text-sm font-medium text-foreground">Import your story</h3>
      <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
        Paste narrative text, optionally add a link to an article (plain HTML only—many sites block
        scraping). The server builds characters and relationship strings; add{" "}
        <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px]">
          OPENAI_API_KEY
        </code>{" "}
        in <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px]">.env.local</code>{" "}
        for AI-powered extraction, or rely on the built-in heuristic (English names + same-sentence
        co-mentions).
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Paste character summaries, plot beats, or transcripts..."
          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-[color:var(--ring)] placeholder:text-muted focus-visible:ring-2"
          aria-label="Story text"
        />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article (optional)"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-[color:var(--ring)] placeholder:text-muted focus-visible:ring-2"
          aria-label="Article URL"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[color:var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate relationship board"}
          </button>
          {hasImport ? (
            <button
              type="button"
              onClick={() => {
                onClear();
                setHint(null);
              }}
              className="rounded-lg border border-border bg-transparent px-4 py-2 text-sm text-muted transition hover:bg-surface hover:text-foreground"
            >
              Clear import · restore Single&apos;s Inferno demo
            </button>
          ) : null}
        </div>
      </form>

      {error ? (
        <p className="mt-3 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {hint ? <p className="mt-3 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
