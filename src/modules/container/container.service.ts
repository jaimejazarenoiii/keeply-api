import { Types } from "mongoose";
import type { NodeStore } from "../../models/node.store";
import { nodeStore } from "../../models/node.store";
import { hierarchyService } from "../../services/hierarchy.service";
import type { NodeRecord, TreeNode } from "../../types/node";
import { ApiError } from "../../utils/errors";
import { normalizeImages, optionalMetadata, requireNonEmptyString } from "../../utils/validation";

export interface CreateContainerInput {
  name: unknown;
  parentId: unknown;
  metadata?: unknown;
  images?: unknown;
}

export interface UpdateContainerInput {
  name?: unknown;
  metadata?: unknown;
  images?: unknown;
}

export interface MoveContainerInput {
  parentId: unknown;
}

export class ContainerService {
  constructor(private readonly store: NodeStore = nodeStore) {}

  async createContainer(input: CreateContainerInput): Promise<NodeRecord> {
    const parentId = requireNonEmptyString(input.parentId, "parentId");
    const parent = await this.store.findById(parentId);

    if (!parent) {
      throw new ApiError(404, "NOT_FOUND", "Parent not found");
    }

    hierarchyService.validateParentType({
      childType: "CONTAINER",
      parent
    });

    const metadata = optionalMetadata(input.metadata);

    return this.store.create({
      _id: new Types.ObjectId().toHexString(),
      type: "CONTAINER",
      name: requireNonEmptyString(input.name, "name"),
      parentId: parent._id,
      spaceId: hierarchyService.getParentSpaceId(parent),
      images: normalizeImages(input.images),
      ...(metadata ? { metadata } : {})
    });
  }

  async getContainer(containerId: string): Promise<NodeRecord> {
    const container = await this.store.findById(containerId);

    if (!container || container.type !== "CONTAINER") {
      throw new ApiError(404, "NOT_FOUND", "Container not found");
    }

    return container;
  }

  async getContainerTree(containerId: string): Promise<TreeNode> {
    const container = await this.getContainer(containerId);
    const descendants = await this.store.findChildrenBySpace(container.spaceId);

    return hierarchyService.buildTree(container, descendants);
  }

  async listSubtreeItems(containerId: string): Promise<NodeRecord[]> {
    const container = await this.getContainer(containerId);
    const descendants = await this.store.findChildrenBySpace(container.spaceId);
    const descendantIds = hierarchyService.getDescendantIds(container._id, descendants);

    return descendants.filter((node) => node.type === "ITEM" && descendantIds.has(node._id));
  }

  async updateContainer(containerId: string, input: UpdateContainerInput): Promise<NodeRecord> {
    await this.getContainer(containerId);

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

    const updated = await this.store.updateById(containerId, updates);

    if (!updated || updated.type !== "CONTAINER") {
      throw new ApiError(404, "NOT_FOUND", "Container not found");
    }

    return updated;
  }

  async moveContainer(containerId: string, input: MoveContainerInput): Promise<NodeRecord> {
    const container = await this.getContainer(containerId);
    const parentId = requireNonEmptyString(input.parentId, "parentId");
    const parent = await this.store.findById(parentId);

    if (!parent) {
      throw new ApiError(404, "NOT_FOUND", "Parent not found");
    }

    const descendants = await this.store.findChildrenBySpace(container.spaceId);

    hierarchyService.validateContainerMove(container, parent, descendants);

    const updated = await this.store.updateById(containerId, {
      parentId: parent._id,
      spaceId: hierarchyService.getParentSpaceId(parent)
    });

    if (!updated || updated.type !== "CONTAINER") {
      throw new ApiError(404, "NOT_FOUND", "Container not found");
    }

    return updated;
  }
}

export const containerService = new ContainerService();
