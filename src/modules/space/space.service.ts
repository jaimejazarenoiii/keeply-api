import { Types } from "mongoose";
import type { NodeStore } from "../../models/node.store";
import { nodeStore } from "../../models/node.store";
import type { NodeRecord, TreeNode } from "../../types/node";
import { ApiError } from "../../utils/errors";
import {
  normalizeImages,
  optionalMetadata,
  parseTagsAndDescriptionForCreate,
  parseTagsAndDescriptionForUpdate,
  rejectQuantityForNonItem,
  requireNonEmptyString
} from "../../utils/validation";
import { hierarchyService } from "../../services/hierarchy.service";

export interface CreateSpaceInput {
  userId: string;
  name: unknown;
  metadata?: unknown;
  images?: unknown;
  tags?: unknown;
  description?: unknown;
  quantity?: unknown;
}

export interface UpdateSpaceInput {
  name?: unknown;
  metadata?: unknown;
  images?: unknown;
  tags?: unknown;
  description?: unknown;
  quantity?: unknown;
}

export class SpaceService {
  constructor(private readonly store: NodeStore = nodeStore) {}

  async createSpace(input: CreateSpaceInput): Promise<NodeRecord> {
    rejectQuantityForNonItem("SPACE", input.quantity);
    const id = new Types.ObjectId().toHexString();
    const nodeMetadata = parseTagsAndDescriptionForCreate(input);

    return this.store.create({
      _id: id,
      userId: input.userId,
      type: "SPACE",
      name: requireNonEmptyString(input.name, "name"),
      parentId: null,
      spaceId: id,
      images: normalizeImages(input.images),
      ...(optionalMetadata(input.metadata) ? { metadata: optionalMetadata(input.metadata) } : {}),
      ...nodeMetadata
    });
  }

  async listSpaces(userId: string): Promise<NodeRecord[]> {
    return this.store.findByType("SPACE", userId);
  }

  async getSpace(spaceId: string, userId: string): Promise<NodeRecord> {
    const space = await this.store.findById(spaceId, userId);

    if (!space || space.type !== "SPACE") {
      throw new ApiError(404, "NOT_FOUND", "Space not found");
    }

    return space;
  }

  async getSpaceTree(spaceId: string, userId: string): Promise<TreeNode> {
    const space = await this.getSpace(spaceId, userId);
    const descendants = await this.store.findChildrenBySpace(space._id, userId);

    return hierarchyService.buildTree(space, descendants);
  }

  async updateSpace(spaceId: string, userId: string, input: UpdateSpaceInput): Promise<NodeRecord> {
    await this.getSpace(spaceId, userId);
    rejectQuantityForNonItem("SPACE", input.quantity);

    const updates = this.buildSpaceUpdates(input);

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "At least one field must be provided");
    }

    const updated = await this.store.updateById(spaceId, userId, updates);

    if (!updated) {
      throw new ApiError(404, "NOT_FOUND", "Space not found");
    }

    return updated;
  }

  async deleteSpace(spaceId: string, userId: string): Promise<void> {
    await this.getSpace(spaceId, userId);

    if ((await this.store.countDescendants(spaceId, userId)) > 0) {
      throw new ApiError(400, "INVALID_MOVE", "Cannot delete a non-empty Space");
    }

    await this.store.deleteById(spaceId, userId);
  }

  private buildSpaceUpdates(input: UpdateSpaceInput) {
    const updates: Record<string, unknown> = {};

    if (input.name !== undefined) {
      updates.name = requireNonEmptyString(input.name, "name");
    }

    if (input.metadata !== undefined) {
      updates.metadata = optionalMetadata(input.metadata);
    }

    if (input.images !== undefined) {
      updates.images = normalizeImages(input.images);
    }

    const nodeMetadata = parseTagsAndDescriptionForUpdate(input);

    if (input.tags !== undefined) {
      updates.tags = nodeMetadata.tags?.length ? nodeMetadata.tags : undefined;
    }

    if (input.description !== undefined) {
      updates.description = nodeMetadata.description;
    }

    return updates;
  }
}

export const spaceService = new SpaceService();
