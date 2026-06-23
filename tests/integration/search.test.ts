import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ApiErrorResponse, NodeListResponse } from "../../src/types/api";
import { authHeaders, createAuthTestApp, registerTestUser } from "../helpers/auth";
import { requestJson } from "../helpers/http";

describe("Search API", () => {
  it("searches name, description, and tags with a single query string", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "search-owner@example.com");
    const headers = authHeaders(auth);

    const space = await requestJson<{ data: { id: string } }>(
      app,
      "POST",
      "/spaces",
      {
        name: "Garage Workshop",
        tags: ["tools", "home"],
        description: "Main garage storage area"
      },
      { headers }
    );

    const container = await requestJson<{ data: { id: string } }>(
      app,
      "POST",
      "/containers",
      {
        name: "Tool Cabinet",
        parentId: space.body.data.id,
        tags: ["tools", "metal"],
        description: "Locked cabinet for power tools"
      },
      { headers }
    );

    await requestJson(
      app,
      "POST",
      "/items",
      {
        name: "Cordless Drill",
        parentId: container.body.data.id,
        quantity: 1,
        tags: ["power-tools"],
        description: "18V power tools drill with spare battery"
      },
      { headers }
    );

    const byName = await requestJson<NodeListResponse>(
      app,
      "GET",
      "/search?q=workshop",
      undefined,
      { headers }
    );

    assert.equal(byName.status, 200);
    assert.equal(byName.body.data.length, 1);
    assert.equal(byName.body.data[0]?.type, "SPACE");
    assert.equal(byName.body.data[0]?.name, "Garage Workshop");

    const byDescription = await requestJson<NodeListResponse>(
      app,
      "GET",
      "/search?q=power%20tools",
      undefined,
      { headers }
    );

    assert.equal(byDescription.status, 200);
    assert.equal(byDescription.body.data.length, 2);
    assert.ok(byDescription.body.data.some((node) => node.type === "CONTAINER"));
    assert.ok(byDescription.body.data.some((node) => node.type === "ITEM"));

    const byTag = await requestJson<NodeListResponse>(
      app,
      "GET",
      "/search?q=metal",
      undefined,
      { headers }
    );

    assert.equal(byTag.status, 200);
    assert.equal(byTag.body.data.length, 1);
    assert.equal(byTag.body.data[0]?.name, "Tool Cabinet");

    const broadMatch = await requestJson<NodeListResponse>(
      app,
      "GET",
      "/search?q=tool",
      undefined,
      { headers }
    );

    assert.equal(broadMatch.status, 200);
    assert.equal(broadMatch.body.data.length, 3);
  });

  it("filters by node type and respects limit", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "search-type@example.com");
    const headers = authHeaders(auth);

    const space = await requestJson<{ data: { id: string } }>(
      app,
      "POST",
      "/spaces",
      { name: "Alpha Space", tags: ["shared"] },
      { headers }
    );

    await requestJson(
      app,
      "POST",
      "/containers",
      {
        name: "Alpha Container",
        parentId: space.body.data.id,
        tags: ["shared"]
      },
      { headers }
    );

    await requestJson(
      app,
      "POST",
      "/items",
      {
        name: "Alpha Item",
        parentId: space.body.data.id,
        tags: ["shared"]
      },
      { headers }
    );

    const itemsOnly = await requestJson<NodeListResponse>(
      app,
      "GET",
      "/search?q=shared&type=ITEM",
      undefined,
      { headers }
    );

    assert.equal(itemsOnly.status, 200);
    assert.equal(itemsOnly.body.data.length, 1);
    assert.equal(itemsOnly.body.data[0]?.type, "ITEM");

    const limited = await requestJson<NodeListResponse>(
      app,
      "GET",
      "/search?q=shared&limit=2",
      undefined,
      { headers }
    );

    assert.equal(limited.status, 200);
    assert.equal(limited.body.data.length, 2);
  });

  it("requires q and does not leak other users' nodes", async () => {
    const { app } = createAuthTestApp();
    const owner = await registerTestUser(app, "search-owner-isolation@example.com");
    const other = await registerTestUser(app, "search-other@example.com");

    await requestJson(
      app,
      "POST",
      "/spaces",
      {
        name: "Private Space",
        tags: ["secret"],
        description: "Owner only"
      },
      { headers: authHeaders(owner) }
    );

    const missingQuery = await requestJson<ApiErrorResponse>(
      app,
      "GET",
      "/search",
      undefined,
      { headers: authHeaders(owner) }
    );

    assert.equal(missingQuery.status, 400);
    assert.equal(missingQuery.body.error.code, "VALIDATION_ERROR");

    const otherSearch = await requestJson<NodeListResponse>(
      app,
      "GET",
      "/search?q=secret",
      undefined,
      { headers: authHeaders(other) }
    );

    assert.equal(otherSearch.status, 200);
    assert.equal(otherSearch.body.data.length, 0);
  });
});
