import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { isCCD } from "./isCCD";

describe("isCCD", () => {
  it("returns false for Canon IXY 610F variants", () => {
    assert.equal(isCCD({ make: "Canon", model: "IXY 610F" }), false);
    assert.equal(isCCD({ make: "Canon", model: "IXY610F" }), false);
    assert.equal(isCCD({ make: "Canon", model: "Canon IXY DIGITAL 610F" }), false);
  });

  it("returns true for a known CCD compact", () => {
    assert.equal(isCCD({ make: "Canon", model: "Canon PowerShot G7" }), true);
  });

  it("returns false when model is missing", () => {
    assert.equal(isCCD({ make: "Canon", model: undefined }), false);
  });

  it("returns false for unsupported models", () => {
    assert.equal(isCCD({ make: "Canon", model: "PowerShot G9" }), false);
  });
});
