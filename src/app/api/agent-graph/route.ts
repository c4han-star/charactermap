import { NextResponse } from "next/server";
import {
  getS5Episode,
  S5_CHARACTER_IDS,
  S5_EPISODES,
} from "@/data/singlesInfernoS5";
import {
  buildCustomShowUserPrompt,
  normalizeCustomLlmPayload,
} from "@/lib/agentGraph/customUniverse";
import { mergeS5Characters, normalizeS5Edges } from "@/lib/agentGraph/mergeS5";

export const runtime = "nodejs";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/chat/completions";

type ResolvedLlm = {
  chatCompletionsUrl: string;
  apiKey: string;
  model: string;
};

/** OpenAI-compatible chat; DeepSeek uses same body shape, different host/path. */
function resolveChatLlm(): ResolvedLlm | null {
  const customUrl = process.env.LLM_CHAT_COMPLETIONS_URL?.trim();
  const customKey =
    process.env.LLM_API_KEY?.trim() ||
    process.env.DEEPSEEK_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim();
  if (customUrl) {
    if (!customKey) return null;
    return {
      chatCompletionsUrl: customUrl,
      apiKey: customKey,
      model:
        process.env.LLM_MODEL?.trim() ||
        process.env.DEEPSEEK_MODEL?.trim() ||
        process.env.OPENAI_MODEL?.trim() ||
        "deepseek-v4-flash",
    };
  }

  const provider = (process.env.LLM_PROVIDER ?? "").toLowerCase();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (provider === "deepseek") {
    if (!deepseekKey) return null;
    return {
      chatCompletionsUrl: DEEPSEEK_CHAT_URL,
      apiKey: deepseekKey,
      model: process.env.DEEPSEEK_MODEL?.trim() ?? "deepseek-v4-flash",
    };
  }
  if (provider === "openai") {
    if (!openaiKey) return null;
    return {
      chatCompletionsUrl: OPENAI_CHAT_URL,
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() ?? "gpt-4o-mini",
    };
  }

  if (openaiKey && deepseekKey) {
    return {
      chatCompletionsUrl: OPENAI_CHAT_URL,
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() ?? "gpt-4o-mini",
    };
  }
  if (openaiKey) {
    return {
      chatCompletionsUrl: OPENAI_CHAT_URL,
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() ?? "gpt-4o-mini",
    };
  }
  if (deepseekKey) {
    return {
      chatCompletionsUrl: DEEPSEEK_CHAT_URL,
      apiKey: deepseekKey,
      model: process.env.DEEPSEEK_MODEL?.trim() ?? "deepseek-v4-flash",
    };
  }
  return null;
}

const ALLOWED = new Set<string>(S5_CHARACTER_IDS);

type CustomShowInput = {
  title?: string;
  premise?: string;
  maxCharacters?: number;
};

type Body = {
  universe?: string;
  episodeId?: string;
  language?: "zh" | "en";
  customShow?: CustomShowInput;
};

const SYSTEM_JSON = `You output compact JSON only. Never wrap in code fences.`;

async function requestLlmJsonObject(
  llm: ResolvedLlm,
  user: string,
): Promise<{ parsed: Record<string, unknown>; model: string }> {
  const model = llm.model;
  const res = await fetch(llm.chatCompletionsUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${llm.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 3600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_JSON },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Response(
      JSON.stringify({
        error: "LLM_UPSTREAM_ERROR",
        message: text.slice(0, 500),
        status: res.status,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const rawContent = data.choices?.[0]?.message?.content;
  if (typeof rawContent !== "string") {
    throw new Response(
      JSON.stringify({ error: "EMPTY_COMPLETION" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const parsed = JSON.parse(rawContent) as Record<string, unknown>;
    return { parsed, model };
  } catch {
    throw new Response(
      JSON.stringify({ error: "MODEL_NOT_JSON", raw: rawContent.slice(0, 400) }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}

function buildPrompt(episodeLabel: string, blurb: string, language: "zh" | "en") {
  const ids = S5_CHARACTER_IDS.join(", ");
  const langLine =
    language === "zh"
      ? "Edge labels: short Simplified Chinese (max ~12 characters). episodeSummary and confidenceNote also in Chinese."
      : "Edge labels: max 4 English words. episodeSummary and confidenceNote in English.";

  return `You are helping build a RELATIONSHIP MAP for the Netflix Korean dating show "Single's Inferno" Season 5.

Episode scope: ${episodeLabel} — ${blurb}.

Rules (critical):
- Output ONLY valid JSON (no markdown). Top-level keys: characters, edges, episodeSummary, confidenceNote.
- characters: array of objects, one per cast member id in [${ids}]. Each object MUST include "id" from that list. You may include "displayName" (romanization), optional "role" (very short), optional "chaosScore" integer 0-100.
- edges: 5 to 12 undirected story relationships visible by the END of this episode. Each edge: { "from": "<id>", "to": "<id>", "label": "<string>", "relType": one of romance | betrayal | alliance | crush | conflict | fake_friend | hidden | default }.
- Use ONLY the ids above for from/to. Never invent new ids.
- If public information is incomplete or you are guessing, say so in confidenceNote and prefer relType "hidden" or "default" for uncertain ties.
- Do not claim criminal acts or real-world harassment unless widely reported; stay entertainment-safe.

${langLine}`;
}

export async function POST(request: Request) {
  const llm = resolveChatLlm();
  if (!llm) {
    return NextResponse.json(
      {
        error: "NO_API_KEY",
        message:
          "Set DEEPSEEK_API_KEY or OPENAI_API_KEY in .env.local. If both exist, OpenAI is used unless LLM_PROVIDER=deepseek. Optional: DEEPSEEK_MODEL, OPENAI_MODEL, LLM_CHAT_COMPLETIONS_URL + LLM_API_KEY.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const language = body.language === "zh" ? "zh" : "en";

  const custom = body.customShow;
  const customTitle =
    custom && typeof custom === "object"
      ? String(custom.title ?? "").trim()
      : "";

  if (customTitle.length >= 2) {
    if (customTitle.length > 120) {
      return NextResponse.json(
        { error: "CUSTOM_TITLE_TOO_LONG" },
        { status: 400 },
      );
    }
    const premise = String(custom?.premise ?? "").trim().slice(0, 2500);
    const maxC =
      typeof custom?.maxCharacters === "number" &&
      Number.isFinite(custom.maxCharacters)
        ? Math.min(20, Math.max(4, Math.round(custom.maxCharacters)))
        : 14;

    const user = buildCustomShowUserPrompt({
      title: customTitle,
      premise,
      language,
      maxCast: maxC,
    });

    let parsed: Record<string, unknown>;
    let model: string;
    try {
      const out = await requestLlmJsonObject(llm, user);
      parsed = out.parsed;
      model = out.model;
    } catch (e) {
      if (e instanceof Response) {
        const j = await e.json().catch(() => ({}));
        return NextResponse.json(j, { status: e.status });
      }
      throw e;
    }

    const norm = normalizeCustomLlmPayload(parsed);
    if (!norm) {
      return NextResponse.json(
        {
          error: "CUSTOM_GRAPH_INVALID",
          message:
            "Model JSON failed validation (need ≥3 characters with valid ids, ≥2 edges).",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      characters: norm.characters,
      edges: norm.edges,
      episodeSummary: norm.episodeSummary,
      confidenceNote: norm.confidenceNote,
      episodeId: "custom",
      model,
      universe: "custom",
    });
  }

  if (body.universe !== "singles-inferno-s5") {
    return NextResponse.json(
      { error: "UNSUPPORTED_UNIVERSE" },
      { status: 400 },
    );
  }

  const epIds = new Set(S5_EPISODES.map((e) => e.id));
  const episodeId =
    typeof body.episodeId === "string" && epIds.has(body.episodeId)
      ? body.episodeId
      : "ep1";

  const ep = getS5Episode(episodeId);

  const user = buildPrompt(ep.label, ep.blurb, language);

  let parsed: Record<string, unknown>;
  let model: string;
  try {
    const out = await requestLlmJsonObject(llm, user);
    parsed = out.parsed;
    model = out.model;
  } catch (e) {
    if (e instanceof Response) {
      const j = await e.json().catch(() => ({}));
      return NextResponse.json(j, { status: e.status });
    }
    throw e;
  }

  const charList = Array.isArray(parsed.characters)
    ? (parsed.characters as unknown[])
    : [];

  const patches = charList
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .map((c) => ({
      id: String(c.id ?? ""),
      displayName:
        typeof c.displayName === "string" ? c.displayName : undefined,
      name: typeof c.name === "string" ? c.name : undefined,
      role: typeof c.role === "string" ? c.role : undefined,
      chaosScore:
        typeof c.chaosScore === "number" ? (c.chaosScore as number) : undefined,
    }))
    .filter((p) => ALLOWED.has(p.id));

  const characters = mergeS5Characters(patches);
  let edges = normalizeS5Edges(parsed.edges, ALLOWED);

  if (edges.length === 0) {
    edges = [
      {
        from: "heesun",
        to: "subeen",
        label: language === "zh" ? "关系待模型补全" : "TBD — retry",
        relType: "hidden",
      },
    ];
  }

  const episodeSummary =
    typeof parsed.episodeSummary === "string"
      ? parsed.episodeSummary.trim()
      : "";
  const confidenceNote =
    typeof parsed.confidenceNote === "string"
      ? parsed.confidenceNote.trim()
      : "";

  return NextResponse.json({
    characters,
    edges,
    episodeSummary,
    confidenceNote,
    episodeId,
    model,
    universe: "singles-inferno-s5",
  });
}
