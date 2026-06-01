# Keeply API

Backend API for hierarchical physical storage and item tracking.

## Prerequisites

- Node.js LTS
- MongoDB running locally or available through a connection string

## Setup

Create a local `.env` file:

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

Generate local JWT keys with Node.js:

```powershell
node -e "const { generateKeyPairSync } = require('node:crypto'); const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 }); console.log('JWT_PRIVATE_KEY_B64=' + Buffer.from(privateKey.export({ type: 'pkcs8', format: 'pem' })).toString('base64')); console.log('JWT_PUBLIC_KEY_B64=' + Buffer.from(publicKey.export({ type: 'spki', format: 'pem' })).toString('base64'));"
```

Keep generated keys in local environment configuration only. Do not commit
`.env` files or private keys.

Install dependencies:

```bash
npm install
```

Run the API in development mode:

```bash
npm run dev
```

The API listens on `http://localhost:3000`.

## API Docs

Open Swagger UI at:

```text
http://localhost:3000/docs
```

The raw OpenAPI contract is served at:

```text
http://localhost:3000/openapi.yaml
```

## Authentication

Register or log in to receive an access token and refresh token:

```powershell
$auth = Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/register `
  -ContentType "application/json" `
  -Body (@{
    email = "cj@example.com"
    password = "correct-horse-battery-staple"
    name = "CJ"
  } | ConvertTo-Json)

$accessToken = $auth.data.accessToken
```

Use the access token on protected storage and subscription routes:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/spaces `
  -Headers @{ Authorization = "Bearer $accessToken" }
```

Refresh tokens are rotated by `POST /auth/refresh` and revoked by
`POST /auth/logout`.

## Subscriptions

Subscription state is RevenueCat-ready. Configure RevenueCat to send server
events to:

```text
POST /subscriptions/revenuecat/webhook
```

The webhook must include the shared authorization value configured in
`REVENUECAT_WEBHOOK_AUTH_TOKEN`. Authenticated clients can inspect their current
state with:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/subscription/status `
  -Headers @{ Authorization = "Bearer $accessToken" }
```

## Checks

Run the full local verification suite:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
```
