# Implementation Plan: User Authorization and Subscription Readiness

**Branch**: `002-user-auth-subscriptions` | **Date**: 2026-06-01 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from
`/specs/002-user-auth-subscriptions/spec.md`

## Summary

Add first-party user registration and JWT authorization to the existing Express
API so Spaces, Containers, and Items are owned by one authenticated user. Use
email/password registration with required `name`, required `email`, required
`password`, and optional `profileImageUrl`; sign short-lived JWT access tokens
with an asymmetric private key stored in environment configuration; validate
tokens through authentication middleware before storage routes. Prepare
subscription data with RevenueCat-compatible customer, entitlement, product, and
event records, but keep existing storage workflows available to signed-in users
until a later paid-gating feature defines limits.

## Technical Context

**Language/Version**: TypeScript in strict mode on Node.js LTS

**Primary Dependencies**: Express.js, Mongoose, dotenv, `jose` for asymmetric JWT
signing/verification, Node.js `crypto` for password hashing and refresh-token
generation, centralized validation and error middleware

**Storage**: MongoDB collections for users, auth sessions, subscription customers,
subscription entitlements, subscription products, subscription events, and
existing owned node records

**Testing**: Node.js test runner with unit tests for auth services and token
utilities, integration tests for registration/login/protected storage flows, and
contract checks against the OpenAPI documents

**Target Platform**: Backend HTTP API deployable to a Node.js server runtime

**Project Type**: Single backend API project

**Performance Goals**: Authenticated storage requests add no more than 50ms p95
over current route handling for token validation; registration and login complete
within 1 second p95 under normal database latency

**Constraints**: JWT private key and public key must be validated during app
startup; passwords must never be stored or returned in plaintext; token
validation must reject expired, malformed, wrong-issuer, and wrong-audience
tokens; storage routes must never query unscoped user data

**Scale/Scope**: MVP covers individual user accounts, register/login/me/refresh,
JWT-protected storage routes, user-owned nodes, and subscription readiness for
RevenueCat customer identity and entitlement events. Email verification, password
reset, OAuth/social login, teams, sharing, and paid feature limits are future
work.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Code Quality**: Design uses clear boundaries, two-space indentation where
  tooling permits, and decouples long lines or complex blocks. PASS: auth,
  subscription, and storage ownership concerns are separated into modules,
  services, middleware, models, and shared validation helpers.
- **Testing Standards**: Unit, integration, contract, or manual verification is
  defined for each behavior and failure path. PASS: token utility, password
  hashing, registration/login, protected route, ownership, and webhook event
  behavior all have planned verification.
- **UX Consistency**: API responses, errors, validation, names, and workflows
  follow existing user-facing patterns or document a justified change. PASS:
  responses keep `{ data }` and `{ error }` envelopes and extend the existing
  error-code style.
- **Performance Requirements**: Latency, throughput, resource, or data-volume
  constraints are stated, with measurement planned for sensitive paths. PASS:
  token validation latency, indexed ownership queries, and bounded subscription
  event processing are documented.
- **Linting And Formatting**: Required lint, type, format, and diagnostic checks
  are identified; any unavailable tooling is documented. PASS: strict TypeScript,
  lint, format, build, and test scripts remain required.

## Project Structure

### Documentation (this feature)

```text
specs/002-user-auth-subscriptions/
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
├── config/
│   └── env.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── models/
│   ├── auth-session.model.ts
│   ├── node.model.ts
│   ├── subscription.model.ts
│   └── user.model.ts
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.routes.ts
│   │   └── auth.service.ts
│   ├── container/
│   ├── item/
│   ├── space/
│   └── subscription/
│       ├── subscription.controller.ts
│       ├── subscription.routes.ts
│       └── subscription.service.ts
├── services/
│   └── hierarchy.service.ts
├── types/
│   ├── api.ts
│   ├── auth.ts
│   ├── errors.ts
│   ├── node.ts
│   └── subscription.ts
└── utils/
    ├── async-handler.ts
    ├── errors.ts
    ├── password.ts
    ├── tokens.ts
    └── validation.ts

tests/
├── contract/
│   ├── auth-openapi.test.ts
│   └── openapi.test.ts
├── integration/
│   ├── auth.test.ts
│   ├── auth-storage-ownership.test.ts
│   ├── subscriptions.test.ts
│   ├── containers.test.ts
│   ├── items.test.ts
│   └── spaces.test.ts
└── unit/
    ├── auth.service.test.ts
    ├── password.test.ts
    ├── subscription.service.test.ts
    └── tokens.test.ts
```

**Structure Decision**: Use the existing single backend API structure. Add
dedicated `auth` and `subscription` modules, keep token/password helpers in
`src/utils/`, and extend the existing node persistence boundary with user-scoped
queries instead of spreading ownership filtering through controllers.

## Complexity Tracking

No constitution violations.

## Phase 0 Research

Research output is captured in [research.md](./research.md). Key decisions:

- Use asymmetric JWT access tokens signed with a private key from environment
  configuration.
- Require `email`, `password`, and `name` for registration; keep
  `profileImageUrl` optional.
- Use opaque refresh tokens stored as hashes for longer app sessions and logout.
- Add `userId` ownership to storage nodes and enforce user-scoped node store
  methods.
- Prepare RevenueCat-compatible customer and entitlement records without making
  existing storage features paid-only.

## Phase 1 Design

Design artifacts:

- [data-model.md](./data-model.md)
- [contracts/openapi.yaml](./contracts/openapi.yaml)
- [quickstart.md](./quickstart.md)

Post-design Constitution Check:

- **Code Quality**: PASS. Auth, token, password, subscription, and ownership
  logic have clear service/model boundaries.
- **Testing Standards**: PASS. Unit, integration, and contract coverage are
  mapped to security-sensitive behavior and public API contracts.
- **UX Consistency**: PASS. New endpoints use the existing response envelope and
  stable API error pattern.
- **Performance Requirements**: PASS. Token verification, ownership indexes, and
  idempotent subscription event lookup are specified.
- **Linting And Formatting**: PASS. The existing `typecheck`, `lint`,
  `format:check`, and `test` scripts remain completion gates.
