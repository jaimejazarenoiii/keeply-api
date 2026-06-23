# Tasks: Item Metadata and Dashboard API

**Input**: Design documents from `/specs/003-item-metadata-dashboard/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required for behavioral changes. Write tests before implementation
for shared tag/description validation, Item quantity rules, Space/Container
quantity rejection, dashboard aggregation, response propagation, cross-user
isolation, and OpenAPI contract coverage.

**Organization**: Tasks are grouped by user story so each story can be
implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files.
- **[Story]**: User story label for story phases only.
- Every task includes an exact target file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add feature-specific types, test shells, and documentation hooks
before metadata and dashboard work begins.

- [x] T001 [P] Add dashboard summary response types in `src/types/api.ts`
- [x] T002 [P] Add node metadata validation unit test shell in `tests/unit/item-metadata.validation.test.ts`
- [x] T003 [P] Add dashboard service unit test shell in `tests/unit/dashboard.service.test.ts`
- [x] T004 [P] Add dashboard integration test shell in `tests/integration/dashboard.test.ts`
- [x] T005 [P] Add dashboard OpenAPI contract test shell in `tests/contract/dashboard-openapi.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared Node schema, store, validation, and response-mapping changes
that MUST be complete before user story implementation starts.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Extend NodeRecord, NodeDto, TreeNode, and PathSegment with tags, description, and Item-only quantity in `src/types/node.ts`
- [x] T007 Add tags, description, and quantity schema fields plus recency index in `src/models/node.model.ts`
- [x] T008 Extend NodeStore interface with metadata update fields plus countByType and findRecentByType in `src/models/node.store.ts`
- [x] T009 Implement countByType and findRecentByType in MongooseNodeStore in `src/models/node.store.ts`
- [x] T010 [P] Add normalizeTags, optionalDescription, optionalQuantity, and rejectQuantityForNonItem helpers in `src/utils/validation.ts`
- [x] T011 Extend toNodeDto with type-aware metadata mapping in `src/utils/node-response.ts`
- [x] T012 Update in-memory NodeStore for metadata fields and dashboard queries in `tests/helpers/in-memory-node-store.ts`
- [x] T013 [P] Add Node schema tests for metadata fields and recency index in `tests/unit/node.model.test.ts`

**Checkpoint**: Foundation ready. User story work can now begin.

---

## Phase 3: User Story 1 - Enrich Storage Node Details (Priority: P1) MVP

**Goal**: Signed-in users can create and update Spaces and Containers with tags
and description, and Items with quantity, tags, and description, then retrieve
those fields on direct reads.

**Independent Test**: Create a Space, Container, and Item each with tags and
description, plus Item quantity, then retrieve each record and verify normalized
values, default Item quantity behavior, and rejection of quantity on
Space/Container requests.

### Tests for User Story 1

- [x] T014 [P] [US1] Add shared tags, description, Item quantity, and quantity-rejection unit tests in `tests/unit/item-metadata.validation.test.ts`
- [x] T015 [P] [US1] Add Item create, update, read, and validation failure integration tests in `tests/integration/items.test.ts`
- [x] T016 [P] [US1] Add Space tags and description integration tests in `tests/integration/spaces.test.ts`
- [x] T017 [P] [US1] Add Container tags and description integration tests in `tests/integration/containers.test.ts`

### Implementation for User Story 1

- [x] T018 [US1] Persist Item metadata on create in `src/modules/item/item.service.ts`
- [x] T019 [US1] Persist Item metadata on update in `src/modules/item/item.service.ts`
- [x] T020 [US1] Accept metadata fields in Item controller create and update handlers in `src/modules/item/item.controller.ts`
- [x] T021 [US1] Persist Space tags and description on create and update in `src/modules/space/space.service.ts`
- [x] T022 [US1] Accept tags and description in Space controller create and update handlers in `src/modules/space/space.controller.ts`
- [x] T023 [US1] Persist Container tags and description on create and update in `src/modules/container/container.service.ts`
- [x] T024 [US1] Accept tags and description in Container controller create and update handlers in `src/modules/container/container.controller.ts`
- [x] T025 [US1] Extend NodeStore updateById to persist tags, description, and quantity in `src/models/node.store.ts`

**Checkpoint**: User Story 1 is independently functional for direct Space,
Container, and Item CRUD with metadata.

---

## Phase 4: User Story 2 - View Storage Dashboard Summary (Priority: P2)

**Goal**: Signed-in users can retrieve a dashboard with owned storage counts and
bounded recent Space, Container, and Item lists that include relevant metadata.

**Independent Test**: Create tagged Spaces and Containers plus Items for two
users, retrieve `/dashboard` for each user, and verify counts, recent limits,
metadata on recent records, empty-user behavior, and zero cross-user leakage.

### Tests for User Story 2

- [x] T026 [P] [US2] Add dashboard aggregation unit tests in `tests/unit/dashboard.service.test.ts`
- [x] T027 [P] [US2] Add dashboard counts, limits, metadata, empty-user, and isolation integration tests in `tests/integration/dashboard.test.ts`
- [x] T028 [P] [US2] Add dashboard OpenAPI contract checks in `tests/contract/dashboard-openapi.test.ts`

### Implementation for User Story 2

- [x] T029 [P] [US2] Create dashboard service in `src/modules/dashboard/dashboard.service.ts`
- [x] T030 [P] [US2] Create dashboard controller in `src/modules/dashboard/dashboard.controller.ts`
- [x] T031 [P] [US2] Create authenticated dashboard routes in `src/modules/dashboard/dashboard.routes.ts`
- [x] T032 [US2] Register dashboard route in `src/app.ts`

**Checkpoint**: User Story 2 is independently functional for authenticated
dashboard reads.

---

## Phase 5: User Story 3 - Keep Node Metadata Consistent Across Hierarchy Responses (Priority: P3)

**Goal**: Tags and description appear consistently for Spaces and Containers in
trees, path segments, and dashboard recent lists; Item metadata including
quantity appears consistently in subtree lists, tree leaf nodes, Item path
segments, and dashboard recent Items.

**Independent Test**: Create a Space, Container, and Item with metadata, then
retrieve them through direct reads, Space/Container trees, Item path, and
dashboard recent lists with matching metadata per node type.

### Tests for User Story 3

- [x] T033 [P] [US3] Add Item metadata propagation integration tests in `tests/integration/items.test.ts`
- [x] T034 [P] [US3] Add Space and Container metadata propagation integration tests in `tests/integration/spaces.test.ts`
- [x] T035 [P] [US3] Add hierarchy mapper unit tests for node metadata in `tests/unit/hierarchy.service.test.ts`
- [x] T036 [P] [US3] Add dashboard recent record metadata integration tests in `tests/integration/dashboard.test.ts`

### Implementation for User Story 3

- [x] T037 [US3] Include supported node metadata in createTreeNode in `src/services/hierarchy.service.ts`
- [x] T038 [US3] Include supported node metadata on all Item path segments in `src/services/hierarchy.service.ts`
- [x] T039 [US3] Ensure Container subtree Item responses expose Item metadata in `src/modules/container/container.controller.ts`

**Checkpoint**: Node metadata is consistent across all supported response
surfaces.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, contract sync, and quality gates affecting multiple
user stories.

- [x] T040 [P] Merge node metadata fields and dashboard endpoint into canonical OpenAPI in `specs/001-hierarchical-storage-api/contracts/openapi.yaml`
- [x] T041 [P] Add Space and Container metadata flows to `specs/003-item-metadata-dashboard/quickstart.md`
- [x] T042 [P] Add measurable dashboard response timing assertion in `tests/integration/dashboard.test.ts`
- [x] T043 Run typecheck, lint, format:check, and full test suite with elevated Node heap in `package.json` scripts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational — MVP for Space, Container,
  and Item metadata CRUD.
- **User Story 2 (Phase 4)**: Depends on Foundational — strongest metadata
  assertions on recent records after US1.
- **User Story 3 (Phase 5)**: Depends on US1 metadata persistence and
  Foundational response mapping — validates cross-surface propagation.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1**: Independent after Foundational; delivers metadata create, update, and
  direct read behavior for Spaces, Containers, and Items.
- **US2**: Independent after Foundational for counts and recent lists; benefits
  from US1 when validating metadata on recent records.
- **US3**: Requires US1 metadata persistence and Foundational mappers; ensures
  hierarchy and dashboard surfaces stay consistent.

### Within Each User Story

- Tests must be written and fail before implementation.
- Types and models before stores.
- Stores before services.
- Services before controllers and route registration.
- Type checks, linting, formatting, and diagnostics before final completion.

### Parallel Opportunities

- Setup tasks T001-T005 can run in parallel.
- Foundational tasks T010 and T013 can run in parallel with T006-T009 and T011-T012.
- US1 test tasks T014-T017 can run in parallel.
- US1 Space and Container implementation tasks T021-T024 can run in parallel with
  Item tasks T018-T020 after shared validation exists.
- US2 test tasks T026-T028 can run in parallel.
- US2 implementation tasks T029-T031 can run in parallel before T032.
- US3 test tasks T033-T036 can run in parallel.
- Polish tasks T040-T042 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T014 [US1] Add shared tags, description, Item quantity, and quantity-rejection unit tests"
Task: "T015 [US1] Add Item create, update, read, and validation failure integration tests"
Task: "T016 [US1] Add Space tags and description integration tests"
Task: "T017 [US1] Add Container tags and description integration tests"
```

## Parallel Example: User Story 2

```bash
Task: "T026 [US2] Add dashboard aggregation unit tests"
Task: "T027 [US2] Add dashboard counts, limits, metadata, empty-user, and isolation integration tests"
Task: "T028 [US2] Add dashboard OpenAPI contract checks"
Task: "T029 [US2] Create dashboard service"
Task: "T030 [US2] Create dashboard controller"
Task: "T031 [US2] Create authenticated dashboard routes"
```

## Parallel Example: User Story 3

```bash
Task: "T033 [US3] Add Item metadata propagation integration tests"
Task: "T034 [US3] Add Space and Container metadata propagation integration tests"
Task: "T035 [US3] Add hierarchy mapper unit tests for node metadata"
Task: "T036 [US3] Add dashboard recent record metadata integration tests"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundation.
3. Complete Phase 3 for Space, Container, and Item metadata create, update, and
   direct retrieval.
4. Stop and validate metadata normalization and quantity rejection rules.

### Incremental Delivery

1. Deliver US1 to enrich Space, Container, and Item detail records.
2. Deliver US2 to add the authenticated dashboard landing summary.
3. Deliver US3 to keep metadata consistent across hierarchy responses.
4. Complete polish and quality gates.

### Suggested Scope For First PR

Phases 1-3 only: foundational Node changes plus Space, Container, and Item
metadata CRUD. This gives the client usable tags and description on all node
types and Item quantity before dashboard and propagation work land.

---

## Notes

- [P] tasks use different files and can run in parallel after dependencies.
- Story labels map each task to the corresponding spec user story.
- `tags` and `description` apply to Spaces, Containers, and Items.
- `quantity` applies to Items only; reject it on Space and Container requests.
- Default Item quantity to `1` in API responses when storage has no value.
- Dashboard recent ordering uses `updatedAt`, then `createdAt`, then `_id`.
- On Windows, run tests with `NODE_OPTIONS=--max-old-space-size=8192` if needed.
- Commit only when explicitly requested.
