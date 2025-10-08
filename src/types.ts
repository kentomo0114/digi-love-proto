export type SensorType = "CCD" | "CMOS" | "FOVEON" | "UNKNOWN";

export const SENSOR_TYPES: SensorType[] = ["CCD", "CMOS", "FOVEON", "UNKNOWN"];

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
