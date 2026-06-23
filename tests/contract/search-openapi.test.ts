import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createApp } from "../../src/app";
import { requestText } from "../helpers/http";

describe("Search OpenAPI contract", () => {
  it("documents the search endpoint with a single q query parameter", async () => {
    const response = await requestText(createApp(), "GET", "/openapi.yaml");

    assert.equal(response.status, 200);
    assert.match(response.body, /\/search:/);
    assert.match(response.body, /searchNodes/);
    assert.match(response.body, /NodeListResponse/);

    const searchSection = response.body.slice(
      response.body.indexOf("/search:"),
      response.body.indexOf("/spaces:")
    );

    assert.match(searchSection, /- name: q/);
    assert.doesNotMatch(searchSection, /- name: name/);
    assert.doesNotMatch(searchSection, /- name: description/);
    assert.doesNotMatch(searchSection, /- name: tags/);
  });
});
