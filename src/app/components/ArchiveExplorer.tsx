"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";

import { ExploreGrid, type Photo } from "./ExploreGrid";
import { FilterBar, FILTER_ALL, SENSOR_FILTER_ANY, type FilterState } from "./FilterBar";
import type { SensorType } from "@/types";
import { SENSOR_TYPES } from "@/types";
import { classifySensor } from "@/lib/exif/classifySensor";
import { getCameraReleaseYear } from "@/lib/exif/getCameraReleaseYear";
import { isClassicCamera } from "@/lib/exif/isClassicCamera";

const QUERY_KEYWORD = "q";
const RELEASE_YEAR_CUTOFF = 2014;
const ICON_BUTTON_STYLE: React.CSSProperties = {
  width: "3rem",
  height: "3rem",
  minWidth: "3rem",
  minHeight: "3rem",
  padding: 0,
  borderRadius: "9999px",
  border: "1px solid var(--stroke)",
  boxShadow: "none",
};

const DEFAULT_FILTERS: FilterState = {
  camera: FILTER_ALL,
  lens: FILTER_ALL,
  year: FILTER_ALL,
  sensor: SENSOR_FILTER_ANY,
  ccdOnly: false,
  sort: "NEWEST",
};

type ApiResponse = {
  photos: Photo[];
};

type ArchiveExplorerProps = {
  syncWithUrl?: boolean;
  className?: string;
};

type ParsedState = {
  filters: FilterState;
  keyword: string;
};

type SummaryItem = {
  label: string;
  value: string;
};

type PendingUpload = {
  id: string;
  fileName: string;
  fileSize: string;
  photo: Photo;
  summary: SummaryItem[];
  releaseYear?: number;
  isBlocked: boolean;
};

const UploadGlyph = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    role="img"
    {...props}
  >
    <path
      d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 4v12"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m8 8 4-4 4 4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function parseFilters(params: ReadonlyURLSearchParams | URLSearchParams | null): ParsedState {
  if (!params) {
    return { filters: DEFAULT_FILTERS, keyword: "" };
  }

  const cameraParam = params.get("camera");
  const lensParam = params.get("lens");
  const yearParam = params.get("year");
  const sortParam = params.get("sort");
  const ccdOnlyParam = params.get("ccd");
  const sensorParam = params.get("sensor");
  const keywordParam = params.get(QUERY_KEYWORD);

  const camera = cameraParam && cameraParam.trim().length > 0 ? cameraParam : FILTER_ALL;
  const lens = lensParam && lensParam.trim().length > 0 ? lensParam : FILTER_ALL;
  const year = yearParam && /^\d{4}$/.test(yearParam) ? yearParam : FILTER_ALL;
  const sort: FilterState["sort"] = sortParam === "OLDEST" ? "OLDEST" : "NEWEST";
  const ccdOnly = ccdOnlyParam === "1" || ccdOnlyParam?.toLowerCase() === "true";
  const sensorUpper = sensorParam ? sensorParam.toUpperCase() : null;
  const sensor: FilterState["sensor"] = sensorUpper && SENSOR_TYPES.includes(sensorUpper as SensorType)
    ? (sensorUpper as SensorType)
    : SENSOR_FILTER_ANY;
  const keyword = keywordParam?.trim() ?? "";

  return { filters: { camera, lens, year, sensor, sort, ccdOnly }, keyword };
}

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

const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${formatNumber(value, value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[exponent]}`;
};

const buildSummary = (photo: Photo, releaseYear?: number, isBlocked?: boolean): SummaryItem[] => {
  const summary: SummaryItem[] = [];
  const add = (label: string, raw: unknown, formatter?: (value: unknown) => string | null) => {
    const formatted = formatter ? formatter(raw) : raw == null ? null : String(raw);
    if (!formatted) return;
    summary.push({ label, value: formatted });
  };

  add("File", photo.alt);
  add("Make", photo.exif?.make);
  add("Camera", photo.exif?.camera);
  add("Lens", photo.exif?.lens);
  add("ISO", photo.exif?.iso);
  add("Aperture", photo.exif?.f);
  add("Shutter", photo.exif?.s);
  add("Year", photo.exif?.year);
  add("Sensor", photo.exif?.sensor);
  add("Release", releaseYear);
  add("Status", isBlocked ? "TOO NEW" : "OK");
  return summary;
};

async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth || 1200,
        height: image.naturalHeight || 800,
      });
    };
    image.onerror = () => {
      resolve({ width: 1200, height: 800 });
    };
    image.src = url;
  });
}

function extractYear(value: unknown): number | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getFullYear();
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getFullYear();
    }
    const match = value.match(/(\d{4})/);
    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  return undefined;
}

async function parsePendingFile(file: File): Promise<PendingUpload | null> {
  const objectUrl = URL.createObjectURL(file);

  let exifRaw: Record<string, unknown> | null = null;
  try {
    const { parse } = await import("exifr");
    exifRaw = (await parse(file, { tiff: true, ifd0: true, exif: true, xmp: true, icc: true, iptc: true })) as
      | Record<string, unknown>
      | null;
  } catch (error) {
    console.warn("Failed to parse EXIF", error);
  }

  const make = typeof exifRaw?.Make === "string" ? exifRaw.Make : undefined;
  const camera = typeof exifRaw?.Model === "string" ? exifRaw.Model : undefined;
  const lens = typeof exifRaw?.LensModel === "string" ? exifRaw.LensModel : undefined;
  const isoRaw = exifRaw?.ISO;
  const iso = typeof isoRaw === "number" ? Math.round(isoRaw) : Number.isFinite(Number(isoRaw)) ? Number(isoRaw) : undefined;
  const f = formatFNumber(exifRaw?.FNumber ?? exifRaw?.ApertureValue ?? exifRaw?.FocalRatio ?? null) ?? undefined;
  const s = formatExposure(exifRaw?.ExposureTime ?? exifRaw?.ShutterSpeedValue ?? null) ?? undefined;
  const year = extractYear(exifRaw?.DateTimeOriginal ?? exifRaw?.CreateDate ?? exifRaw?.ModifyDate ?? null);

  const sensor = classifySensor({ make, model: camera, lens });
  const isClassic = isClassicCamera({ make, model: camera });

  const releaseYear = getCameraReleaseYear({ make, model: camera });
  const isBlocked = isClassic
    ? false
    : releaseYear !== undefined
      ? releaseYear > RELEASE_YEAR_CUTOFF
      : sensor !== "CCD";

  const { width, height } = await getImageDimensions(objectUrl);

  const photo: Photo = {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    src: objectUrl,
    alt: file.name,
    width,
    height,
    exif: {
      make,
      camera,
      lens,
      iso,
      f,
      s,
      year,
      sensor,
    },
  };

  return {
    id: photo.id,
    fileName: file.name,
    fileSize: formatFileSize(file.size),
    photo,
    summary: buildSummary(photo, releaseYear, isBlocked),
    releaseYear,
    isBlocked,
  };
}

function buildSearchParams(filters: FilterState, keyword: string): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.camera !== FILTER_ALL) {
    params.set("camera", filters.camera);
  }
  if (filters.lens !== FILTER_ALL) {
    params.set("lens", filters.lens);
  }
  if (filters.year !== FILTER_ALL) {
    params.set("year", filters.year);
  }
  if (filters.sensor !== SENSOR_FILTER_ANY) {
    params.set("sensor", filters.sensor);
  }
  if (filters.ccdOnly) {
    params.set("ccd", "1");
  }
  if (filters.sort !== "NEWEST") {
    params.set("sort", filters.sort);
  }
  if (keyword.trim().length > 0) {
    params.set(QUERY_KEYWORD, keyword.trim());
  }

  return params;
}

function filtersEqual(a: FilterState, b: FilterState): boolean {
  return (
    a.camera === b.camera &&
    a.lens === b.lens &&
    a.year === b.year &&
    a.sensor === b.sensor &&
    a.ccdOnly === b.ccdOnly &&
    a.sort === b.sort
  );
}

function toKeywordCandidates(photo: Photo): string[] {
  const values: Array<string | number | undefined> = [
    photo.alt,
    photo.id,
    photo.exif?.make,
    photo.exif?.camera,
    photo.exif?.lens,
    photo.exif?.iso,
    photo.exif?.f,
    photo.exif?.s,
    photo.exif?.year,
    photo.exif?.sensor,
  ];
  return values
    .map((value) => (value == null ? "" : typeof value === "string" ? value : value.toString()))
    .filter((value) => value.length > 0)
    .map((value) => value.toLowerCase());
}

export function ArchiveExplorer({ syncWithUrl = true, className }: ArchiveExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();
  const [sourcePhotos, setSourcePhotos] = React.useState<Photo[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{ id: number; message: string } | null>(null);
  const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const [pendingUploads, setPendingUploads] = React.useState<PendingUpload[]>([]);
  const [isParsingUploads, setIsParsingUploads] = React.useState<boolean>(false);

  const initialParsed = React.useMemo(() => parseFilters(syncWithUrl ? searchParams : null), [searchParams, syncWithUrl]);

  const [filters, setFilters] = React.useState<FilterState>(initialParsed.filters);
  const [keyword, setKeyword] = React.useState<string>(initialParsed.keyword);

  const hasBlockedUploads = React.useMemo(() => pendingUploads.some((item) => item.isBlocked), [pendingUploads]);

  React.useEffect(() => {
    if (!syncWithUrl) return;
    const parsed = parseFilters(searchParams);
    setFilters((current) => (filtersEqual(current, parsed.filters) ? current : parsed.filters));
    setKeyword((current) => (current === parsed.keyword ? current : parsed.keyword));
  }, [searchParams, syncWithUrl]);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setIsLoadingData(true);
      try {
        const params = new URLSearchParams();
        if (filters.ccdOnly) {
          params.set("ccd", "1");
        }
        const query = params.toString();
        const response = await fetch(`/api/photos${query ? `?${query}` : ""}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to load photos (${response.status})`);
        }
        const payload = (await response.json()) as ApiResponse;
        if (!cancelled) {
          setSourcePhotos(payload.photos ?? []);
          setLoadError(null);
        }
      } catch (error) {
        if (cancelled) return;
        if ((error as DOMException).name === "AbortError") {
          return;
        }
        setLoadError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        if (!cancelled) {
          setIsLoadingData(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters.ccdOnly]);

  const handleFiltersChange = React.useCallback(
    (next: FilterState) => {
      setFilters(next);
      if (!syncWithUrl) return;
      startTransition(() => {
        const params = buildSearchParams(next, keyword);
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [keyword, pathname, router, startTransition, syncWithUrl]
  );

  const availableCameras = React.useMemo(() => {
    return Array.from(
      new Set(
        sourcePhotos
          .map((photo) => photo.exif?.camera)
          .filter((value): value is string => Boolean(value && value.length > 0))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [sourcePhotos]);

  const availableSensors = React.useMemo(() => {
    return Array.from(
      new Set(
        sourcePhotos.map((photo) => {
          const sensor = photo.exif?.sensor ?? "UNKNOWN";
          return SENSOR_TYPES.includes(sensor as SensorType) ? (sensor as SensorType) : "UNKNOWN";
        })
      )
    ).filter((sensor): sensor is SensorType => SENSOR_TYPES.includes(sensor));
  }, [sourcePhotos]);

  const filteredPhotos = React.useMemo(() => {
    const keywordNeedle = keyword.trim().toLowerCase();
    return sourcePhotos.filter((photo) => {
      if (filters.camera !== FILTER_ALL && photo.exif?.camera !== filters.camera) {
        return false;
      }
      if (filters.lens !== FILTER_ALL && photo.exif?.lens !== filters.lens) {
        return false;
      }
      if (filters.year !== FILTER_ALL) {
        const yearValue = photo.exif?.year ? String(photo.exif.year) : null;
        if (yearValue !== filters.year) {
          return false;
        }
      }
      if (filters.sensor !== SENSOR_FILTER_ANY) {
        const sensorValue = photo.exif?.sensor ?? "UNKNOWN";
        if (sensorValue !== filters.sensor) {
          return false;
        }
      }
      if (keywordNeedle.length > 0) {
        const haystack = toKeywordCandidates(photo);
        if (!haystack.some((value) => value.includes(keywordNeedle))) {
          return false;
        }
      }
      return true;
    });
  }, [filters.camera, filters.lens, filters.sensor, filters.year, keyword, sourcePhotos]);

  const sortedPhotos = React.useMemo(() => {
    return [...filteredPhotos].sort((a, b) => {
      const yearA = a.exif?.year ?? 0;
      const yearB = b.exif?.year ?? 0;

      if (filters.sort === "NEWEST") {
        if (yearA !== yearB) return yearB - yearA;
        return b.id.localeCompare(a.id);
      }

      if (yearA !== yearB) return yearA - yearB;
      return a.id.localeCompare(b.id);
    });
  }, [filteredPhotos, filters.sort]);

  const cleanupPendingUploads = React.useCallback((uploads: PendingUpload[]) => {
    uploads.forEach((item) => {
      URL.revokeObjectURL(item.photo.src);
    });
  }, []);

  const handleUploadSelection = React.useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setIsParsingUploads(true);
      cleanupPendingUploads(pendingUploads);
      try {
        const parsed = await Promise.all(Array.from(files).map((file) => parsePendingFile(file)));
        const valid = parsed.filter((item): item is PendingUpload => Boolean(item));
        setPendingUploads(valid);
      } catch (error) {
        console.error("Failed to process uploads", error);
      } finally {
        setIsParsingUploads(false);
        if (uploadInputRef.current) {
          uploadInputRef.current.value = "";
        }
      }
    },
    [cleanupPendingUploads, pendingUploads]
  );

  const handleConfirmUploads = React.useCallback(() => {
    if (pendingUploads.length === 0) {
      uploadInputRef.current?.click();
      return;
    }

    const blockedCount = pendingUploads.filter((item) => item.isBlocked).length;
    if (blockedCount > 0) {
      setToast({ id: Date.now(), message: `${blockedCount}件は発売年が新しい機種です` });
      return;
    }

    setSourcePhotos((current) => [...pendingUploads.map((item) => item.photo), ...current]);
    setPendingUploads([]);
  }, [pendingUploads]);

  const uploadDisabled = hasBlockedUploads && pendingUploads.length > 0;
  const hasPending = pendingUploads.length > 0;

  const handleUploadButtonClick = React.useCallback(() => {
    if (isParsingUploads) return;
    if (pendingUploads.length > 0) {
      if (uploadDisabled) {
        setToast({ id: Date.now(), message: "最新機種が含まれているため追加できません" });
        return;
      }
      handleConfirmUploads();
    } else {
      uploadInputRef.current?.click();
    }
  }, [handleConfirmUploads, isParsingUploads, pendingUploads, uploadDisabled]);

  const pendingUploadsRef = React.useRef<PendingUpload[]>(pendingUploads);

  React.useEffect(() => {
    pendingUploadsRef.current = pendingUploads;
  }, [pendingUploads]);

  React.useEffect(() => {
    return () => {
      cleanupPendingUploads(pendingUploadsRef.current);
    };
  }, [cleanupPendingUploads]);

  return (
    <section className={className} style={{ paddingBottom: "calc(var(--s-4) * 2)" }}>
      <div
        className="relative mx-auto flex w-full flex-col"
        style={{
          gap: "calc(var(--s-2) * 1.5)",
          paddingInline: "clamp(var(--s-1), 2vw, var(--s-3))",
          paddingTop: "calc(var(--s-4) * 1.2)",
          maxWidth: "min(100%, 1400px)",
        }}
      >
        <FilterBar
          cameras={availableCameras}
          sensors={availableSensors}
          value={filters}
          onChange={handleFiltersChange}
        />

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              void handleUploadSelection(event.target.files);
            }}
          />

          {!hasPending && (
            <>
              <button
                type="button"
                className="pixel-button upload-button"
                onClick={handleUploadButtonClick}
                disabled={isParsingUploads}
                aria-label="写真をアップロード"
                style={ICON_BUTTON_STYLE}
              >
                <UploadGlyph style={{ width: "1.25rem", height: "1.25rem" }} />
                <span className="sr-only">写真をアップロード</span>
              </button>
            </>
          )}

          {hasPending && (
            <>
              <button
                type="button"
                className="pixel-button"
                onClick={() => uploadInputRef.current?.click()}
                style={ICON_BUTTON_STYLE}
                aria-label="写真を選択"
              >
                <UploadGlyph style={{ width: "1.25rem", height: "1.25rem" }} />
                <span className="sr-only">写真を選択</span>
              </button>

              {!uploadDisabled && (
                <button
                  type="button"
                  className="pixel-button upload-button"
                  onClick={handleUploadButtonClick}
                  disabled={isParsingUploads}
                >
                  OK
                </button>
              )}

              {uploadDisabled && (
                <button type="button" className="pixel-button" disabled>
                  OK
                </button>
              )}
            </>
          )}

          {isParsingUploads && <span className="upload-hint">解析中...</span>}
          {!isParsingUploads && hasBlockedUploads && (
            <span className="upload-hint" style={{ color: "var(--tone-warning)" }}>
              最新機種は追加対象外です
            </span>
          )}
        </div>

        {pendingUploads.length > 0 && (
          <div
            className="upload-preview"
            style={{
              marginInline: "auto",
              width: "min(100%, 720px)",
            }}
          >
            <p
              style={{
                fontSize: "var(--fs-xs)",
                letterSpacing: "var(--ls-wide)",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
              }}
            >
              EXIF PREVIEW
            </p>

            <div className="upload-preview-list">
              {pendingUploads.map((item) => (
                <article key={item.id} className="upload-preview-card" data-blocked={item.isBlocked ? "true" : undefined}>
                  <header className="upload-preview-header">
                    <span>{item.fileName}</span>
                    <span>{item.fileSize}</span>
                  </header>
                  {item.isBlocked && (
                    <p className="upload-preview-warning">最新機種のため追加できません</p>
                  )}
                  <dl>
                    {item.summary.map((entry) => (
                      <div key={`${item.id}-${entry.label}`}>
                        <dt>{entry.label}</dt>
                        <dd>{entry.value}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </div>
        )}

        {loadError && (
          <div
            style={{
              paddingInline: "var(--s-2)",
              paddingBlock: "var(--s-2)",
              fontSize: "var(--fs-xs)",
              color: "var(--tone-error)",
              background: "var(--tone-error-soft)",
              borderRadius: "var(--r-card)",
            }}
          >
            {loadError}
          </div>
        )}

        {isLoadingData && sourcePhotos.length === 0 ? (
          <div
            style={{
              paddingInline: "var(--s-3)",
              paddingBlock: "calc(var(--s-3) * 1.5)",
              textAlign: "center",
              fontSize: "var(--fs-xs)",
              color: "var(--ink-muted)",
              background: "var(--panel-strong)",
              borderRadius: "var(--r-card)",
            }}
          >
            Loading photo stories...
          </div>
        ) : (
          <ExploreGrid photos={sortedPhotos} />
        )}
      </div>
    </section>
  );
}
