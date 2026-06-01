import { Types } from "mongoose";
import type { NodeStore } from "../../models/node.store";
import { nodeStore } from "../../models/node.store";
import type { NodeRecord, TreeNode } from "../../types/node";
import { ApiError } from "../../utils/errors";
import { normalizeImages, optionalMetadata, requireNonEmptyString } from "../../utils/validation";
import { hierarchyService } from "../../services/hierarchy.service";

export interface CreateSpaceInput {
  name: unknown;
  metadata?: unknown;
  images?: unknown;
}

export interface UpdateSpaceInput {
  name?: unknown;
  metadata?: unknown;
  images?: unknown;
}

export class SpaceService {
  constructor(private readonly store: NodeStore = nodeStore) {}

  async createSpace(input: CreateSpaceInput): Promise<NodeRecord> {
    const id = new Types.ObjectId().toHexString();

    return this.store.create({
      _id: id,
      type: "SPACE",
      name: requireNonEmptyString(input.name, "name"),
      parentId: null,
      spaceId: id,
      images: normalizeImages(input.images),
      ...(optionalMetadata(input.metadata) ? { metadata: optionalMetadata(input.metadata) } : {})
    });
  }

  async listSpaces(): Promise<NodeRecord[]> {
    return this.store.findByType("SPACE");
  }

  async getSpace(spaceId: string): Promise<NodeRecord> {
    const space = await this.store.findById(spaceId);

    if (!space || space.type !== "SPACE") {
      throw new ApiError(404, "NOT_FOUND", "Space not found");
    }

    return space;
  }

  async getSpaceTree(spaceId: string): Promise<TreeNode> {
    const space = await this.getSpace(spaceId);
    const descendants = await this.store.findChildrenBySpace(space._id);

    return hierarchyService.buildTree(space, descendants);
  }

  async updateSpace(spaceId: string, input: UpdateSpaceInput): Promise<NodeRecord> {
    await this.getSpace(spaceId);

    const updates: Partial<Pick<NodeRecord, "name" | "metadata" | "images">> = {};

    if (input.name !== undefined) {
      updates.name = requireNonEmptyString(input.name, "name");
    }

    if (input.metadata !== undefined) {
      updates.metadata = optionalMetadata(input.metadata);
    }

    if (input.images !== undefined) {
      updates.images = normalizeImages(input.images);
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "At least one field must be provided");
    }

    const updated = await this.store.updateById(spaceId, updates);

    if (!updated) {
      throw new ApiError(404, "NOT_FOUND", "Space not found");
    }

    return updated;
  }

  async deleteSpace(spaceId: string): Promise<void> {
    await this.getSpace(spaceId);

    if ((await this.store.countDescendants(spaceId)) > 0) {
      throw new ApiError(400, "INVALID_MOVE", "Cannot delete a non-empty Space");
    }

    await this.store.deleteById(spaceId);
  }
}

export const spaceService = new SpaceService();
