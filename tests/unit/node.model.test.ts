import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NodeModel } from "../../src/models/node.model";

describe("NodeModel", () => {
  it("defines indexes used by hierarchy queries", () => {
    const indexes = NodeModel.schema.indexes().map(([fields]) => fields);

    assert(indexes.some((fields) => "parentId" in fields));
    assert(indexes.some((fields) => "spaceId" in fields && "parentId" in fields));
    assert(indexes.some((fields) => "type" in fields && "spaceId" in fields));
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
});
