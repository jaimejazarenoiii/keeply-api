# Feature Specification: User Authorization and Subscription Readiness

**Feature Branch**: `002-user-auth-subscriptions`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Create authorization for this, so there'd be user, prepare the data model for subscription already, so if subscription is needed model then do so, not sure if what approach. I'll be using revenue cat, saying it because it might matter in structure."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Access Personal Storage Data (Priority: P1)

A registered user accesses only their own Spaces, Containers, and Items so their
physical storage records remain private and separated from every other user.

**Why this priority**: User ownership is required before the storage API can be
used by more than one person without exposing private inventory data.

**Independent Test**: Create records for two different users, then verify each
user can list, retrieve, update, and remove only the records they own.

**Acceptance Scenarios**:

1. **Given** a signed-in user has no Spaces, **When** they create a Space, **Then**
   the Space is owned by that user.
2. **Given** two users each have Spaces, **When** one user lists Spaces, **Then**
   only that user's Spaces are returned.
3. **Given** one user owns a Container or Item, **When** another user attempts to
   retrieve or change it, **Then** access is denied without exposing the record's
   private details.

---

### User Story 2 - Preserve Ownership Across The Hierarchy (Priority: P2)

A user manages nested Containers and Items without accidentally mixing ownership
between users anywhere in the hierarchy.

**Why this priority**: The storage model is recursive, so authorization must hold
for parent-child relationships as well as individual records.

**Independent Test**: Create a hierarchy for one user, create a separate Space for
another user, then attempt cross-user moves and parent assignments and verify they
are rejected.

**Acceptance Scenarios**:

1. **Given** a user owns a Space, **When** they add Containers or Items under it,
   **Then** those records remain associated with the same user.
2. **Given** a Container belongs to one user, **When** another user attempts to
   add an Item to that Container, **Then** the operation is rejected.
3. **Given** two users have separate hierarchies, **When** either user attempts to
   move a Container or Item into the other user's hierarchy, **Then** the move is
   rejected.

---

### User Story 3 - Track Subscription Entitlement State (Priority: P3)

The system records each user's subscription customer identity, active entitlement
state, and purchase lifecycle status so paid capabilities can be enabled later
without redesigning user data.

**Why this priority**: Subscription readiness affects the user model and future
feature gating, but it should not delay the core authorization boundary.

**Independent Test**: Record subscription updates for a user, including active,
expired, and revoked states, then verify the user's current entitlement status is
available for future access decisions.

**Acceptance Scenarios**:

1. **Given** a user has no subscription record, **When** their account is
   inspected, **Then** the user is treated as having no active paid entitlement.
2. **Given** a subscription update marks a user's entitlement as active, **When**
   the user's entitlement status is checked, **Then** the active entitlement and
   relevant renewal or expiration timing are available.
3. **Given** a subscription update marks a purchase as expired, refunded, or
   revoked, **When** the user's entitlement status is checked, **Then** paid
   access is no longer reported as active.

---

### Edge Cases

- Requests without a valid user identity must be rejected before any private
  storage data is returned or changed.
- Attempts to access another user's missing or private record must not reveal
  whether that record exists.
- Creating or moving a child record under a parent owned by another user must be
  rejected.
- Ownership must remain consistent when retrieving full Item paths through nested
  Containers.
- Deleting or disabling a user account must prevent future access to that user's
  private storage data.
- Duplicate external customer identifiers must not be linked to multiple users.
- Out-of-order subscription updates must not downgrade a newer entitlement state
  using stale purchase information.
- Replayed subscription updates must be safe to process without creating duplicate
  active entitlements.
- Users without an active subscription must still have a well-defined access
  state rather than causing errors in storage workflows.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST represent a User as the owner of storage data.
- **FR-002**: System MUST require a valid user identity before allowing access to
  private storage operations.
- **FR-003**: System MUST associate every Space with exactly one owning User.
- **FR-004**: System MUST ensure Containers and Items are accessible only through
  a hierarchy owned by the requesting User.
- **FR-005**: System MUST prevent users from listing, retrieving, creating,
  updating, moving, or removing storage records outside their ownership boundary.
- **FR-006**: System MUST apply ownership checks consistently to Space,
  Container, Item, and full Item path workflows.
- **FR-007**: System MUST return clear authorization failures for private data
  access without exposing another user's record details.
- **FR-008**: System MUST maintain a subscription customer record that links a
  User to an external subscription customer identity.
- **FR-009**: System MUST maintain subscription entitlement state for each User,
  including whether paid access is active, inactive, expired, revoked, or unknown.
- **FR-010**: System MUST record subscription product or offering identifiers in a
  way that supports multiple future paid plans or entitlement types.
- **FR-011**: System MUST record purchase lifecycle updates needed to determine a
  user's current entitlement state, including activation, renewal, expiration,
  cancellation, refund, and revocation outcomes.
- **FR-012**: System MUST make the current entitlement state available to future
  features that require paid access.
- **FR-013**: System MUST treat users with no subscription record as having no
  active paid entitlement.
- **FR-014**: System MUST process repeated subscription updates without creating
  duplicate active entitlement records.
- **FR-015**: System MUST preserve enough subscription history to investigate
  disputed access, refunds, or support requests.
- **FR-016**: System MUST NOT require an active subscription for the existing
  storage workflows unless a specific workflow is later configured as paid-only.

### Quality Requirements

- **QR-001**: Code MUST follow project style, including two-space indentation
  where tooling permits and decoupled long lines or complex blocks.
- **QR-002**: Tests MUST cover primary behavior, important failure paths, and any
  API, data, or service boundary touched by this feature.
- **QR-003**: User-facing responses, validation messages, errors, names, and
  workflows MUST remain consistent with existing patterns.
- **QR-004**: Performance expectations MUST be measurable, including relevant
  latency, throughput, resource, or data-volume constraints.
- **QR-005**: Linting, formatting, type checks, and diagnostics MUST pass where
  repository tooling exists.

### Key Entities

- **User**: A person with an account who owns storage records and may have a
  subscription customer identity.
- **Owned Storage Record**: Any Space, Container, or Item that belongs to exactly
  one User and must remain inside that user's authorization boundary.
- **Subscription Customer**: The link between a User and the external billing or
  entitlement system's customer identity.
- **Subscription Product**: A purchasable plan, package, or offering that may
  grant one or more entitlements.
- **Subscription Entitlement**: The user's current paid access state for a named
  capability, including status and relevant effective dates.
- **Subscription Event**: A recorded purchase lifecycle update used to audit and
  recompute entitlement state when needed.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In authorization tests with at least two users, 100% of cross-user
  read and write attempts are denied.
- **SC-002**: 100% of newly created Spaces, Containers, and Items are associated
  with exactly one owning User.
- **SC-003**: Users can complete their existing storage create, list, update, and
  path retrieval workflows with authorization checks in place and no visible
  cross-user data leakage.
- **SC-004**: Subscription state checks return a clear active or inactive result
  for users with no subscription, active subscription, expired subscription, and
  revoked purchase scenarios.
- **SC-005**: Reprocessing the same subscription lifecycle update more than once
  leaves the user's final entitlement state unchanged.
- **SC-006**: Support staff can inspect subscription history for a user well
  enough to explain current paid access status for at least the latest 12 months.

## Assumptions

- Version 1 supports individual user ownership only; shared households, teams,
  delegated access, and organization-level permissions are out of scope.
- The current storage API remains available to signed-in users unless a later
  feature defines specific paid-only limits or capabilities.
- RevenueCat is the expected external subscription entitlement source, so the data
  model must preserve external customer, product, entitlement, and event
  identifiers while keeping internal access decisions tied to the local User.
- Subscription events may arrive more than once or out of chronological order.
- User account creation and sign-in will use the project's chosen authentication
  approach during planning; this spec focuses on ownership, authorization, and
  subscription readiness.
