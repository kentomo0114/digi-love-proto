import ccdData from "@/data/ccd_cameras.json";

export type NormalizedModel = string;

function collapse(value: string): NormalizedModel {
  return value
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

const aliasLookup = new Map<NormalizedModel, NormalizedModel>();

for (const modelName of ccdData.models) {
  const normalized = collapse(modelName);
  if (normalized) {
    aliasLookup.set(normalized, normalized);
  }
}

for (const [alias, canonical] of Object.entries(ccdData.aliases ?? {})) {
  const aliasNormalized = collapse(alias);
  const canonicalNormalized = collapse(canonical);
  if (aliasNormalized && canonicalNormalized) {
    aliasLookup.set(aliasNormalized, canonicalNormalized);
  }
}

export function normalizeModel(value?: string | null): NormalizedModel | null {
  if (!value) return null;
  const normalized = collapse(value);
  if (!normalized) return null;
  return aliasLookup.get(normalized) ?? normalized;
}

export function tokenizeModel(value?: string | null): string[] {
  if (!value) return [];
  const normalized = value.normalize("NFKC").toUpperCase();
  const coarse = normalized.replace(/[^A-Z0-9]+/g, " ").split(/\s+/).filter(Boolean);

  const tokens = new Set<string>();

  for (const token of coarse) {
    if (!token) continue;
    let current = token[0];
    let currentType = /[0-9]/.test(current) ? "digit" : "alpha";

    for (let index = 1; index < token.length; index += 1) {
      const char = token[index];
      const charType = /[0-9]/.test(char) ? "digit" : "alpha";
      if (charType === currentType) {
        current += char;
      } else {
        tokens.add(current);
        current = char;
        currentType = charType;
      }
    }
    tokens.add(current);
  }

  return Array.from(tokens);
}

export function getCanonicalModels(): NormalizedModel[] {
  return Array.from(
    new Set(
      ccdData.models
        .map((model) => normalizeModel(model))
        .filter((value): value is NormalizedModel => Boolean(value))
    )
  );
}

export function getAliasLookup(): ReadonlyMap<NormalizedModel, NormalizedModel> {
  return aliasLookup;
}
