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
```

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

## Checks

Run the full local verification suite:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
```
