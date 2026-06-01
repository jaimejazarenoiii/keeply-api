export type NodeType = "SPACE" | "CONTAINER" | "ITEM";

export interface NodeImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
  createdAt: Date;
}

export interface NodeRecord {
  _id: string;
  type: NodeType;
  name: string;
  parentId: string | null;
  spaceId: string;
  images: NodeImage[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeDto {
  id: string;
  type: NodeType;
  name: string;
  parentId: string | null;
  spaceId: string;
  images: NodeImage[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreeNode {
  id: string;
  type: NodeType;
  name: string;
  parentId: string | null;
  spaceId: string;
  images: NodeImage[];
  metadata?: Record<string, unknown>;
  children: TreeNode[];
}

export interface PathSegment {
  id: string;
  type: NodeType;
  name: string;
  images: NodeImage[];
}

export interface ItemPath {
  itemId: string;
  path: PathSegment[];
}

export const NODE_TYPES = ["SPACE", "CONTAINER", "ITEM"] as const;
