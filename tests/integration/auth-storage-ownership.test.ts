import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { describe, it } from "node:test";
import type {
  ApiErrorResponse,
  ItemPathResponse,
  NodeResponse,
  SpaceListResponse,
  TreeResponse
} from "../../src/types/api";
import { authHeaders, createAuthTestApp, registerTestUser } from "../helpers/auth";
import { requestJson } from "../helpers/http";

describe("Authenticated storage ownership", () => {
  it("requires authentication for Space access", async () => {
    const { app } = createAuthTestApp();
    const response = await requestJson<ApiErrorResponse>(app, "GET", "/spaces");

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, "AUTHENTICATION_REQUIRED");
  });

  it("lists only Spaces owned by the authenticated user", async () => {
    const { app } = createAuthTestApp();
    const firstUser = await registerTestUser(app, "first@example.com");
    const secondUser = await registerTestUser(app, "second@example.com");

    const firstSpace = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Garage" },
      { headers: authHeaders(firstUser) }
    );
    const secondSpace = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Office" },
      { headers: authHeaders(secondUser) }
    );

    assert.equal(firstSpace.status, 201);
    assert.equal(secondSpace.status, 201);
    assert.equal("userId" in firstSpace.body.data, false);
    assert.equal("userId" in secondSpace.body.data, false);

    const firstList = await requestJson<SpaceListResponse>(app, "GET", "/spaces", undefined, {
      headers: authHeaders(firstUser)
    });
    const secondList = await requestJson<SpaceListResponse>(app, "GET", "/spaces", undefined, {
      headers: authHeaders(secondUser)
    });

    assert.deepEqual(
      firstList.body.data.map((space) => space.id),
      [firstSpace.body.data.id]
    );
    assert.deepEqual(
      secondList.body.data.map((space) => space.id),
      [secondSpace.body.data.id]
    );
  });

  it("denies updates to another user's Space", async () => {
    const { app } = createAuthTestApp();
    const firstUser = await registerTestUser(app, "first@example.com");
    const secondUser = await registerTestUser(app, "second@example.com");
    const firstSpace = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Garage" },
      { headers: authHeaders(firstUser) }
    );

    const response = await requestJson<ApiErrorResponse>(
      app,
      "PATCH",
      `/spaces/${firstSpace.body.data.id}`,
      { name: "Workshop" },
      { headers: authHeaders(secondUser) }
    );

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, "NOT_FOUND");
  });

  it("rejects Containers created under another user's parent", async () => {
    const { app } = createAuthTestApp();
    const firstUser = await registerTestUser(app, "first@example.com");
    const secondUser = await registerTestUser(app, "second@example.com");
    const firstSpace = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Garage" },
      { headers: authHeaders(firstUser) }
    );

    const response = await requestJson<ApiErrorResponse>(
      app,
      "POST",
      "/containers",
      {
        name: "Shelf A",
        parentId: firstSpace.body.data.id
      },
      { headers: authHeaders(secondUser) }
    );

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, "NOT_FOUND");
  });

  it("rejects Items created or moved under another user's parent", async () => {
    const { app } = createAuthTestApp();
    const firstUser = await registerTestUser(app, "first@example.com");
    const secondUser = await registerTestUser(app, "second@example.com");
    const firstSpace = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Garage" },
      { headers: authHeaders(firstUser) }
    );
    const secondSpace = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Office" },
      { headers: authHeaders(secondUser) }
    );
    const secondItem = await requestJson<NodeResponse>(
      app,
      "POST",
      "/items",
      {
        name: "Notebook",
        parentId: secondSpace.body.data.id
      },
      { headers: authHeaders(secondUser) }
    );

    const createResponse = await requestJson<ApiErrorResponse>(
      app,
      "POST",
      "/items",
      {
        name: "Extension Cord",
        parentId: firstSpace.body.data.id
      },
      { headers: authHeaders(secondUser) }
    );
    const moveResponse = await requestJson<ApiErrorResponse>(
      app,
      "PATCH",
      `/items/${secondItem.body.data.id}/move`,
      {
        parentId: firstSpace.body.data.id
      },
      { headers: authHeaders(secondUser) }
    );

    assert.equal(createResponse.status, 404);
    assert.equal(createResponse.body.error.code, "NOT_FOUND");
    assert.equal(moveResponse.status, 404);
    assert.equal(moveResponse.body.error.code, "NOT_FOUND");
  });

  it("scopes tree and Item path retrieval to the authenticated owner", async () => {
    const { app } = createAuthTestApp();
    const firstUser = await registerTestUser(app, "first@example.com");
    const secondUser = await registerTestUser(app, "second@example.com");
    const firstHeaders = authHeaders(firstUser);
    const secondHeaders = authHeaders(secondUser);
    const space = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Garage" },
      { headers: firstHeaders }
    );
    const shelf = await requestJson<NodeResponse>(
      app,
      "POST",
      "/containers",
      {
        name: "Shelf A",
        parentId: space.body.data.id
      },
      { headers: firstHeaders }
    );
    const item = await requestJson<NodeResponse>(
      app,
      "POST",
      "/items",
      {
        name: "Extension Cord",
        parentId: shelf.body.data.id
      },
      { headers: firstHeaders }
    );

    const ownerTree = await requestJson<TreeResponse>(
      app,
      "GET",
      `/containers/${shelf.body.data.id}/tree`,
      undefined,
      { headers: firstHeaders }
    );
    const otherTree = await requestJson<ApiErrorResponse>(
      app,
      "GET",
      `/containers/${shelf.body.data.id}/tree`,
      undefined,
      { headers: secondHeaders }
    );
    const otherPath = await requestJson<ApiErrorResponse>(
      app,
      "GET",
      `/items/${item.body.data.id}/path`,
      undefined,
      { headers: secondHeaders }
    );
    const ownerPath = await requestJson<ItemPathResponse>(
      app,
      "GET",
      `/items/${item.body.data.id}/path`,
      undefined,
      { headers: firstHeaders }
    );

    assert.equal(ownerTree.status, 200);
    assert.equal(ownerTree.body.data.name, "Shelf A");
    assert.equal(otherTree.status, 404);
    assert.equal(otherTree.body.error.code, "NOT_FOUND");
    assert.equal(otherPath.status, 404);
    assert.equal(otherPath.body.error.code, "NOT_FOUND");
    assert.deepEqual(
      ownerPath.body.data.path.map((segment) => segment.name),
      ["Garage", "Shelf A", "Extension Cord"]
    );
  });

  it("keeps authenticated storage reads within a measurable overhead budget", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "perf@example.com");
    const headers = authHeaders(auth);
    const iterations = 10;

    await requestJson<NodeResponse>(app, "POST", "/spaces", { name: "Garage" }, { headers });

    const startedAt = performance.now();

    for (let index = 0; index < iterations; index += 1) {
      const response = await requestJson<SpaceListResponse>(app, "GET", "/spaces", undefined, {
        headers
      });

      assert.equal(response.status, 200);
    }

    const averageMs = (performance.now() - startedAt) / iterations;

    assert.equal(averageMs < 250, true, `Average authenticated read was ${averageMs}ms`);
  });
});
