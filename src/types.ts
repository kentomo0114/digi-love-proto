export type SensorType = "CCD" | "CMOS" | "FOVEON" | "UNKNOWN";
export type SensorKind = "CCD" | "CMOS" | "Foveon" | "Unknown";

export const SENSOR_TYPES: SensorType[] = ["CCD", "CMOS", "FOVEON", "UNKNOWN"];
export const SENSOR_KINDS: SensorKind[] = ["CCD", "CMOS", "Foveon", "Unknown"];

export type ExifSummary = {
  make?: string;
  camera?: string;
  lens?: string;
  iso?: number;
  f?: string;
  s?: string;
  year?: number;
  sensor?: SensorKind;
  ccdStatus?: "ccd" | "non-ccd" | "unknown";
  ccd?: boolean;
};

const SENSOR_TYPE_TO_KIND_MAP: Record<SensorType, SensorKind> = {
  CCD: "CCD",
  CMOS: "CMOS",
  FOVEON: "Foveon",
  UNKNOWN: "Unknown",
};

const SENSOR_KIND_TO_TYPE_MAP: Record<SensorKind, SensorType> = {
  CCD: "CCD",
  CMOS: "CMOS",
  Foveon: "FOVEON",
  Unknown: "UNKNOWN",
};

export type ExifSensorMetadata = {
  sensor?: SensorType;
  /** @deprecated UIでは使用しない */
  ccd?: boolean;
};

export function isSensorType(value: unknown): value is SensorType {
  if (typeof value !== "string") return false;
  return (SENSOR_TYPES as readonly string[]).includes(value.toUpperCase());
}

export function toSensorType(value: unknown): SensorType | undefined {
  if (typeof value !== "string") return undefined;
  const upper = value.toUpperCase();
  return isSensorType(upper) ? (upper as SensorType) : undefined;
}

export const SENSOR_LABELS: Record<SensorType, string> = {
  CCD: "CCD",
  CMOS: "CMOS",
  FOVEON: "Foveon",
  UNKNOWN: "Unknown",
};

export const sensorLabel = (t?: SensorType | null): string =>
  !t ? "Unknown" : t === "FOVEON" ? "Foveon X3" : t;

export const toSensorKind = (value: unknown): SensorKind => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if ((SENSOR_KIND_TO_TYPE_MAP as Record<string, SensorType | undefined>)[trimmed]) {
      return trimmed as SensorKind;
    }
    const upper = trimmed.toUpperCase();
    if ((SENSOR_TYPE_TO_KIND_MAP as Record<string, SensorKind | undefined>)[upper]) {
      return SENSOR_TYPE_TO_KIND_MAP[upper as SensorType] ?? "Unknown";
    }
  }
  return "Unknown";
};

export const sensorTypeToKind = (sensor?: SensorType | null): SensorKind => {
  if (!sensor) return "Unknown";
  return SENSOR_TYPE_TO_KIND_MAP[sensor] ?? "Unknown";
};

export const sensorKindToType = (kind?: SensorKind | null): SensorType => {
  if (!kind) return "UNKNOWN";
  return SENSOR_KIND_TO_TYPE_MAP[kind] ?? "UNKNOWN";
};
