# Implementation Plan: Hierarchical Storage API

**Branch**: `001-hierarchical-storage-api` | **Date**: 2026-05-29 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from
`/specs/001-hierarchical-storage-api/spec.md`

## Summary

Build an Express.js backend API that tracks Spaces, Containers, and Items as a
single recursive Node tree per Space. MongoDB stores all hierarchy members and
their image references in a single `nodes` collection, Mongoose enforces typed
persistence boundaries, and the service layer owns validation for parent type
rules, circular references, tree retrieval, node moves, and Item path
resolution.

## Technical Context

**Language/Version**: TypeScript in strict mode on Node.js LTS

**Primary Dependencies**: Express.js, Mongoose with TypeScript support, MongoDB
driver, dotenv/config support, request validation middleware, centralized error
middleware

**Storage**: MongoDB with one `nodes` collection containing SPACE, CONTAINER,
and ITEM records, including ordered image reference arrays per node

**Testing**: Unit tests for services and utilities, integration tests for API
flows against an isolated MongoDB test database, and contract validation against
the OpenAPI document

**Target Platform**: Backend HTTP API deployable to a Node.js server runtime

**Project Type**: Single backend API project

**Performance Goals**: Item path lookup returns within 3 seconds for trees up to
10 Container levels deep; tree and subtree retrieval use indexed `parentId` and
`spaceId` queries

**Constraints**: TypeScript `strict`, `noImplicitAny`, and `strictNullChecks`
must remain enabled; no `any` in domain logic; Items cannot contain children;
cycles and cross-Space parent changes are rejected

**Scale/Scope**: MVP covers CRUD for Spaces, Containers, and Items; multiple
image references per node; node moves; tree retrieval; subtree Item retrieval;
and full Item path retrieval. Authentication, RBAC, audit history, binary image
upload storage, search indexing, labels, offline sync, and sharing are future
work.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality**: Design uses clear boundaries, two-space indentation where
  tooling permits, and decouples long lines or complex blocks. PASS: layered
  modules separate routes, controllers, services, models, types, and utilities.
- **Testing Standards**: Unit, integration, contract, or manual verification is
  defined for each behavior and failure path. PASS: service rules, API flows,
  and OpenAPI contracts are planned.
- **UX Consistency**: API responses, errors, validation, names, and workflows
  follow existing user-facing patterns or document a justified change. PASS:
  centralized error codes and consistent response envelopes are specified.
- **Performance Requirements**: Latency, throughput, resource, or data-volume
  constraints are stated, with measurement planned for sensitive paths. PASS:
  hierarchy depth, query indexes, pagination/depth limits, and path timing are
  identified.
- **Linting And Formatting**: Required lint, type, format, and diagnostic checks
  are identified; any unavailable tooling is documented. PASS: strict TypeScript,
  lint, format, and diagnostics are required before completion.

## Project Structure

### Documentation (this feature)

```text
specs/001-hierarchical-storage-api/
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
├── server.ts
├── config/
│   └── database.ts
├── modules/
│   ├── space/
│   │   ├── space.controller.ts
│   │   ├── space.routes.ts
│   │   └── space.service.ts
│   ├── container/
│   │   ├── container.controller.ts
│   │   ├── container.routes.ts
│   │   └── container.service.ts
│   └── item/
│       ├── item.controller.ts
│       ├── item.routes.ts
│       └── item.service.ts
├── models/
│   └── node.model.ts
├── services/
│   └── hierarchy.service.ts
├── types/
│   ├── api.ts
│   ├── errors.ts
│   └── node.ts
└── utils/
    ├── async-handler.ts
    ├── errors.ts
    └── validation.ts

tests/
├── contract/
│   └── openapi.test.ts
├── integration/
│   ├── spaces.test.ts
│   ├── containers.test.ts
│   └── items.test.ts
└── unit/
    ├── hierarchy.service.test.ts
    └── node.model.test.ts
```

**Structure Decision**: Use a single backend project rooted at `src/`. Feature
modules own HTTP routing and request handling, while shared hierarchy rules live
in `src/services/hierarchy.service.ts` so Space, Container, and Item flows use
one validation path.

## Complexity Tracking

No constitution violations.

## Phase 0 Research

Research output is captured in [research.md](./research.md). Key decisions:

- Use a single Node collection for SPACE, CONTAINER, and ITEM.
- Use adjacency-list parent references with indexed `parentId` and `spaceId`.
- Keep hierarchy validation in the service layer, not in route controllers.
- Resolve Item paths by walking ancestors to the Space and returning ordered
  path segments.

## Phase 1 Design

Design artifacts:

- [data-model.md](./data-model.md)
- [contracts/openapi.yaml](./contracts/openapi.yaml)
- [quickstart.md](./quickstart.md)

Post-design Constitution Check:

- **Code Quality**: PASS. The design keeps domain rules in services and avoids
  controller-level hierarchy logic.
- **Testing Standards**: PASS. Unit, integration, and contract test coverage are
  mapped to the planned service and API boundaries.
- **UX Consistency**: PASS. Errors use stable codes and response shapes.
- **Performance Requirements**: PASS. Required indexes, depth controls, and path
  lookup expectations are documented.
- **Linting And Formatting**: PASS. Strict TypeScript, linting, formatting, and
  diagnostics are part of completion criteria.
