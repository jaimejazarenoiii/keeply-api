import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DashboardSummaryResponse } from "../../src/types/api";
import { authHeaders, createAuthTestApp, registerTestUser } from "../helpers/auth";
import { requestJson } from "../helpers/http";

describe("Dashboard API", () => {
  it("returns counts, recent limits, metadata, and empty-user data", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "dashboard-owner@example.com");
    const headers = authHeaders(auth);

    let firstContainerId = "";

    for (let index = 0; index < 6; index += 1) {
      const space = await requestJson<{ data: { id: string } }>(
        app,
        "POST",
        "/spaces",
        {
          name: `Space ${index}`,
          tags: [`space-${index}`],
          description: `Space description ${index}`
        },
        { headers }
      );

      const container = await requestJson<{ data: { id: string } }>(
        app,
        "POST",
        "/containers",
        {
          name: `Container ${index}`,
          parentId: space.body.data.id,
          tags: [`container-${index}`],
          description: `Container description ${index}`
        },
        { headers }
      );

      if (index === 0) {
        firstContainerId = container.body.data.id;
      }
    }

    for (let index = 0; index < 12; index += 1) {
      await requestJson(
        app,
        "POST",
        "/items",
        {
          name: `Item ${index}`,
          parentId: firstContainerId,
          quantity: index + 1,
          tags: [`item-${index}`],
          description: `Item description ${index}`
        },
        { headers }
      );
    }

    const startedAt = Date.now();
    const dashboard = await requestJson<DashboardSummaryResponse>(
      app,
      "GET",
      "/dashboard",
      undefined,
      { headers }
    );
    const elapsedMs = Date.now() - startedAt;

    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.body.data.counts.spaces, 6);
    assert.equal(dashboard.body.data.counts.containers, 6);
    assert.equal(dashboard.body.data.counts.items, 12);
    assert.equal(dashboard.body.data.recent.spaces.length, 5);
    assert.equal(dashboard.body.data.recent.containers.length, 5);
    assert.equal(dashboard.body.data.recent.items.length, 10);
    assert.ok(dashboard.body.data.recent.spaces.some((space) => space.tags?.includes("space-5")));
    assert.ok(
      dashboard.body.data.recent.containers.some(
        (container) => container.description === "Container description 5"
      )
    );
    assert.ok(dashboard.body.data.recent.items.some((item) => item.quantity === 12));
    assert.ok(elapsedMs < 1000, `expected dashboard under 1s, took ${elapsedMs}ms`);

    const emptyUser = await registerTestUser(app, "empty-dashboard@example.com");
    const emptyDashboard = await requestJson<DashboardSummaryResponse>(
      app,
      "GET",
      "/dashboard",
      undefined,
      { headers: authHeaders(emptyUser) }
    );

    assert.deepEqual(emptyDashboard.body.data.counts, {
      spaces: 0,
      containers: 0,
      items: 0
    });
    assert.deepEqual(emptyDashboard.body.data.recent, {
      spaces: [],
      containers: [],
      items: []
    });
  });

  it("does not leak another user's dashboard data", async () => {
    const { app } = createAuthTestApp();
    const owner = await registerTestUser(app, "owner-dashboard@example.com");
    const other = await registerTestUser(app, "other-dashboard@example.com");

    await requestJson(
      app,
      "POST",
      "/spaces",
      {
        name: "Owner Space",
        tags: ["owner"],
        description: "Owner only"
      },
      { headers: authHeaders(owner) }
    );

    const otherDashboard = await requestJson<DashboardSummaryResponse>(
      app,
      "GET",
      "/dashboard",
      undefined,
      { headers: authHeaders(other) }
    );

    assert.equal(otherDashboard.body.data.counts.spaces, 0);
    assert.equal(otherDashboard.body.data.recent.spaces.length, 0);
  });

  it("includes metadata on dashboard recent records", async () => {
    const { app } = createAuthTestApp();
    const auth = await registerTestUser(app, "dashboard-metadata@example.com");
    const headers = authHeaders(auth);

    const space = await requestJson<{ data: { id: string } }>(
      app,
      "POST",
      "/spaces",
      {
        name: "Kitchen",
        tags: ["home"],
        description: "Kitchen space"
      },
      { headers }
    );
    const container = await requestJson<{ data: { id: string } }>(
      app,
      "POST",
      "/containers",
      {
        name: "Pantry",
        parentId: space.body.data.id,
        tags: ["food"],
        description: "Dry goods"
      },
      { headers }
    );
    await requestJson(
      app,
      "POST",
      "/items",
      {
        name: "Batteries",
        parentId: container.body.data.id,
        quantity: 4,
        tags: ["electronics"],
        description: "Backup pack"
      },
      { headers }
    );

    const dashboard = await requestJson<DashboardSummaryResponse>(
      app,
      "GET",
      "/dashboard",
      undefined,
      { headers }
    );

    assert.equal(dashboard.body.data.recent.spaces[0]?.description, "Kitchen space");
    assert.equal(dashboard.body.data.recent.containers[0]?.tags?.[0], "food");
    assert.equal(dashboard.body.data.recent.items[0]?.quantity, 4);
  });
});
