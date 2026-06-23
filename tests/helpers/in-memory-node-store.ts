import type { CreateNodeInput, NodeStore, NodeUpdateFields } from "../../src/models/node.store";
import type { NodeSearchCriteria } from "../../src/utils/node-search";
import { nodeMatchesSearch, sortNodesByRecency } from "../../src/utils/node-search";
import type { NodeRecord, NodeType } from "../../src/types/node";

export class InMemoryNodeStore implements NodeStore {
  private readonly nodes = new Map<string, NodeRecord>();

  async create(input: CreateNodeInput): Promise<NodeRecord> {
    const now = new Date();
    const node: NodeRecord = {
      ...input,
      createdAt: now,
      updatedAt: now
    };

    this.nodes.set(node._id, node);

    return node;
  }

  async findById(id: string, userId: string): Promise<NodeRecord | null> {
    const node = this.nodes.get(id);

    return node?.userId === userId ? node : null;
  }

  async findByType(type: NodeType, userId: string): Promise<NodeRecord[]> {
    return [...this.nodes.values()].filter((node) => node.type === type && node.userId === userId);
  }

  async findChildrenBySpace(spaceId: string, userId: string): Promise<NodeRecord[]> {
    return [...this.nodes.values()].filter(
      (node) => node.spaceId === spaceId && node.userId === userId && node.type !== "SPACE"
    );
  }

  async updateById(
    id: string,
    userId: string,
    updates: NodeUpdateFields
  ): Promise<NodeRecord | null> {
    const node = this.nodes.get(id);

    if (!node || node.userId !== userId) {
      return null;
    }

    const updated: NodeRecord = {
      ...node,
      updatedAt: new Date()
    };

    for (const [field, value] of Object.entries(updates) as Array<
      [keyof NodeUpdateFields, NodeUpdateFields[keyof NodeUpdateFields]]
    >) {
      if (value === undefined) {
        delete updated[field];
        continue;
      }

      updated[field] = value as never;
    }

    this.nodes.set(id, updated);

    return updated;
  }

  async deleteById(id: string, userId: string): Promise<boolean> {
    const node = this.nodes.get(id);

    if (!node || node.userId !== userId) {
      return false;
    }

    return this.nodes.delete(id);
  }

  async countChildren(parentId: string, userId: string): Promise<number> {
    return [...this.nodes.values()].filter(
      (node) => node.parentId === parentId && node.userId === userId
    ).length;
  }

  async countDescendants(spaceId: string, userId: string): Promise<number> {
    return [...this.nodes.values()].filter(
      (node) => node.spaceId === spaceId && node.userId === userId && node.type !== "SPACE"
    ).length;
  }

  async countByType(type: NodeType, userId: string): Promise<number> {
    return [...this.nodes.values()].filter((node) => node.type === type && node.userId === userId)
      .length;
  }

  async findRecentByType(type: NodeType, userId: string, limit: number): Promise<NodeRecord[]> {
    return [...this.nodes.values()]
      .filter((node) => node.type === type && node.userId === userId)
      .sort((left, right) => {
        const updatedDiff = right.updatedAt.getTime() - left.updatedAt.getTime();

        if (updatedDiff !== 0) {
          return updatedDiff;
        }

        const createdDiff = right.createdAt.getTime() - left.createdAt.getTime();

        if (createdDiff !== 0) {
          return createdDiff;
        }

        return right._id.localeCompare(left._id);
      })
      .slice(0, limit);
  }

  async searchNodes(userId: string, criteria: NodeSearchCriteria): Promise<NodeRecord[]> {
    return sortNodesByRecency(
      [...this.nodes.values()].filter(
        (node) => node.userId === userId && nodeMatchesSearch(node, criteria)
      )
    ).slice(0, criteria.limit);
  }
}
