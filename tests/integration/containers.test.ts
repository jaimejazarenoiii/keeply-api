import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ApiErrorResponse, NodeResponse, TreeResponse } from "../../src/types/api";
import { authHeaders, createAuthTestApp, registerTestUser } from "../helpers/auth";
import { requestJson } from "../helpers/http";

describe("Container API", () => {
  it("creates nested Containers and returns the Space tree", async () => {
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

    assert.equal(shelf.status, 201);
    assert.equal(shelf.body.data.type, "CONTAINER");
    assert.equal(shelf.body.data.parentId, space.body.data.id);
    assert.equal(shelf.body.data.spaceId, space.body.data.id);

    assert.equal(bin.status, 201);
    assert.equal(bin.body.data.parentId, shelf.body.data.id);
    assert.equal(bin.body.data.spaceId, space.body.data.id);

    const tree = await requestJson<TreeResponse>(
      app,
      "GET",
      `/spaces/${space.body.data.id}/tree`,
      undefined,
      { headers }
    );

    assert.equal(tree.status, 200);
    assert.equal(tree.body.data.name, "Garage");
    assert.equal(tree.body.data.children[0]?.name, "Shelf A");
    assert.equal(tree.body.data.children[0]?.children[0]?.name, "Bin 1");
  });

  it("updates Containers", async () => {
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

    const updated = await requestJson<NodeResponse>(
      app,
      "PATCH",
      `/containers/${shelf.body.data.id}`,
      { name: "Shelf B" },
      { headers }
    );

    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.name, "Shelf B");
  });

  it("rejects Containers created beneath missing or invalid parents", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app);

    const missingParent = await requestJson<ApiErrorResponse>(
      app,
      "POST",
      "/containers",
      {
        name: "Shelf A",
        parentId: "missing-parent"
      },
      { headers: authHeaders(auth) }
    );

    assert.equal(missingParent.status, 404);
    assert.equal(missingParent.body.error.code, "NOT_FOUND");
  });

  it("rejects circular Container moves", async () => {
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

    const response = await requestJson<ApiErrorResponse>(
      app,
      "PATCH",
      `/containers/${shelf.body.data.id}/move`,
      { parentId: bin.body.data.id },
      { headers }
    );

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "CIRCULAR_REFERENCE");
  });

  it("deletes empty Containers", async () => {
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

    const deleted = await requestJson<undefined>(
      app,
      "DELETE",
      `/containers/${shelf.body.data.id}`,
      undefined,
      { headers }
    );

    assert.equal(deleted.status, 204);

    const tree = await requestJson<TreeResponse>(
      app,
      "GET",
      `/spaces/${space.body.data.id}/tree`,
      undefined,
      { headers }
    );

    assert.deepEqual(tree.body.data.children, []);
  });

  it("rejects deleting non-empty Containers", async () => {
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

    await requestJson<NodeResponse>(
      app,
      "POST",
      "/containers",
      {
        name: "Bin 1",
        parentId: shelf.body.data.id
      },
      { headers }
    );

    const response = await requestJson<ApiErrorResponse>(
      app,
      "DELETE",
      `/containers/${shelf.body.data.id}`,
      undefined,
      { headers }
    );

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "INVALID_MOVE");
  });

  it("creates and updates Containers with tags and description", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "container-metadata@example.com");
    const headers = authHeaders(auth);
    const space = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Garage" },
      { headers }
    );

    const created = await requestJson<NodeResponse>(
      app,
      "POST",
      "/containers",
      {
        name: "Shelf A",
        parentId: space.body.data.id,
        tags: [" shelf ", "storage", "Shelf"],
        description: "Metal shelf"
      },
      { headers }
    );

    assert.deepEqual(created.body.data.tags, ["shelf", "storage"]);
    assert.equal(created.body.data.description, "Metal shelf");

    const updated = await requestJson<NodeResponse>(
      app,
      "PATCH",
      `/containers/${created.body.data.id}`,
      {
        description: "Updated shelf note"
      },
      { headers }
    );

    assert.equal(updated.body.data.description, "Updated shelf note");
  });

  it("rejects quantity on Container create and update", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "container-quantity@example.com");
    const headers = authHeaders(auth);
    const space = await requestJson<NodeResponse>(
      app,
      "POST",
      "/spaces",
      { name: "Garage" },
      { headers }
    );

    const created = await requestJson<ApiErrorResponse>(
      app,
      "POST",
      "/containers",
      {
        name: "Shelf A",
        parentId: space.body.data.id,
        quantity: 3
      },
      { headers }
    );

    assert.equal(created.status, 400);
    assert.equal(created.body.error.code, "VALIDATION_ERROR");
  });
});
