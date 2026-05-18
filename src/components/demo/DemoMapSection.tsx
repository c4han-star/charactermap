"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  RelationshipGraphPreview,
  type OverrideGraphPayload,
} from "@/components/landing/RelationshipGraphPreview";

export type DemoUniverse = "generic" | "singles-inferno";

type DemoMapSectionProps = {
  universe: DemoUniverse;
};

type AiLayerState = {
  characters: OverrideGraphPayload["characters"];
  edges: OverrideGraphPayload["edges"];
  episodeSummary: string;
  confidenceNote: string;
};

function friendlyApiMessage(data: {
  error?: string;
  message?: string;
  status?: number;
}, fallback: string) {
  if (data.error === "NO_API_KEY") {
    return "This deployment isn’t connected to an AI provider yet. The site owner needs to add keys in the hosting dashboard (same names as a local .env file).";
  }
  return data.message ?? data.error ?? fallback;
}

export function DemoMapSection({ universe }: DemoMapSectionProps) {
  const searchParams = useSearchParams();
  const episodeId =
    searchParams.get("episode") &&
    ["ep1", "ep2", "ep3", "ep4", "ep5"].includes(searchParams.get("episode")!)
      ? (searchParams.get("episode") as string)
      : "ep1";

  const [useCustomAiBoard, setUseCustomAiBoard] = useState(false);
  const [aiLayer, setAiLayer] = useState<AiLayerState | null>(null);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [customTitle, setCustomTitle] = useState("");
  const [customPremise, setCustomPremise] = useState("");
  const [customMaxCast, setCustomMaxCast] = useState(14);
  const [photoResolveNote, setPhotoResolveNote] = useState<string | null>(null);
  const [photoOverrideText, setPhotoOverrideText] = useState("");

  const story = useCustomAiBoard
    ? "generic"
    : universe === "singles-inferno"
      ? "singles-inferno-s5"
      : "generic";

  useEffect(() => {
    setAiLayer(null);
    setAiErr(null);
    setUseCustomAiBoard(false);
    setPhotoResolveNote(null);
    setPhotoOverrideText("");
  }, [episodeId, universe]);

  const queryKey = searchParams.toString();
  useEffect(() => {
    if (universe === "singles-inferno") return;
    const params = new URLSearchParams(queryKey);
    const title = params.get("title");
    if (typeof title === "string" && title.trim().length >= 2) {
      setCustomTitle(title.trim());
    }
    const premise = params.get("premise");
    if (typeof premise === "string" && premise.trim()) {
      setCustomPremise(premise.trim());
    }
  }, [universe, queryKey]);

  const overrideGraph = useMemo<OverrideGraphPayload | null>(
    () =>
      aiLayer
        ? { characters: aiLayer.characters, edges: aiLayer.edges }
        : null,
    [aiLayer],
  );

  const fetchCustomGraph = useCallback(async () => {
    const title = customTitle.trim();
    if (title.length < 2) {
      setAiErr("Add a show title (at least two characters).");
      return;
    }
    setLoading(true);
    setAiErr(null);
    setPhotoResolveNote(null);
    setPhotoOverrideText("");
    try {
      const res = await fetch("/api/agent-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customShow: {
            title,
            premise: customPremise.trim(),
            maxCharacters: customMaxCast,
          },
          language: "en",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        characters?: AiLayerState["characters"];
        edges?: AiLayerState["edges"];
        episodeSummary?: string;
        confidenceNote?: string;
      };
      if (!res.ok) {
        setAiErr(friendlyApiMessage(data, `Something went wrong (${res.status}).`));
        return;
      }
      if (!data.characters?.length || !data.edges) {
        setAiErr("The story didn’t come back complete—try again in a moment.");
        return;
      }
      let characters = data.characters;
      try {
        const ph = await fetch("/api/cast-headshots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cast: characters.map((c) => ({
              id: c.id,
              name: c.name,
              ...(c.actorName ? { actorName: c.actorName } : {}),
            })),
            showTitle: title,
            language: "en",
          }),
        });
        if (ph.ok) {
          const pj = (await ph.json()) as {
            images?: Record<string, string>;
            diagnostics?: {
              tvId: number | null;
              tmdbMatchedCount: number;
              creditsCastCount: number;
            };
          };
          const map = pj.images ?? {};
          characters = characters.map((c) =>
            map[c.id] ? { ...c, photoUrl: map[c.id] } : c,
          );
          const d = pj.diagnostics;
          const n = data.characters.length;
          const resolved = Object.keys(map).length;
          const tmdbCastHits =
            typeof d?.tmdbMatchedCount === "number" ? d.tmdbMatchedCount : 0;
          if (d && !d.tvId && title.length >= 2) {
            setPhotoResolveNote(
              "TMDB did not match a TV series for this title. Try spelling the title as listed on themoviedb.org. Without Google Custom Search image keys, some cards may stay on placeholders.",
            );
          } else if (d?.tvId && d.tmdbMatchedCount === 0 && resolved === 0) {
            setPhotoResolveNote(
              "TMDB matched the show, but no cast headshots lined up with your character names. Add actorName for fictional roles, or paste manual photo URLs (JSON in Advanced settings).",
            );
          } else if (d?.tvId && resolved < n) {
            setPhotoResolveNote(
              `Some characters still have no photo (${resolved}/${n}). Regenerate with actorName hints, or set links manually in JSON.`,
            );
          } else if (
            d?.tvId &&
            resolved === n &&
            tmdbCastHits < n
          ) {
            setPhotoResolveNote(
              `Every card has an image, but only ${tmdbCastHits}/${n} came from TMDB episode credits; the rest used TMDB person search or Google Images and are more likely to mismatch the role. Use manual JSON or actorName, then regenerate.`,
            );
          }
        }
      } catch {
        /* keep LLM characters without photoUrl */
      }
      setUseCustomAiBoard(true);
      setAiLayer({
        characters,
        edges: data.edges,
        episodeSummary: data.episodeSummary ?? "",
        confidenceNote: data.confidenceNote ?? "",
      });
    } catch {
      setAiErr("Network hiccup—try again.");
    } finally {
      setLoading(false);
    }
  }, [customTitle, customPremise, customMaxCast]);

  const fetchAiGraph = useCallback(async () => {
    if (universe !== "singles-inferno") return;
    setLoading(true);
    setAiErr(null);
    try {
      const res = await fetch("/api/agent-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universe: "singles-inferno-s5",
          episodeId,
          language: "en",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        characters?: AiLayerState["characters"];
        edges?: AiLayerState["edges"];
        episodeSummary?: string;
        confidenceNote?: string;
      };
      if (!res.ok) {
        setAiErr(friendlyApiMessage(data, `Something went wrong (${res.status}).`));
        return;
      }
      if (!data.characters?.length || !data.edges) {
        setAiErr("The story didn’t come back complete—try again in a moment.");
        return;
      }
      setUseCustomAiBoard(false);
      setAiLayer({
        characters: data.characters,
        edges: data.edges,
        episodeSummary: data.episodeSummary ?? "",
        confidenceNote: data.confidenceNote ?? "",
      });
    } catch {
      setAiErr("Network hiccup—try again.");
    } finally {
      setLoading(false);
    }
  }, [universe, episodeId]);

  const clearAi = useCallback(() => {
    setAiLayer(null);
    setAiErr(null);
    setUseCustomAiBoard(false);
    setPhotoResolveNote(null);
    setPhotoOverrideText("");
  }, []);

  const applyPhotoOverrides = useCallback(() => {
    if (!aiLayer) return;
    const raw = photoOverrideText.trim();
    if (!raw) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setAiErr("Could not parse photo JSON.");
      return;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setAiErr('Photo JSON must be an object: { "character_id": "https://..." }');
      return;
    }
    const o = parsed as Record<string, unknown>;
    let applied = 0;
    const next = aiLayer.characters.map((c) => {
      const v = o[c.id];
      if (typeof v !== "string") return c;
      const url = v.trim();
      if (!url.startsWith("https://") || url.length > 2000) return c;
      applied += 1;
      return { ...c, photoUrl: url };
    });
    if (applied === 0) {
      setAiErr(
        "No links applied: keys must match existing character ids and values must be https image URLs.",
      );
      return;
    }
    setAiLayer({ ...aiLayer, characters: next });
    setPhotoResolveNote(
      `Applied manual photo URLs for ${applied} character(s).`,
    );
    setAiErr(null);
  }, [aiLayer, photoOverrideText]);

  return (
    <div className="relative z-10 space-y-12">
      <div className="relative rounded-[1.35rem] bg-zinc-950/50 px-8 py-11 shadow-[0_28px_90px_-28px_rgba(0,0,0,0.92)] ring-1 ring-white/[0.08] backdrop-blur-2xl sm:px-12 sm:py-14">
        <div className="space-y-8" onPointerDown={(e) => e.stopPropagation()}>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Show title
            </span>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="The Glory, Single’s Inferno, Heart Signal…"
              className="mt-3 w-full border-0 border-b border-white/15 bg-transparent pb-3 text-lg text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent/80"
              maxLength={120}
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Focus or notes (optional)
            </span>
            <textarea
              value={customPremise}
              onChange={(e) => setCustomPremise(e.target.value)}
              placeholder="Love triangle, betrayal arc, episode 6 tension…"
              rows={3}
              className="mt-3 w-full resize-y rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted/45 focus:border-white/20"
              maxLength={2500}
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-6">
            <span className="text-xs text-muted">Cast size</span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={4}
                max={20}
                value={customMaxCast}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  setCustomMaxCast(Math.min(20, Math.max(4, Math.round(v))));
                }}
                className="w-16 rounded-md border border-white/12 bg-black/30 px-2 py-1.5 text-center text-sm text-foreground outline-none focus:border-white/25"
                aria-label="Maximum characters on board"
              />
              <span className="text-xs text-muted/80">4–20 roles</span>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => void fetchCustomGraph()}
            className="demo-cta-glow relative w-full rounded-xl bg-accent py-4 text-base font-semibold tracking-wide text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-45"
          >
            {loading ? "Generating…" : "Generate relationship map"}
          </button>
        </div>
      </div>

      {universe === "singles-inferno" ? (
        <div
          data-agent-toolbar
          className="flex flex-col items-stretch gap-4 rounded-2xl border border-white/[0.07] bg-black/25 px-6 py-6 text-center backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:text-left"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="text-sm leading-relaxed text-muted">
            Season 5 showcase — generate ties for the episode you&apos;re scrubbing.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => void fetchAiGraph()}
            className="shrink-0 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.1] disabled:opacity-45"
          >
            {loading ? "Generating…" : "Refresh episode map"}
          </button>
        </div>
      ) : null}

      {aiErr ? (
        <p
          className="rounded-lg border border-red-500/25 bg-red-950/20 px-4 py-3 text-center text-sm text-red-200/95"
          role="alert"
        >
          {aiErr}
        </p>
      ) : null}

      {photoResolveNote ? (
        <p className="text-center text-xs leading-relaxed text-amber-200/75">
          Some portraits may not match the cast perfectly. Open{" "}
          <span className="text-amber-100/90">Advanced settings</span> for fixes
          and technical detail.
        </p>
      ) : null}

      <details className="group rounded-2xl border border-white/[0.06] bg-black/20 backdrop-blur-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm text-muted transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
          <span className="font-medium tracking-wide">Advanced settings</span>
          <span
            className="text-xs text-muted/80 transition-transform group-open:rotate-180"
            aria-hidden
          >
            ▼
          </span>
        </summary>
        <div className="space-y-5 border-t border-white/[0.06] px-5 py-5 text-xs leading-relaxed text-muted">
          <section className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
              Host &amp; API setup
            </h3>
            <p>
              The server needs <code className="text-foreground/90">OPENAI_API_KEY</code>{" "}
              or <code className="text-foreground/90">DEEPSEEK_API_KEY</code> (Vercel:
              Project → Settings → Environment Variables; locally:{" "}
              <code className="text-foreground/90">.env.local</code>
              ). If both exist, OpenAI is used unless{" "}
              <code className="text-foreground/90">LLM_PROVIDER=deepseek</code>. If you set{" "}
              <code className="text-foreground/90">LLM_CHAT_COMPLETIONS_URL</code>, also set{" "}
              <code className="text-foreground/90">LLM_API_KEY</code> (or a provider key
              above). Optional:{" "}
              <code className="text-foreground/90">DEEPSEEK_MODEL</code>,{" "}
              <code className="text-foreground/90">OPENAI_MODEL</code>.
            </p>
            <p>
              This flow requests <strong className="text-foreground/90">English</strong>{" "}
              labels from the model. Cast photos use{" "}
              <code className="text-foreground/90">TMDB_API_KEY</code> (TV search, credits,
              person search). Optional{" "}
              <code className="text-foreground/90">GOOGLE_CSE_API_KEY</code> +{" "}
              <code className="text-foreground/90">GOOGLE_CSE_CX</code> for image fallback.
              Wikipedia is not used. Output is model-generated and may not match a real
              show.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
              Board legend
            </h3>
            <p>
              Pink = romance · blue = alliance · red = conflict / betrayal · dashed = crush
              or hidden ties.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
              Accuracy
            </h3>
            <p>
              Models can misremember names or timelines; for factual grounding you can add
              retrieval (RAG / browsing) later.
            </p>
          </section>

          {photoResolveNote ? (
            <section className="space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                Photo matching (full message)
              </h3>
              <p className="whitespace-pre-wrap rounded-md border border-white/10 bg-black/30 p-3 font-mono text-[11px] text-zinc-300">
                {photoResolveNote}
              </p>
            </section>
          ) : null}

          {aiLayer && useCustomAiBoard ? (
            <section className="space-y-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                Manual photo URLs (JSON)
              </h3>
              <p>
                When a face doesn&apos;t match the role, paste a JSON object: keys are{" "}
                <code className="text-foreground/90">characters[].id</code>, values are{" "}
                <code className="text-foreground/90">https://</code> image URLs. Example:{" "}
                <code className="text-foreground/90">
                  {`{"heesun":"https://image.tmdb.org/t/p/w185/....jpg"}`}
                </code>
              </p>
              <textarea
                value={photoOverrideText}
                onChange={(e) => setPhotoOverrideText(e.target.value)}
                rows={4}
                spellCheck={false}
                placeholder='{"role_id":"https://..."}'
                className="w-full resize-y rounded-lg border border-white/10 bg-black/35 px-3 py-2 font-mono text-[11px] text-foreground outline-none focus:border-white/20"
              />
              <button
                type="button"
                onClick={() => applyPhotoOverrides()}
                className="rounded-lg border border-white/12 bg-white/[0.06] px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.1]"
              >
                Apply photo URLs
              </button>
            </section>
          ) : null}
        </div>
      </details>

      {aiLayer ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-5 py-5 text-sm leading-relaxed backdrop-blur-sm">
            {aiLayer.episodeSummary ? (
              <p className="text-pretty text-foreground/95">{aiLayer.episodeSummary}</p>
            ) : null}
            {aiLayer.confidenceNote ? (
              <p className="mt-3 text-pretty text-xs text-muted">{aiLayer.confidenceNote}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={clearAi}
            className="text-sm text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Clear board and start over
          </button>
        </div>
      ) : null}

      <div className="pt-2">
        <RelationshipGraphPreview
          variant="full"
          story={story}
          overrideGraph={overrideGraph}
          aiOverlay={Boolean(aiLayer)}
        />
      </div>
    </div>
  );
}
