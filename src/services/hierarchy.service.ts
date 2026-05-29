import type { NodeRecord, NodeType, TreeNode } from "../types/node";
import { ApiError } from "../utils/errors";

export interface ParentValidationInput {
  childType: NodeType;
  childId?: string;
  parent: NodeRecord;
}

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
}

export const hierarchyService = new HierarchyService();
