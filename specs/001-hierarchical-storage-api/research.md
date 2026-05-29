# Research: Hierarchical Storage API

## Decision: Use A Single Node Collection

Store Spaces, Containers, and Items in one MongoDB `nodes` collection with a
discriminator-like `type` field.

**Rationale**: A shared collection keeps recursive traversal, move operations,
and path resolution uniform. The same parent validation logic applies to every
node, and Mongoose can expose strongly typed interfaces around the shared shape.

**Alternatives considered**:

- Separate `spaces`, `containers`, and `items` collections: clearer per-entity
  separation, but move and path logic would require more branching.
- Fully embedded tree documents: simple retrieval for small trees, but moving
  nodes and updating deep structures becomes expensive and error-prone.

## Decision: Model Hierarchy With Parent References

Each node stores `parentId`, `spaceId`, and `type`. A Space has `parentId: null`
and `spaceId` equal to its own identifier. Containers and Items have one parent,
which may be a Space or Container.

**Rationale**: Parent references support unbounded depth without rewriting large
documents. Indexes on `parentId` and `spaceId` keep child lookup and scoped
queries efficient.

**Alternatives considered**:

- Materialized path: faster path reads, but every move requires updating all
  descendants.
- Nested sets: efficient subtree reads, but complex and fragile for frequent
  moves.

## Decision: Enforce Hierarchy Rules In Services

The service layer validates parent type, Space consistency, circular references,
and move legality before persisting changes.

**Rationale**: Controllers remain focused on HTTP handling, while one shared
service path protects all Space, Container, and Item operations.

**Alternatives considered**:

- Route-level validation only: duplicates logic and risks inconsistent behavior.
- Database-only validation: MongoDB can enforce some structural constraints but
  cannot express all ancestor and cross-Space rules cleanly.

## Decision: Resolve Item Paths By Ancestor Walk

Item path lookup starts from the Item, walks parent nodes until the Space root,
then returns ordered path segments from Space to Item.

**Rationale**: Ancestor walking keeps path data current after renames and moves
without denormalized path updates. The MVP target of 10 Container levels makes
bounded ancestor traversal acceptable.

**Alternatives considered**:

- Store denormalized path names on each Item: faster reads, but stale data risk
  after renames and moves.
- Precompute path cache: useful later for hot hierarchies, but unnecessary for
  MVP and adds invalidation complexity.

## Decision: Use Consistent Error Codes

Domain failures return stable error codes including `INVALID_MOVE`,
`CIRCULAR_REFERENCE`, `NOT_FOUND`, `INVALID_PARENT_TYPE`, and `SPACE_MISMATCH`.

**Rationale**: Stable codes make client behavior predictable and keep user-facing
workflows consistent as required by the constitution.

**Alternatives considered**:

- Free-form error messages only: easier initially, but harder for clients to
  handle reliably.
- HTTP status-only errors: insufficient detail for hierarchy-specific failures.

## Decision: Store Image References On Nodes

Spaces, Containers, and Items store ordered image reference arrays directly on
the Node record.

**Rationale**: Images belong to the same user-facing entity being retrieved, so
including image references on the Node keeps create, update, tree, and path
responses straightforward. It also avoids extra joins or lookups for the MVP.

**Alternatives considered**:

- Separate image collection: useful for advanced media workflows, but adds
  lifecycle and query complexity before binary uploads are in scope.
- Store images only in metadata: flexible, but weakly typed and harder to
  validate consistently.
