import { NextResponse } from "next/server";
import { resolveCastPhotoUrls } from "@/lib/castHeadshots/resolveUrls";

export const runtime = "nodejs";

type CastRow = { id?: unknown; name?: unknown; actorName?: unknown };

type Body = {
  cast?: CastRow[];
  showTitle?: unknown;
  language?: unknown;
};

function isZhEn(v: unknown): v is "zh" | "en" {
  return v === "zh" || v === "en";
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const raw = Array.isArray(body.cast) ? body.cast : [];
  const cast: { id: string; name: string; actorName?: string }[] = [];
  const seen = new Set<string>();

  for (const row of raw.slice(0, 24)) {
    if (!row || typeof row !== "object") continue;
    const id = typeof row.id === "string" ? row.id.trim().toLowerCase() : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const actorRaw =
      typeof row.actorName === "string" ? row.actorName.trim() : "";
    const actorName =
      actorRaw.length >= 2 && actorRaw.length <= 80 ? actorRaw : undefined;
    if (!id || id.length > 32 || !name || name.length > 120) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    cast.push({ id, name, ...(actorName ? { actorName } : {}) });
  }

  if (cast.length < 1) {
    return NextResponse.json(
      { error: "EMPTY_CAST", message: "Provide cast: [{ id, name, actorName? }, ...]" },
      { status: 400 },
    );
  }

  const showTitle =
    typeof body.showTitle === "string" ? body.showTitle.trim() : "";
  const language = isZhEn(body.language) ? body.language : "zh";

  const { images, diagnostics } = await resolveCastPhotoUrls({
    cast,
    showTitle: showTitle.length >= 2 ? showTitle : undefined,
    language,
  });

  return NextResponse.json({
    images,
    resolvedCount: Object.keys(images).length,
    castSize: cast.length,
    diagnostics,
  });
}
