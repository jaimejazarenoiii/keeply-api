import type { NodeStore } from "../../models/node.store";
import { nodeStore } from "../../models/node.store";
import type { DashboardSummary } from "../../types/api";
import { toNodeDto } from "../../utils/node-response";

export class DashboardService {
  constructor(private readonly store: NodeStore = nodeStore) {}

  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    const [spaces, containers, items, recentSpaces, recentContainers, recentItems] =
      await Promise.all([
        this.store.countByType("SPACE", userId),
        this.store.countByType("CONTAINER", userId),
        this.store.countByType("ITEM", userId),
        this.store.findRecentByType("SPACE", userId, 5),
        this.store.findRecentByType("CONTAINER", userId, 5),
        this.store.findRecentByType("ITEM", userId, 10)
      ]);

    return {
      counts: {
        spaces,
        containers,
        items
      },
      recent: {
        spaces: recentSpaces.map(toNodeDto),
        containers: recentContainers.map(toNodeDto),
        items: recentItems.map(toNodeDto)
      }
    };
  }
}

export const dashboardService = new DashboardService();
