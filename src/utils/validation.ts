import { randomUUID } from "node:crypto";
import type { AuthenticatedUser } from "../types/auth";
import type { NodeImage, NodeType } from "../types/node";
import { ApiError } from "./errors";

export interface NodeImageInput {
  url: string;
  altText?: string;
  sortOrder?: number;
}

export function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be a non-empty string`);
  }

  return value.trim();
}

export function requireObjectBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  return value as Record<string, unknown>;
}

export function requireAuthenticatedUser(user: AuthenticatedUser | undefined): AuthenticatedUser {
  if (!user) {
    throw new ApiError(401, "AUTHENTICATION_REQUIRED", "Authentication is required");
  }

  return user;
}

export function optionalMetadata(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", "metadata must be an object");
  }

  return value as Record<string, unknown>;
}

export function normalizeImages(images: unknown): NodeImage[] {
  if (!images) {
    return [];
  }

  if (!Array.isArray(images)) {
    throw new ApiError(400, "VALIDATION_ERROR", "images must be an array");
  }

  return images.map((image, index) => ({
    id: randomUUID(),
    url: requireNonEmptyString((image as NodeImageInput).url, "image.url"),
    ...((image as NodeImageInput).altText
      ? { altText: (image as NodeImageInput).altText?.trim() }
      : {}),
    sortOrder: (image as NodeImageInput).sortOrder ?? index,
    createdAt: new Date()
  }));
}

export function normalizeTags(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", "tags must be an array");
  }

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      throw new ApiError(400, "VALIDATION_ERROR", "tags must be an array of strings");
    }

    const trimmed = entry.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const key = trimmed.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    tags.push(trimmed);
  }

  return tags;
}

export function optionalDescription(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, "VALIDATION_ERROR", "description must be a string");
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export function optionalQuantity(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", "quantity must be an integer");
  }

  if (value < 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "quantity must be greater than or equal to 0");
  }

  return value;
}

export function rejectQuantityForNonItem(nodeType: NodeType, quantity: unknown): void {
  if (quantity !== undefined && nodeType !== "ITEM") {
    throw new ApiError(400, "VALIDATION_ERROR", "quantity is only allowed on Items");
  }
}

export interface NodeMetadataInput {
  tags?: unknown;
  description?: unknown;
  quantity?: unknown;
}

export function parseTagsAndDescriptionForCreate(input: NodeMetadataInput): {
  tags?: string[];
  description?: string;
} {
  const result: { tags?: string[]; description?: string } = {};
  const tags = normalizeTags(input.tags);

  if (tags !== undefined && tags.length > 0) {
    result.tags = tags;
  }

  const description = optionalDescription(input.description);

  if (description) {
    result.description = description;
  }

  return result;
}

export function parseTagsAndDescriptionForUpdate(input: NodeMetadataInput): {
  tags?: string[] | undefined;
  description?: string | undefined;
} {
  const result: { tags?: string[] | undefined; description?: string | undefined } = {};

  if (input.tags !== undefined) {
    result.tags = normalizeTags(input.tags) ?? [];
  }

  if (input.description !== undefined) {
    result.description = optionalDescription(input.description);
  }

  return result;
}

const SEARCH_LIMIT_DEFAULT = 50;
const SEARCH_LIMIT_MAX = 100;

export interface SearchNodesQueryInput {
  q?: unknown;
  type?: unknown;
  limit?: unknown;
}

export interface ParsedSearchNodesQuery {
  query: string;
  types?: NodeType[];
  limit: number;
}

function requireQueryString(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "q must be a non-empty string");
  }

  return value.trim();
}

function parseQueryNodeTypes(value: unknown): NodeType[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  const entries = Array.isArray(value) ? value : [value];
  const types: NodeType[] = [];
  const seen = new Set<NodeType>();

  for (const entry of entries) {
    if (typeof entry !== "string") {
      throw new ApiError(400, "VALIDATION_ERROR", "type must be SPACE, CONTAINER, or ITEM");
    }

    for (const part of entry.split(",")) {
      const normalized = part.trim().toUpperCase();

      if (normalized !== "SPACE" && normalized !== "CONTAINER" && normalized !== "ITEM") {
        throw new ApiError(400, "VALIDATION_ERROR", "type must be SPACE, CONTAINER, or ITEM");
      }

      const nodeType = normalized as NodeType;

      if (seen.has(nodeType)) {
        continue;
      }

      seen.add(nodeType);
      types.push(nodeType);
    }
  }

  return types.length > 0 ? types : undefined;
}

function parseSearchLimit(value: unknown): number {
  if (value === undefined) {
    return SEARCH_LIMIT_DEFAULT;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ApiError(400, "VALIDATION_ERROR", "limit must be a positive integer");
  }

  return Math.min(parsed, SEARCH_LIMIT_MAX);
}

export function parseSearchNodesQuery(query: SearchNodesQueryInput): ParsedSearchNodesQuery {
  const searchQuery = requireQueryString(query.q);
  const types = parseQueryNodeTypes(query.type);
  const limit = parseSearchLimit(query.limit);

  return {
    query: searchQuery,
    ...(types ? { types } : {}),
    limit
  };
}
