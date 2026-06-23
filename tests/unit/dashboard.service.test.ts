import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DashboardService } from "../../src/modules/dashboard/dashboard.service";
import { InMemoryNodeStore } from "../helpers/in-memory-node-store";

describe("DashboardService", () => {
  it("returns counts and bounded recent lists for one user", async () => {
    const store = new InMemoryNodeStore();
    const service = new DashboardService(store);
    const userId = "user-1";

    for (let index = 0; index < 6; index += 1) {
      await store.create({
        _id: `space-${index}`,
        userId,
        type: "SPACE",
        name: `Space ${index}`,
        parentId: null,
        spaceId: `space-${index}`,
        images: [],
        tags: [`space-${index}`],
        description: `Space note ${index}`
      });
    }

    for (let index = 0; index < 6; index += 1) {
      await store.create({
        _id: `container-${index}`,
        userId,
        type: "CONTAINER",
        name: `Container ${index}`,
        parentId: "space-0",
        spaceId: "space-0",
        images: [],
        tags: [`container-${index}`]
      });
    }

    for (let index = 0; index < 12; index += 1) {
      await store.create({
        _id: `item-${index}`,
        userId,
        type: "ITEM",
        name: `Item ${index}`,
        parentId: "container-0",
        spaceId: "space-0",
        images: [],
        quantity: index + 1,
        tags: [`item-${index}`]
      });
    }

    const summary = await service.getDashboardSummary(userId);

    assert.equal(summary.counts.spaces, 6);
    assert.equal(summary.counts.containers, 6);
    assert.equal(summary.counts.items, 12);
    assert.equal(summary.recent.spaces.length, 5);
    assert.equal(summary.recent.containers.length, 5);
    assert.equal(summary.recent.items.length, 10);
    assert.ok(summary.recent.items.some((item) => item.quantity === 12));
    assert.equal(summary.recent.spaces[0]?.tags?.[0], "space-5");
  });

  it("returns empty dashboard data for users with no records", async () => {
    const store = new InMemoryNodeStore();
    const service = new DashboardService(store);
    const summary = await service.getDashboardSummary("empty-user");

    assert.deepEqual(summary.counts, { spaces: 0, containers: 0, items: 0 });
    assert.deepEqual(summary.recent, { spaces: [], containers: [], items: [] });
  });
});
