# Quickstart: Hierarchical Storage API

## Prerequisites

- Node.js LTS
- MongoDB available locally or through a connection string
- Package manager selected during project setup

## Environment

Create an environment file for local development:

```text
PORT=3000
MONGODB_URI=mongodb://localhost:27017/keeply
```

## Setup

Install runtime and development dependencies for Express.js, TypeScript,
Mongoose, testing, linting, and formatting.

Expected setup commands after package scripts exist:

```bash
npm install
npm run typecheck
npm run lint
npm run test
```

## Run Locally

Start MongoDB, then run the API in development mode:

```bash
npm run dev
```

The API should listen on `http://localhost:3000`.

Verify the health endpoint:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/health
```

Open the interactive API documentation at:

```text
http://localhost:3000/docs
```

The raw OpenAPI contract is also served at:

```text
http://localhost:3000/openapi.yaml
```

## MVP Structure Flow

Use these PowerShell commands to verify the Phase 3 Space and Container flow:

```powershell
$space = Invoke-RestMethod -Method Post -Uri http://localhost:3000/spaces `
  -ContentType "application/json" `
  -Body '{"name":"Garage"}'

$shelf = Invoke-RestMethod -Method Post -Uri http://localhost:3000/containers `
  -ContentType "application/json" `
  -Body (@{ name = "Shelf A"; parentId = $space.data.id } | ConvertTo-Json)

$bin = Invoke-RestMethod -Method Post -Uri http://localhost:3000/containers `
  -ContentType "application/json" `
  -Body (@{ name = "Bin 1"; parentId = $shelf.data.id } | ConvertTo-Json)

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/spaces/$($space.data.id)/tree"
```

The final response should return `Garage` with `Shelf A` as a child and `Bin 1`
as a nested child of `Shelf A`.

## Item Tracking Flow

Use these PowerShell commands after the MVP structure flow to verify Phase 4
Item tracking:

```powershell
$item = Invoke-RestMethod -Method Post -Uri http://localhost:3000/items `
  -ContentType "application/json" `
  -Body (@{
    name = "Extension Cord"
    parentId = $bin.data.id
    images = @(@{ url = "https://example.com/extension-cord.jpg"; altText = "Cord" })
  } | ConvertTo-Json -Depth 4)

Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/items/$($item.data.id)" `
  -ContentType "application/json" `
  -Body (@{ metadata = @{ outdoor = $true } } | ConvertTo-Json -Depth 3)

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/containers/$($shelf.data.id)/items"

Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/items/$($item.data.id)/move" `
  -ContentType "application/json" `
  -Body (@{ parentId = $space.data.id } | ConvertTo-Json)
```

The subtree item response should include `Extension Cord` before it is moved out
of `Shelf A`.

## Item Path Flow

Use these PowerShell commands after creating the MVP structure and Item to verify
Phase 5 path retrieval and circular move rejection:

```powershell
Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/items/$($item.data.id)/move" `
  -ContentType "application/json" `
  -Body (@{ parentId = $bin.data.id } | ConvertTo-Json)

Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/containers/$($bin.data.id)" `
  -ContentType "application/json" `
  -Body (@{ name = "Cable Bin" } | ConvertTo-Json)

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/items/$($item.data.id)/path"

Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/containers/$($shelf.data.id)/move" `
  -ContentType "application/json" `
  -Body (@{ parentId = $bin.data.id } | ConvertTo-Json)
```

The path response should include `Garage > Shelf A > Cable Bin > Extension Cord`.
The final move command should be rejected with `CIRCULAR_REFERENCE`.

## Manual Verification Flow

1. Create a Space named `Garage`.
2. Create a Container named `Shelf A` under `Garage`.
3. Create a Container named `Bin 1` under `Shelf A`.
4. Create an Item named `Extension Cord` under `Bin 1`.
5. Add two image references to `Garage`, `Bin 1`, and `Extension Cord`.
6. Rename `Bin 1` to `Cable Bin`.
7. Update the Item metadata with a basic note, such as `outdoor: true`.
8. Retrieve the Item path and verify it returns:

```text
Garage > Shelf A > Cable Bin > Extension Cord
```

9. Verify each Space, Container, and Item response includes its saved images.
10. Move the Item directly under `Garage`.
11. Retrieve the Item path and verify it returns:

```text
Garage > Extension Cord
```

12. Attempt to move `Shelf A` under `Cable Bin` and verify the API rejects the
    circular move with `CIRCULAR_REFERENCE`.

## Required Checks

Before implementation is considered complete, run:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
```

If any script is unavailable during early setup, create it before completing the
feature or document why it cannot run.
