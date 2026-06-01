import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { JsonObject } from "swagger-ui-express";
import { parse } from "yaml";

export const openApiPath = resolve(
  process.cwd(),
  "specs/001-hierarchical-storage-api/contracts/openapi.yaml"
);

export function readOpenApiYaml(): string {
  return readFileSync(openApiPath, "utf8");
}

export function readOpenApiDocument(): JsonObject {
  return parse(readOpenApiYaml()) as JsonObject;
}
