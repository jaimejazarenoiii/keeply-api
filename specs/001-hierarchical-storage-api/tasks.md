# Tasks: Hierarchical Storage API

**Input**: Design documents from `/specs/001-hierarchical-storage-api/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required for behavioral changes. Write tests before implementation
for services, API boundaries, and hierarchy failure paths.

**Organization**: Tasks are grouped by user story so each story can be
implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files.
- **[Story]**: User story label for story phases only.
- Every task includes an exact target file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Express.js, TypeScript, linting, formatting, and
folder foundation requested for the backend API.

- [X] T001 Initialize Node.js project metadata and scripts in `package.json`
- [X] T002 Install runtime dependencies in `package.json`
- [X] T003 Install TypeScript and Express type dependencies in `package.json`
- [X] T004 Configure strict TypeScript compiler options in `tsconfig.json`
- [X] T005 [P] Configure ESLint for TypeScript in `eslint.config.js`
- [X] T006 [P] Configure Prettier with two-space indentation in `.prettierrc`
- [X] T007 [P] Configure ignored generated files in `.prettierignore`
- [X] T008 Create source folder structure in `src/modules/.gitkeep`
- [X] T009 [P] Create shared folder structure in `src/shared/.gitkeep`
- [X] T010 [P] Create config folder structure in `src/config/.gitkeep`
- [X] T011 [P] Create middleware folder structure in `src/middleware/.gitkeep`
- [X] T012 [P] Create utils folder structure in `src/utils/.gitkeep`
- [X] T013 [P] Create test folder structure in `tests/unit/.gitkeep`
- [X] T014 [P] Create integration test folder in `tests/integration/.gitkeep`
- [X] T015 [P] Create contract test folder in `tests/contract/.gitkeep`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core runtime, database, types, and error handling that must exist
before any user story implementation starts.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T016 Create Express application with JSON and CORS in `src/app.ts`
- [X] T017 Create HTTP server bootstrap in `src/server.ts`
- [X] T018 Add health check route in `src/app.ts`
- [X] T019 Configure environment parsing in `src/config/env.ts`
- [X] T020 Setup MongoDB connection with error handling in `src/config/database.ts`
- [X] T021 Define shared API response types in `src/types/api.ts`
- [X] T022 Define hierarchy and node TypeScript types in `src/types/node.ts`
- [X] T023 Define API error code types in `src/types/errors.ts`
- [X] T024 Create base API error class in `src/utils/errors.ts`
- [X] T025 Create global error middleware in `src/middleware/error.middleware.ts`
- [X] T026 Create async route helper in `src/utils/async-handler.ts`
- [X] T027 Create request validation helper in `src/utils/validation.ts`
- [X] T028 Create Mongoose Node schema and indexes in `src/models/node.model.ts`
- [X] T029 Create hierarchy service skeleton in `src/services/hierarchy.service.ts`
- [X] T030 [P] Add Node model unit tests in `tests/unit/node.model.test.ts`
- [X] T031 [P] Add error middleware tests in `tests/unit/error.middleware.test.ts`
- [X] T032 [P] Add OpenAPI contract smoke test in `tests/contract/openapi.test.ts`

**Checkpoint**: Foundation ready. User story work can now begin.

---

## Phase 3: User Story 1 - Register Storage Structure (Priority: P1) MVP

**Goal**: Users can create a Space, add Containers under it, nest Containers,
and retrieve the hierarchy.

**Independent Test**: Create `Garage`, create `Shelf A`, create `Bin 1` under
`Shelf A`, then retrieve the Space tree and verify parent-child relationships.

### Tests for User Story 1

- [ ] T033 [P] [US1] Add Space API integration tests in `tests/integration/spaces.test.ts`
- [ ] T034 [P] [US1] Add Container tree tests in `tests/integration/containers.test.ts`
- [ ] T035 [P] [US1] Add hierarchy validation unit tests in `tests/unit/hierarchy.service.test.ts`

### Implementation for User Story 1

- [ ] T036 [P] [US1] Create Space routes in `src/modules/space/space.routes.ts`
- [ ] T037 [P] [US1] Create Space controller in `src/modules/space/space.controller.ts`
- [ ] T038 [US1] Implement Space service CRUD in `src/modules/space/space.service.ts`
- [ ] T039 [P] [US1] Create Container routes in `src/modules/container/container.routes.ts`
- [ ] T040 [P] [US1] Create Container controller in `src/modules/container/container.controller.ts`
- [ ] T041 [US1] Implement Container write logic in `src/modules/container/container.service.ts`
- [ ] T042 [US1] Implement parent type validation in `src/services/hierarchy.service.ts`
- [ ] T043 [US1] Implement Space tree retrieval in `src/services/hierarchy.service.ts`
- [ ] T044 [US1] Register Space and Container routes in `src/app.ts`

**Checkpoint**: User Story 1 is independently functional.

---

## Phase 4: User Story 2 - Track Items In Nested Containers (Priority: P2)

**Goal**: Users can create, update, retrieve, move, and remove Items under a
Space or Container, with images included in responses.

**Independent Test**: Create nested Containers, create `Extension Cord` under
the deepest Container, update metadata/images, move it, and verify location.

### Tests for User Story 2

- [ ] T045 [P] [US2] Add Item API integration tests in `tests/integration/items.test.ts`
- [ ] T046 [P] [US2] Add Item parent validation tests in `tests/unit/hierarchy.service.test.ts`
- [ ] T047 [P] [US2] Add image reference tests in `tests/unit/node.model.test.ts`

### Implementation for User Story 2

- [ ] T048 [P] [US2] Create Item routes in `src/modules/item/item.routes.ts`
- [ ] T049 [P] [US2] Create Item controller in `src/modules/item/item.controller.ts`
- [ ] T050 [US2] Implement Item CRUD in `src/modules/item/item.service.ts`
- [ ] T051 [US2] Implement Item move validation in `src/services/hierarchy.service.ts`
- [ ] T052 [US2] Implement image normalization in `src/utils/validation.ts`
- [ ] T053 [US2] Implement subtree Item retrieval in `src/modules/container/container.service.ts`
- [ ] T054 [US2] Register Item routes in `src/app.ts`

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 5: User Story 3 - Retrieve Full Item Path (Priority: P3)

**Goal**: Users can retrieve the complete ordered path from Space to Item after
renames, Container moves, and Item moves.

**Independent Test**: Store an Item under at least three hierarchy levels,
retrieve the path, rename/move nodes, and verify the path remains current.

### Tests for User Story 3

- [ ] T055 [P] [US3] Add Item path integration tests in `tests/integration/items.test.ts`
- [ ] T056 [P] [US3] Add ancestor traversal unit tests in `tests/unit/hierarchy.service.test.ts`
- [ ] T057 [P] [US3] Add circular move rejection tests in `tests/integration/containers.test.ts`

### Implementation for User Story 3

- [ ] T058 [US3] Implement ancestor traversal in `src/services/hierarchy.service.ts`
- [ ] T059 [US3] Implement circular move detection in `src/services/hierarchy.service.ts`
- [ ] T060 [US3] Implement Item path endpoint in `src/modules/item/item.controller.ts`
- [ ] T061 [US3] Add Item path service method in `src/modules/item/item.service.ts`
- [ ] T062 [US3] Ensure path responses include images in `src/types/api.ts`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Contract alignment, documentation checks, performance validation,
and required quality gates.

- [ ] T063 [P] Sync OpenAPI coverage in `specs/001-hierarchical-storage-api/contracts/openapi.yaml`
- [ ] T064 [P] Add README setup notes in `README.md`
- [ ] T065 Validate quickstart flow in `specs/001-hierarchical-storage-api/quickstart.md`
- [ ] T066 Add index verification tests in `tests/unit/node.model.test.ts`
- [ ] T067 Split long lines or complex blocks across `src/`
- [ ] T068 Run TypeScript type checks using scripts in `package.json`
- [ ] T069 Run ESLint using scripts in `package.json`
- [ ] T070 Run Prettier check using scripts in `package.json`
- [ ] T071 Run full test suite using scripts in `package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP scope.
- **User Story 2 (Phase 4)**: Depends on Foundational and can reuse US1 routes.
- **User Story 3 (Phase 5)**: Depends on hierarchy services from US1 and US2.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1**: Independent after Foundational.
- **US2**: Can start after Foundational, but tree verification benefits from US1.
- **US3**: Requires Item creation and move behavior from US2.

### Within Each User Story

- Tests must be written and fail before implementation.
- Types and request contracts before service implementation.
- Services before controllers and route registration.
- Integration tests before checkpoint completion.
- Type checks, linting, formatting, and diagnostics before final completion.

### Parallel Opportunities

- Setup directory/config tasks T005-T015 can run in parallel.
- Foundational test tasks T030-T032 can run in parallel after core files exist.
- US1 route/controller tests T033-T035 can run in parallel.
- US2 test and route/controller tasks T045-T049 can run in parallel.
- US3 test tasks T055-T057 can run in parallel.
- Polish documentation and contract tasks T063-T066 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T033 [US1] Add Space API integration tests"
Task: "T034 [US1] Add Container tree tests"
Task: "T035 [US1] Add hierarchy validation unit tests"
Task: "T036 [US1] Create Space routes"
Task: "T037 [US1] Create Space controller"
Task: "T039 [US1] Create Container routes"
Task: "T040 [US1] Create Container controller"
```

## Parallel Example: User Story 2

```bash
Task: "T045 [US2] Add Item API integration tests"
Task: "T046 [US2] Add Item parent validation tests"
Task: "T047 [US2] Add image reference tests"
Task: "T048 [US2] Create Item routes"
Task: "T049 [US2] Create Item controller"
```

## Parallel Example: User Story 3

```bash
Task: "T055 [US3] Add Item path integration tests"
Task: "T056 [US3] Add ancestor traversal unit tests"
Task: "T057 [US3] Add circular move rejection tests"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundation.
3. Complete Phase 3 for Spaces, Containers, and tree retrieval.
4. Stop and validate the independent US1 test flow.

### Incremental Delivery

1. Deliver US1 to register and view storage structure.
2. Deliver US2 to track Items and images.
3. Deliver US3 to resolve full Item paths.
4. Complete polish and quality gates.

### Foundation Setup Focus

The user's requested foundation setup is covered by T001-T029, including Node.js
initialization, TypeScript strict mode, ESLint, Prettier, Express app/server,
MongoDB connection, folders, and global error handling.

## Notes

- [P] tasks use different files and can run in parallel after dependencies.
- Story labels map each task to the corresponding spec user story.
- Avoid starting story work before the shared Node model and hierarchy service
  skeleton exist.
- Commit after logical groups only when explicitly requested.
