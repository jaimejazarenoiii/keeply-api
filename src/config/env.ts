import dotenv from "dotenv";

dotenv.config();

const DEFAULT_PORT = 3000;

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

export const env = {
  port: parsePort(process.env.PORT),
  mongoUri: requireEnv("MONGODB_URI"),
  nodeEnv: process.env.NODE_ENV ?? "development"
} as const;
