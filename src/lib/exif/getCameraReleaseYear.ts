import releases from "@/data/camera_releases.json";

const normalize = (value?: string | null): string | null => {
  if (!value) return null;
  const normalized = value
    .normalize("NFKC")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > 0 ? normalized : null;
};

const modelMap = new Map<string, number>();
const aliasMap = new Map<string, number>();

for (const [label, year] of Object.entries(releases.models ?? {})) {
  const key = normalize(label);
  if (key && typeof year === "number") {
    modelMap.set(key, year);
  }
}

for (const [alias, canonical] of Object.entries(releases.aliases ?? {})) {
  const aliasKey = normalize(alias);
  const canonicalKey = normalize(canonical);
  if (!aliasKey || !canonicalKey) continue;
  const year = modelMap.get(canonicalKey);
  if (year !== undefined) {
    aliasMap.set(aliasKey, year);
  }
}

export type CameraLookupInput = {
  make?: string;
  model?: string;
};

export function getCameraReleaseYear({ make, model }: CameraLookupInput): number | undefined {
  const candidates = [
    model,
    [make, model].filter(Boolean).join(" "),
    make,
  ];

  for (const candidate of candidates) {
    const key = normalize(candidate);
    if (!key) continue;
    const direct = modelMap.get(key) ?? aliasMap.get(key);
    if (direct !== undefined) {
      return direct;
    }
  }

  return undefined;
}
