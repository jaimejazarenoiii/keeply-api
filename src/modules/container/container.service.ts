import { Types } from "mongoose";
import type { NodeStore } from "../../models/node.store";
import { nodeStore } from "../../models/node.store";
import { hierarchyService } from "../../services/hierarchy.service";
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

export interface CreateContainerInput {
  userId: string;
  name: unknown;
  parentId: unknown;
  metadata?: unknown;
  images?: unknown;
  tags?: unknown;
  description?: unknown;
  quantity?: unknown;
}

export interface UpdateContainerInput {
  name?: unknown;
  metadata?: unknown;
  images?: unknown;
  tags?: unknown;
  description?: unknown;
  quantity?: unknown;
}

export interface MoveContainerInput {
  parentId: unknown;
}

export class ContainerService {
  constructor(private readonly store: NodeStore = nodeStore) {}

  async createContainer(input: CreateContainerInput): Promise<NodeRecord> {
    rejectQuantityForNonItem("CONTAINER", input.quantity);

    const parentId = requireNonEmptyString(input.parentId, "parentId");
    const parent = await this.store.findById(parentId, input.userId);

    if (!parent) {
      throw new ApiError(404, "NOT_FOUND", "Parent not found");
    }

    hierarchyService.validateParentType({
      childType: "CONTAINER",
      parent
    });
    hierarchyService.validateOwner(parent, input.userId);

    const metadata = optionalMetadata(input.metadata);
    const nodeMetadata = parseTagsAndDescriptionForCreate(input);

    return this.store.create({
      _id: new Types.ObjectId().toHexString(),
      userId: input.userId,
      type: "CONTAINER",
      name: requireNonEmptyString(input.name, "name"),
      parentId: parent._id,
      spaceId: hierarchyService.getParentSpaceId(parent),
      images: normalizeImages(input.images),
      ...(metadata ? { metadata } : {}),
      ...nodeMetadata
    });
  }

  async getContainer(containerId: string, userId: string): Promise<NodeRecord> {
    const container = await this.store.findById(containerId, userId);

    if (!container || container.type !== "CONTAINER") {
      throw new ApiError(404, "NOT_FOUND", "Container not found");
    }

    return container;
  }

  async getContainerTree(containerId: string, userId: string): Promise<TreeNode> {
    const container = await this.getContainer(containerId, userId);
    const descendants = await this.store.findChildrenBySpace(container.spaceId, userId);
    hierarchyService.validateOwnedDescendants(container, descendants);

    return hierarchyService.buildTree(container, descendants);
  }

  async listSubtreeItems(containerId: string, userId: string): Promise<NodeRecord[]> {
    const container = await this.getContainer(containerId, userId);
    const descendants = await this.store.findChildrenBySpace(container.spaceId, userId);
    hierarchyService.validateOwnedDescendants(container, descendants);
    const descendantIds = hierarchyService.getDescendantIds(container._id, descendants);

    return descendants.filter((node) => node.type === "ITEM" && descendantIds.has(node._id));
  }

  async updateContainer(
    containerId: string,
    userId: string,
    input: UpdateContainerInput
  ): Promise<NodeRecord> {
    await this.getContainer(containerId, userId);
    rejectQuantityForNonItem("CONTAINER", input.quantity);

    const updates = this.buildContainerUpdates(input);

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "At least one field must be provided");
    }

    const updated = await this.store.updateById(containerId, userId, updates);

    if (!updated || updated.type !== "CONTAINER") {
      throw new ApiError(404, "NOT_FOUND", "Container not found");
    }

    return updated;
  }

  async moveContainer(
    containerId: string,
    userId: string,
    input: MoveContainerInput
  ): Promise<NodeRecord> {
    const container = await this.getContainer(containerId, userId);
    const parentId = requireNonEmptyString(input.parentId, "parentId");
    const parent = await this.store.findById(parentId, userId);

    if (!parent) {
      throw new ApiError(404, "NOT_FOUND", "Parent not found");
    }

    const descendants = await this.store.findChildrenBySpace(container.spaceId, userId);

    hierarchyService.validateContainerMove(container, parent, descendants);

    const updated = await this.store.updateById(containerId, userId, {
      parentId: parent._id,
      spaceId: hierarchyService.getParentSpaceId(parent)
    });

    if (!updated || updated.type !== "CONTAINER") {
      throw new ApiError(404, "NOT_FOUND", "Container not found");
    }

    return updated;
  }

  async deleteContainer(containerId: string, userId: string): Promise<void> {
    await this.getContainer(containerId, userId);

    if ((await this.store.countChildren(containerId, userId)) > 0) {
      throw new ApiError(400, "INVALID_MOVE", "Cannot delete a non-empty Container");
    }

    await this.store.deleteById(containerId, userId);
  }

  private buildContainerUpdates(input: UpdateContainerInput) {
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

export const containerService = new ContainerService();
