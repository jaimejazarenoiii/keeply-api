import { Router, type RequestHandler } from "express";
import type { SubscriptionController } from "./subscription.controller";
import { subscriptionController } from "./subscription.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";

export function createSubscriptionRouter(
  controller: SubscriptionController = subscriptionController,
  authenticate: RequestHandler = authMiddleware
): Router {
  const router = Router();

  router.get("/status", authenticate, asyncHandler(controller.getStatus.bind(controller)));
  router.post(
    "/revenuecat/webhook",
    asyncHandler(controller.receiveRevenueCatWebhook.bind(controller))
  );

  return router;
}

export const subscriptionRouter = createSubscriptionRouter();
