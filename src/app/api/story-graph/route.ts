import { NextResponse } from "next/server";
import { extractHeuristicStory } from "@/lib/storyImport/heuristic";
import { extractWithOpenAI } from "@/lib/storyImport/openai";
import { stripHtml } from "@/lib/storyImport/html";

export const runtime = "nodejs";

const MAX_CHARS = 24_000;

async function fetchUrlText(urlStr: string): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return { ok: false, error: "Invalid URL." };
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    return { ok: false, error: "Only http(s) URLs are allowed." };
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 18_000);

  try {
    const res = await fetch(url.href, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CharacterRelationshipTracker/1.0; +https://example.invalid)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) {
      return { ok: false, error: `Fetch failed (${res.status}).` };
    }
    const ct = res.headers.get("content-type") ?? "";
    const htmlOrText = await res.text();
    if (ct.includes("text/plain")) {
      return { ok: true, text: htmlOrText.slice(0, MAX_CHARS) };
    }
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
      return {
        ok: false,
        error: "URL did not return readable HTML or plain text.",
      };
    }
    const text = stripHtml(htmlOrText).slice(0, MAX_CHARS);
    return { ok: true, text };
  } catch {
    clearTimeout(t);
    return {
      ok: false,
      error:
        "Could not load URL (timeout, blocked, or network error). Paste the story text instead.",
    };
  }
}

export async function POST(req: Request) {
  let body: { text?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const pasted = typeof body.text === "string" ? body.text.trim() : "";
  const urlStr = typeof body.url === "string" ? body.url.trim() : "";

  let combined = pasted;

  if (urlStr) {
    const fetched = await fetchUrlText(urlStr);
    if (!fetched.ok) {
      return NextResponse.json({ error: fetched.error }, { status: 400 });
    }
    combined = [pasted, fetched.text].filter(Boolean).join("\n\n").trim();
  }

  combined = combined.slice(0, MAX_CHARS);

  if (!combined) {
    return NextResponse.json(
      { error: "Add story text and/or a fetchable article URL." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  try {
    if (apiKey) {
      const graph = await extractWithOpenAI(combined, apiKey);
      return NextResponse.json({
        graph,
        source: "openai" as const,
      });
    }

    const graph = extractHeuristicStory(combined);
    return NextResponse.json({
      graph,
      source: "heuristic" as const,
      hint:
        "Heuristic mode (name patterns + same-sentence co-mention). Set OPENAI_API_KEY for smarter relationship labels.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generation failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
