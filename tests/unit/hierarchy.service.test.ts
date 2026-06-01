import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HierarchyService } from "../../src/services/hierarchy.service";
import type { NodeRecord, NodeType } from "../../src/types/node";
import { ApiError } from "../../src/utils/errors";

function createNode(
  id: string,
  type: NodeType,
  name: string,
  parentId: string | null,
  spaceId = "space-1"
): NodeRecord {
  const now = new Date();

  return {
    _id: id,
    type,
    name,
    parentId,
    spaceId,
    images: [],
    createdAt: now,
    updatedAt: now
  };
}

describe("HierarchyService", () => {
  it("rejects Item parents", () => {
    const service = new HierarchyService();
    const parent = createNode("item-1", "ITEM", "Extension Cord", "container-1");

    assert.throws(
      () => service.validateParentType({ childType: "ITEM", parent }),
      (error) =>
        error instanceof ApiError &&
        error.statusCode === 400 &&
        error.code === "INVALID_PARENT_TYPE"
    );
  });

  it("allows Item parents to be Spaces or Containers", () => {
    const service = new HierarchyService();
    const space = createNode("space-1", "SPACE", "Garage", null);
    const container = createNode("container-1", "CONTAINER", "Shelf A", "space-1");

    assert.doesNotThrow(() => service.validateParentType({ childType: "ITEM", parent: space }));
    assert.doesNotThrow(() => service.validateParentType({ childType: "ITEM", parent: container }));
  });

  it("rejects Space children with parents", () => {
    const service = new HierarchyService();
    const parent = createNode("space-1", "SPACE", "Garage", null);

    assert.throws(
      () => service.validateParentType({ childType: "SPACE", parent }),
      (error) =>
        error instanceof ApiError &&
        error.statusCode === 400 &&
        error.code === "INVALID_PARENT_TYPE"
    );
  });

  it("builds a parent-to-child tree", () => {
    const service = new HierarchyService();
    const space = createNode("space-1", "SPACE", "Garage", null);
    const shelf = createNode("container-1", "CONTAINER", "Shelf A", "space-1");
    const bin = createNode("container-2", "CONTAINER", "Bin 1", "container-1");

    const tree = service.buildTree(space, [bin, shelf]);

    assert.equal(tree.name, "Garage");
    assert.equal(tree.children[0]?.name, "Shelf A");
    assert.equal(tree.children[0]?.children[0]?.name, "Bin 1");
  });

  it("builds an ancestor path from Space to node", async () => {
    const service = new HierarchyService();
    const space = createNode("space-1", "SPACE", "Garage", null);
    const shelf = createNode("container-1", "CONTAINER", "Shelf A", "space-1");
    const item = createNode("item-1", "ITEM", "Extension Cord", "container-1");
    const nodes = new Map([space, shelf, item].map((node) => [node._id, node]));

    const path = await service.buildAncestorPath(item, async (nodeId) => nodes.get(nodeId) ?? null);

    assert.deepEqual(
      path.map((segment) => segment.name),
      ["Garage", "Shelf A", "Extension Cord"]
    );
  });

  it("rejects moving a Container beneath one of its descendants", () => {
    const service = new HierarchyService();
    const shelf = createNode("container-1", "CONTAINER", "Shelf A", "space-1");
    const bin = createNode("container-2", "CONTAINER", "Bin 1", "container-1");

    assert.throws(
      () => service.validateContainerMove(shelf, bin, [bin]),
      (error) =>
        error instanceof ApiError && error.statusCode === 400 && error.code === "CIRCULAR_REFERENCE"
    );
  });
});
