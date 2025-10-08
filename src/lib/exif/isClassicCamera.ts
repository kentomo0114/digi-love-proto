import ccdCameras from "@/data/ccd_cameras.json";

const normalize = (value?: string | null): string | null => {
  if (!value) return null;
  const normalized = value
    .normalize("NFKC")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > 0 ? normalized : null;
};

const modelSet = new Set<string>();
const aliasMap = new Map<string, string>();

for (const model of ccdCameras.models ?? []) {
  const key = normalize(model);
  if (key) {
    modelSet.add(key);
  }
}

for (const [alias, canonical] of Object.entries(ccdCameras.aliases ?? {})) {
  const aliasKey = normalize(alias);
  const canonicalKey = normalize(canonical);
  if (!aliasKey || !canonicalKey) continue;
  aliasMap.set(aliasKey, canonicalKey);
}

export type ClassicCameraLookupInput = {
  make?: string;
  model?: string;
};

export function isClassicCamera({ make, model }: ClassicCameraLookupInput): boolean {
  const candidates = [model, [make, model].filter(Boolean).join(" "), make];

  for (const candidate of candidates) {
    const key = normalize(candidate);
    if (!key) continue;
    if (modelSet.has(key)) {
      return true;
    }
    const canonical = aliasMap.get(key);
    if (canonical && modelSet.has(canonical)) {
      return true;
    }
  }

  return false;
}
