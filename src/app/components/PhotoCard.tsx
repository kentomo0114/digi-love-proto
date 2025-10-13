"use client";

import type { ExifSummary, SensorKind } from "@/types";

export type Photo = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  exif?: ExifSummary;
  sensor?: SensorKind;
};

type PhotoCardProps = {
  photo: Photo;
  onSelect?: (photo: Photo) => void;
};

export function PhotoCard({ photo, onSelect }: PhotoCardProps) {
  const aspectRatio = `${Math.max(photo.width, 1)} / ${Math.max(photo.height, 1)}`;

  return (
    <article
      className="relative overflow-hidden"
      style={{ borderRadius: "var(--r-card)" }}
    >
      <button
        type="button"
        onClick={() => onSelect?.(photo)}
        className="group relative block w-full overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-white/80"
        style={{ borderRadius: "var(--r-card)" }}
      >
        <div className="relative w-full overflow-hidden" style={{ aspectRatio }}>
          <img
            src={photo.src}
            alt={photo.alt}
            loading="lazy"
            width={photo.width}
            height={photo.height}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
        </div>

        <div
          className="absolute inset-0 flex flex-col justify-end"
          style={{ padding: "var(--s-3)", pointerEvents: "none" }}
        >
          <div
            className="flex flex-col gap-1 text-white opacity-0 translate-y-1 transition duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
            style={{
              alignItems: "flex-start",
              justifyContent: "flex-end",
            }}
          >
            <h3
              className="text-left"
              style={{
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                letterSpacing: "var(--ls-base)",
                textShadow: "0 12px 32px rgba(0, 0, 0, 0.45)",
              }}
            >
              {photo.alt}
            </h3>
            <p
              className="text-left"
              style={{
                fontSize: "var(--fs-xxs)",
                letterSpacing: "var(--ls-wider)",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              {photo.exif?.camera ?? "Unknown"}
            </p>
          </div>
        </div>
      </button>
    </article>
  );
}
