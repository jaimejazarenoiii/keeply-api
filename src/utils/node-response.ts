import type { NodeDto, NodeRecord, PathSegment, TreeNode } from "../types/node";

export function mapNodeMetadataFields(
  node: NodeRecord
): Pick<NodeDto, "tags" | "description" | "quantity"> {
  const fields: Pick<NodeDto, "tags" | "description" | "quantity"> = {};

  if (node.tags && node.tags.length > 0) {
    fields.tags = node.tags;
  }

  if (node.description) {
    fields.description = node.description;
  }

  if (node.type === "ITEM") {
    fields.quantity = node.quantity ?? 1;
  }

  return fields;
}

export function toNodeDto(node: NodeRecord): NodeDto {
  return {
    id: node._id,
    type: node.type,
    name: node.name,
    parentId: node.parentId,
    spaceId: node.spaceId,
    images: node.images,
    ...(node.metadata ? { metadata: node.metadata } : {}),
    ...mapNodeMetadataFields(node),
    createdAt: node.createdAt,
    updatedAt: node.updatedAt
  };
}

export function toPathSegment(node: NodeRecord): PathSegment {
  return {
    id: node._id,
    type: node.type,
    name: node.name,
    images: node.images,
    ...mapNodeMetadataFields(node)
  };
}

export function toTreeNode(node: NodeRecord, children: TreeNode[] = []): TreeNode {
  return {
    id: node._id,
    type: node.type,
    name: node.name,
    parentId: node.parentId,
    spaceId: node.spaceId,
    images: node.images,
    ...(node.metadata ? { metadata: node.metadata } : {}),
    ...mapNodeMetadataFields(node),
    children
  };
}
