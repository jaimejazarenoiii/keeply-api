import { Types } from "mongoose";
import type { NodeStore } from "../../models/node.store";
import { nodeStore } from "../../models/node.store";
import { hierarchyService } from "../../services/hierarchy.service";
import type { ItemPath, NodeRecord } from "../../types/node";
import { ApiError } from "../../utils/errors";
import { normalizeImages, optionalMetadata, requireNonEmptyString } from "../../utils/validation";

export interface CreateItemInput {
  name: unknown;
  parentId: unknown;
  metadata?: unknown;
  images?: unknown;
}

export interface UpdateItemInput {
  name?: unknown;
  metadata?: unknown;
  images?: unknown;
}

export interface MoveItemInput {
  parentId: unknown;
}

export class ItemService {
  constructor(private readonly store: NodeStore = nodeStore) {}

  async createItem(input: CreateItemInput): Promise<NodeRecord> {
    const parent = await this.getValidParent(input.parentId);
    const metadata = optionalMetadata(input.metadata);

    return this.store.create({
      _id: new Types.ObjectId().toHexString(),
      type: "ITEM",
      name: requireNonEmptyString(input.name, "name"),
      parentId: parent._id,
      spaceId: hierarchyService.getParentSpaceId(parent),
      images: normalizeImages(input.images),
      ...(metadata ? { metadata } : {})
    });
  }

  async getItem(itemId: string): Promise<NodeRecord> {
    const item = await this.store.findById(itemId);

    if (!item || item.type !== "ITEM") {
      throw new ApiError(404, "NOT_FOUND", "Item not found");
    }

    return item;
  }

  async updateItem(itemId: string, input: UpdateItemInput): Promise<NodeRecord> {
    await this.getItem(itemId);

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

    const updated = await this.store.updateById(itemId, updates);

    if (!updated || updated.type !== "ITEM") {
      throw new ApiError(404, "NOT_FOUND", "Item not found");
    }

    return updated;
  }

  async moveItem(itemId: string, input: MoveItemInput): Promise<NodeRecord> {
    await this.getItem(itemId);

    const parent = await this.getValidParent(input.parentId);
    const updated = await this.store.updateById(itemId, {
      parentId: parent._id,
      spaceId: hierarchyService.getParentSpaceId(parent)
    });

    if (!updated || updated.type !== "ITEM") {
      throw new ApiError(404, "NOT_FOUND", "Item not found");
    }

    return updated;
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.getItem(itemId);
    await this.store.deleteById(itemId);
  }

  async getItemPath(itemId: string): Promise<ItemPath> {
    const item = await this.getItem(itemId);
    const path = await hierarchyService.buildAncestorPath(item, (nodeId) =>
      this.store.findById(nodeId)
    );

    return {
      itemId: item._id,
      path
    };
  }

  private async getValidParent(parentIdInput: unknown): Promise<NodeRecord> {
    const parentId = requireNonEmptyString(parentIdInput, "parentId");
    const parent = await this.store.findById(parentId);

    if (!parent) {
      throw new ApiError(404, "NOT_FOUND", "Parent not found");
    }

    hierarchyService.validateParentType({
      childType: "ITEM",
      parent
    });

    return parent;
  }
}

export const itemService = new ItemService();
