import { NextResponse } from "next/server";

import { photos } from "@/data/photos";
import { classifySensor } from "@/lib/exif/classifySensor";

function toBoolean(value: string | null): boolean {
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ccdOnly = toBoolean(searchParams.get("ccd"));

  const enriched = photos.map((photo) => {
    const exif = photo.exif ?? {};
    const sensor = classifySensor({ make: exif.make, model: exif.camera, lens: exif.lens });
    const verdict = sensor === "CCD";
    const status = exif.camera ? (sensor === "UNKNOWN" ? "unknown" : verdict ? "ccd" : "non-ccd") : "unknown";

    return {
      ...photo,
      exif: {
        ...exif,
        ccd: verdict,
        ccdStatus: status,
        sensor,
      },
    };
  });

  const filtered = ccdOnly ? enriched.filter((photo) => photo.exif?.ccd === true) : enriched;

  return NextResponse.json({ photos: filtered });
}
