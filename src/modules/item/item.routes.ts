import { Router, type RequestHandler } from "express";
import type { ItemController } from "./item.controller";
import { itemController } from "./item.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";

export function createItemRouter(
  controller: ItemController = itemController,
  authenticate: RequestHandler = authMiddleware
): Router {
  const router = Router();

  router.use(authenticate);
  router.post("/", asyncHandler(controller.createItem.bind(controller)));
  router.get("/:itemId/path", asyncHandler(controller.getItemPath.bind(controller)));
  router.get("/:itemId", asyncHandler(controller.getItem.bind(controller)));
  router.patch("/:itemId", asyncHandler(controller.updateItem.bind(controller)));
  router.patch("/:itemId/move", asyncHandler(controller.moveItem.bind(controller)));
  router.delete("/:itemId", asyncHandler(controller.deleteItem.bind(controller)));

  return router;
}

export const itemRouter = createItemRouter();
