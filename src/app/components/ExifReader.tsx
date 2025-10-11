"use client";

import * as React from "react";

import { classifySensor } from "@/lib/exif/classifySensor";

const formatNumber = (value: number, digits = 1): string => {
  return Number.isFinite(value) ? value.toFixed(digits).replace(/\.0+$/, "") : String(value);
};

const formatExposure = (value: unknown): string | null => {
  if (typeof value === "number" && value > 0) {
    if (value >= 1) {
      return `${formatNumber(value, 3)}s`;
    }
    const reciprocal = Math.round(1 / value);
    return `1/${reciprocal}`;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
};

const formatFNumber = (value: unknown): string | null => {
  if (typeof value === "number") {
    return `f/${formatNumber(value, 1)}`;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.startsWith("f") ? value : `f/${value}`;
  }
  return null;
};

const formatDate = (value: unknown): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    const hh = String(value.getHours()).padStart(2, "0");
    const min = String(value.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
};

type SummaryItem = {
  label: string;
  value: string;
};

type ExifReading = {
  id: string;
  fileName: string;
  fileSize: string;
  summary: SummaryItem[];
  raw: Record<string, unknown> | null;
  error?: string;
};

const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${formatNumber(value, value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[exponent]}`;
};

const buildSummary = (data: Record<string, unknown> | null): SummaryItem[] => {
  if (!data) return [];

  const summary: SummaryItem[] = [];
  const add = (label: string, value: unknown, formatter?: (value: unknown) => string | null) => {
    const formatted = formatter ? formatter(value) : value == null ? null : String(value);
    if (!formatted) return;
    summary.push({ label, value: formatted });
  };

  add("Make", data.Make);
  add("Camera", data.Model ?? data.CameraModelName);
  add("Lens", data.LensModel ?? data.LensMake);
  add("ISO", data.ISO);
  add("Aperture", data.FNumber, formatFNumber);
  add("Shutter", data.ExposureTime, formatExposure);
  add("Focal", data.FocalLength, (value) => {
    if (typeof value === "number") {
      return `${formatNumber(value, 1)}mm`;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      return value.endsWith("mm") ? value : `${value}mm`;
    }
    return null;
  });
  add("Captured", data.DateTimeOriginal ?? data.CreateDate, formatDate);

  const sensor = classifySensor({
    make: typeof data.Make === "string" ? data.Make : undefined,
    model: typeof data.Model === "string" ? data.Model : undefined,
    lens: typeof data.LensModel === "string" ? data.LensModel : undefined,
  });
  if (sensor !== "UNKNOWN") {
    add("Sensor", sensor);
  }

  return summary;
};

type ExifrParseOptions = {
  tiff?: boolean;
  ifd0?: Record<string, unknown>;
  exif?: boolean;
  xmp?: boolean;
  icc?: boolean;
  iptc?: boolean;
};

const EXIFR_OPTIONS: ExifrParseOptions = Object.freeze({
  tiff: true,
  ifd0: {},
  exif: true,
  xmp: true,
  icc: true,
  iptc: true,
});

export function ExifReader() {
  const [readings, setReadings] = React.useState<ExifReading[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFiles = React.useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setGlobalError(null);

    const nextReadings: ExifReading[] = [];
    let parse: typeof import("exifr")["parse"];
    try {
      ({ parse } = await import("exifr"));
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Failed to load EXIF parser.");
      setIsProcessing(false);
      return;
    }

    for (const file of Array.from(files)) {
      try {
        const raw = (await parse(file, EXIFR_OPTIONS)) as Record<string, unknown> | null;
        const summary = buildSummary(raw);
        if (summary.length === 0) {
          summary.push({ label: "Notice", value: "No EXIF payload found in this image." });
        }
        nextReadings.push({
          id: `${file.name}-${file.lastModified}-${file.size}`,
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          summary,
          raw,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to parse EXIF.";
        nextReadings.push({
          id: `${file.name}-${file.lastModified}-${file.size}`,
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          summary: [],
          raw: null,
          error: message,
        });
      }
    }

    setReadings((current) => [...nextReadings, ...current].slice(0, 8));
    setIsProcessing(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const handleFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      void handleFiles(event.target.files);
    },
    [handleFiles]
  );

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      if (event.dataTransfer.files?.length) {
        void handleFiles(event.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  return (
    <section
      className="relative mx-auto flex w-full max-w-6xl flex-col"
      style={{
        gap: "var(--s-3)",
        paddingInline: "clamp(var(--s-2), 4vw, var(--s-4))",
        paddingBottom: "calc(var(--s-4) * 2)",
      }}
    >
      <header
        className="pixel-frame pixel-notch"
        style={{
          paddingInline: "var(--s-3)",
          paddingBlock: "var(--s-3)",
          boxShadow: "var(--shadow-soft)",
          color: "var(--ink)",
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between" style={{ gap: "var(--s-3)" }}>
          <div className="flex flex-col" style={{ gap: "var(--s-2)" }}>
            <p
              style={{
                fontSize: "var(--fs-xxs)",
                letterSpacing: "var(--ls-wider)",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
                fontWeight: 600,
              }}
            >
              Inspect
            </p>
            <h2
              style={{
                fontSize: "var(--fs-xl)",
                lineHeight: "var(--lh-tight)",
                letterSpacing: "var(--ls-base)",
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              EXIF Metadata Reader
            </h2>
            <p
              style={{
                maxWidth: "48ch",
                fontSize: "var(--fs-sm)",
                lineHeight: "var(--lh-loose)",
                color: "var(--ink-muted)",
              }}
            >
              Drop a JPEG, TIFF, or RAW export to reveal the metadata pulse. We keep everything client-side — nothing ever leaves this browser tab.
            </p>
          </div>

          <div
            className="token-stack"
            style={{
              alignItems: "flex-end",
              gap: "var(--s-1)",
              fontSize: "var(--fs-xxs)",
              letterSpacing: "var(--ls-wide)",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
            }}
          >
            <span>Processed Files</span>
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "var(--fs-counter)",
                lineHeight: 1,
                color: "var(--ink)",
              }}
            >
              {readings.length.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </header>

      <label
        className="pixel-frame pixel-notch"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        style={{
          borderStyle: "dashed",
          paddingInline: "var(--s-4)",
          paddingBlock: "calc(var(--s-4) * 1.5)",
          textAlign: "center",
          color: "var(--ink)",
          boxShadow: "var(--shadow-soft)",
          cursor: isProcessing ? "progress" : "pointer",
          transition: "transform 120ms ease, box-shadow 120ms ease",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        <div className="token-stack" style={{ gap: "var(--s-2)", alignItems: "center" }}>
          <span
            className="token-chip"
            style={{
              borderStyle: "dashed",
              color: "var(--accent)",
              borderColor: "var(--accent)",
              background: "var(--accent-soft)",
            }}
          >
            Drag & Drop
          </span>
          <p
            style={{
              fontSize: "var(--fs-sm)",
              lineHeight: "var(--lh-loose)",
              color: "var(--ink-muted)",
            }}
          >
            {isProcessing ? "Decoding metadata…" : "Drop files here or click to choose up to 8 recent reads."}
          </p>
        </div>
      </label>

      {globalError && (
        <div
          className="pixel-frame pixel-notch"
          style={{
            paddingInline: "var(--s-2)",
            paddingBlock: "var(--s-2)",
            fontSize: "var(--fs-xs)",
            color: "var(--tone-error)",
            background: "var(--tone-error-soft)",
            borderColor: "var(--tone-error)",
          }}
        >
          {globalError}
        </div>
      )}

      <div className="token-stack" style={{ gap: "var(--s-2)" }}>
        {readings.length === 0 ? (
          <div
            className="pixel-frame pixel-notch"
            style={{
              paddingInline: "var(--s-3)",
              paddingBlock: "calc(var(--s-3) * 1.25)",
              textAlign: "center",
              fontSize: "var(--fs-xs)",
              color: "var(--ink-soft)",
            }}
          >
            Waiting for your first upload.
          </div>
        ) : (
          readings.map((reading) => (
            <article
              key={reading.id}
              className="pixel-frame pixel-notch"
              style={{
                paddingInline: "var(--s-3)",
                paddingBlock: "var(--s-3)",
                color: "var(--ink)",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              <header
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
                style={{ gap: "var(--s-2)", marginBottom: "var(--s-2)" }}
              >
                <div className="flex flex-col" style={{ gap: "calc(var(--s-1) * 0.75)" }}>
                  <h3
                    style={{
                      fontSize: "var(--fs-lg)",
                      letterSpacing: "var(--ls-base)",
                      fontWeight: 600,
                    }}
                  >
                    {reading.fileName}
                  </h3>
                  <p
                    style={{
                      fontSize: "var(--fs-xxs)",
                      letterSpacing: "var(--ls-wide)",
                      textTransform: "uppercase",
                      color: "var(--ink-soft)",
                    }}
                  >
                    {reading.fileSize}
                  </p>
                </div>
                <button
                  type="button"
                  className="pixel-button"
                  onClick={() => {
                    setReadings((current) => current.filter((item) => item.id !== reading.id));
                  }}
                >
                  Remove
                </button>
              </header>

              {reading.error ? (
                <div
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--tone-error)",
                    background: "var(--tone-error-soft)",
                    borderRadius: "var(--r-card)",
                    paddingInline: "var(--s-2)",
                    paddingBlock: "var(--s-2)",
                  }}
                >
                  {reading.error}
                </div>
              ) : (
                <div className="token-stack" style={{ gap: "var(--s-2)" }}>
                  <dl
                    className="grid gap-x-6 gap-y-2 sm:grid-cols-2"
                    style={{
                      fontSize: "var(--fs-xs)",
                      letterSpacing: "var(--ls-base)",
                      color: "var(--ink)",
                    }}
                  >
                    {reading.summary.map((item) => (
                      <div key={`${reading.id}-${item.label}`} className="flex flex-col">
                        <dt
                          style={{
                            fontSize: "var(--fs-xxs)",
                            letterSpacing: "var(--ls-wide)",
                            textTransform: "uppercase",
                            color: "var(--ink-soft)",
                            fontWeight: 600,
                          }}
                        >
                          {item.label}
                        </dt>
                        <dd style={{ fontFamily: "var(--font-geist-mono)", marginTop: "calc(var(--s-1) * 0.25)" }}>
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {reading.raw && (
                    <details
                      className="pixel-frame"
                      style={{
                        borderStyle: "dashed",
                        paddingInline: "var(--s-2)",
                        paddingBlock: "var(--s-2)",
                        background: "var(--panel-strong)",
                        color: "var(--ink)",
                      }}
                    >
                      <summary
                        style={{
                          cursor: "pointer",
                          fontSize: "var(--fs-xxs)",
                          letterSpacing: "var(--ls-wide)",
                          textTransform: "uppercase",
                          color: "var(--ink-soft)",
                          fontWeight: 600,
                        }}
                      >
                        Raw payload
                      </summary>
                      <pre
                        style={{
                          marginTop: "var(--s-2)",
                          fontSize: "var(--fs-xs)",
                          lineHeight: "var(--lh-default)",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {JSON.stringify(reading.raw, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
