import { Router, type RequestHandler } from "express";
import type { SearchController } from "./search.controller";
import { searchController } from "./search.controller";
import { asyncHandler } from "../../utils/async-handler";

export function createSearchRouter(
  controller: SearchController = searchController,
  authMiddleware: RequestHandler
): Router {
  const router = Router();

  router.get("/", authMiddleware, asyncHandler(controller.searchNodes.bind(controller)));

  return router;
}
