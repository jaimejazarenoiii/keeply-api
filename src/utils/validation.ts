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

export function normalizeImages(images: NodeImageInput[] | undefined): NodeImage[] {
  if (!images) {
    return [];
  }

  return images.map((image, index) => ({
    id: randomUUID(),
    url: requireNonEmptyString(image.url, "image.url"),
    ...(image.altText ? { altText: image.altText.trim() } : {}),
    sortOrder: image.sortOrder ?? index,
    createdAt: new Date()
  }));
}
