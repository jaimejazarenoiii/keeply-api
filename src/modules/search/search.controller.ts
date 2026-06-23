import type { Request, Response } from "express";
import type { SearchService } from "./search.service";
import { searchService } from "./search.service";
import type { NodeListResponse } from "../../types/api";
import { parseSearchNodesQuery, requireAuthenticatedUser } from "../../utils/validation";

export class SearchController {
  constructor(private readonly service: SearchService = searchService) {}

  async searchNodes(req: Request, res: Response<NodeListResponse>): Promise<void> {
    const user = requireAuthenticatedUser(req.user);
    const query = parseSearchNodesQuery(req.query);
    const nodes = await this.service.searchNodes(user.id, query);

    res.status(200).json({ data: nodes });
  }
}

export const searchController = new SearchController();
