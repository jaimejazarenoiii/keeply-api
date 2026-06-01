import { generateKeyPairSync } from "node:crypto";
import type { Express } from "express";
import { createApp } from "../../src/app";
import type { AuthStore } from "../../src/models/auth.store";
import type { NodeStore } from "../../src/models/node.store";
import type { SubscriptionStore } from "../../src/models/subscription.store";
import type { AccessTokenConfig } from "../../src/utils/tokens";
import type { AuthTokenResponse } from "../../src/types/api";
import { InMemoryAuthStore, InMemorySubscriptionStore } from "./in-memory-auth-store";
import { InMemoryNodeStore } from "./in-memory-node-store";
import { bearerAuthHeader, requestJson } from "./http";

export type TestAuthTokenConfig = AccessTokenConfig & { refreshTokenTtlDays: number };

export function createTestAuthTokenConfig(): TestAuthTokenConfig {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048
  });

  return {
    privateKeyB64: Buffer.from(
      privateKey.export({
        type: "pkcs8",
        format: "pem"
      })
    ).toString("base64"),
    publicKeyB64: Buffer.from(
      publicKey.export({
        type: "spki",
        format: "pem"
      })
    ).toString("base64"),
    issuer: "keeply-api-test",
    audience: "keeply-api-test",
    accessTokenTtlSeconds: 900,
    refreshTokenTtlDays: 30
  };
}

export async function registerTestUser(
  app: Express,
  email = "cj@example.com"
): Promise<AuthTokenResponse["data"]> {
  const response = await requestJson<AuthTokenResponse>(app, "POST", "/auth/register", {
    email,
    password: "correct-horse-battery-staple",
    name: "CJ"
  });

  if (response.status !== 201) {
    throw new Error(`Failed to register test user: ${response.status}`);
  }

  return response.body.data;
}

export function authHeaders(auth: AuthTokenResponse["data"]): Record<string, string> {
  return bearerAuthHeader(auth.accessToken);
}

export interface AuthTestDependencies {
  authStore: AuthStore;
  nodeStore: NodeStore;
  subscriptionStore: SubscriptionStore;
  authTokenConfig: TestAuthTokenConfig;
}

export function createAuthTestApp(): {
  app: Express;
  authStore: InMemoryAuthStore;
  nodeStore: InMemoryNodeStore;
  subscriptionStore: InMemorySubscriptionStore;
  authTokenConfig: TestAuthTokenConfig;
  revenueCatWebhookAuthToken: string;
} {
  const authStore = new InMemoryAuthStore();
  const nodeStore = new InMemoryNodeStore();
  const subscriptionStore = new InMemorySubscriptionStore();
  const authTokenConfig = createTestAuthTokenConfig();
  const revenueCatWebhookAuthToken = "test-revenuecat-token";

  return {
    app: createApp({
      authStore,
      nodeStore,
      subscriptionStore,
      authTokenConfig,
      revenueCatWebhookAuthToken
    }),
    authStore,
    nodeStore,
    subscriptionStore,
    authTokenConfig,
    revenueCatWebhookAuthToken
  };
}
