import type { BoardCharacter, BoardEdge } from "@/data/singlesInfernoS5";
import { layoutImportedCharacters } from "@/lib/storyImport/layout";

type OpenAIResponse = {
  characters: { id: string; name: string }[];
  relationships: { from: string; to: string; label: string }[];
};

export async function extractWithOpenAI(
  text: string,
  apiKey: string,
): Promise<{ characters: BoardCharacter[]; edges: BoardEdge[] }> {
  const truncated = text.slice(0, 14_000);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You extract people and their relationships from narrative text. Output strict JSON only. Use concise English relationship labels (2-4 words). No markdown.",
        },
        {
          role: "user",
          content: `Analyze this text and return JSON with shape:
{"characters":[{"id":"lowercase-slug","name":"Display Name"}],"relationships":[{"from":"slug","to":"slug","label":"short relation"}]}
Rules: at most 12 characters and 24 relationships. Slugs must match character ids. Skip minor unnamed extras. If unclear, omit rather than guess wildly.

Text:
---
${truncated}
---`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty model response");

  let parsed: OpenAIResponse;
  try {
    parsed = JSON.parse(raw) as OpenAIResponse;
  } catch {
    throw new Error("Invalid JSON from model");
  }

  const charsIn = (parsed.characters ?? []).slice(0, 12);

  const stubs = charsIn.map((c, i) => ({
    id: c.id.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || `c${i}`,
    name: c.name.trim() || `Character ${i + 1}`,
    primary: i === 0,
  }));

  const normalizedIds = new Set(stubs.map((s) => s.id));

  const edges: BoardEdge[] = (parsed.relationships ?? [])
    .filter(
      (r) =>
        r.from &&
        r.to &&
        normalizedIds.has(r.from) &&
        normalizedIds.has(r.to) &&
        r.from !== r.to,
    )
    .slice(0, 24)
    .map((r) => ({
      from: r.from,
      to: r.to,
      label: (r.label || "Linked").slice(0, 48),
    }));

  const characters = layoutImportedCharacters(stubs);

  return { characters, edges };
}
