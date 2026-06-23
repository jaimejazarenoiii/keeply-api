# Research: Item Metadata and Dashboard API

## Decision: Use First-Class Node Metadata Fields On The Node Record

Node metadata will be stored as optional top-level Node fields. `tags` and
`description` apply to Spaces, Containers, and Items. `quantity` applies to
Items only.

**Rationale**: The spec requires typed validation, predictable API responses,
and consistent propagation across hierarchy surfaces. First-class fields keep
Mongoose validators, TypeScript types, and OpenAPI schemas explicit. The generic
`metadata` bag remains available for future extensibility without overloading it
with core node behavior.

**Alternatives considered**:

- Store values only in `metadata`: flexible, but weakens schema validation and
  makes response mapping harder to keep consistent.
- Separate `items` collection: clearer Item-only shape, but breaks the current
  recursive Node model and complicates tree/path/dashboard queries.

## Decision: Default Item Quantity To 1

New Item create requests may omit `quantity`; omitted values persist as absent and
API mappers return `quantity: 1`. Existing Items without stored quantity also
return `1`.

**Rationale**: The spec assumes quantity represents identical units and should
behave predictably for legacy records and minimal create payloads. Defaulting at
the response boundary avoids a one-time migration while keeping create/update
validation simple.

**Alternatives considered**:

- Require quantity on every create: stricter, but breaks backward-compatible
  Item create flows.
- Return absent quantity as `null`: valid, but less useful for clients that
  expect a count-like field on every Item.

## Decision: Normalize Tags In Shared Validation Helpers

Tags are accepted as a string array, trimmed, empty values removed, and
deduplicated case-insensitively while preserving the first seen display casing.

**Rationale**: The spec requires deterministic normalization on create and
update. Central helpers in `src/utils/validation.ts` keep Item service logic
small and make unit testing straightforward.

**Alternatives considered**:

- Lowercase all tags for storage: simpler dedupe, but loses user-facing casing.
- Reject duplicate tags with validation errors: explicit, but noisier for
  clients than silent normalization.

## Decision: Treat Blank Descriptions As Absent

Description input is trimmed. Blank strings after trimming are stored as absent
and omitted from responses unless a non-empty value exists.

**Rationale**: This keeps responses clean and matches the spec's expectation that
blank notes should not create ambiguous empty-string states across create and
update.

**Alternatives considered**:

- Store empty string explicitly: consistent storage, but clients must treat `""`
  and omission differently.
- Reject blank descriptions: unnecessary friction when users clear a note.

## Decision: Reject Quantity On Non-Item Nodes

Space and Container create/update requests that include `quantity` must return
`VALIDATION_ERROR`. Response mappers omit `quantity` from Space and Container
responses.

**Rationale**: Quantity represents identical Item units and is not meaningful for
storage locations. Explicit rejection prevents ambiguous client payloads.

**Alternatives considered**:

- Silently ignore quantity on Space/Container requests: simpler for clients, but
  hides mistakes.
- Store quantity on all node types: inconsistent with domain meaning.

## Decision: Propagate Node Metadata Through Existing Response Mappers

Supported metadata will be included anywhere node-shaped data is returned:

- direct Space, Container, and Item CRUD responses via `toNodeDto`
- Container subtree Item lists
- Space/Container tree nodes via `HierarchyService.createTreeNode`
- all Item path segments via `buildAncestorPath`
- dashboard recent Space, Container, and Item records

**Rationale**: One mapping path reduces drift between endpoints and satisfies
the consistency user story without introducing separate DTO types for each
surface.

**Alternatives considered**:

- Item-only DTO type everywhere: clearer typing, but increases mapper count and
  controller branching.
- Include metadata only on direct Item GET: simpler, but violates FR-008 through
  FR-010.

## Decision: Add One Authenticated Dashboard Endpoint

Expose `GET /dashboard` behind the existing bearer auth middleware. The response
contains:

- counts: `{ spaces, containers, items }`
- recent lists: up to 5 Spaces, 5 Containers, and 10 Items

**Rationale**: The dashboard is a read-only aggregate for the signed-in user's
landing experience. A dedicated module keeps storage CRUD routes unchanged and
makes contract testing isolated.

**Alternatives considered**:

- Extend `/spaces` list with aggregate query params: avoids a new route, but
  mixes list and summary concerns.
- Separate count and recent endpoints: more flexible, but adds client round trips
  for a simple landing screen.

## Decision: Order Recent Records By Activity With Stable Tie-Breaking

Recent records sort by `updatedAt` descending, then `createdAt` descending, then
`_id` descending.

**Rationale**: Matches the spec's recency basis and guarantees deterministic
ordering when timestamps collide during bulk imports or rapid updates.

**Alternatives considered**:

- Sort by `createdAt` only: simpler, but ignores meaningful updates to names or
  metadata.
- Sort by name as tie-breaker: readable, but less stable than identifier order.

## Decision: Extend NodeStore For Dashboard Queries

Add user-scoped store methods:

- `countByType(type, userId)`
- `findRecentByType(type, userId, limit)`

Implement them in both `MongooseNodeStore` and the in-memory test store.

**Rationale**: Dashboard logic should not call Mongoose directly from services.
Store methods keep tests fast and preserve the ownership boundary established in
earlier features.

**Alternatives considered**:

- Single aggregation pipeline in the dashboard service: efficient, but harder to
  test without MongoDB and less aligned with current architecture.
- Reuse `findByType` and sort in memory: acceptable for tests only; unbounded
  for large datasets.

## Decision: Add A Recency Index For Dashboard Reads

Add compound index:

```text
{ userId: 1, type: 1, updatedAt: -1, createdAt: -1 }
```

**Rationale**: Dashboard queries filter by authenticated user and node type, then
sort by recency with strict limits. The index supports bounded reads without
scanning the full collection.

**Alternatives considered**:

- Reuse existing `{ userId: 1, type: 1 }` index only: helps filtering, but still
  requires in-memory sort for recency.
- Materialized dashboard document: fast reads, but adds write complexity and sync
  rules not required for MVP scale.

## Decision: Defer Tag Search And Advanced Dashboard Filters

Tag-based search, quantity rollups, date-range filters, and paginated recent
lists remain out of scope for this feature.

**Rationale**: The spec covers metadata persistence, consistent Item exposure,
and a bounded landing-page summary. Search and analytics can build on the new
fields later without changing the MVP contract.

**Alternatives considered**:

- Include tag filter query params now: useful, but expands scope beyond the
  current spec and tests.
