import { classifySensor } from "./classifySensor";

export type ExifLike = {
  make?: string;
  model?: string;
};

export function isCCD(exif: ExifLike): boolean {
  const sensor = classifySensor({ make: exif.make, model: exif.model });
  return sensor === "CCD";
}
