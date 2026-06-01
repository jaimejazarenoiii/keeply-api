import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createApp } from "../../src/app";
import type { ApiErrorResponse, NodeResponse, TreeResponse } from "../../src/types/api";
import { InMemoryNodeStore } from "../helpers/in-memory-node-store";
import { requestJson } from "../helpers/http";

describe("Container API", () => {
  it("creates nested Containers and returns the Space tree", async () => {
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

    assert.equal(shelf.status, 201);
    assert.equal(shelf.body.data.type, "CONTAINER");
    assert.equal(shelf.body.data.parentId, space.body.data.id);
    assert.equal(shelf.body.data.spaceId, space.body.data.id);

    assert.equal(bin.status, 201);
    assert.equal(bin.body.data.parentId, shelf.body.data.id);
    assert.equal(bin.body.data.spaceId, space.body.data.id);

    const tree = await requestJson<TreeResponse>(app, "GET", `/spaces/${space.body.data.id}/tree`);

    assert.equal(tree.status, 200);
    assert.equal(tree.body.data.name, "Garage");
    assert.equal(tree.body.data.children[0]?.name, "Shelf A");
    assert.equal(tree.body.data.children[0]?.children[0]?.name, "Bin 1");
  });

  it("updates Containers", async () => {
    const app = createApp({ nodeStore: new InMemoryNodeStore() });
    const space = await requestJson<NodeResponse>(app, "POST", "/spaces", {
      name: "Garage"
    });
    const shelf = await requestJson<NodeResponse>(app, "POST", "/containers", {
      name: "Shelf A",
      parentId: space.body.data.id
    });

    const updated = await requestJson<NodeResponse>(
      app,
      "PATCH",
      `/containers/${shelf.body.data.id}`,
      { name: "Shelf B" }
    );

    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.name, "Shelf B");
  });

  it("rejects Containers created beneath missing or invalid parents", async () => {
    const app = createApp({ nodeStore: new InMemoryNodeStore() });

    const missingParent = await requestJson<ApiErrorResponse>(app, "POST", "/containers", {
      name: "Shelf A",
      parentId: "missing-parent"
    });

    assert.equal(missingParent.status, 404);
    assert.equal(missingParent.body.error.code, "NOT_FOUND");
  });

  it("rejects circular Container moves", async () => {
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

    const response = await requestJson<ApiErrorResponse>(
      app,
      "PATCH",
      `/containers/${shelf.body.data.id}/move`,
      { parentId: bin.body.data.id }
    );

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "CIRCULAR_REFERENCE");
  });
});
