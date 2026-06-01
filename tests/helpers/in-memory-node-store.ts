import type { CreateNodeInput, NodeStore } from "../../src/models/node.store";
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
    updates: Partial<Pick<NodeRecord, "name" | "parentId" | "spaceId" | "metadata" | "images">>
  ): Promise<NodeRecord | null> {
    const node = this.nodes.get(id);

    if (!node || node.userId !== userId) {
      return null;
    }

    const updated = {
      ...node,
      ...updates,
      updatedAt: new Date()
    };

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
}
