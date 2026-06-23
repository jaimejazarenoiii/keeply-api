import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  ApiErrorResponse,
  ItemPathResponse,
  NodeListResponse,
  NodeResponse
} from "../../src/types/api";
import { authHeaders, createAuthTestApp, registerTestUser } from "../helpers/auth";
import { requestJson } from "../helpers/http";

describe("Item API", () => {
  it("creates, updates, retrieves, moves, lists, and deletes Items", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app);
    const headers = authHeaders(auth);
    const space = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Garage" },
      { headers }
    );
    const shelf = await requestJson<NodeResponse>(
      app,
      "POST",
      "/containers",
      {
        name: "Shelf A",
        parentId: space.body.data.id
      },
      { headers }
    );
    const bin = await requestJson<NodeResponse>(
      app,
      "POST",
      "/containers",
      {
        name: "Bin 1",
        parentId: shelf.body.data.id
      },
      { headers }
    );

    const created = await requestJson<NodeResponse>(
      app,
      "POST",
      "/items",
      {
        name: "Extension Cord",
        parentId: bin.body.data.id,
        images: [{ url: "https://example.com/cord.jpg", altText: "Cord" }]
      },
      { headers }
    );

    assert.equal(created.status, 201);
    assert.equal(created.body.data.type, "ITEM");
    assert.equal(created.body.data.parentId, bin.body.data.id);
    assert.equal(created.body.data.spaceId, space.body.data.id);
    assert.equal(created.body.data.images[0]?.sortOrder, 0);

    const updated = await requestJson<NodeResponse>(
      app,
      "PATCH",
      `/items/${created.body.data.id}`,
      {
        metadata: { outdoor: true },
        images: [{ url: "https://example.com/updated-cord.jpg", sortOrder: 2 }]
      },
      { headers }
    );

    assert.equal(updated.status, 200);
    assert.deepEqual(updated.body.data.metadata, { outdoor: true });
    assert.equal(updated.body.data.images[0]?.sortOrder, 2);

    const retrieved = await requestJson<NodeResponse>(
      app,
      "GET",
      `/items/${created.body.data.id}`,
      undefined,
      { headers }
    );

    assert.equal(retrieved.status, 200);
    assert.equal(retrieved.body.data.name, "Extension Cord");

    const subtreeItems = await requestJson<NodeListResponse>(
      app,
      "GET",
      `/containers/${shelf.body.data.id}/items`,
      undefined,
      { headers }
    );

    assert.equal(subtreeItems.status, 200);
    assert.equal(subtreeItems.body.data.length, 1);
    assert.equal(subtreeItems.body.data[0]?.id, created.body.data.id);

    const moved = await requestJson<NodeResponse>(
      app,
      "PATCH",
      `/items/${created.body.data.id}/move`,
      {
        parentId: space.body.data.id
      },
      { headers }
    );

    assert.equal(moved.status, 200);
    assert.equal(moved.body.data.parentId, space.body.data.id);

    const deleted = await requestJson<undefined>(
      app,
      "DELETE",
      `/items/${created.body.data.id}`,
      undefined,
      { headers }
    );

    assert.equal(deleted.status, 204);
  });

  it("rejects Items created beneath Item parents", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app);
    const headers = authHeaders(auth);
    const space = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Garage" },
      { headers }
    );
    const item = await requestJson<NodeResponse>(
      app,
      "POST",
      "/items",
      {
        name: "Extension Cord",
        parentId: space.body.data.id
      },
      { headers }
    );

    const response = await requestJson<ApiErrorResponse>(
      app,
      "POST",
      "/items",
      {
        name: "Adapter",
        parentId: item.body.data.id
      },
      { headers }
    );

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "INVALID_PARENT_TYPE");
  });

  it("returns current Item paths after Container and Item moves", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app);
    const headers = authHeaders(auth);
    const space = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Garage" },
      { headers }
    );
    const shelf = await requestJson<NodeResponse>(
      app,
      "POST",
      "/containers",
      {
        name: "Shelf A",
        parentId: space.body.data.id
      },
      { headers }
    );
    const bin = await requestJson<NodeResponse>(
      app,
      "POST",
      "/containers",
      {
        name: "Bin 1",
        parentId: shelf.body.data.id
      },
      { headers }
    );
    const cabinet = await requestJson<NodeResponse>(
      app,
      "POST",
      "/containers",
      {
        name: "Cabinet",
        parentId: space.body.data.id
      },
      { headers }
    );
    const item = await requestJson<NodeResponse>(
      app,
      "POST",
      "/items",
      {
        name: "Extension Cord",
        parentId: bin.body.data.id,
        images: [{ url: "https://example.com/cord.jpg" }]
      },
      { headers }
    );

    const firstPath = await requestJson<ItemPathResponse>(
      app,
      "GET",
      `/items/${item.body.data.id}/path`,
      undefined,
      { headers }
    );

    assert.equal(firstPath.status, 200);
    assert.deepEqual(
      firstPath.body.data.path.map((segment) => segment.name),
      ["Garage", "Shelf A", "Bin 1", "Extension Cord"]
    );
    assert.equal(firstPath.body.data.path.at(-1)?.images[0]?.url, "https://example.com/cord.jpg");

    await requestJson<NodeResponse>(
      app,
      "PATCH",
      `/containers/${bin.body.data.id}`,
      {
        name: "Cable Bin"
      },
      { headers }
    );
    await requestJson<NodeResponse>(
      app,
      "PATCH",
      `/containers/${bin.body.data.id}/move`,
      {
        parentId: cabinet.body.data.id
      },
      { headers }
    );

    const afterContainerMove = await requestJson<ItemPathResponse>(
      app,
      "GET",
      `/items/${item.body.data.id}/path`,
      undefined,
      { headers }
    );

    assert.deepEqual(
      afterContainerMove.body.data.path.map((segment) => segment.name),
      ["Garage", "Cabinet", "Cable Bin", "Extension Cord"]
    );

    await requestJson<NodeResponse>(
      app,
      "PATCH",
      `/items/${item.body.data.id}/move`,
      {
        parentId: space.body.data.id
      },
      { headers }
    );

    const afterItemMove = await requestJson<ItemPathResponse>(
      app,
      "GET",
      `/items/${item.body.data.id}/path`,
      undefined,
      { headers }
    );

    assert.deepEqual(
      afterItemMove.body.data.path.map((segment) => segment.name),
      ["Garage", "Extension Cord"]
    );
  });

  it("creates, updates, and reads Items with metadata", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "item-metadata@example.com");
    const headers = authHeaders(auth);
    const space = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Kitchen" },
      { headers }
    );
    const container = await requestJson<NodeResponse>(
      app,
      "POST",
      "/containers",
      {
        name: "Pantry",
        parentId: space.body.data.id
      },
      { headers }
    );

    const created = await requestJson<NodeResponse>(
      app,
      "POST",
      "/items",
      {
        name: "AA Batteries",
        parentId: container.body.data.id,
        quantity: 12,
        tags: [" battery ", "electronics", "battery"],
        description: "Backup pack"
      },
      { headers }
    );

    assert.equal(created.status, 201);
    assert.equal(created.body.data.quantity, 12);
    assert.deepEqual(created.body.data.tags, ["battery", "electronics"]);
    assert.equal(created.body.data.description, "Backup pack");

    const retrieved = await requestJson<NodeResponse>(
      app,
      "GET",
      `/items/${created.body.data.id}`,
      undefined,
      { headers }
    );

    assert.equal(retrieved.body.data.quantity, 12);

    const updated = await requestJson<NodeResponse>(
      app,
      "PATCH",
      `/items/${created.body.data.id}`,
      {
        quantity: 8,
        description: "Used four cells"
      },
      { headers }
    );

    assert.equal(updated.body.data.quantity, 8);
    assert.equal(updated.body.data.description, "Used four cells");
  });

  it("defaults omitted Item quantity to 1", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "item-default-quantity@example.com");
    const headers = authHeaders(auth);
    const space = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Garage" },
      { headers }
    );
    const item = await requestJson<NodeResponse>(
      app,
      "POST",
      "/items",
      {
        name: "Hammer",
        parentId: space.body.data.id
      },
      { headers }
    );

    assert.equal(item.body.data.quantity, 1);
  });

  it("rejects invalid Item quantity", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "item-invalid-quantity@example.com");
    const headers = authHeaders(auth);
    const space = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Garage" },
      { headers }
    );

    const response = await requestJson<ApiErrorResponse>(
      app,
      "POST",
      "/items",
      {
        name: "Batteries",
        parentId: space.body.data.id,
        quantity: -1
      },
      { headers }
    );

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });

  it("propagates Item metadata through subtree, tree, and path responses", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "item-propagation@example.com");
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
    const container = await requestJson<NodeResponse>(
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
    const item = await requestJson<NodeResponse>(
      app,
      "POST",
      "/items",
      {
        name: "Extension Cord",
        parentId: container.body.data.id,
        quantity: 2,
        tags: ["tool"],
        description: "Heavy duty"
      },
      { headers }
    );

    const subtree = await requestJson<NodeListResponse>(
      app,
      "GET",
      `/containers/${container.body.data.id}/items`,
      undefined,
      { headers }
    );

    assert.equal(subtree.body.data[0]?.quantity, 2);
    assert.deepEqual(subtree.body.data[0]?.tags, ["tool"]);

    const tree = await requestJson<{
      data: { children: Array<{ children: Array<{ quantity?: number; tags?: string[] }> }> };
    }>(app, "GET", `/spaces/${space.body.data.id}/tree`, undefined, { headers });

    const treeItem = tree.body.data.children[0]?.children[0];
    assert.equal(treeItem?.quantity, 2);
    assert.deepEqual(treeItem?.tags, ["tool"]);

    const path = await requestJson<ItemPathResponse>(
      app,
      "GET",
      `/items/${item.body.data.id}/path`,
      undefined,
      { headers }
    );

    assert.equal(path.body.data.path[0]?.tags?.[0], "home");
    assert.equal(path.body.data.path[1]?.description, "Top shelf");
    assert.equal(path.body.data.path.at(-1)?.quantity, 2);
    assert.equal(path.body.data.path.at(-1)?.description, "Heavy duty");
  });
});
