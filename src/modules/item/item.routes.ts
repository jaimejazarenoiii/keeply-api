import { Router } from "express";
import type { ItemController } from "./item.controller";
import { itemController } from "./item.controller";
import { asyncHandler } from "../../utils/async-handler";

export function createItemRouter(controller: ItemController = itemController): Router {
  const router = Router();

  router.post("/", asyncHandler(controller.createItem.bind(controller)));
  router.get("/:itemId/path", asyncHandler(controller.getItemPath.bind(controller)));
  router.get("/:itemId", asyncHandler(controller.getItem.bind(controller)));
  router.patch("/:itemId", asyncHandler(controller.updateItem.bind(controller)));
  router.patch("/:itemId/move", asyncHandler(controller.moveItem.bind(controller)));
  router.delete("/:itemId", asyncHandler(controller.deleteItem.bind(controller)));

  return router;
}

export const itemRouter = createItemRouter();
