import cors from "cors";
import express from "express";
import { errorMiddleware } from "./middleware/error.middleware";
import type { NodeStore } from "./models/node.store";
import { ContainerController } from "./modules/container/container.controller";
import { createContainerRouter } from "./modules/container/container.routes";
import { ContainerService } from "./modules/container/container.service";
import { createDocsRouter } from "./modules/docs/docs.routes";
import { ItemController } from "./modules/item/item.controller";
import { createItemRouter } from "./modules/item/item.routes";
import { ItemService } from "./modules/item/item.service";
import { SpaceController } from "./modules/space/space.controller";
import { createSpaceRouter } from "./modules/space/space.routes";
import { SpaceService } from "./modules/space/space.service";

export interface AppDependencies {
  nodeStore?: NodeStore;
}

export function createApp(dependencies: AppDependencies = {}): express.Express {
  const app = express();
  const spaceService = new SpaceService(dependencies.nodeStore);
  const containerService = new ContainerService(dependencies.nodeStore);
  const itemService = new ItemService(dependencies.nodeStore);
  const spaceController = new SpaceController(spaceService);
  const containerController = new ContainerController(containerService);
  const itemController = new ItemController(itemService);

  app.use(cors());
  app.use(express.json());
  app.use(createDocsRouter());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      data: {
        status: "ok"
      }
    });
  });

  app.use("/spaces", createSpaceRouter(spaceController));
  app.use("/containers", createContainerRouter(containerController));
  app.use("/items", createItemRouter(itemController));

  app.use(errorMiddleware);

  return app;
}

export const app = createApp();
