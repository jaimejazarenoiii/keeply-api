# Quickstart: User Authorization and Subscription Readiness

## Prerequisites

- Node.js LTS
- MongoDB available locally or through a connection string
- Existing Keeply API setup from the hierarchical storage feature

## Environment

Create or update the local environment file:

```text
PORT=3000
MONGODB_URI=mongodb://localhost:27017/keeply
JWT_PRIVATE_KEY_B64=<base64-pem-private-key>
JWT_PUBLIC_KEY_B64=<base64-pem-public-key>
JWT_ISSUER=keeply-api
JWT_AUDIENCE=keeply-api
JWT_ACCESS_TOKEN_TTL_SECONDS=900
JWT_REFRESH_TOKEN_TTL_DAYS=30
REVENUECAT_WEBHOOK_AUTH_TOKEN=<local-shared-webhook-token>
```

Generate a local RS256 key pair with Node.js and print base64 values suitable for
`.env`:

```powershell
node -e "const { generateKeyPairSync } = require('node:crypto'); const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 }); console.log('JWT_PRIVATE_KEY_B64=' + Buffer.from(privateKey.export({ type: 'pkcs8', format: 'pem' })).toString('base64')); console.log('JWT_PUBLIC_KEY_B64=' + Buffer.from(publicKey.export({ type: 'spki', format: 'pem' })).toString('base64'));"
```

The implementation must validate these variables at startup and fail fast if the
keys are missing, invalid, or mismatched.

## Key Rotation Notes

JWT keys are configured through environment variables so operational rotation can
be done without schema changes:

1. Generate a new key pair.
2. Deploy the new public key anywhere tokens are verified.
3. Deploy the matching private key to the API.
4. Keep access token TTL short enough that old access tokens age out quickly.

The current implementation signs and verifies with one active key pair. If
overlapping old and new access tokens must both remain valid in production, add a
key identifier (`kid`) and a public-key set before rotating.

## Webhook Secret Notes

`REVENUECAT_WEBHOOK_AUTH_TOKEN` is a shared secret for RevenueCat webhook
requests. Keep it out of source control, rotate it if it is exposed, and update
RevenueCat and the API environment together. Local tests should use a throwaway
value only.

## Setup

Expected dependency update during implementation:

```bash
npm install jose
```

Then run the standard checks:

```bash
npm run typecheck
npm run lint
npm run test
```

## Run Locally

Start MongoDB, then run the API:

```bash
npm run dev
```

The API should listen on `http://localhost:3000`.

## Registration Flow

Register a user with required `email`, `password`, and `name`. `profileImageUrl`
is optional.

```powershell
$auth = Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/register `
  -ContentType "application/json" `
  -Body (@{
    email = "cj@example.com"
    password = "correct-horse-battery-staple"
    name = "CJ"
    profileImageUrl = "https://example.com/profile.jpg"
  } | ConvertTo-Json)

$accessToken = $auth.data.accessToken
$refreshToken = $auth.data.refreshToken
```

Expected result:

- Response status is `201`.
- Response includes `accessToken`, `refreshToken`, `tokenType: "Bearer"`,
  `expiresIn`, and `user`.
- Response does not include `passwordHash`.

## Login And Profile Flow

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/login `
  -ContentType "application/json" `
  -Body (@{
    email = "cj@example.com"
    password = "correct-horse-battery-staple"
  } | ConvertTo-Json)

$accessToken = $login.data.accessToken

Invoke-RestMethod -Method Get -Uri http://localhost:3000/auth/me `
  -Headers @{ Authorization = "Bearer $accessToken" }
```

Expected result:

- Valid credentials return status `200`.
- Invalid credentials return `401` with the existing `{ error }` response shape.
- `/auth/me` returns the authenticated user's id, email, name, and optional
  profile image URL.

## Protected Storage Flow

All storage requests require the bearer token.

```powershell
$space = Invoke-RestMethod -Method Post -Uri http://localhost:3000/spaces `
  -Headers @{ Authorization = "Bearer $accessToken" } `
  -ContentType "application/json" `
  -Body '{"name":"Garage"}'

Invoke-RestMethod -Method Get -Uri http://localhost:3000/spaces `
  -Headers @{ Authorization = "Bearer $accessToken" }
```

Expected result:

- The created Space is owned by the authenticated user.
- Listing Spaces returns only that user's Spaces.
- The same flow with another user's token cannot retrieve, update, move, or
  delete this user's Space, Containers, Items, or Item paths.

## Refresh And Logout Flow

```powershell
$refreshed = Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/refresh `
  -ContentType "application/json" `
  -Body (@{ refreshToken = $refreshToken } | ConvertTo-Json)

Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/logout `
  -ContentType "application/json" `
  -Body (@{ refreshToken = $refreshed.data.refreshToken } | ConvertTo-Json)
```

Expected result:

- Refresh returns a new access token and rotated refresh token.
- Logout revokes the refresh token.
- Reusing a revoked refresh token returns `401`.

## Subscription Status Flow

Users without subscription events should still receive a clear inactive state.

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/subscription/status `
  -Headers @{ Authorization = "Bearer $accessToken" }
```

Expected result:

- Response status is `200`.
- Response includes an `entitlements` array.
- No subscription record is interpreted as no active paid entitlement.

## RevenueCat Webhook Flow

During implementation, configure RevenueCat to send webhooks to:

```text
POST /subscriptions/revenuecat/webhook
```

The request must include the shared webhook authorization value configured in
`REVENUECAT_WEBHOOK_AUTH_TOKEN`.

Expected result:

- Valid events are accepted with status `202`.
- Replayed events are accepted or ignored idempotently.
- Expired, refunded, or revoked events update the current entitlement to inactive
  or revoked.

## Required Checks

Before implementation is considered complete, run:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
```
