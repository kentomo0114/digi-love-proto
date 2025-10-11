import { NextResponse } from "next/server";

import { photos } from "@/data/photos";
import { classifySensor } from "@/lib/exif/classifySensor";
import { sensorTypeToKind } from "@/types";

function toBoolean(value: string | null): boolean {
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ccdOnly = toBoolean(searchParams.get("ccd"));

  const enriched = photos.map((photo) => {
    const exif = photo.exif ?? {};
    const sensorType = classifySensor({ make: exif.make, model: exif.camera, lens: exif.lens });
    const sensor = sensorTypeToKind(sensorType);
    const verdict = sensorType === "CCD";
    const status = exif.camera ? (sensorType === "UNKNOWN" ? "unknown" : verdict ? "ccd" : "non-ccd") : "unknown";

    return {
      ...photo,
      sensor,
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
