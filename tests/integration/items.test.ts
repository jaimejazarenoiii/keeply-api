import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createApp } from "../../src/app";
import type {
  ApiErrorResponse,
  ItemPathResponse,
  NodeListResponse,
  NodeResponse
} from "../../src/types/api";
import { InMemoryNodeStore } from "../helpers/in-memory-node-store";
import { requestJson } from "../helpers/http";

describe("Item API", () => {
  it("creates, updates, retrieves, moves, lists, and deletes Items", async () => {
    const app = createApp({ nodeStore: new InMemoryNodeStore() });
    const space = await requestJson<NodeResponse>(app, "POST", "/spaces", {
      name: "Garage"
    });
    const shelf = await requestJson<NodeResponse>(app, "POST", "/containers", {
      name: "Shelf A",
      parentId: space.body.data.id
    });
    const bin = await requestJson<NodeResponse>(app, "POST", "/containers", {
      name: "Bin 1",
      parentId: shelf.body.data.id
    });

    const created = await requestJson<NodeResponse>(app, "POST", "/items", {
      name: "Extension Cord",
      parentId: bin.body.data.id,
      images: [{ url: "https://example.com/cord.jpg", altText: "Cord" }]
    });

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
      }
    );

    assert.equal(updated.status, 200);
    assert.deepEqual(updated.body.data.metadata, { outdoor: true });
    assert.equal(updated.body.data.images[0]?.sortOrder, 2);

    const retrieved = await requestJson<NodeResponse>(app, "GET", `/items/${created.body.data.id}`);

    assert.equal(retrieved.status, 200);
    assert.equal(retrieved.body.data.name, "Extension Cord");

    const subtreeItems = await requestJson<NodeListResponse>(
      app,
      "GET",
      `/containers/${shelf.body.data.id}/items`
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
      }
    );

    assert.equal(moved.status, 200);
    assert.equal(moved.body.data.parentId, space.body.data.id);

    const deleted = await requestJson<undefined>(app, "DELETE", `/items/${created.body.data.id}`);

    assert.equal(deleted.status, 204);
  });

  it("rejects Items created beneath Item parents", async () => {
    const app = createApp({ nodeStore: new InMemoryNodeStore() });
    const space = await requestJson<NodeResponse>(app, "POST", "/spaces", {
      name: "Garage"
    });
    const item = await requestJson<NodeResponse>(app, "POST", "/items", {
      name: "Extension Cord",
      parentId: space.body.data.id
    });

    const response = await requestJson<ApiErrorResponse>(app, "POST", "/items", {
      name: "Adapter",
      parentId: item.body.data.id
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "INVALID_PARENT_TYPE");
  });

  it("returns current Item paths after Container and Item moves", async () => {
    const app = createApp({ nodeStore: new InMemoryNodeStore() });
    const space = await requestJson<NodeResponse>(app, "POST", "/spaces", {
      name: "Garage"
    });
    const shelf = await requestJson<NodeResponse>(app, "POST", "/containers", {
      name: "Shelf A",
      parentId: space.body.data.id
    });
    const bin = await requestJson<NodeResponse>(app, "POST", "/containers", {
      name: "Bin 1",
      parentId: shelf.body.data.id
    });
    const cabinet = await requestJson<NodeResponse>(app, "POST", "/containers", {
      name: "Cabinet",
      parentId: space.body.data.id
    });
    const item = await requestJson<NodeResponse>(app, "POST", "/items", {
      name: "Extension Cord",
      parentId: bin.body.data.id,
      images: [{ url: "https://example.com/cord.jpg" }]
    });

    const firstPath = await requestJson<ItemPathResponse>(
      app,
      "GET",
      `/items/${item.body.data.id}/path`
    );

    assert.equal(firstPath.status, 200);
    assert.deepEqual(
      firstPath.body.data.path.map((segment) => segment.name),
      ["Garage", "Shelf A", "Bin 1", "Extension Cord"]
    );
    assert.equal(firstPath.body.data.path.at(-1)?.images[0]?.url, "https://example.com/cord.jpg");

    await requestJson<NodeResponse>(app, "PATCH", `/containers/${bin.body.data.id}`, {
      name: "Cable Bin"
    });
    await requestJson<NodeResponse>(app, "PATCH", `/containers/${bin.body.data.id}/move`, {
      parentId: cabinet.body.data.id
    });

    const afterContainerMove = await requestJson<ItemPathResponse>(
      app,
      "GET",
      `/items/${item.body.data.id}/path`
    );

    assert.deepEqual(
      afterContainerMove.body.data.path.map((segment) => segment.name),
      ["Garage", "Cabinet", "Cable Bin", "Extension Cord"]
    );

    await requestJson<NodeResponse>(app, "PATCH", `/items/${item.body.data.id}/move`, {
      parentId: space.body.data.id
    });

    const afterItemMove = await requestJson<ItemPathResponse>(
      app,
      "GET",
      `/items/${item.body.data.id}/path`
    );

    assert.deepEqual(
      afterItemMove.body.data.path.map((segment) => segment.name),
      ["Garage", "Extension Cord"]
    );
  });
});
