import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SubscriptionService } from "../../src/modules/subscription/subscription.service";
import { InMemoryAuthStore, InMemorySubscriptionStore } from "../helpers/in-memory-auth-store";

describe("SubscriptionService", () => {
  it("keeps the latest entitlement state when an older event arrives out of order", async () => {
    const { service } = await createServiceWithUser("user-1");

    await service.processRevenueCatWebhook({
      payload: {
        event: {
          id: "event-expired",
          app_user_id: "user-1",
          type: "EXPIRATION",
          product_id: "keeply.pro.monthly",
          entitlement_id: "pro",
          event_timestamp_ms: Date.parse("2026-02-01T00:00:00.000Z")
        }
      }
    });
    await service.processRevenueCatWebhook({
      payload: {
        event: {
          id: "event-active",
          app_user_id: "user-1",
          type: "INITIAL_PURCHASE",
          product_id: "keeply.pro.monthly",
          entitlement_id: "pro",
          event_timestamp_ms: Date.parse("2026-01-01T00:00:00.000Z")
        }
      }
    });

    const status = await service.getStatus("user-1");

    assert.equal(status.entitlements[0]?.status, "EXPIRED");
  });

  it("handles duplicate events idempotently", async () => {
    const { service } = await createServiceWithUser("user-1");
    const payload = {
      event: {
        id: "event-active",
        app_user_id: "user-1",
        type: "INITIAL_PURCHASE",
        product_id: "keeply.pro.monthly",
        entitlement_id: "pro",
        event_timestamp_ms: Date.parse("2026-01-01T00:00:00.000Z")
      }
    };

    const first = await service.processRevenueCatWebhook({ payload });
    const duplicate = await service.processRevenueCatWebhook({ payload });
    const status = await service.getStatus("user-1");

    assert.equal(first.accepted, true);
    assert.equal(duplicate.accepted, false);
    assert.equal(status.entitlements.length, 1);
    assert.equal(status.entitlements[0]?.status, "ACTIVE");
  });
});

async function createServiceWithUser(userId: string) {
  const authStore = new InMemoryAuthStore();
  const subscriptionStore = new InMemorySubscriptionStore();

  await authStore.createUser({
    _id: userId,
    email: `${userId}@example.com`,
    name: "CJ",
    passwordHash: "hash",
    status: "ACTIVE"
  });

  return {
    service: new SubscriptionService(subscriptionStore, authStore),
    authStore,
    subscriptionStore
  };
}
