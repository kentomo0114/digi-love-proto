import sensorCatalog from "@/data/sensor_catalog.json";
import type { SensorType } from "@/types";
import { SENSOR_TYPES } from "@/types";

const toSensorType = (value: unknown): SensorType | null => {
  if (typeof value !== "string") return null;
  return SENSOR_TYPES.includes(value as SensorType) ? (value as SensorType) : null;
};

const normalizeCatalogValue = (value?: string | null): string | null => {
  if (!value) return null;
  const normalized = value
    .normalize("NFKC")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > 0 ? normalized : null;
};

const modelMap = new Map<string, SensorType>();
const aliasMap = new Map<string, SensorType>();

const patternEntries = Object.entries(sensorCatalog.patterns ?? {})
  .map(([pattern, sensor]) => {
    const sensorType = toSensorType(sensor);
    if (!sensorType) return null;
    return { regex: new RegExp(pattern, "i"), sensor: sensorType };
  })
  .filter((entry): entry is { regex: RegExp; sensor: SensorType } => Boolean(entry));

for (const [label, sensor] of Object.entries(sensorCatalog.models ?? {})) {
  const normalized = normalizeCatalogValue(label);
  const sensorType = toSensorType(sensor);
  if (normalized && sensorType) {
    modelMap.set(normalized, sensorType);
  }
}

for (const [canonical, aliasList] of Object.entries(sensorCatalog.aliases ?? {})) {
  const canonicalKey = normalizeCatalogValue(canonical);
  if (!canonicalKey) continue;
  const sensorType = modelMap.get(canonicalKey);
  if (!sensorType) continue;
  for (const alias of aliasList ?? []) {
    const aliasKey = normalizeCatalogValue(alias);
    if (!aliasKey || modelMap.has(aliasKey)) continue;
    aliasMap.set(aliasKey, sensorType);
  }
}

export type ClassifySensorOptions = {
  make?: string;
  model?: string;
  lens?: string;
};

export function classifySensor({ make, model, lens }: ClassifySensorOptions): SensorType {
  const lookup = (value?: string | null): SensorType | undefined => {
    const key = normalizeCatalogValue(value);
    if (!key) return undefined;
    return modelMap.get(key) ?? aliasMap.get(key);
  };

  const directCandidates = [model, make, [make, model].filter(Boolean).join(" ")];
  for (const candidate of directCandidates) {
    const resolved = lookup(candidate);
    if (resolved) {
      return resolved;
    }
  }

  const haystack = normalizeCatalogValue([make, model, lens].filter(Boolean).join(" "));
  if (haystack) {
    for (const entry of patternEntries) {
      if (entry.regex.test(haystack)) {
        return entry.sensor;
      }
    }
  }

  return "UNKNOWN";
}

export function ensureSensorType(value: SensorType | undefined | null): SensorType {
  if (!value) return "UNKNOWN";
  return SENSOR_TYPES.includes(value) ? value : "UNKNOWN";
}
