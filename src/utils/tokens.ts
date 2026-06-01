import { createPrivateKey, createPublicKey, randomBytes, sign, verify } from "node:crypto";
import { ApiError } from "./errors";
import type { AccessTokenClaims } from "../types/auth";

export interface JwtKeyPairConfig {
  privateKeyB64: string;
  publicKeyB64: string;
}

export interface AccessTokenConfig extends JwtKeyPairConfig {
  issuer: string;
  audience: string;
  accessTokenTtlSeconds: number;
}

export interface AccessTokenVerifyConfig {
  publicKeyB64: string;
  issuer: string;
  audience: string;
}

export function decodeBase64Pem(value: string): string {
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    throw new Error("JWT key must be base64 encoded");
  }
}

export function validateJwtKeyPair(config: JwtKeyPairConfig): void {
  if (!config.privateKeyB64 || !config.publicKeyB64) {
    throw new Error("JWT_PRIVATE_KEY_B64 and JWT_PUBLIC_KEY_B64 are required");
  }

  const privateKey = createPrivateKey(decodeBase64Pem(config.privateKeyB64));
  const publicKey = createPublicKey(decodeBase64Pem(config.publicKeyB64));
  const sample = randomBytes(32);
  const signature = sign("sha256", sample, privateKey);

  if (!verify("sha256", sample, publicKey, signature)) {
    throw new Error("JWT private and public keys do not match");
  }
}

export async function signAccessToken(
  claims: AccessTokenClaims,
  config: AccessTokenConfig
): Promise<string> {
  const { SignJWT, importPKCS8 } = await import("jose");
  const privateKey = await importPKCS8(decodeBase64Pem(config.privateKeyB64), "RS256");

  return new SignJWT({
    email: claims.email,
    name: claims.name
  })
    .setProtectedHeader({ alg: "RS256" })
    .setSubject(claims.sub)
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setIssuedAt()
    .setExpirationTime(`${config.accessTokenTtlSeconds}s`)
    .sign(privateKey);
}

export async function verifyAccessToken(
  token: string,
  config: AccessTokenVerifyConfig
): Promise<AccessTokenClaims> {
  try {
    const { jwtVerify, importSPKI } = await import("jose");
    const publicKey = await importSPKI(decodeBase64Pem(config.publicKeyB64), "RS256");
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: config.issuer,
      audience: config.audience
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      throw new Error("Missing required access token claims");
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name
    };
  } catch {
    throw new ApiError(401, "INVALID_TOKEN", "Invalid or expired access token");
  }
}
