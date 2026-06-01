import { Router, type RequestHandler } from "express";
import type { ContainerController } from "./container.controller";
import { containerController } from "./container.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";

export function createContainerRouter(
  controller: ContainerController = containerController,
  authenticate: RequestHandler = authMiddleware
): Router {
  const router = Router();

  router.use(authenticate);
  router.post("/", asyncHandler(controller.createContainer.bind(controller)));
  router.patch("/:containerId", asyncHandler(controller.updateContainer.bind(controller)));
  router.delete("/:containerId", asyncHandler(controller.deleteContainer.bind(controller)));
  router.patch("/:containerId/move", asyncHandler(controller.moveContainer.bind(controller)));
  router.get("/:containerId/items", asyncHandler(controller.listSubtreeItems.bind(controller)));
  router.get("/:containerId/tree", asyncHandler(controller.getContainerTree.bind(controller)));

  return router;
}

export const containerRouter = createContainerRouter();
