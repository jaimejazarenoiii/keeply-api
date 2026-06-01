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
});
