import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createApp } from "../../src/app";
import type { ApiErrorResponse, NodeResponse, SpaceListResponse } from "../../src/types/api";
import { InMemoryNodeStore } from "../helpers/in-memory-node-store";
import { requestJson } from "../helpers/http";

describe("Space API", () => {
  it("creates and lists Spaces", async () => {
    const app = createApp({ nodeStore: new InMemoryNodeStore() });

    const created = await requestJson<NodeResponse>(app, "POST", "/spaces", {
      name: " Garage ",
      metadata: { indoor: false }
    });

    assert.equal(created.status, 201);
    assert.equal(created.body.data.type, "SPACE");
    assert.equal(created.body.data.name, "Garage");
    assert.equal(created.body.data.parentId, null);
    assert.equal(created.body.data.spaceId, created.body.data.id);
    assert.deepEqual(created.body.data.metadata, { indoor: false });

    const listed = await requestJson<SpaceListResponse>(app, "GET", "/spaces");

    assert.equal(listed.status, 200);
    assert.equal(listed.body.data.length, 1);
    assert.equal(listed.body.data[0]?.id, created.body.data.id);
  });

  it("rejects empty Space names", async () => {
    const app = createApp({ nodeStore: new InMemoryNodeStore() });

    const response = await requestJson<ApiErrorResponse>(app, "POST", "/spaces", {
      name: " "
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });

  it("updates and deletes empty Spaces", async () => {
    const app = createApp({ nodeStore: new InMemoryNodeStore() });
    const created = await requestJson<NodeResponse>(app, "POST", "/spaces", {
      name: "Garage"
    });

    const updated = await requestJson<NodeResponse>(
      app,
      "PATCH",
      `/spaces/${created.body.data.id}`,
      { name: "Workshop" }
    );

    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.name, "Workshop");

    const deleted = await requestJson<undefined>(app, "DELETE", `/spaces/${created.body.data.id}`);

    assert.equal(deleted.status, 204);
  });
});
