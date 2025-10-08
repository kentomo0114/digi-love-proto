import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { classifySensor } from "./classifySensor";

describe("classifySensor", () => {
  it("maps Canon IXY 610F variants to CMOS", () => {
    const variants = [
      "Canon IXY 610F",
      "IXY610F",
      "Canon IXY DIGITAL 610F",
    ];

    for (const model of variants) {
      assert.equal(
        classifySensor({ make: "Canon", model }),
        "CMOS",
        `${model} should resolve to CMOS`
      );
    }
  });

  it("detects Foveon sensors via Sigma DP patterns", () => {
    assert.equal(
      classifySensor({ make: "SIGMA", model: "SIGMA DP2 Merrill" }),
      "FOVEON"
    );
  });

  it("returns CCD for known CCD compacts", () => {
    assert.equal(
      classifySensor({ make: "Canon", model: "Canon PowerShot G7" }),
      "CCD"
    );
  });

  it("falls back to UNKNOWN for unsupported models", () => {
    assert.equal(
      classifySensor({ make: "Canon", model: "PowerShot G9" }),
      "UNKNOWN"
    );
  });
});
