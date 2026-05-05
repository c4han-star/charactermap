import type { BoardCharacter } from "@/data/singlesInfernoS5";

function hashRot(key: number): number {
  const x = Math.sin(key * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 10 - 5;
}

export type NamedStub = {
  id: string;
  name: string;
  primary?: boolean;
};

/** Scatter polaroids in corkboard coordinates (~1180×720 space used by the graph). */
export function layoutImportedCharacters(
  stubs: NamedStub[],
  worldW = 1180,
  worldH = 720,
): BoardCharacter[] {
  const n = stubs.length;
  const golden = Math.PI * (3 - Math.sqrt(5));

  return stubs.map((c, i) => {
    const t = i + 0.35;
    const r =
      Math.min(worldW, worldH) *
      (0.14 + 0.42 * Math.sqrt(t / Math.max(n + 2, 3)));
    const theta = i * golden;
    const jx = hashRot((c.id + "x").split("").reduce((a, ch) => a + ch.charCodeAt(0), 0));
    const jy = hashRot((c.id + "y").split("").reduce((a, ch) => a + ch.charCodeAt(0), 0));
    return {
      id: c.id,
      name: c.name,
      primary: c.primary ?? i === 0,
      photoSeed: `story-${c.id}`.slice(0, 48),
      rotKey: c.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), i + 1),
      x: Math.round(worldW / 2 + r * Math.cos(theta) + jx * 6),
      y: Math.round(worldH / 2 + r * Math.sin(theta) + jy * 6),
    };
  });
}
