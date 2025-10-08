"use client";

import * as React from "react";
import type { SensorType } from "@/types";
import { SENSOR_LABELS } from "@/types";

export type SortOrder = "NEWEST" | "OLDEST";

type SensorFilter = "ANY" | SensorType;

export type FilterState = {
  camera: string;
  lens: string;
  year: string;
  sensor: SensorFilter;
  ccdOnly: boolean;
  sort: SortOrder;
};

type FilterBarProps = {
  cameras: string[];
  sensors: SensorType[];
  value: FilterState;
  onChange: (next: FilterState) => void;
};

const OPTION_ALL = "ALL";
const SENSOR_ANY = "ANY";

export function FilterBar({ cameras, sensors, value, onChange }: FilterBarProps) {
  const updateFilters = React.useCallback(
    (patch: Partial<FilterState>) => {
      onChange({ ...value, ...patch });
    },
    [onChange, value]
  );

  const sensorChoices = React.useMemo(() => {
    const set = new Set<SensorType>(sensors);
    set.add("UNKNOWN");
    return Array.from(set);
  }, [sensors]);

  const labelStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "calc(var(--s-1) * 0.75)",
    fontSize: "var(--fs-xxs)",
    letterSpacing: "var(--ls-wide)",
    fontWeight: 600,
    textTransform: "uppercase",
    color: "var(--ink-soft)",
    alignItems: "flex-start",
  };

  return (
    <section
      style={{
        paddingInline: "var(--s-3)",
        paddingBlock: "var(--s-2)",
        color: "var(--ink)",
        background: "transparent",
        maxWidth: "640px",
        marginInline: "auto",
      }}
    >
      <div className="flex flex-col" style={{ gap: "var(--s-2)" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "var(--s-2)",
          }}
        >
          <label style={labelStyle}>
            <span>Camera</span>
            <select
              className="pixel-input"
              value={value.camera}
              style={{ width: "auto", minWidth: "160px" }}
              onChange={(event) => updateFilters({ camera: event.target.value })}
            >
              <option value={OPTION_ALL}>All Cameras</option>
              {value.camera !== OPTION_ALL && value.camera && !cameras.includes(value.camera) && (
                <option value={value.camera}>{value.camera}</option>
              )}
              {cameras.map((camera) => (
                <option key={camera} value={camera}>
                  {camera}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            <span>Sensor</span>
            <select
              className="pixel-input"
              value={value.sensor}
              style={{ width: "auto", minWidth: "160px" }}
              onChange={(event) => updateFilters({ sensor: event.target.value as SensorFilter })}
            >
              <option value={SENSOR_ANY}>Any Sensor</option>
              {value.sensor !== SENSOR_ANY && value.sensor && !sensorChoices.includes(value.sensor as SensorType) && (
                <option value={value.sensor}>{SENSOR_LABELS[value.sensor as SensorType] ?? value.sensor}</option>
              )}
              {sensorChoices.map((sensor) => (
                <option key={sensor} value={sensor}>
                  {SENSOR_LABELS[sensor]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}

export const FILTER_ALL = OPTION_ALL;
export const SENSOR_FILTER_ANY = SENSOR_ANY;
