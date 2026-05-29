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
