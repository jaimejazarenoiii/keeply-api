# Data Model: Hierarchical Storage API

## Node

Single collection representation for every hierarchy member.

### Fields

- `_id`: Stable MongoDB object identifier.
- `type`: One of `SPACE`, `CONTAINER`, or `ITEM`.
- `name`: Required display name.
- `parentId`: Parent Node identifier, or `null` for a Space.
- `spaceId`: Owning Space identifier. For a Space, this is its own identifier.
- `images`: Ordered list of image references associated with this node.
- `metadata`: Optional structured key-value data for future extensibility.
- `createdAt`: Creation timestamp.
- `updatedAt`: Last update timestamp.

### TypeScript Shape

```ts
type NodeType = "SPACE" | "CONTAINER" | "ITEM";

interface NodeRecord {
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

interface NodeImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
  createdAt: Date;
}
```

## Relationships

- A Space is a root node and has no parent.
- A Space can contain Containers and Items.
- A Container belongs to one Space and has a Space or Container parent.
- A Container can contain Containers and Items.
- An Item belongs to one Space and has a Space or Container parent.
- An Item cannot contain child nodes.
- Spaces, Containers, and Items can each have zero or more Images.

## Validation Rules

- `name` is required and must be non-empty after trimming.
- `type` must be one of the supported Node types.
- `parentId` must be `null` only for Spaces.
- Non-Space nodes must have a valid Space or Container parent.
- A child node must have the same `spaceId` as its parent.
- A Container cannot be moved beneath itself or beneath any descendant.
- A move that creates a circular reference must be rejected.
- Item parents must be Spaces or Containers.
- Item nodes must never be used as parents.
- Image URLs are required and must be non-empty after trimming.
- Image ordering must be stable and unique within a node.

## Indexes

- `{ parentId: 1 }` for direct child lookups.
- `{ spaceId: 1 }` for Space-scoped queries.
- `{ spaceId: 1, parentId: 1 }` for tree and subtree traversal.
- `{ type: 1, spaceId: 1 }` for filtering node types within a Space.

## Derived Views

### Tree Node

Returned by tree retrieval endpoints.

```ts
interface TreeNode {
  id: string;
  type: NodeType;
  name: string;
  images: NodeImage[];
  metadata?: Record<string, unknown>;
  children?: TreeNode[];
}
```

Items appear as leaf nodes. Containers may include child Containers and Items.

### Item Path

Returned by Item path retrieval.

```ts
interface ItemPath {
  itemId: string;
  path: Array<{
    id: string;
    type: NodeType;
    name: string;
    images: NodeImage[];
  }>;
}
```

The path is ordered from Space to Item.
