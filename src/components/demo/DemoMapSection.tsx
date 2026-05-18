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
  /** Non-error hint after auto-matching actor photos (identity), not graph layout */
  const [photoResolveNote, setPhotoResolveNote] = useState<string | null>(null);
  /** Manual `{"charId":"https://..."}` overrides for wrong auto headshots */
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
      setAiErr("Enter a show title (at least 2 characters).");
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
        setAiErr(
          data.message ?? data.error ?? `Request failed (${res.status})`,
        );
        return;
      }
      if (!data.characters?.length || !data.edges) {
        setAiErr("The model response was incomplete.");
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
              "TMDB matched the show, but no cast headshots lined up with your character names. Add actorName for fictional roles, or paste manual photo URLs (JSON below).",
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
      setAiErr("Network or server error.");
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
        setAiErr(
          data.message ??
            data.error ??
            `Request failed (${res.status})`,
        );
        return;
      }
      if (!data.characters?.length || !data.edges) {
        setAiErr("The model response was incomplete.");
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
      setAiErr("Network or server error.");
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
    <div className="space-y-4">
      <div
        className="space-y-3 rounded-lg border border-border bg-surface/40 px-3 py-3"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-sm font-medium text-foreground">Your show</p>
          <p className="mt-1 text-xs text-muted">
            Enter a show title and optional premise; the server calls your configured LLM
            (supports <code className="text-foreground">DEEPSEEK_API_KEY</code> or{" "}
            <code className="text-foreground">OPENAI_API_KEY</code>
            ; if both are set, OpenAI is used unless you set{" "}
            <code className="text-foreground">LLM_PROVIDER=deepseek</code> in{" "}
            <code className="text-foreground">.env.local</code>
            ) to produce character and edge JSON. This demo always requests English labels
            and summaries from the model. Auto photos try to match each card to
            the right performer (not graph layout). If a face mismatches the role, add{" "}
            <code className="text-foreground">actorName</code> for billing names, or
            paste manual <code className="text-foreground">https://</code> URLs below.
            Headshots use <code className="text-foreground">TMDB_API_KEY</code> (TV
            search + cast credits + person search). Optionally add{" "}
            <code className="text-foreground">GOOGLE_CSE_API_KEY</code> +{" "}
            <code className="text-foreground">GOOGLE_CSE_CX</code> for Google Programmable
            Search image fallback (enable Custom Search API in Google Cloud; free tier is
            modest). Wikipedia is not used. Output is model-generated and may not match
            the real show.
          </p>
        </div>
        <label className="block text-sm">
          <span className="text-muted">Show title</span>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g. The Glory · Episode 6"
            className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-foreground"
            maxLength={120}
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Premise / episode focus (optional)</span>
          <textarea
            value={customPremise}
            onChange={(e) => setCustomPremise(e.target.value)}
            placeholder="Cast list, arc notes, or where the episode should end…"
            rows={3}
            className="mt-1 w-full resize-y rounded border border-border bg-background px-2 py-1.5 text-foreground"
            maxLength={2500}
          />
        </label>
        <label className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>Max characters (4–20, default 14)</span>
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
            className="w-20 rounded border border-border bg-background px-2 py-1 text-foreground"
          />
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => void fetchCustomGraph()}
          className="rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate custom relationship board"}
        </button>
      </div>

      {universe === "singles-inferno" ? (
        <>
          <div
            data-agent-toolbar
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface/40 px-3 py-3"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="text-sm text-muted">
              Example: Single&apos;s Inferno S5 (fixed cast)
            </span>
            <button
              type="button"
              disabled={loading}
              onClick={() => void fetchAiGraph()}
              className="rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? "Generating…" : "Generate AI graph for this episode"}
            </button>
          </div>
        </>
      ) : null}

      <p className="text-xs text-muted">
        Models can misremember names or timelines; for factual grounding you can add
        retrieval (RAG / browsing) later.
      </p>

      {aiErr ? (
        <p className="text-sm text-red-400" role="alert">
          {aiErr}
        </p>
      ) : null}

      {photoResolveNote ? (
        <p className="text-sm text-amber-200/90" role="status">
          {photoResolveNote}
        </p>
      ) : null}

      {aiLayer && useCustomAiBoard ? (
        <div
          className="space-y-2 rounded-lg border border-border bg-surface/30 px-3 py-3"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium text-foreground">Manual photo fix</p>
          <p className="text-xs text-muted">
            Use when the face does not match the role (not for moving nodes). Paste a
            JSON object: keys are <code className="text-foreground">characters[].id</code>
            , values are <code className="text-foreground">https://</code> image URLs
            (TMDB URLs work well). Example:{" "}
            <code className="text-foreground">
              {`{"heesun":"https://image.tmdb.org/t/p/w185/....jpg"}`}
            </code>
          </p>
          <textarea
            value={photoOverrideText}
            onChange={(e) => setPhotoOverrideText(e.target.value)}
            rows={4}
            spellCheck={false}
            placeholder='{"role_id":"https://..."}'
            className="w-full resize-y rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground"
          />
          <button
            type="button"
            onClick={() => applyPhotoOverrides()}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface/80"
          >
            Apply photo URLs
          </button>
        </div>
      ) : null}

      {aiLayer ? (
        <>
          <div className="rounded-lg border border-border bg-surface/30 px-4 py-3 text-sm leading-relaxed text-muted">
            {aiLayer.episodeSummary ? (
              <p className="text-foreground">{aiLayer.episodeSummary}</p>
            ) : null}
            {aiLayer.confidenceNote ? (
              <p className="mt-2 text-xs">{aiLayer.confidenceNote}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={clearAi}
            className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear AI layer and restore built-in demo data
          </button>
        </>
      ) : null}

      <RelationshipGraphPreview
        variant="full"
        story={story}
        overrideGraph={overrideGraph}
        aiOverlay={Boolean(aiLayer)}
      />
    </div>
  );
}
