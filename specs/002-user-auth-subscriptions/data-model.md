# Data Model: User Authorization and Subscription Readiness

## User

Account record for one person using Keeply.

### Fields

- `_id`: Stable MongoDB object identifier.
- `email`: Required normalized email address, unique across users.
- `name`: Required display name.
- `profileImageUrl`: Optional profile image URL.
- `passwordHash`: Derived password hash with algorithm parameters and salt.
- `status`: `ACTIVE`, `DISABLED`, or `DELETED`.
- `createdAt`: Creation timestamp.
- `updatedAt`: Last update timestamp.

### Validation Rules

- `email` is required, trimmed, lowercased, and unique.
- `passwordHash` is required and never returned by API responses.
- `name` is required and must be non-empty after trimming.
- `profileImageUrl`, when present, must be a non-empty URL string.
- Disabled or deleted users cannot receive new access tokens.

## Auth Session

Refresh-token session for a user and client login.

### Fields

- `_id`: Stable MongoDB object identifier.
- `userId`: Owning User identifier.
- `refreshTokenHash`: Hash of the current opaque refresh token.
- `userAgent`: Optional client user-agent string for support and audit.
- `ipAddress`: Optional originating IP address.
- `expiresAt`: Expiration timestamp.
- `revokedAt`: Optional revocation timestamp.
- `createdAt`: Creation timestamp.
- `updatedAt`: Last update timestamp.

### Validation Rules

- `userId` must reference an active User.
- `refreshTokenHash` is required and unique.
- Expired or revoked sessions cannot issue new JWT access tokens.
- Refresh token rotation replaces the stored hash.

## JWT Access Token

Short-lived bearer token returned by registration, login, and refresh.

### Claims

- `sub`: User identifier.
- `email`: User email.
- `name`: User display name.
- `iss`: Expected issuer from environment configuration.
- `aud`: Expected audience from environment configuration.
- `iat`: Issued-at timestamp.
- `exp`: Expiration timestamp.

### Validation Rules

- Token signature must verify with the configured public key.
- `iss`, `aud`, `exp`, and `sub` must be present and valid.
- Expired, malformed, wrong-issuer, and wrong-audience tokens are rejected.
- User referenced by `sub` must still exist and be active.

## Owned Node

Existing Space, Container, and Item records extended with ownership.

### Additional Field

- `userId`: Owning User identifier.

### Validation Rules

- Every new Space, Container, and Item must have `userId`.
- Node reads and writes must be scoped to the authenticated `userId`.
- Parent lookup and move validation must require the same `userId` on parent,
  child, and descendants.
- Cross-user parent assignment and moves are rejected.

### Indexes

- `{ userId: 1, type: 1 }` for listing a user's Spaces.
- `{ userId: 1, parentId: 1 }` for ownership-scoped child lookup.
- `{ userId: 1, spaceId: 1 }` for ownership-scoped tree and path workflows.
- `{ userId: 1, type: 1, spaceId: 1 }` for type filters within a user's Space.

## Subscription Customer

Link between a local User and the external subscription provider customer.

### Fields

- `_id`: Stable MongoDB object identifier.
- `userId`: Local User identifier.
- `provider`: Provider name, initially `REVENUECAT`.
- `externalCustomerId`: Provider customer/app user identifier.
- `createdAt`: Creation timestamp.
- `updatedAt`: Last update timestamp.

### Validation Rules

- `(provider, externalCustomerId)` must be unique.
- A User may have at most one active customer link per provider.
- Customer links must not be reassigned across users without an explicit support
  process.

## Subscription Product

Known product, package, or offering that may grant entitlements.

### Fields

- `_id`: Stable MongoDB object identifier.
- `provider`: Provider name, initially `REVENUECAT`.
- `externalProductId`: Provider product identifier.
- `entitlementKey`: Internal entitlement key this product grants.
- `displayName`: Optional support-facing product name.
- `createdAt`: Creation timestamp.
- `updatedAt`: Last update timestamp.

### Validation Rules

- `(provider, externalProductId)` must be unique.
- `entitlementKey` is required and stable.

## Subscription Entitlement

Current paid access state for a User.

### Fields

- `_id`: Stable MongoDB object identifier.
- `userId`: Local User identifier.
- `provider`: Provider name, initially `REVENUECAT`.
- `entitlementKey`: Internal entitlement or capability name.
- `status`: `ACTIVE`, `INACTIVE`, `EXPIRED`, `REVOKED`, or `UNKNOWN`.
- `externalProductId`: Optional latest provider product identifier.
- `originalTransactionId`: Optional provider transaction lineage identifier.
- `currentPeriodEndsAt`: Optional renewal or expiration timestamp.
- `lastEventAt`: Provider event timestamp used for ordering.
- `createdAt`: Creation timestamp.
- `updatedAt`: Last update timestamp.

### Validation Rules

- `(userId, provider, entitlementKey)` must be unique.
- Out-of-order events cannot overwrite a newer `lastEventAt`.
- Missing subscription records are interpreted as no active paid entitlement.

## Subscription Event

Immutable event record for subscription audit, replay protection, and support.

### Fields

- `_id`: Stable MongoDB object identifier.
- `provider`: Provider name, initially `REVENUECAT`.
- `externalEventId`: Provider event identifier or deterministic event key.
- `externalCustomerId`: Provider customer/app user identifier.
- `userId`: Local User identifier when resolved.
- `eventType`: Provider lifecycle event type.
- `externalProductId`: Optional provider product identifier.
- `entitlementKey`: Optional internal entitlement key.
- `occurredAt`: Provider event timestamp.
- `processedAt`: Processing timestamp.
- `payload`: Raw provider event payload for audit.

### Validation Rules

- `(provider, externalEventId)` must be unique.
- Replayed events return success without duplicating entitlement changes.
- Events with unknown customers are stored for investigation and do not grant
  access until linked to a local User.

## API Response Shapes

### Auth User DTO

```ts
interface AuthUserDto {
  id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
}
```

### Auth Token DTO

```ts
interface AuthTokenDto {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUserDto;
}
```

### Subscription Status DTO

```ts
interface SubscriptionStatusDto {
  entitlements: Array<{
    key: string;
    status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "REVOKED" | "UNKNOWN";
    currentPeriodEndsAt?: string;
  }>;
}
```
