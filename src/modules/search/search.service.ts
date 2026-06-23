import type { NodeStore } from "../../models/node.store";
import { nodeStore } from "../../models/node.store";
import type { NodeDto } from "../../types/node";
import { toNodeDto } from "../../utils/node-response";
import type { ParsedSearchNodesQuery } from "../../utils/validation";

export class SearchService {
  constructor(private readonly store: NodeStore = nodeStore) {}

  async searchNodes(userId: string, query: ParsedSearchNodesQuery): Promise<NodeDto[]> {
    const nodes = await this.store.searchNodes(userId, query);

    return nodes.map(toNodeDto);
  }
}

export const searchService = new SearchService();
