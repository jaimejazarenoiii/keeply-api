import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { describe, it } from "node:test";
import {
  decodeBase64Pem,
  signAccessToken,
  verifyAccessToken,
  validateJwtKeyPair
} from "../../src/utils/tokens";

function createJwtConfig() {
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
    issuer: "keeply-api",
    audience: "keeply-api",
    accessTokenTtlSeconds: 900
  };
}

describe("token utilities", () => {
  it("validates matching JWT key pairs", () => {
    const config = createJwtConfig();

    assert.doesNotThrow(() =>
      validateJwtKeyPair({
        privateKeyB64: config.privateKeyB64,
        publicKeyB64: config.publicKeyB64
      })
    );
  });

  it("signs and verifies JWT access tokens", async () => {
    const config = createJwtConfig();
    const accessToken = await signAccessToken(
      {
        sub: "user-1",
        email: "cj@example.com",
        name: "CJ"
      },
      config
    );

    const claims = await verifyAccessToken(accessToken, config);

    assert.equal(claims.sub, "user-1");
    assert.equal(claims.email, "cj@example.com");
    assert.equal(claims.name, "CJ");
  });

  it("rejects invalid audiences", async () => {
    const config = createJwtConfig();
    const accessToken = await signAccessToken(
      {
        sub: "user-1",
        email: "cj@example.com",
        name: "CJ"
      },
      config
    );

    await assert.rejects(
      () =>
        verifyAccessToken(accessToken, {
          ...config,
          audience: "other-audience"
        }),
      /Invalid or expired access token/
    );
  });

  it("decodes base64 PEM values", () => {
    const encoded = Buffer.from("example").toString("base64");

    assert.equal(decodeBase64Pem(encoded), "example");
  });
});
