import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createApp } from "../../src/app";
import { requestText } from "../helpers/http";

describe("Dashboard OpenAPI contract", () => {
  it("documents the dashboard endpoint in the served OpenAPI contract", async () => {
    const response = await requestText(createApp(), "GET", "/openapi.yaml");

    assert.equal(response.status, 200);
    assert.match(response.body, /\/dashboard:/);
    assert.match(response.body, /DashboardSummary/);
    assert.match(response.body, /quantity:/);
    assert.match(response.body, /tags:/);
    assert.match(response.body, /description:/);
  });
});
