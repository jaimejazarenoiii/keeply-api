import dotenv from "dotenv";
import { validateJwtKeyPair } from "../utils/tokens";

dotenv.config();

const DEFAULT_PORT = 3000;
const DEFAULT_JWT_ACCESS_TOKEN_TTL_SECONDS = 900;
const DEFAULT_JWT_REFRESH_TOKEN_TTL_DAYS = 30;

function parsePort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  return parsed;
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function parsePositiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

const jwtKeyPair = {
  privateKeyB64: requireEnv("JWT_PRIVATE_KEY_B64"),
  publicKeyB64: requireEnv("JWT_PUBLIC_KEY_B64")
};

validateJwtKeyPair(jwtKeyPair);

export const env = {
  port: parsePort(process.env.PORT),
  mongoUri: requireEnv("MONGODB_URI"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwt: {
    ...jwtKeyPair,
    issuer: process.env.JWT_ISSUER ?? "keeply-api",
    audience: process.env.JWT_AUDIENCE ?? "keeply-api",
    accessTokenTtlSeconds: parsePositiveInteger(
      process.env.JWT_ACCESS_TOKEN_TTL_SECONDS,
      DEFAULT_JWT_ACCESS_TOKEN_TTL_SECONDS,
      "JWT_ACCESS_TOKEN_TTL_SECONDS"
    ),
    refreshTokenTtlDays: parsePositiveInteger(
      process.env.JWT_REFRESH_TOKEN_TTL_DAYS,
      DEFAULT_JWT_REFRESH_TOKEN_TTL_DAYS,
      "JWT_REFRESH_TOKEN_TTL_DAYS"
    )
  },
  revenueCat: {
    webhookAuthToken: process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN ?? ""
  }
} as const;
