# Feature Specification: Item Metadata and Dashboard API

**Feature Branch**: `003-item-metadata-dashboard`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Add tags and quantity for items on node also add
description or note, also prepare a dashboard api where there's a summary of
numbers of containers spacfes items, then top 5 recent spaces, containers and 10
for items."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Enrich Storage Node Details (Priority: P1)

A signed-in user records richer details on Spaces, Containers, and Items so
storage locations and trackable objects are easier to identify, organize, and
distinguish when names alone are not enough.

Items support `quantity`, `tags`, and `description`. Spaces and Containers
support `tags` and `description` but not `quantity`.

**Why this priority**: Node detail is the core building block of the hierarchy.
Tags and notes improve every create, retrieve, update, tree, path, and dashboard
response. Item quantity adds practical inventory tracking.

**Independent Test**: Create a Space with tags and a description, a Container
with tags and a description, and an Item with quantity, tags, and description.
Retrieve each record directly and verify all fields are returned exactly as
normalized.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they create a Space with tags and
   description, **Then** the Space response includes those fields.
2. **Given** a signed-in user has a Space, **When** they create a Container with
   tags and description, **Then** the Container response includes those fields.
3. **Given** a signed-in user has a Container, **When** they create an Item with
   quantity, tags, and description, **Then** the Item response includes those
   fields.
4. **Given** a Space, Container, or Item exists, **When** the user updates its
   supported metadata fields, **Then** subsequent direct, tree, path, and
   dashboard responses reflect the current values.
5. **Given** a node has no tags, quantity, or description, **When** it is
   retrieved, **Then** the response remains valid and uses predictable defaults
   or omitted optional fields consistently.

---

### User Story 2 - View Storage Dashboard Summary (Priority: P2)

A signed-in user opens a dashboard and sees their total number of Spaces,
Containers, and Items, plus the most recent storage records, so they can quickly
understand and resume recent activity.

**Why this priority**: A dashboard is the likely landing screen after login and
gives users immediate feedback that their storage records are available.

**Independent Test**: Create multiple Spaces, Containers, and Items for one
user, create records for another user, then retrieve the dashboard and verify
counts and recent lists include only the authenticated user's records.

**Acceptance Scenarios**:

1. **Given** a user has storage data, **When** they retrieve the dashboard,
   **Then** they receive counts for Spaces, Containers, and Items.
2. **Given** a user has more than five Spaces or Containers, **When** they
   retrieve the dashboard, **Then** only the five most recently created or
   updated Spaces and Containers are returned.
3. **Given** a user has more than ten Items, **When** they retrieve the
   dashboard, **Then** only the ten most recently created or updated Items are
   returned.
4. **Given** two users have storage data, **When** one user retrieves their
   dashboard, **Then** no counts or recent records from the other user are
   included.
5. **Given** recent Spaces or Containers have tags and description, **When** the
   user retrieves the dashboard, **Then** those fields are included on recent
   Space and Container records.

---

### User Story 3 - Keep Node Metadata Consistent Across Hierarchy Responses (Priority: P3)

A user sees the same node metadata whether a Space, Container, or Item appears
in direct retrieval, tree responses, Item path segments, or dashboard recent
lists.

**Why this priority**: Inconsistent response shapes make frontend state and UI
harder to maintain. Once metadata fields exist, the API should expose them
consistently wherever node data is returned.

**Independent Test**: Create a Space, Container, and Item each with tags and
description, and an Item with quantity. Retrieve them through direct reads,
Space/Container trees, Item path, and dashboard recent lists. Verify supported
response shapes carry the expected metadata for each node type.

**Acceptance Scenarios**:

1. **Given** a Space or Container has tags and description, **When** it appears
   in a tree or dashboard recent list, **Then** the response includes those
   fields.
2. **Given** an Item has tags and quantity, **When** it appears in a tree,
   subtree list, or dashboard recent Item list, **Then** the response includes
   those Item fields.
3. **Given** a node has a description, **When** the user retrieves an Item path,
   **Then** each path segment includes enough display metadata for
   breadcrumbs/details without requiring a second request.

---

### Edge Cases

- Creating or updating an Item with a negative quantity must be rejected.
- Creating or updating an Item with a non-integer quantity must be rejected.
- Creating or updating a Space or Container with `quantity` must be rejected.
- Creating or updating any node with duplicate tags should normalize to unique
  tags.
- Tags with extra whitespace should be trimmed.
- Empty tags should be rejected or removed during normalization; behavior must
  be consistent for create and update across Spaces, Containers, and Items.
- Description/note values that are blank after trimming should be stored as
  absent or empty consistently.
- Dashboard counts must be scoped to the authenticated user only.
- Dashboard recent lists must not expose another user's record names,
  identifiers, or counts.
- Dashboard responses must work for brand-new users with no storage records.
- Dashboard recent ordering must be deterministic when records have the same
  timestamp.
- Existing Spaces, Containers, and Items created before these fields existed
  must remain retrievable.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow Items to store an optional non-negative integer
  `quantity`.
- **FR-002**: System MUST allow Spaces, Containers, and Items to store zero or
  more text `tags`.
- **FR-003**: System MUST allow Spaces, Containers, and Items to store an
  optional `description` or note.
- **FR-004**: System MUST normalize tags by trimming whitespace.
- **FR-005**: System MUST prevent duplicate tags on the same node after
  normalization.
- **FR-006**: System MUST validate Item quantity during Item create and update.
- **FR-007**: System MUST reject `quantity` on Space and Container create and
  update requests.
- **FR-008**: System MUST include tags and description when retrieving a Space,
  Container, or Item directly.
- **FR-009**: System MUST include Item quantity, tags, and description when
  retrieving an Item directly.
- **FR-010**: System MUST include Item quantity, tags, and description when Items
  appear in Container subtree Item responses.
- **FR-011**: System MUST include supported node metadata when Spaces, Containers,
  and Items appear in Space or Container tree responses.
- **FR-012**: System MUST include supported node display metadata in Item path
  responses for each path segment.
- **FR-013**: System MUST provide an authenticated dashboard endpoint.
- **FR-014**: Dashboard endpoint MUST return counts for Spaces, Containers, and
  Items owned by the authenticated user.
- **FR-015**: Dashboard endpoint MUST return the five most recent Spaces owned
  by the authenticated user.
- **FR-016**: Dashboard endpoint MUST return the five most recent Containers
  owned by the authenticated user.
- **FR-017**: Dashboard endpoint MUST return the ten most recent Items owned by
  the authenticated user.
- **FR-018**: Dashboard endpoint MUST NOT include records owned by any other
  user.
- **FR-019**: Dashboard recent records MUST include stable identifiers, type,
  name, parentId, spaceId, images, and relevant metadata for the node type.
- **FR-020**: Dashboard recent records MUST be ordered by most recent activity
  first, using `updatedAt` then `createdAt` as the recency basis.
- **FR-021**: Dashboard endpoint MUST return empty counts and empty lists for a
  user with no storage records.
- **FR-022**: Existing Space, Container, and Item create/update APIs MUST remain
  backward-compatible when the new fields are omitted.

### Quality Requirements

- **QR-001**: Code MUST follow project style, including two-space indentation
  where tooling permits and decoupled long lines or complex blocks.
- **QR-002**: Tests MUST cover primary behavior, important failure paths, and
  any API, data, or service boundary touched by this feature.
- **QR-003**: User-facing responses, validation messages, errors, names, and
  workflows MUST remain consistent with existing patterns.
- **QR-004**: Performance expectations MUST be measurable, including relevant
  latency, throughput, resource, or data-volume constraints.
- **QR-005**: Linting, formatting, type checks, and diagnostics MUST pass where
  repository tooling exists.

### Key Entities

- **Node Metadata**: Additional fields used to describe storage nodes. All node
  types support `tags` and `description`. Items additionally support
  `quantity`.
- **Tag**: A short user-provided label attached to a Space, Container, or Item
  for organization and quick recognition.
- **Dashboard Summary**: A per-user aggregate view containing storage counts and
  recent storage records.
- **Recent Storage Record**: A Space, Container, or Item selected for dashboard
  display based on most recent activity.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create Spaces and Containers with tags and description,
  and Items with quantity, tags, and description, then retrieve those fields in
  under 30 seconds during manual API verification.
- **SC-002**: Dashboard count totals match direct database/API records in 100% of
  integration test cases.
- **SC-003**: Dashboard response returns no more than five Spaces, five
  Containers, and ten Items.
- **SC-004**: Dashboard response for a user with no records returns counts of
  zero and empty recent lists.
- **SC-005**: Cross-user dashboard integration tests show zero leakage of record
  counts or recent record data.
- **SC-006**: Node metadata remains visible in every supported response surface
  covered by tests.

## Assumptions

- Item `quantity` represents a count of identical units and defaults to `1` when
  omitted for newly created Items.
- Existing Items without a stored quantity should be treated as quantity `1` in
  API responses unless migration chooses another explicit default.
- `quantity` is not meaningful for Spaces or Containers and is not exposed on
  those node types.
- Tags are case-preserving for display but duplicate detection is
  case-insensitive.
- Description and note refer to one user-facing text field named `description`
  in the API.
- Dashboard recency is based on `updatedAt` first, then `createdAt`.
- Dashboard is scoped to the authenticated user and requires the same bearer
  authentication as storage endpoints.
