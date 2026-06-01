import cors from "cors";
import express from "express";
import type { RequestHandler } from "express";
import { createAuthMiddleware } from "./middleware/auth.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import type { AuthStore } from "./models/auth.store";
import type { NodeStore } from "./models/node.store";
import type { SubscriptionStore } from "./models/subscription.store";
import { AuthController } from "./modules/auth/auth.controller";
import { createAuthRouter } from "./modules/auth/auth.routes";
import { AuthService } from "./modules/auth/auth.service";
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
import { SubscriptionController } from "./modules/subscription/subscription.controller";
import { createSubscriptionRouter } from "./modules/subscription/subscription.routes";
import { SubscriptionService } from "./modules/subscription/subscription.service";
import { asyncHandler } from "./utils/async-handler";
import { verifyAccessToken, type AccessTokenConfig } from "./utils/tokens";

export interface AppDependencies {
  nodeStore?: NodeStore;
  authStore?: AuthStore;
  subscriptionStore?: SubscriptionStore;
  authMiddleware?: RequestHandler;
  authTokenConfig?: AccessTokenConfig & { refreshTokenTtlDays: number };
  revenueCatWebhookAuthToken?: string;
}

export function createApp(dependencies: AppDependencies = {}): express.Express {
  const app = express();
  const spaceService = new SpaceService(dependencies.nodeStore);
  const containerService = new ContainerService(dependencies.nodeStore);
  const itemService = new ItemService(dependencies.nodeStore);
  const authService = new AuthService(dependencies.authStore, dependencies.authTokenConfig);
  const subscriptionService = new SubscriptionService(
    dependencies.subscriptionStore,
    dependencies.authStore
  );
  const spaceController = new SpaceController(spaceService);
  const containerController = new ContainerController(containerService);
  const itemController = new ItemController(itemService);
  const authController = new AuthController(authService);
  const subscriptionController = new SubscriptionController(
    subscriptionService,
    dependencies.revenueCatWebhookAuthToken ?? process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN ?? ""
  );
  const authMiddleware =
    dependencies.authMiddleware ??
    createAuthMiddleware((token) =>
      dependencies.authTokenConfig
        ? verifyAccessToken(token, dependencies.authTokenConfig)
        : verifyAccessTokenWithEnvironment(token)
    );

  app.use(cors());
  app.use(express.json());
  app.set("authMiddleware", authMiddleware);
  app.use(createDocsRouter());
  app.use("/auth", createAuthRouter(authController, authMiddleware));
  app.get(
    "/subscription/status",
    authMiddleware,
    asyncHandler(subscriptionController.getStatus.bind(subscriptionController))
  );
  app.use("/subscriptions", createSubscriptionRouter(subscriptionController, authMiddleware));

  app.get("/health", (_req, res) => {
    res.status(200).json({
      data: {
        status: "ok"
      }
    });
  });

  app.use("/spaces", createSpaceRouter(spaceController, authMiddleware));
  app.use("/containers", createContainerRouter(containerController, authMiddleware));
  app.use("/items", createItemRouter(itemController, authMiddleware));

  app.use(errorMiddleware);

  return app;
}

export const app = createApp();

async function verifyAccessTokenWithEnvironment(token: string) {
  const { env } = await import("./config/env.js");

  return verifyAccessToken(token, env.jwt);
}
