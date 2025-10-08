"use client";

import * as React from "react";

import { PhotoCard, type Photo } from "./PhotoCard";

type ExploreGridProps = {
  photos: Photo[];
};

const BATCH_SIZE = 12;

export function ExploreGrid({ photos }: ExploreGridProps) {
  const [visibleCount, setVisibleCount] = React.useState(BATCH_SIZE);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [photos]);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (visibleCount >= photos.length) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((current) => {
              if (current >= photos.length) return current;
              return Math.min(current + BATCH_SIZE, photos.length);
            });
          }
        });
      },
      { rootMargin: "320px" }
    );

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [photos.length, visibleCount]);

  const visiblePhotos = React.useMemo(() => photos.slice(0, visibleCount), [photos, visibleCount]);

  if (photos.length === 0) {
    return (
      <div className="pixel-frame pixel-notch px-6 py-12 text-center text-sm text-slate-300">
        No photos match the selected filters yet.
      </div>
    );
  }

  return (
    <section className="space-y-12">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePhotos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
      </div>
      <div ref={sentinelRef} aria-hidden="true" className="h-10 w-full" />
      {visibleCount < photos.length && (
        <div className="text-center text-[0.7rem] uppercase tracking-[0.32em] text-slate-500">
          Scanning archive…
        </div>
      )}
    </section>
  );
}

export type { Photo } from "./PhotoCard";
