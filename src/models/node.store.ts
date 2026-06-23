import { NodeModel } from "./node.model";
import type { NodeRecord, NodeType } from "../types/node";
import { buildMongooseSearchFilter } from "../utils/node-search";
import type { NodeSearchCriteria } from "../utils/node-search";

export type CreateNodeInput = Omit<NodeRecord, "createdAt" | "updatedAt">;

export type NodeUpdateFields = Partial<
  Pick<
    NodeRecord,
    "name" | "parentId" | "spaceId" | "metadata" | "images" | "tags" | "description" | "quantity"
  >
>;

export interface NodeStore {
  create(input: CreateNodeInput): Promise<NodeRecord>;
  findById(id: string, userId: string): Promise<NodeRecord | null>;
  findByType(type: NodeType, userId: string): Promise<NodeRecord[]>;
  findChildrenBySpace(spaceId: string, userId: string): Promise<NodeRecord[]>;
  updateById(id: string, userId: string, updates: NodeUpdateFields): Promise<NodeRecord | null>;
  deleteById(id: string, userId: string): Promise<boolean>;
  countChildren(parentId: string, userId: string): Promise<number>;
  countDescendants(spaceId: string, userId: string): Promise<number>;
  countByType(type: NodeType, userId: string): Promise<number>;
  findRecentByType(type: NodeType, userId: string, limit: number): Promise<NodeRecord[]>;
  searchNodes(userId: string, criteria: NodeSearchCriteria): Promise<NodeRecord[]>;
}

export type { NodeSearchCriteria };

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

function buildUpdateQuery(updates: NodeUpdateFields): Record<string, unknown> {
  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};

  for (const [field, value] of Object.entries(updates)) {
    if (value === undefined) {
      unset[field] = 1;
      continue;
    }

    set[field] = value;
  }

  const query: Record<string, unknown> = {};

  if (Object.keys(set).length > 0) {
    query.$set = set;
  }

  if (Object.keys(unset).length > 0) {
    query.$unset = unset;
  }

  return query;
}

export class MongooseNodeStore implements NodeStore {
  async create(input: CreateNodeInput): Promise<NodeRecord> {
    const node = await NodeModel.create(input);

    return normalizeNodeRecord(node.toObject());
  }

  async findById(id: string, userId: string): Promise<NodeRecord | null> {
    const node = await NodeModel.findOne({ _id: id, userId }).lean();

    return node ? normalizeNodeRecord(node) : null;
  }

  async findByType(type: NodeType, userId: string): Promise<NodeRecord[]> {
    const nodes = await NodeModel.find({ type, userId }).sort({ createdAt: 1 }).lean();

    return nodes.map(normalizeNodeRecord);
  }

  async findChildrenBySpace(spaceId: string, userId: string): Promise<NodeRecord[]> {
    const nodes = await NodeModel.find({
      spaceId,
      userId,
      type: { $ne: "SPACE" }
    })
      .sort({ createdAt: 1 })
      .lean();

    return nodes.map(normalizeNodeRecord);
  }

  async updateById(
    id: string,
    userId: string,
    updates: NodeUpdateFields
  ): Promise<NodeRecord | null> {
    const updateQuery = buildUpdateQuery(updates);
    const node = await NodeModel.findOneAndUpdate({ _id: id, userId }, updateQuery, {
      new: true,
      runValidators: true
    }).lean();

    return node ? normalizeNodeRecord(node) : null;
  }

  async deleteById(id: string, userId: string): Promise<boolean> {
    const result = await NodeModel.deleteOne({ _id: id, userId });

    return result.deletedCount === 1;
  }

  async countChildren(parentId: string, userId: string): Promise<number> {
    return NodeModel.countDocuments({ parentId, userId });
  }

  async countDescendants(spaceId: string, userId: string): Promise<number> {
    return NodeModel.countDocuments({ spaceId, userId, type: { $ne: "SPACE" } });
  }

  async countByType(type: NodeType, userId: string): Promise<number> {
    return NodeModel.countDocuments({ type, userId });
  }

  async findRecentByType(type: NodeType, userId: string, limit: number): Promise<NodeRecord[]> {
    const nodes = await NodeModel.find({ type, userId })
      .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    return nodes.map(normalizeNodeRecord);
  }

  async searchNodes(userId: string, criteria: NodeSearchCriteria): Promise<NodeRecord[]> {
    const nodes = await NodeModel.find(buildMongooseSearchFilter(userId, criteria))
      .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
      .limit(criteria.limit)
      .lean();

    return nodes.map(normalizeNodeRecord);
  }
}

export const nodeStore = new MongooseNodeStore();
