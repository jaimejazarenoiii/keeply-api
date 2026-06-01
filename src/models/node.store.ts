import { NodeModel } from "./node.model";
import type { NodeRecord, NodeType } from "../types/node";

export type CreateNodeInput = Omit<NodeRecord, "createdAt" | "updatedAt">;

export interface NodeStore {
  create(input: CreateNodeInput): Promise<NodeRecord>;
  findById(id: string): Promise<NodeRecord | null>;
  findByType(type: NodeType): Promise<NodeRecord[]>;
  findChildrenBySpace(spaceId: string): Promise<NodeRecord[]>;
  updateById(
    id: string,
    updates: Partial<Pick<NodeRecord, "name" | "parentId" | "spaceId" | "metadata" | "images">>
  ): Promise<NodeRecord | null>;
  deleteById(id: string): Promise<boolean>;
  countChildren(parentId: string): Promise<number>;
  countDescendants(spaceId: string): Promise<number>;
}

function normalizeNodeRecord(node: unknown): NodeRecord {
  const raw = node as NodeRecord & {
    _id: { toString(): string };
    createdAt?: Date;
    updatedAt?: Date;
  };

  return {
    ...raw,
    _id: raw._id.toString(),
    createdAt: raw.createdAt ?? new Date(),
    updatedAt: raw.updatedAt ?? new Date()
  };
}

export class MongooseNodeStore implements NodeStore {
  async create(input: CreateNodeInput): Promise<NodeRecord> {
    const node = await NodeModel.create(input);

    return normalizeNodeRecord(node.toObject());
  }

  async findById(id: string): Promise<NodeRecord | null> {
    const node = await NodeModel.findById(id).lean();

    return node ? normalizeNodeRecord(node) : null;
  }

  async findByType(type: NodeType): Promise<NodeRecord[]> {
    const nodes = await NodeModel.find({ type }).sort({ createdAt: 1 }).lean();

    return nodes.map(normalizeNodeRecord);
  }

  async findChildrenBySpace(spaceId: string): Promise<NodeRecord[]> {
    const nodes = await NodeModel.find({
      spaceId,
      type: { $ne: "SPACE" }
    })
      .sort({ createdAt: 1 })
      .lean();

    return nodes.map(normalizeNodeRecord);
  }

  async updateById(
    id: string,
    updates: Partial<Pick<NodeRecord, "name" | "parentId" | "spaceId" | "metadata" | "images">>
  ): Promise<NodeRecord | null> {
    const node = await NodeModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).lean();

    return node ? normalizeNodeRecord(node) : null;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await NodeModel.deleteOne({ _id: id });

    return result.deletedCount === 1;
  }

  async countChildren(parentId: string): Promise<number> {
    return NodeModel.countDocuments({ parentId });
  }

  async countDescendants(spaceId: string): Promise<number> {
    return NodeModel.countDocuments({ spaceId, type: { $ne: "SPACE" } });
  }
}

export const nodeStore = new MongooseNodeStore();
