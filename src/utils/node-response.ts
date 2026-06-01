import type { NodeDto, NodeRecord } from "../types/node";

export function toNodeDto(node: NodeRecord): NodeDto {
  return {
    id: node._id,
    type: node.type,
    name: node.name,
    parentId: node.parentId,
    spaceId: node.spaceId,
    images: node.images,
    ...(node.metadata ? { metadata: node.metadata } : {}),
    createdAt: node.createdAt,
    updatedAt: node.updatedAt
  };
}
