# Tasks: User Authorization and Subscription Readiness

**Input**: Design documents from `/specs/002-user-auth-subscriptions/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required for behavioral and security changes. Write tests before
implementation for token utilities, password hashing, auth flows, protected API
boundaries, ownership failure paths, and subscription event idempotency.

**Organization**: Tasks are grouped by user story so each story can be
implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files.
- **[Story]**: User story label for story phases only.
- Every task includes an exact target file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add dependency, environment, documentation, and test-helper setup
needed before authorization work begins.

- [x] T001 Install JWT dependency `jose` and update `package.json`
- [x] T002 Update dependency lockfile for `jose` in `package-lock.json`
- [x] T003 Add JWT and RevenueCat environment parsing placeholders in `src/config/env.ts`
- [x] T004 [P] Document JWT key generation and auth env variables in `README.md`
- [x] T005 [P] Add auth-capable request helper support in `tests/helpers/http.ts`
- [x] T006 [P] Add in-memory user/session/subscription test store scaffolding in `tests/helpers/in-memory-auth-store.ts`
- [x] T007 [P] Add auth contract smoke test shell in `tests/contract/auth-openapi.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth, token, password, type, and persistence foundations that
MUST be complete before any user story can be implemented.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 Define auth and session TypeScript types in `src/types/auth.ts`
- [x] T009 Define subscription TypeScript types in `src/types/subscription.ts`
- [x] T010 Extend API response types for auth and subscription DTOs in `src/types/api.ts`
- [x] T011 Extend API error code types with auth, ownership, and subscription errors in `src/types/errors.ts`
- [x] T012 [P] Add password hashing and verification unit tests in `tests/unit/password.test.ts`
- [x] T013 [P] Add JWT signing and verification unit tests in `tests/unit/tokens.test.ts`
- [x] T014 Implement scrypt password hashing helpers in `src/utils/password.ts`
- [x] T015 Implement JWT key loading, signing, and verification helpers in `src/utils/tokens.ts`
- [x] T016 Validate JWT private/public key configuration during env loading in `src/config/env.ts`
- [x] T017 Create Mongoose User schema and indexes in `src/models/user.model.ts`
- [x] T018 Create Mongoose Auth Session schema and indexes in `src/models/auth-session.model.ts`
- [x] T019 Create user/session store interfaces and Mongoose implementations in `src/models/auth.store.ts`
- [x] T020 Create authenticated request type augmentation in `src/types/express.d.ts`
- [x] T021 Implement bearer-token authentication middleware in `src/middleware/auth.middleware.ts`
- [x] T022 Register auth middleware exports without protecting routes yet in `src/app.ts`

**Checkpoint**: Foundation ready. User story work can now begin.

---

## Phase 3: User Story 1 - Access Personal Storage Data (Priority: P1) MVP

**Goal**: A registered user can authenticate and access only their own Spaces,
Containers, and Items.

**Independent Test**: Register two users, create records for both users, then
verify each user can list, retrieve, update, and remove only records they own.

### Tests for User Story 1

- [x] T023 [P] [US1] Add registration/login/me/refresh/logout integration tests in `tests/integration/auth.test.ts`
- [x] T024 [P] [US1] Add protected Space ownership integration tests in `tests/integration/auth-storage-ownership.test.ts`
- [x] T025 [P] [US1] Add auth service unit tests for duplicate email, invalid credentials, disabled users, and refresh rotation in `tests/unit/auth.service.test.ts`
- [x] T026 [P] [US1] Add User model index and password omission tests in `tests/unit/user.model.test.ts`
- [x] T027 [P] [US1] Expand auth OpenAPI contract checks in `tests/contract/auth-openapi.test.ts`

### Implementation for User Story 1

- [x] T028 [P] [US1] Create auth routes for register/login/refresh/logout/me in `src/modules/auth/auth.routes.ts`
- [x] T029 [P] [US1] Create auth controller request handlers in `src/modules/auth/auth.controller.ts`
- [x] T030 [US1] Implement auth service registration, login, refresh, logout, and current-user flows in `src/modules/auth/auth.service.ts`
- [x] T031 [US1] Add auth routes to the Express app before protected storage routes in `src/app.ts`
- [x] T032 [US1] Add `userId` field and ownership indexes to the Node schema in `src/models/node.model.ts`
- [x] T033 [US1] Extend Node record types with `userId` in `src/types/node.ts`
- [x] T034 [US1] Scope Node store create/find/update/delete methods by `userId` in `src/models/node.store.ts`
- [x] T035 [US1] Update in-memory Node store ownership behavior in `tests/helpers/in-memory-node-store.ts`
- [x] T036 [US1] Require authenticated user id when creating and listing Spaces in `src/modules/space/space.controller.ts`
- [x] T037 [US1] Persist and query Space ownership in `src/modules/space/space.service.ts`
- [x] T038 [US1] Protect Space routes with auth middleware in `src/modules/space/space.routes.ts`
- [x] T039 [US1] Protect Container and Item routes with auth middleware in `src/modules/container/container.routes.ts`
- [x] T040 [US1] Protect Item routes with auth middleware in `src/modules/item/item.routes.ts`
- [x] T041 [US1] Update existing Space integration tests to register/login before protected requests in `tests/integration/spaces.test.ts`
- [x] T042 [US1] Update existing Container integration tests to register/login before protected requests in `tests/integration/containers.test.ts`
- [x] T043 [US1] Update existing Item integration tests to register/login before protected requests in `tests/integration/items.test.ts`
- [x] T044 [US1] Update OpenAPI contract with auth endpoints and bearer security in `specs/001-hierarchical-storage-api/contracts/openapi.yaml`

**Checkpoint**: User Story 1 is independently functional and all storage records
are user-owned.

---

## Phase 4: User Story 2 - Preserve Ownership Across The Hierarchy (Priority: P2)

**Goal**: Ownership is enforced across nested Containers, Items, moves, subtree
queries, and full Item path retrieval.

**Independent Test**: Create separate hierarchies for two users, attempt
cross-user parent assignments and moves, and verify they are rejected without
revealing private records.

### Tests for User Story 2

- [x] T045 [P] [US2] Add cross-user Container parent rejection tests in `tests/integration/auth-storage-ownership.test.ts`
- [x] T046 [P] [US2] Add cross-user Item creation and move rejection tests in `tests/integration/auth-storage-ownership.test.ts`
- [x] T047 [P] [US2] Add ownership-scoped tree and Item path tests in `tests/integration/auth-storage-ownership.test.ts`
- [x] T048 [P] [US2] Add hierarchy service ownership validation tests in `tests/unit/hierarchy.service.test.ts`

### Implementation for User Story 2

- [x] T049 [US2] Pass authenticated user id through Container controller operations in `src/modules/container/container.controller.ts`
- [x] T050 [US2] Enforce owner-scoped parent validation and moves in `src/modules/container/container.service.ts`
- [x] T051 [US2] Pass authenticated user id through Item controller operations in `src/modules/item/item.controller.ts`
- [x] T052 [US2] Enforce owner-scoped Item creation, updates, moves, reads, and path retrieval in `src/modules/item/item.service.ts`
- [x] T053 [US2] Add owner-aware ancestor and descendant validation in `src/services/hierarchy.service.ts`
- [x] T054 [US2] Return privacy-preserving not-found or access-denied errors in `src/utils/errors.ts`
- [x] T055 [US2] Ensure ownership is included in node DTO mapping only where appropriate in `src/utils/node-response.ts`
- [x] T056 [US2] Update Container and Item OpenAPI operations with bearer security and ownership errors in `specs/001-hierarchical-storage-api/contracts/openapi.yaml`

**Checkpoint**: User Stories 1 and 2 work independently, and cross-user
hierarchy access is blocked.

---

## Phase 5: User Story 3 - Track Subscription Entitlement State (Priority: P3)

**Goal**: The system records RevenueCat-compatible subscription customer,
product, entitlement, and lifecycle event state for future paid access decisions.

**Independent Test**: Record subscription events for a user, including active,
expired, replayed, and revoked scenarios, then verify current entitlement state
is correct and idempotent.

### Tests for User Story 3

- [x] T057 [P] [US3] Add subscription status integration tests for users with no entitlement and active entitlement in `tests/integration/subscriptions.test.ts`
- [x] T058 [P] [US3] Add RevenueCat webhook integration tests for active, expired, revoked, and replayed events in `tests/integration/subscriptions.test.ts`
- [x] T059 [P] [US3] Add subscription service unit tests for out-of-order and duplicate event handling in `tests/unit/subscription.service.test.ts`
- [x] T060 [P] [US3] Add subscription model index tests in `tests/unit/subscription.model.test.ts`
- [x] T061 [P] [US3] Expand subscription OpenAPI contract checks in `tests/contract/auth-openapi.test.ts`

### Implementation for User Story 3

- [x] T062 [P] [US3] Create Subscription Customer schema in `src/models/subscription.model.ts`
- [x] T063 [P] [US3] Create Subscription Product schema in `src/models/subscription.model.ts`
- [x] T064 [P] [US3] Create Subscription Entitlement schema in `src/models/subscription.model.ts`
- [x] T065 [P] [US3] Create Subscription Event schema in `src/models/subscription.model.ts`
- [x] T066 [US3] Create subscription store interfaces and Mongoose implementations in `src/models/subscription.store.ts`
- [x] T067 [P] [US3] Create subscription routes for status and RevenueCat webhook in `src/modules/subscription/subscription.routes.ts`
- [x] T068 [P] [US3] Create subscription controller handlers in `src/modules/subscription/subscription.controller.ts`
- [x] T069 [US3] Implement entitlement lookup and RevenueCat event processing in `src/modules/subscription/subscription.service.ts`
- [x] T070 [US3] Validate RevenueCat webhook authorization token from env in `src/modules/subscription/subscription.controller.ts`
- [x] T071 [US3] Register subscription routes in `src/app.ts`
- [x] T072 [US3] Add subscription response DTOs and event accepted DTOs in `src/types/api.ts`
- [x] T073 [US3] Update OpenAPI contract with subscription status and webhook endpoints in `specs/001-hierarchical-storage-api/contracts/openapi.yaml`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, quickstart validation, performance checks, and
required quality gates.

- [x] T074 [P] Update local setup and auth usage documentation in `README.md`
- [x] T075 [P] Add implementation notes for key rotation and webhook secrets in `specs/002-user-auth-subscriptions/quickstart.md`
- [x] T076 [P] Verify generated task coverage against `specs/002-user-auth-subscriptions/spec.md`
- [x] T077 Split long auth and subscription methods into readable helpers across `src/modules/auth/auth.service.ts`
- [x] T078 Split long ownership validation blocks into readable helpers across `src/services/hierarchy.service.ts`
- [x] T079 Measure JWT verification overhead with the auth-storage integration tests in `tests/integration/auth-storage-ownership.test.ts`
- [x] T080 Run TypeScript type checks using scripts in `package.json`
- [x] T081 Run ESLint using scripts in `package.json`
- [x] T082 Run Prettier check using scripts in `package.json`
- [x] T083 Run full test suite using scripts in `package.json`
- [x] T084 Validate quickstart flows in `specs/002-user-auth-subscriptions/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP scope.
- **User Story 2 (Phase 4)**: Depends on Foundational and the ownership fields
  introduced by US1.
- **User Story 3 (Phase 5)**: Depends on Foundational and can be implemented
  after US1 auth exists.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1**: Independent after Foundational; establishes auth and user-owned
  storage access.
- **US2**: Requires US1's authenticated user context and node `userId` ownership
  field, then focuses on hierarchy-wide enforcement.
- **US3**: Requires authenticated Users from US1, but does not depend on US2's
  hierarchy enforcement.

### Within Each User Story

- Tests must be written and fail before implementation.
- Types and models before stores.
- Stores before services.
- Services before controllers and route registration.
- Existing integration tests must be updated before checkpoint completion.
- Type checks, linting, formatting, and diagnostics before final completion.

### Parallel Opportunities

- Setup documentation/helper tasks T004-T007 can run in parallel.
- Foundational unit test tasks T012-T013 can run in parallel.
- US1 test tasks T023-T027 can run in parallel.
- US1 route/controller tasks T028-T029 can run in parallel after tests exist.
- US2 test tasks T045-T048 can run in parallel.
- US3 model tasks T062-T065 can run in parallel.
- US3 route/controller tasks T067-T068 can run in parallel.
- Polish documentation and verification tasks T074-T076 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T023 [US1] Add registration/login/me/refresh/logout integration tests"
Task: "T024 [US1] Add protected Space ownership integration tests"
Task: "T025 [US1] Add auth service unit tests"
Task: "T026 [US1] Add User model tests"
Task: "T027 [US1] Expand auth OpenAPI contract checks"
```

## Parallel Example: User Story 2

```bash
Task: "T045 [US2] Add cross-user Container parent rejection tests"
Task: "T046 [US2] Add cross-user Item creation and move rejection tests"
Task: "T047 [US2] Add ownership-scoped tree and Item path tests"
Task: "T048 [US2] Add hierarchy service ownership validation tests"
```

## Parallel Example: User Story 3

```bash
Task: "T057 [US3] Add subscription status integration tests"
Task: "T058 [US3] Add RevenueCat webhook integration tests"
Task: "T059 [US3] Add subscription service unit tests"
Task: "T060 [US3] Add subscription model index tests"
Task: "T061 [US3] Expand subscription OpenAPI contract checks"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundation.
3. Complete Phase 3 for registration, JWT auth, protected routes, and user-owned
   storage records.
4. Stop and validate two users cannot access each other's Spaces.

### Incremental Delivery

1. Deliver US1 to make existing storage APIs private per user.
2. Deliver US2 to close hierarchy-specific cross-user edge cases.
3. Deliver US3 to prepare subscription entitlements for RevenueCat.
4. Complete polish and quality gates.

### What Is Necessary For This App

The core necessary account fields are `email`, `password`, `name`, optional
`profileImageUrl`, account `status`, refresh-token session data, and `userId` on
every storage node. Additional profile fields, email verification, password
reset, OAuth, sharing, and paid limits stay out of scope for this task set.

## Notes

- [P] tasks use different files and can run in parallel after dependencies.
- Story labels map each task to the corresponding spec user story.
- Do not store `.env` or generated private keys in git.
- Commit only when explicitly requested.
