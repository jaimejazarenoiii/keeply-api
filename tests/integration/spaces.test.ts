import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ApiErrorResponse, NodeResponse, SpaceListResponse } from "../../src/types/api";
import { authHeaders, createAuthTestApp, registerTestUser } from "../helpers/auth";
import { requestJson } from "../helpers/http";

describe("Space API", () => {
  it("creates and lists Spaces", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app);

    const created = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      {
        name: " Garage ",
        metadata: { indoor: false }
      },
      { headers: authHeaders(auth) }
    );

    assert.equal(created.status, 201);
    assert.equal(created.body.data.type, "SPACE");
    assert.equal(created.body.data.name, "Garage");
    assert.equal(created.body.data.parentId, null);
    assert.equal(created.body.data.spaceId, created.body.data.id);
    assert.deepEqual(created.body.data.metadata, { indoor: false });

    const listed = await requestJson<SpaceListResponse>(app, "GET", "/spaces", undefined, {
      headers: authHeaders(auth)
    });

    assert.equal(listed.status, 200);
    assert.equal(listed.body.data.length, 1);
    assert.equal(listed.body.data[0]?.id, created.body.data.id);
  });

  it("rejects empty Space names", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app);

    const response = await requestJson<ApiErrorResponse>(
      app,
      "POST",
      "/spaces",
      {
        name: " "
      },
      { headers: authHeaders(auth) }
    );

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });

  it("updates and deletes empty Spaces", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app);
    const headers = authHeaders(auth);
    const created = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      {
        name: "Garage"
      },
      { headers }
    );

    const updated = await requestJson<NodeResponse>(
      app,
      "PATCH",
      `/spaces/${created.body.data.id}`,
      { name: "Workshop" },
      { headers }
    );

    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.name, "Workshop");

    const deleted = await requestJson<undefined>(
      app,
      "DELETE",
      `/spaces/${created.body.data.id}`,
      undefined,
      { headers }
    );

    assert.equal(deleted.status, 204);
  });

  it("creates and updates Spaces with tags and description", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "space-metadata@example.com");
    const headers = authHeaders(auth);

    const created = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      {
        name: "Kitchen",
        tags: [" home ", "indoor", "home"],
        description: "Main kitchen storage"
      },
      { headers }
    );

    assert.equal(created.status, 201);
    assert.deepEqual(created.body.data.tags, ["home", "indoor"]);
    assert.equal(created.body.data.description, "Main kitchen storage");
    assert.equal(created.body.data.quantity, undefined);

    const updated = await requestJson<NodeResponse>(
      app,
      "PATCH",
      `/spaces/${created.body.data.id}`,
      {
        tags: ["cooking"],
        description: "Updated kitchen note"
      },
      { headers }
    );

    assert.deepEqual(updated.body.data.tags, ["cooking"]);
    assert.equal(updated.body.data.description, "Updated kitchen note");
  });

  it("rejects quantity on Space create and update", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "space-quantity@example.com");
    const headers = authHeaders(auth);

    const created = await requestJson<ApiErrorResponse>(
      app,
      "POST",
      "/spaces",
      {
        name: "Garage",
        quantity: 1
      },
      { headers }
    );

    assert.equal(created.status, 400);
    assert.equal(created.body.error.code, "VALIDATION_ERROR");

    const space = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Garage" },
      { headers }
    );

    const updated = await requestJson<ApiErrorResponse>(
      app,
      "PATCH",
      `/spaces/${space.body.data.id}`,
      { quantity: 2 },
      { headers }
    );

    assert.equal(updated.status, 400);
    assert.equal(updated.body.error.code, "VALIDATION_ERROR");
  });

  it("includes Space metadata in tree responses", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "space-tree-metadata@example.com");
    const headers = authHeaders(auth);

    const space = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      {
        name: "Garage",
        tags: ["home"],
        description: "Garage space"
      },
      { headers }
    );
    const shelf = await requestJson<NodeResponse>(
      app,
      "POST",
      "/containers",
      {
        name: "Shelf A",
        parentId: space.body.data.id,
        tags: ["storage"],
        description: "Top shelf"
      },
      { headers }
    );

    const tree = await requestJson<{
      data: {
        tags?: string[];
        description?: string;
        children: Array<{ id: string; tags?: string[]; description?: string }>;
      };
    }>(app, "GET", `/spaces/${space.body.data.id}/tree`, undefined, { headers });

    assert.equal(tree.body.data.tags?.[0], "home");
    assert.equal(tree.body.data.description, "Garage space");
    assert.equal(tree.body.data.children[0]?.tags?.[0], "storage");
    assert.equal(tree.body.data.children[0]?.description, "Top shelf");
    assert.equal(tree.body.data.children[0]?.id, shelf.body.data.id);
  });
});
