import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeTags,
  optionalDescription,
  optionalQuantity,
  rejectQuantityForNonItem
} from "../../src/utils/validation";
import { ApiError } from "../../src/utils/errors";

describe("node metadata validation", () => {
  it("normalizes tags by trimming and deduplicating case-insensitively", () => {
    assert.deepEqual(normalizeTags([" battery ", "Electronics", "battery"]), [
      "battery",
      "Electronics"
    ]);
  });

  it("removes empty tags after trimming", () => {
    assert.deepEqual(normalizeTags([" ", "valid"]), ["valid"]);
  });

  it("rejects non-array tags", () => {
    assert.throws(
      () => normalizeTags("battery"),
      (error) => error instanceof ApiError && error.code === "VALIDATION_ERROR"
    );
  });

  it("treats blank descriptions as absent", () => {
    assert.equal(optionalDescription("  note  "), "note");
    assert.equal(optionalDescription("   "), undefined);
  });

  it("validates item quantity as a non-negative integer", () => {
    assert.equal(optionalQuantity(12), 12);
    assert.equal(optionalQuantity(0), 0);

    assert.throws(
      () => optionalQuantity(-1),
      (error) => error instanceof ApiError && error.code === "VALIDATION_ERROR"
    );
    assert.throws(
      () => optionalQuantity(1.5),
      (error) => error instanceof ApiError && error.code === "VALIDATION_ERROR"
    );
  });

  it("rejects quantity on Spaces and Containers", () => {
    assert.throws(
      () => rejectQuantityForNonItem("SPACE", 1),
      (error) => error instanceof ApiError && error.code === "VALIDATION_ERROR"
    );
    assert.throws(
      () => rejectQuantityForNonItem("CONTAINER", 1),
      (error) => error instanceof ApiError && error.code === "VALIDATION_ERROR"
    );
    assert.doesNotThrow(() => rejectQuantityForNonItem("ITEM", 1));
    assert.doesNotThrow(() => rejectQuantityForNonItem("SPACE", undefined));
  });
});
