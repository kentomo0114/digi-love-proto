"use client";

import * as React from "react";
import NextImage from "next/image";
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";

import { ExploreGrid, type Photo } from "./ExploreGrid";
import { FilterBar, FILTER_ALL, SENSOR_FILTER_ANY, type FilterState } from "./FilterBar";
import type { SensorKind, SensorType } from "@/types";
import { SENSOR_TYPES, sensorKindToType, sensorTypeToKind, toSensorKind } from "@/types";
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

type ArchivePhoto = Photo & {
  meta?: {
    sensor?: SensorKind;
  };
};

type ApiResponse = {
  photos: ArchivePhoto[];
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
  photo: ArchivePhoto;
  summary: SummaryItem[];
  releaseYear?: number;
  isBlocked: boolean;
};

const normalizePhotoSensor = (photo: ArchivePhoto): ArchivePhoto => {
  const sensor: SensorKind = toSensorKind(
    (photo as { exif?: { sensor?: unknown }; sensor?: unknown }).exif?.sensor ??
      (photo as { sensor?: unknown }).sensor ??
      null
  );
  return {
    ...photo,
    sensor,
    exif: photo.exif ? { ...photo.exif, sensor } : photo.exif,
  };
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

const buildSummary = (photo: ArchivePhoto, releaseYear?: number, isBlocked?: boolean): SummaryItem[] => {
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
  const sensor = photo.exif?.sensor ?? photo.sensor ?? photo.meta?.sensor;
  add("Sensor", sensor);
  add("Release", releaseYear);
  add("Status", isBlocked ? "TOO NEW" : "OK");
  return summary;
};

async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  if (typeof window === "undefined" || typeof Image === "undefined") {
    return { width: 1200, height: 800 };
  }
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

  type ExifrOptions = {
    tiff?: boolean;
    ifd0?: Record<string, unknown>;
    exif?: boolean;
    xmp?: boolean;
    icc?: boolean;
    iptc?: boolean;
  };

  const exifrOptions: ExifrOptions = {
    tiff: true,
    ifd0: {},
    exif: true,
    xmp: true,
    icc: true,
    iptc: true,
  };

  let exifRaw: Record<string, unknown> | null = null;
  try {
    const { parse } = await import("exifr");
    exifRaw = (await parse(file, exifrOptions)) as
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

  const sensorType = classifySensor({ make, model: camera, lens });
  const sensor = sensorTypeToKind(sensorType);
  const isClassic = isClassicCamera({ make, model: camera });

  const releaseYear = getCameraReleaseYear({ make, model: camera });
  const isBlocked = isClassic
    ? false
    : releaseYear !== undefined
      ? releaseYear > RELEASE_YEAR_CUTOFF
      : sensorType !== "CCD";

  const { width, height } = await getImageDimensions(objectUrl);

  const photo: ArchivePhoto = {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    src: objectUrl,
    alt: file.name,
    width,
    height,
    sensor,
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

function toKeywordCandidates(photo: ArchivePhoto): string[] {
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
  const [sourcePhotos, setSourcePhotos] = React.useState<ArchivePhoto[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const [pendingUploads, setPendingUploads] = React.useState<PendingUpload[]>([]);
  const [isParsingUploads, setIsParsingUploads] = React.useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState<boolean>(false);
  const [activePhoto, setActivePhoto] = React.useState<ArchivePhoto | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState<boolean>(false);

  const initialParsed = React.useMemo(() => parseFilters(syncWithUrl ? searchParams : null), [searchParams, syncWithUrl]);

  const [filters, setFilters] = React.useState<FilterState>(initialParsed.filters);
  const [keyword, setKeyword] = React.useState<string>(initialParsed.keyword);

  const previewTitleId = React.useId();
  const previewDescriptionId = React.useId();
  const modalCloseButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const viewerTitleId = React.useId();
  const viewerDescriptionId = React.useId();
  const photoModalCloseButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const blockedCount = React.useMemo(() => pendingUploads.filter((item) => item.isBlocked).length, [pendingUploads]);
  const hasBlockedUploads = React.useMemo(() => pendingUploads.some((item) => item.isBlocked), [pendingUploads]);
  const selectedPhotoSummary = React.useMemo(() => {
    if (!activePhoto) return [];
    const releaseYear = getCameraReleaseYear({
      make: activePhoto.exif?.make,
      model: activePhoto.exif?.camera,
    });
    return buildSummary(activePhoto, releaseYear, false).filter((entry) => entry.label !== "Status");
  }, [activePhoto]);

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
          setSourcePhotos((payload.photos ?? []).map(normalizePhotoSensor));
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
        sourcePhotos.map((photo) => sensorKindToType(photo.exif?.sensor ?? photo.sensor ?? "Unknown"))
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
        const sensorValue = sensorKindToType(photo.exif?.sensor ?? photo.sensor ?? "Unknown");
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
        setIsPreviewOpen(valid.length > 0);
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

    if (blockedCount > 0) {
      return;
    }

    setSourcePhotos((current) => [...pendingUploads.map((item) => normalizePhotoSensor(item.photo)), ...current]);
    setPendingUploads([]);
    setIsPreviewOpen(false);
  }, [blockedCount, pendingUploads, setSourcePhotos]);

  const hasPending = pendingUploads.length > 0;

  const handleUploadButtonClick = React.useCallback(() => {
    if (isParsingUploads) return;
    if (pendingUploads.length === 0) {
      uploadInputRef.current?.click();
      return;
    }

    setIsPreviewOpen(true);
  }, [isParsingUploads, pendingUploads.length]);

  const handleDismissPreview = React.useCallback(() => {
    setIsPreviewOpen(false);
  }, []);

  const handlePhotoSelect = React.useCallback(
    (photo: Photo) => {
      const normalized = normalizePhotoSensor(photo as ArchivePhoto);
      setActivePhoto(normalized);
      setIsPhotoModalOpen(true);
      setIsPreviewOpen(false);
    },
    []
  );

  const handleClosePhotoModal = React.useCallback(() => {
    setIsPhotoModalOpen(false);
    setActivePhoto(null);
  }, []);

  const pendingUploadsRef = React.useRef<PendingUpload[]>(pendingUploads);

  React.useEffect(() => {
    pendingUploadsRef.current = pendingUploads;
  }, [pendingUploads]);

  React.useEffect(() => {
    return () => {
      cleanupPendingUploads(pendingUploadsRef.current);
    };
  }, [cleanupPendingUploads]);

  React.useEffect(() => {
    if (pendingUploads.length === 0) {
      setIsPreviewOpen(false);
    }
  }, [pendingUploads.length]);

  React.useEffect(() => {
    if (!isPreviewOpen && !isPhotoModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isPreviewOpen) {
          setIsPreviewOpen(false);
        }
        if (isPhotoModalOpen) {
          setIsPhotoModalOpen(false);
          setActivePhoto(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPhotoModalOpen, isPreviewOpen]);

  React.useEffect(() => {
    if (!isPreviewOpen && !isPhotoModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPhotoModalOpen, isPreviewOpen]);

  React.useEffect(() => {
    if (isPreviewOpen) {
      modalCloseButtonRef.current?.focus();
    }
  }, [isPreviewOpen]);

  React.useEffect(() => {
    if (isPhotoModalOpen) {
      photoModalCloseButtonRef.current?.focus();
    }
  }, [isPhotoModalOpen]);

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

              <button
                type="button"
                className="pixel-button upload-button"
                onClick={handleUploadButtonClick}
                disabled={isParsingUploads}
                aria-label="EXIFプレビューを表示"
              >
                REVIEW
              </button>
            </>
          )}

          {isParsingUploads && <span className="upload-hint">解析中...</span>}
          {!isParsingUploads && hasBlockedUploads && (
            <span className="upload-hint" style={{ color: "var(--tone-warning)" }}>
              最新機種は追加対象外です
            </span>
          )}
        </div>

        {isPreviewOpen && pendingUploads.length > 0 && (
          <div
            className="upload-modal-backdrop"
            role="presentation"
            onClick={handleDismissPreview}
          >
            <div
              className="upload-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={previewTitleId}
              aria-describedby={previewDescriptionId}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="upload-modal-header">
                <div>
                  <p className="upload-modal-kicker">Pending Upload</p>
                  <h2 id={previewTitleId}>EXIF Preview</h2>
                </div>
                <button
                  type="button"
                  className="upload-modal-close"
                  onClick={handleDismissPreview}
                  aria-label="閉じる"
                  ref={modalCloseButtonRef}
                >
                  X
                </button>
              </header>

              <div className="upload-modal-body" id={previewDescriptionId}>
                {pendingUploads.map((item) => (
                  <div
                    key={item.id}
                    className="upload-modal-entry"
                    data-blocked={item.isBlocked ? "true" : undefined}
                  >
                    <div className="upload-modal-photo">
                      <NextImage
                        src={item.photo.src}
                        alt={item.photo.alt}
                        width={item.photo.width || 1200}
                        height={item.photo.height || 800}
                        className="upload-modal-photo-image"
                        sizes="(min-width: 900px) 460px, 100vw"
                        style={{ width: "100%", height: "auto" }}
                        unoptimized
                      />
                    </div>

                    <div className="upload-preview-card" data-blocked={item.isBlocked ? "true" : undefined}>
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
                    </div>
                  </div>
                ))}
              </div>

              <footer className="upload-modal-footer">
                <p className="upload-modal-footer-note">
                  {hasBlockedUploads
                    ? `最新機種が${blockedCount}件含まれているため追加できません。対象外のファイルを外してからやり直してください。`
                    : "この内容でアーカイブに追加します。"}
                </p>
                <div className="upload-modal-footer-actions">
                  <button type="button" className="pixel-button" onClick={handleDismissPreview}>
                    Cancel
                  </button>
                  <button type="button" className="pixel-button upload-button" onClick={handleConfirmUploads}>
                    {`Add ${pendingUploads.length}`}
                  </button>
                </div>
              </footer>
            </div>
          </div>
        )}

        {isPhotoModalOpen && activePhoto && (
          <div
            className="upload-modal-backdrop"
            role="presentation"
            onClick={handleClosePhotoModal}
          >
            <div
              className="upload-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={viewerTitleId}
              aria-describedby={viewerDescriptionId}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="upload-modal-header">
                <div>
                  <p className="upload-modal-kicker">Archive Photo</p>
                  <h2 id={viewerTitleId}>{activePhoto.alt}</h2>
                </div>
                <button
                  type="button"
                  className="upload-modal-close"
                  onClick={handleClosePhotoModal}
                  aria-label="閉じる"
                  ref={photoModalCloseButtonRef}
                >
                  X
                </button>
              </header>

              <div className="upload-modal-body" id={viewerDescriptionId}>
                <div className="upload-modal-entry">
                  <div className="upload-modal-photo">
                    <NextImage
                      src={activePhoto.src}
                      alt={activePhoto.alt}
                      width={activePhoto.width || 1400}
                      height={activePhoto.height || 936}
                      className="upload-modal-photo-image"
                      sizes="(min-width: 900px) 560px, 100vw"
                      style={{ width: "100%", height: "auto" }}
                      unoptimized
                      priority
                    />
                  </div>

                  <div className="upload-preview-card">
                    <header className="upload-preview-header">
                      <span>{activePhoto.exif?.camera ?? "Unknown camera"}</span>
                      <span>{activePhoto.exif?.year ?? "—"}</span>
                    </header>
                    <dl>
                      {selectedPhotoSummary.map((entry) => (
                        <div key={`selected-${entry.label}-${entry.value}`}>
                          <dt>{entry.label}</dt>
                          <dd>{entry.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </div>

              <footer className="upload-modal-footer">
                <div className="upload-modal-footer-actions">
                  <button type="button" className="pixel-button upload-button" onClick={handleClosePhotoModal}>
                    Close
                  </button>
                </div>
              </footer>
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
          <ExploreGrid photos={sortedPhotos} onSelect={handlePhotoSelect} />
        )}
      </div>
    </section>
  );
}
