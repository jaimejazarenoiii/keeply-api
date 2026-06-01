import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NodeModel } from "../../src/models/node.model";

describe("NodeModel", () => {
  it("defines indexes used by hierarchy queries", () => {
    const schemaIndexes = NodeModel.schema.indexes() as Array<
      [Record<string, unknown>, Record<string, unknown>]
    >;
    const indexes = schemaIndexes.map(([fields]) => fields);
    const hasIndex = (expectedFields: Record<string, 1>): boolean =>
      indexes.some((fields) =>
        Object.entries(expectedFields).every(
          ([fieldName, direction]) => fields[fieldName] === direction
        )
      );

    assert.equal(hasIndex({ spaceId: 1 }), true);
    assert.equal(hasIndex({ parentId: 1 }), true);
    assert.equal(hasIndex({ spaceId: 1, parentId: 1 }), true);
    assert.equal(hasIndex({ type: 1, spaceId: 1 }), true);
  });

  it("defaults images to an empty array", () => {
    const node = new NodeModel({
      type: "SPACE",
      name: "Garage",
      parentId: null,
      spaceId: "space-1"
    });

    assert.deepEqual(node.images, []);
  });

  it("stores image references in order", () => {
    const node = new NodeModel({
      type: "ITEM",
      name: "Extension Cord",
      parentId: "container-1",
      spaceId: "space-1",
      images: [
        {
          id: "image-1",
          url: "https://example.com/cord-front.jpg",
          sortOrder: 0,
          createdAt: new Date("2026-01-01T00:00:00.000Z")
        },
        {
          id: "image-2",
          url: "https://example.com/cord-back.jpg",
          sortOrder: 1,
          createdAt: new Date("2026-01-01T00:00:00.000Z")
        }
      ]
    });

    assert.equal(node.images[0]?.url, "https://example.com/cord-front.jpg");
    assert.equal(node.images[1]?.url, "https://example.com/cord-back.jpg");
  });
});
