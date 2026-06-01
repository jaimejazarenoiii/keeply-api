import type { RequestHandler } from "express";
import { ApiError } from "../utils/errors";
import { verifyAccessToken } from "../utils/tokens";
import type { AccessTokenClaims } from "../types/auth";

type AccessTokenVerifier = (token: string) => Promise<AccessTokenClaims>;

async function verifyWithEnvironment(token: string): Promise<AccessTokenClaims> {
  const { env } = await import("../config/env.js");

  return verifyAccessToken(token, env.jwt);
}

export function createAuthMiddleware(
  verifyToken: AccessTokenVerifier = verifyWithEnvironment
): RequestHandler {
  return async (req, _res, next) => {
    const authorization = req.header("authorization");

    if (!authorization) {
      next(new ApiError(401, "AUTHENTICATION_REQUIRED", "Authentication is required"));
      return;
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      next(new ApiError(401, "INVALID_TOKEN", "Authorization header must use Bearer token"));
      return;
    }

    try {
      const claims = await verifyToken(token);

      req.user = {
        id: claims.sub,
        email: claims.email,
        name: claims.name
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const authMiddleware = createAuthMiddleware();
