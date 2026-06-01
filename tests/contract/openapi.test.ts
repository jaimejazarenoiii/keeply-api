import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const contractPath = "specs/001-hierarchical-storage-api/contracts/openapi.yaml";

describe("OpenAPI contract", () => {
  it("documents the foundational Node response schema", () => {
    assert.equal(existsSync(contractPath), true);

    const contract = readFileSync(contractPath, "utf8");

    assert.match(contract, /openapi: 3\.1\.0/);
    assert.match(contract, /NodeImage:/);
    assert.match(contract, /NodeResponse:/);
    assert.match(contract, /ErrorResponse:/);
    assert.match(contract, /deleteContainer/);
  });
});
