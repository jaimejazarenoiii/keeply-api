import type { Request, Response } from "express";
import type { DashboardService } from "./dashboard.service";
import { dashboardService } from "./dashboard.service";
import type { DashboardSummaryResponse } from "../../types/api";
import { requireAuthenticatedUser } from "../../utils/validation";

export class DashboardController {
  constructor(private readonly service: DashboardService = dashboardService) {}

  async getDashboardSummary(req: Request, res: Response<DashboardSummaryResponse>): Promise<void> {
    const user = requireAuthenticatedUser(req.user);
    const summary = await this.service.getDashboardSummary(user.id);

    res.status(200).json({ data: summary });
  }
}

export const dashboardController = new DashboardController();
