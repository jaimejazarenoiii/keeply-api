import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createApp } from "../../src/app";
import { requestText } from "../helpers/http";

describe("OpenAPI docs", () => {
  it("serves the raw OpenAPI contract", async () => {
    const response = await requestText(createApp(), "GET", "/openapi.yaml");

    assert.equal(response.status, 200);
    assert.match(response.body, /openapi: 3\.1\.0/);
    assert.match(response.body, /title: Hierarchical Storage API/);
  });

  it("serves Swagger UI", async () => {
    const response = await requestText(createApp(), "GET", "/docs/");

    assert.equal(response.status, 200);
    assert.match(response.body, /swagger-ui/);
    assert.match(response.body, /Keeply API Docs/);
  });
});
