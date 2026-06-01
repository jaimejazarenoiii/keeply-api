import { randomUUID } from "node:crypto";
import type { NodeImage } from "../types/node";
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
