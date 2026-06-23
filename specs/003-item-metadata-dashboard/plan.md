# Implementation Plan: Item Metadata and Dashboard API

**Branch**: `003-item-metadata-dashboard` | **Date**: 2026-06-10 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from
`/specs/003-item-metadata-dashboard/spec.md`

## Summary

Extend the existing user-owned Node model and Space, Container, and Item APIs
with first-class metadata fields. All node types support `tags` and
`description`; Items additionally support `quantity`. Add an authenticated
dashboard endpoint that returns per-user storage counts plus bounded recent
Space, Container, and Item lists. Reuse the current Express module layout,
`NodeStore` abstraction, validation helpers, and response mappers so metadata
appears consistently across direct reads, tree nodes, Item path segments, and
dashboard recent records.

## Technical Context

**Language/Version**: TypeScript in strict mode on Node.js LTS

**Primary Dependencies**: Express.js, Mongoose, existing JWT auth middleware,
`NodeStore`, `HierarchyService`, centralized validation and error middleware

**Storage**: Existing MongoDB `nodes` collection extended with optional `tags`
and `description` on all node types and optional `quantity` on Item records only;
no new collections required

**Testing**: Node.js test runner with unit tests for shared tag/description
validation and Item quantity rules, integration tests for Space, Container, and
Item create/update/read surfaces, dashboard scoping, and contract checks against
the feature OpenAPI document

**Target Platform**: Backend HTTP API deployable to a Node.js server runtime

**Project Type**: Single backend API project

**Performance Goals**: Dashboard response returns within 1 second p95 for users
with up to 10,000 owned nodes; dashboard queries use indexed user/type/recency
filters and bounded limits (5/5/10)

**Constraints**: Metadata fields are optional on create/update and must remain
backward-compatible for existing nodes; Item quantity must be a non-negative
integer; `quantity` must be rejected on Space and Container requests; dashboard
data must never leak across users; recent-list ordering must be deterministic

**Scale/Scope**: MVP covers metadata on Space, Container, and Item
create/update/read paths, metadata propagation through hierarchy responses, and
one authenticated dashboard summary endpoint. Search by tag, quantity analytics,
pagination of recent lists, and cross-Space filtering are future work.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Code Quality**: Design uses clear boundaries, two-space indentation where
  tooling permits, and decouples long lines or complex blocks. PASS: shared tag
  and description validation stays in helpers, Item quantity rules stay isolated,
  dashboard aggregation stays in a dedicated module, and persistence extensions
  stay in `NodeStore`.
- **Testing Standards**: Unit, integration, contract, or manual verification is
  defined for each behavior and failure path. PASS: tag/description validation,
  Item quantity validation, Space/Container quantity rejection, metadata
  propagation, dashboard counts, recent limits, empty-user dashboard, and
  cross-user isolation are planned.
- **UX Consistency**: API responses, errors, validation, names, and workflows
  follow existing user-facing patterns or document a justified change. PASS:
  responses keep `{ data }` and `{ error }` envelopes, reuse existing Node
  response shapes with additive fields, and follow current auth middleware.
- **Performance Requirements**: Latency, throughput, resource, or data-volume
  constraints are stated, with measurement planned for sensitive paths. PASS:
  bounded dashboard reads, indexed recency queries, and integration timing checks
  are documented.
- **Linting And Formatting**: Required lint, type, format, and diagnostic checks
  are identified; any unavailable tooling is documented. PASS: strict TypeScript,
  lint, format, build, and test scripts remain required.

## Project Structure

### Documentation (this feature)

```text
specs/003-item-metadata-dashboard/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app.ts
├── models/
│   ├── node.model.ts
│   └── node.store.ts
├── modules/
│   ├── container/
│   │   ├── container.controller.ts
│   │   ├── container.routes.ts
│   │   └── container.service.ts
│   ├── dashboard/
│   │   ├── dashboard.controller.ts
│   │   ├── dashboard.routes.ts
│   │   └── dashboard.service.ts
│   ├── item/
│   │   ├── item.controller.ts
│   │   ├── item.routes.ts
│   │   └── item.service.ts
│   └── space/
│       ├── space.controller.ts
│       ├── space.routes.ts
│       └── space.service.ts
├── services/
│   └── hierarchy.service.ts
├── types/
│   ├── api.ts
│   └── node.ts
└── utils/
    ├── node-response.ts
    └── validation.ts

tests/
├── contract/
│   └── dashboard-openapi.test.ts
├── integration/
│   ├── containers.test.ts
│   ├── dashboard.test.ts
│   ├── items.test.ts
│   └── spaces.test.ts
└── unit/
    ├── item-metadata.validation.test.ts
    └── dashboard.service.test.ts
```

**Structure Decision**: Extend the existing single backend API structure. Add a
small `dashboard` module, extend Space, Container, and Item persistence and
response mapping in place, and add focused `NodeStore` query methods instead of
embedding dashboard logic in controllers or Mongoose models directly.

## Complexity Tracking

No constitution violations.

## Phase 0 Research

Research output is captured in [research.md](./research.md). Key decisions:

- Store `tags` and `description` as first-class optional Node fields on Spaces,
  Containers, and Items; store `quantity` on Items only.
- Default new and legacy Item quantity to `1` in API responses when absent in
  storage; omit `quantity` from Space and Container responses.
- Normalize tags by trimming, removing empties, and deduplicating
  case-insensitively while preserving first-seen display casing.
- Reject `quantity` on Space and Container create/update requests.
- Expose one authenticated `GET /dashboard` endpoint with counts and bounded
  recent lists ordered by `updatedAt`, then `createdAt`, then `_id`.
- Add a compound index to support user-scoped recency queries efficiently.

## Phase 1 Design

Design artifacts:

- [data-model.md](./data-model.md)
- [contracts/openapi.yaml](./contracts/openapi.yaml)
- [quickstart.md](./quickstart.md)

Post-design Constitution Check:

- **Code Quality**: PASS. Validation, mapping, dashboard aggregation, and store
  queries have clear boundaries.
- **Testing Standards**: PASS. Unit, integration, and contract coverage map to
  metadata validation, response propagation, and dashboard scoping.
- **UX Consistency**: PASS. Additive node fields and one new dashboard endpoint
  follow existing envelopes and auth patterns.
- **Performance Requirements**: PASS. Bounded reads, indexed recency queries, and
  dashboard timing expectations are documented.
- **Linting And Formatting**: PASS. Existing `typecheck`, `lint`, `format:check`,
  and `test` scripts remain completion gates.
