# Quickstart: Item Metadata and Dashboard API

## Prerequisites

- Node.js LTS
- MongoDB available locally or through a connection string
- Existing Keeply API setup from hierarchical storage and auth features

## Environment

Use the same local environment as the auth-enabled API:

```text
PORT=3000
MONGODB_URI=mongodb://localhost:27017/keeply
JWT_PRIVATE_KEY_B64=<base64-pem-private-key>
JWT_PUBLIC_KEY_B64=<base64-pem-public-key>
JWT_ISSUER=keeply-api
JWT_AUDIENCE=keeply-api
JWT_ACCESS_TOKEN_TTL_SECONDS=900
JWT_REFRESH_TOKEN_TTL_DAYS=30
```

## Setup

Run the standard checks after implementation:

```bash
npm run typecheck
npm run lint
npm run test
```

On Windows PowerShell, if Node runs out of memory during checks:

```powershell
$env:NODE_OPTIONS="--max-old-space-size=8192"
npm run test
```

## Run Locally

Start MongoDB, then run the API:

```bash
npm run dev
```

Open Swagger UI at:

```text
http://localhost:3000/docs
```

## Auth Setup

Register or log in to obtain a bearer token:

```powershell
$register = Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/register `
  -ContentType "application/json" `
  -Body (@{
    email = "dashboard@example.com"
    password = "Password123!"
    name = "Dashboard User"
  } | ConvertTo-Json)

$token = $register.data.accessToken
$headers = @{ Authorization = "Bearer $token" }
```

## Space And Container Metadata Flow

Create a Space and Container with tags and description:

```powershell
$space = Invoke-RestMethod -Method Post -Uri http://localhost:3000/spaces `
  -Headers $headers `
  -ContentType "application/json" `
  -Body (@{
    name = "Kitchen"
    tags = @("home", "indoor")
    description = "Main kitchen storage"
  } | ConvertTo-Json)

$container = Invoke-RestMethod -Method Post -Uri http://localhost:3000/containers `
  -Headers $headers `
  -ContentType "application/json" `
  -Body (@{
    name = "Pantry"
    parentId = $space.data.id
    tags = @("food", "dry-goods")
    description = "Upper shelf pantry"
  } | ConvertTo-Json)
```

Update Space metadata:

```powershell
Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/spaces/$($space.data.id)" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body (@{
    tags = @("home", "cooking")
    description = "Updated kitchen note"
  } | ConvertTo-Json)
```

Reject quantity on Space:

```powershell
try {
  Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/spaces/$($space.data.id)" `
    -Headers $headers `
    -ContentType "application/json" `
    -Body '{"quantity": 1}'
} catch {
  $_.ErrorDetails.Message
}
```

Expected: `VALIDATION_ERROR` for quantity on Space or Container.

## Item Metadata Flow

Using the Space and Container from above, create an Item with metadata fields:

```powershell
$item = Invoke-RestMethod -Method Post -Uri http://localhost:3000/items `
  -Headers $headers `
  -ContentType "application/json" `
  -Body (@{
    name = "AA Batteries"
    parentId = $container.data.id
    quantity = 12
    tags = @("battery", "electronics", " battery ")
    description = "Pantry backup pack"
  } | ConvertTo-Json)

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/items/$($item.data.id)" `
  -Headers $headers
```

Expected results:

- `quantity` is `12`
- `tags` are normalized to unique trimmed values such as `battery` and
  `electronics`
- `description` is returned as provided

Update metadata:

```powershell
Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/items/$($item.data.id)" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body (@{
    quantity = 8
    tags = @("battery", "spare")
    description = "Used four cells"
  } | ConvertTo-Json)
```

Validation checks:

```powershell
try {
  Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/items/$($item.data.id)" `
    -Headers $headers `
    -ContentType "application/json" `
    -Body '{"quantity": -1}'
} catch {
  $_.ErrorDetails.Message
}
```

Expected: `VALIDATION_ERROR` for negative quantity.

## Metadata Consistency Flow

Verify metadata appears across hierarchy surfaces:

```powershell
Invoke-RestMethod -Method Get `
  -Uri "http://localhost:3000/containers/$($container.data.id)/items" `
  -Headers $headers

Invoke-RestMethod -Method Get `
  -Uri "http://localhost:3000/spaces/$($space.data.id)/tree" `
  -Headers $headers

Invoke-RestMethod -Method Get `
  -Uri "http://localhost:3000/items/$($item.data.id)/path" `
  -Headers $headers
```

The Item should expose the same metadata in subtree lists, tree leaf nodes, and
the final Item path segment.

## Dashboard Flow

Seed a few records, then retrieve the dashboard:

```powershell
$dashboard = Invoke-RestMethod -Method Get -Uri http://localhost:3000/dashboard `
  -Headers $headers

$dashboard.data.counts
$dashboard.data.recent.spaces.Count
$dashboard.data.recent.containers.Count
$dashboard.data.recent.items.Count
```

Expected results:

- counts reflect only the authenticated user's records
- recent Spaces and Containers contain at most 5 entries each
- recent Items contain at most 10 entries
- recent Item records include metadata fields

Empty-user check:

```powershell
$emptyUser = Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/register `
  -ContentType "application/json" `
  -Body (@{
    email = "empty@example.com"
    password = "Password123!"
    name = "Empty User"
  } | ConvertTo-Json)

Invoke-RestMethod -Method Get -Uri http://localhost:3000/dashboard `
  -Headers @{ Authorization = "Bearer $($emptyUser.data.accessToken)" }
```

Expected:

- counts are all zero
- recent lists are empty arrays

Cross-user isolation check:

```powershell
$otherUser = Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/register `
  -ContentType "application/json" `
  -Body (@{
    email = "other@example.com"
    password = "Password123!"
    name = "Other User"
  } | ConvertTo-Json)

$otherDashboard = Invoke-RestMethod -Method Get -Uri http://localhost:3000/dashboard `
  -Headers @{ Authorization = "Bearer $($otherUser.data.accessToken)" }

$otherDashboard.data.counts
```

Expected: the other user's dashboard does not include the first user's Spaces,
Containers, Items, or counts.

## Contract Reference

Feature contract additions live at:

```text
specs/003-item-metadata-dashboard/contracts/openapi.yaml
```

During implementation, merge these additions into the served OpenAPI document
under `specs/001-hierarchical-storage-api/contracts/openapi.yaml` or the
project's canonical docs source so Swagger UI reflects the new fields and
dashboard route.
