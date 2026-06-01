import type { NodeRecord, NodeType, PathSegment, TreeNode } from "../types/node";
import { ApiError } from "../utils/errors";

export interface ParentValidationInput {
  childType: NodeType;
  childId?: string;
  parent: NodeRecord;
}

export type NodeLoader = (nodeId: string) => Promise<NodeRecord | null>;

export class HierarchyService {
  validateParentType(input: ParentValidationInput): void {
    if (input.parent.type === "ITEM") {
      throw new ApiError(400, "INVALID_PARENT_TYPE", "Items cannot contain child nodes");
    }

    if (input.childType === "SPACE") {
      throw new ApiError(400, "INVALID_PARENT_TYPE", "Spaces cannot have parents");
    }

    if (input.childId && input.childId === input.parent._id) {
      throw new ApiError(400, "INVALID_MOVE", "A node cannot be its own parent");
    }
  }

  validateSameSpace(child: NodeRecord, parent: NodeRecord): void {
    if (child.spaceId !== parent.spaceId) {
      throw new ApiError(400, "SPACE_MISMATCH", "Parent must belong to the same Space");
    }
  }

  getParentSpaceId(parent: NodeRecord): string {
    return parent.type === "SPACE" ? parent._id : parent.spaceId;
  }

  validateContainerMove(
    container: NodeRecord,
    parent: NodeRecord,
    descendants: NodeRecord[]
  ): void {
    this.validateParentType({
      childType: "CONTAINER",
      childId: container._id,
      parent
    });

    if (parent.type !== "SPACE" && container.spaceId !== parent.spaceId) {
      throw new ApiError(400, "SPACE_MISMATCH", "Parent must belong to the same Space");
    }

    const descendantIds = this.getDescendantIds(container._id, descendants);

    if (descendantIds.has(parent._id)) {
      throw new ApiError(
        400,
        "CIRCULAR_REFERENCE",
        "A Container cannot be moved beneath one of its descendants"
      );
    }
  }

  getDescendantIds(rootId: string, descendants: NodeRecord[]): Set<string> {
    const descendantIds = new Set<string>();
    let addedNode = true;

    while (addedNode) {
      addedNode = false;

      for (const descendant of descendants) {
        if (
          descendant.parentId &&
          (descendant.parentId === rootId || descendantIds.has(descendant.parentId)) &&
          !descendantIds.has(descendant._id)
        ) {
          descendantIds.add(descendant._id);
          addedNode = true;
        }
      }
    }

    return descendantIds;
  }

  async buildAncestorPath(node: NodeRecord, loadNode: NodeLoader): Promise<PathSegment[]> {
    const path: PathSegment[] = [];
    const visitedIds = new Set<string>();
    let current: NodeRecord | null = node;

    while (current) {
      if (visitedIds.has(current._id)) {
        throw new ApiError(400, "CIRCULAR_REFERENCE", "Hierarchy contains a circular reference");
      }

      visitedIds.add(current._id);
      path.unshift({
        id: current._id,
        type: current.type,
        name: current.name,
        images: current.images
      });

      current = current.parentId ? await loadNode(current.parentId) : null;

      if (current === null && path[0]?.type !== "SPACE") {
        throw new ApiError(404, "NOT_FOUND", "Ancestor not found");
      }
    }

    return path;
  }

  createTreeNode(node: NodeRecord, children: TreeNode[] = []): TreeNode {
    return {
      id: node._id,
      type: node.type,
      name: node.name,
      parentId: node.parentId,
      spaceId: node.spaceId,
      images: node.images,
      ...(node.metadata ? { metadata: node.metadata } : {}),
      children
    };
  }

  buildTree(root: NodeRecord, descendants: NodeRecord[]): TreeNode {
    const nodesByParentId = new Map<string | null, NodeRecord[]>();

    for (const descendant of descendants) {
      const siblings = nodesByParentId.get(descendant.parentId) ?? [];

      siblings.push(descendant);
      nodesByParentId.set(descendant.parentId, siblings);
    }

    const buildNode = (node: NodeRecord): TreeNode => {
      const children = nodesByParentId.get(node._id)?.map((child) => buildNode(child)) ?? [];

      return this.createTreeNode(node, children);
    };

    return buildNode(root);
  }
}

export const hierarchyService = new HierarchyService();
