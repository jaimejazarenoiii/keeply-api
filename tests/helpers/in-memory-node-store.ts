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

  async findById(id: string): Promise<NodeRecord | null> {
    return this.nodes.get(id) ?? null;
  }

  async findByType(type: NodeType): Promise<NodeRecord[]> {
    return [...this.nodes.values()].filter((node) => node.type === type);
  }

  async findChildrenBySpace(spaceId: string): Promise<NodeRecord[]> {
    return [...this.nodes.values()].filter(
      (node) => node.spaceId === spaceId && node.type !== "SPACE"
    );
  }

  async updateById(
    id: string,
    updates: Partial<Pick<NodeRecord, "name" | "parentId" | "spaceId" | "metadata" | "images">>
  ): Promise<NodeRecord | null> {
    const node = this.nodes.get(id);

    if (!node) {
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

  async deleteById(id: string): Promise<boolean> {
    return this.nodes.delete(id);
  }

  async countChildren(parentId: string): Promise<number> {
    return [...this.nodes.values()].filter((node) => node.parentId === parentId).length;
  }

  async countDescendants(spaceId: string): Promise<number> {
    return [...this.nodes.values()].filter(
      (node) => node.spaceId === spaceId && node.type !== "SPACE"
    ).length;
  }
}
