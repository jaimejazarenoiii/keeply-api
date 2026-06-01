import { Router } from "express";
import type { SpaceController } from "./space.controller";
import { spaceController } from "./space.controller";
import { asyncHandler } from "../../utils/async-handler";

export function createSpaceRouter(controller: SpaceController = spaceController): Router {
  const router = Router();

  router.get("/", asyncHandler(controller.listSpaces.bind(controller)));
  router.post("/", asyncHandler(controller.createSpace.bind(controller)));
  router.patch("/:spaceId", asyncHandler(controller.updateSpace.bind(controller)));
  router.delete("/:spaceId", asyncHandler(controller.deleteSpace.bind(controller)));
  router.get("/:spaceId/tree", asyncHandler(controller.getSpaceTree.bind(controller)));

  return router;
}

export const spaceRouter = createSpaceRouter();
