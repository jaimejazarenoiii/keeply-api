import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const contractPath = "specs/002-user-auth-subscriptions/contracts/openapi.yaml";

describe("Authorization and subscription OpenAPI contract", () => {
  it("documents auth and subscription foundations", () => {
    assert.equal(existsSync(contractPath), true);

    const contract = readFileSync(contractPath, "utf8");

    assert.match(contract, /openapi: 3\.1\.0/);
    assert.match(contract, /\/auth\/register:/);
    assert.match(contract, /\/auth\/login:/);
    assert.match(contract, /\/auth\/me:/);
    assert.match(contract, /bearerAuth:/);
    assert.match(contract, /\/subscription\/status:/);
    assert.match(contract, /\/subscriptions\/revenuecat\/webhook:/);
    assert.match(contract, /operationId: getSubscriptionStatus/);
    assert.match(contract, /operationId: receiveRevenueCatWebhook/);
    assert.match(contract, /SubscriptionStatusResponse:/);
    assert.match(contract, /SubscriptionEventAcceptedResponse:/);
    assert.match(contract, /ACTIVE/);
    assert.match(contract, /REVOKED/);
  });
});
