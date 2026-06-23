import { Router, type RequestHandler } from "express";
import type { DashboardController } from "./dashboard.controller";
import { dashboardController } from "./dashboard.controller";
import { asyncHandler } from "../../utils/async-handler";

export function createDashboardRouter(
  controller: DashboardController = dashboardController,
  authMiddleware: RequestHandler
): Router {
  const router = Router();

  router.get("/", authMiddleware, asyncHandler(controller.getDashboardSummary.bind(controller)));

  return router;
}
