import { Router, type RequestHandler } from "express";
import type { AuthController } from "./auth.controller";
import { authController } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";

export function createAuthRouter(
  controller: AuthController = authController,
  authenticate: RequestHandler = authMiddleware
): Router {
  const router = Router();

  router.post("/register", asyncHandler(controller.register.bind(controller)));
  router.post("/login", asyncHandler(controller.login.bind(controller)));
  router.post("/refresh", asyncHandler(controller.refresh.bind(controller)));
  router.post("/logout", asyncHandler(controller.logout.bind(controller)));
  router.get("/me", authenticate, asyncHandler(controller.me.bind(controller)));

  return router;
}

export const authRouter = createAuthRouter();
