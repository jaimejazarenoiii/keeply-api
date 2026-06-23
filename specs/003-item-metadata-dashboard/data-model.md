# Data Model: Item Metadata and Dashboard API

## Node Metadata Extensions

The existing `Node` record remains the persistence model for Spaces, Containers,
and Items. This feature adds optional metadata fields shared across node types,
plus Item-only quantity.

### Fields

- `tags`: Optional string array of user labels. Stored on Spaces, Containers, and
  Items. Normalized to trimmed, non-empty, case-insensitively unique values.
- `description`: Optional note or description text. Stored on Spaces, Containers,
  and Items. Blank values after trimming are treated as absent.
- `quantity`: Optional non-negative integer count of identical units. Stored on
  Item nodes only. When absent in storage, Item API responses default to `1`.

Existing Node fields remain unchanged:

- `_id`, `userId`, `type`, `name`, `parentId`, `spaceId`, `images`, `metadata`,
  `createdAt`, `updatedAt`

### TypeScript Shape

```ts
interface NodeRecord {
  _id: string;
  userId: string;
  type: NodeType;
  name: string;
  parentId: string | null;
  spaceId: string;
  images: NodeImage[];
  metadata?: Record<string, unknown>;
  tags?: string[];
  description?: string;
  quantity?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface NodeDto {
  id: string;
  type: NodeType;
  name: string;
  parentId: string | null;
  spaceId: string;
  images: NodeImage[];
  metadata?: Record<string, unknown>;
  tags?: string[];
  description?: string;
  quantity?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

Response conventions:

- Spaces and Containers expose `tags` and `description` when present; they MUST
  NOT expose `quantity`.
- Items expose `tags` and `description` when present.
- Item `quantity` SHOULD be present and default to `1` when not stored.
- `tags` SHOULD be present as an empty array or omitted consistently; the
  implementation MUST pick one approach and apply it across all node surfaces.

## Validation Rules

### Tags

- Allowed on Space, Container, and Item create and update requests.
- Must be an array of strings when provided.
- Each tag is trimmed.
- Empty tags after trimming are removed.
- Duplicate tags after case-insensitive comparison are removed.
- First-seen casing is preserved for the stored value.

### Description

- Allowed on Space, Container, and Item create and update requests.
- Must be a string when provided.
- Trimmed before persistence.
- Blank after trimming is stored as absent.

### Quantity

- Allowed only on Item create and update requests.
- Must be an integer.
- Must be greater than or equal to `0`.
- Omitted on Item create defaults to absent storage with response default `1`.
- Negative or non-integer values MUST return `VALIDATION_ERROR`.
- Supplied on Space or Container create/update MUST return `VALIDATION_ERROR`.

## Relationships

No new entities or relationships are introduced. Node metadata belongs to the
same owned Node record used by hierarchy, path, and dashboard flows.

## Indexes

Existing Node indexes remain. Add:

- `{ userId: 1, type: 1, updatedAt: -1, createdAt: -1 }` for dashboard recency
  queries scoped by authenticated user and node type.

## Derived Views

### Tree Node

All node types include supported metadata fields using the same shape as
`NodeDto`, with Item-only quantity omitted from non-Item nodes.

```ts
interface TreeNode {
  id: string;
  type: NodeType;
  name: string;
  parentId: string | null;
  spaceId: string;
  images: NodeImage[];
  metadata?: Record<string, unknown>;
  tags?: string[];
  description?: string;
  quantity?: number;
  children: TreeNode[];
}
```

### Item Path Segment

Each path segment includes supported display metadata for breadcrumb/detail UI.

```ts
interface PathSegment {
  id: string;
  type: NodeType;
  name: string;
  images: NodeImage[];
  tags?: string[];
  description?: string;
  quantity?: number;
}
```

### Dashboard Summary

Per-user aggregate returned by `GET /dashboard`.

```ts
interface DashboardCounts {
  spaces: number;
  containers: number;
  items: number;
}

interface DashboardSummary {
  counts: DashboardCounts;
  recent: {
    spaces: NodeDto[];
    containers: NodeDto[];
    items: NodeDto[];
  };
}
```

### Recent Storage Record Selection

Recent lists contain up to:

- 5 Spaces
- 5 Containers
- 10 Items

Selection rules:

- Filter by authenticated `userId` and node `type`
- Sort by `updatedAt` descending, then `createdAt` descending, then `_id`
  descending
- Include stable identifiers, type, name, parentId, spaceId, images, timestamps,
  and type-appropriate metadata

## Backward Compatibility

- Existing Spaces, Containers, and Items without stored metadata fields remain
  readable.
- Create/update requests that omit the new fields behave as before, except that
  Item responses now include default quantity when applicable.
- Generic `metadata` continues to work independently of the new typed fields.
