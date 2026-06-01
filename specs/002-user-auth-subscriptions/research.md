# Research: User Authorization and Subscription Readiness

## Decision: Use Asymmetric JWT Access Tokens

JWT access tokens will be signed with an asymmetric private key from environment
configuration and verified with the matching public key. Tokens include `sub`,
`email`, `name`, `iss`, `aud`, `iat`, and `exp`, with a short default lifetime.

**Rationale**: Asymmetric signing keeps verification separate from signing and
matches the user's request to generate a private key for JWTs. It also leaves a
clean path for future services to verify tokens using only the public key.

**Alternatives considered**:

- Shared-secret JWT signing: simpler, but the same secret signs and verifies
  tokens, which makes future service separation riskier.
- Server-side session cookies only: useful for browser apps, but less direct for
  mobile or API clients that need bearer tokens.

## Decision: Require Email, Password, And Name For Registration

Registration requires `email`, `password`, and `name`. `profileImageUrl` is
optional. Email is normalized and unique; password is stored only as a derived
hash; `name` is the display name used in profile responses.

**Rationale**: The app needs a stable login identifier, a local credential, and a
human-readable profile field. Profile image is useful but not necessary for core
storage workflows.

**Alternatives considered**:

- Name-only registration: insufficient for login, account recovery, and support.
- Phone-number registration: reasonable later, but adds SMS delivery and regional
  complexity.
- Required profile image: unnecessary friction for account creation.

## Decision: Use Opaque Refresh Tokens For Durable Sessions

Login and registration return a short-lived JWT access token and a longer-lived
opaque refresh token. Refresh tokens are stored hashed with session metadata and
can be rotated or revoked.

**Rationale**: Short access tokens reduce damage from leakage, while refresh
tokens allow the app to keep users signed in. Storing refresh-token hashes makes
logout and session revocation possible without storing bearer secrets directly.

**Alternatives considered**:

- Long-lived JWT only: simpler, but difficult to revoke after logout or account
  disablement.
- JWT refresh tokens: workable, but opaque tokens avoid putting session state in
  another bearer token.

## Decision: Use Node.js Crypto For Password Hashing

Use Node.js `crypto.scrypt` with a per-user salt and stored parameters for
password hashing.

**Rationale**: `scrypt` is available in Node.js LTS, avoids native build
dependencies, and supports a memory-hard password hashing strategy appropriate
for the current API size.

**Alternatives considered**:

- `bcrypt`: common and mature, but usually adds a native or extra dependency.
- Plain SHA hashing: rejected because it is not suitable for passwords.

## Decision: Add User Ownership To Existing Nodes

Every Space, Container, and Item stores `userId`. Node store reads and writes
accept the authenticated user id and scope queries by ownership.

**Rationale**: The current recursive Node collection remains a good fit.
Ownership belongs on the same record so list, parent validation, move, tree, and
path flows can enforce one user boundary consistently.

**Alternatives considered**:

- Separate ownership collection: adds joins/lookups for every storage operation.
- Ownership only on Space: reduces storage duplication but makes query filters
  and cross-user parent validation easier to miss.

## Decision: Prepare RevenueCat-Compatible Subscription Records

The data model stores a local user-to-customer link, product identifiers,
entitlement status, and immutable subscription lifecycle events. RevenueCat
webhook events are processed idempotently by external event id.

**Rationale**: RevenueCat's customer and entitlement concepts map cleanly to
local Users. Keeping raw event references plus normalized current state supports
future paid limits and support investigations.

**Alternatives considered**:

- Store only the latest subscription status on User: simple, but loses audit and
  replay protection.
- Build billing-provider-specific fields into storage records: unnecessary
  coupling before paid feature gates exist.

## Decision: Defer Non-Essential Account Features

Email verification, password reset, OAuth/social login, profile bio, teams,
sharing, and paid-only feature limits remain out of scope for this feature.

**Rationale**: The necessary account fields for this app are email, password,
name, optional profile image, account status, and subscription readiness. Adding
more profile or recovery flows now would delay the authorization boundary.

**Alternatives considered**:

- Include password reset and email verification now: desirable before broad
  launch, but not required to establish ownership and JWT protection.
- Include sharing or household accounts now: conflicts with the individual-user
  scope of the current spec.
