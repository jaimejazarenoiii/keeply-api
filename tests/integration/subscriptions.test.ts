import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  ApiErrorResponse,
  SubscriptionEventAcceptedResponse,
  SubscriptionStatusResponse
} from "../../src/types/api";
import { authHeaders, createAuthTestApp, registerTestUser } from "../helpers/auth";
import { requestJson } from "../helpers/http";

describe("Subscriptions", () => {
  it("returns an empty status for users without entitlements", async () => {
    const { app } = createAuthTestApp();
    const user = await registerTestUser(app);

    const response = await requestJson<SubscriptionStatusResponse>(
      app,
      "GET",
      "/subscription/status",
      undefined,
      { headers: authHeaders(user) }
    );

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data.entitlements, []);
  });

  it("returns an active entitlement after a RevenueCat purchase event", async () => {
    const { app, revenueCatWebhookAuthToken } = createAuthTestApp();
    const user = await registerTestUser(app);

    const webhookResponse = await sendRevenueCatEvent(app, revenueCatWebhookAuthToken, {
      id: "event-active",
      app_user_id: user.user.id,
      type: "INITIAL_PURCHASE",
      product_id: "keeply.pro.monthly",
      entitlement_id: "pro",
      event_timestamp_ms: Date.parse("2026-01-01T00:00:00.000Z"),
      expiration_at_ms: Date.parse("2026-02-01T00:00:00.000Z")
    });

    assert.equal(webhookResponse.status, 202);
    assert.equal(webhookResponse.body.data.accepted, true);

    const statusResponse = await requestJson<SubscriptionStatusResponse>(
      app,
      "GET",
      "/subscription/status",
      undefined,
      { headers: authHeaders(user) }
    );

    assert.equal(statusResponse.status, 200);
    assert.deepEqual(statusResponse.body.data.entitlements, [
      {
        key: "pro",
        status: "ACTIVE",
        currentPeriodEndsAt: "2026-02-01T00:00:00.000Z"
      }
    ]);
  });

  it("accepts expired and revoked RevenueCat lifecycle events", async () => {
    const { app, revenueCatWebhookAuthToken } = createAuthTestApp();
    const user = await registerTestUser(app);

    await sendRevenueCatEvent(app, revenueCatWebhookAuthToken, {
      id: "event-active",
      app_user_id: user.user.id,
      type: "INITIAL_PURCHASE",
      product_id: "keeply.pro.monthly",
      entitlement_id: "pro",
      event_timestamp_ms: Date.parse("2026-01-01T00:00:00.000Z")
    });
    await sendRevenueCatEvent(app, revenueCatWebhookAuthToken, {
      id: "event-expired",
      app_user_id: user.user.id,
      type: "EXPIRATION",
      product_id: "keeply.pro.monthly",
      entitlement_id: "pro",
      event_timestamp_ms: Date.parse("2026-02-01T00:00:00.000Z")
    });

    const expiredStatus = await requestJson<SubscriptionStatusResponse>(
      app,
      "GET",
      "/subscription/status",
      undefined,
      { headers: authHeaders(user) }
    );

    assert.equal(expiredStatus.body.data.entitlements[0]?.status, "EXPIRED");

    const revokedResponse = await sendRevenueCatEvent(app, revenueCatWebhookAuthToken, {
      id: "event-revoked",
      app_user_id: user.user.id,
      type: "REFUND",
      product_id: "keeply.pro.monthly",
      entitlement_id: "pro",
      event_timestamp_ms: Date.parse("2026-02-02T00:00:00.000Z")
    });

    assert.equal(revokedResponse.status, 202);
    assert.equal(revokedResponse.body.data.accepted, true);

    const revokedStatus = await requestJson<SubscriptionStatusResponse>(
      app,
      "GET",
      "/subscription/status",
      undefined,
      { headers: authHeaders(user) }
    );

    assert.equal(revokedStatus.body.data.entitlements[0]?.status, "REVOKED");
  });

  it("ignores replayed RevenueCat events without changing current entitlement state", async () => {
    const { app, revenueCatWebhookAuthToken } = createAuthTestApp();
    const user = await registerTestUser(app);
    const payload = {
      id: "event-active",
      app_user_id: user.user.id,
      type: "INITIAL_PURCHASE",
      product_id: "keeply.pro.monthly",
      entitlement_id: "pro",
      event_timestamp_ms: Date.parse("2026-01-01T00:00:00.000Z")
    };

    await sendRevenueCatEvent(app, revenueCatWebhookAuthToken, payload);
    const replay = await sendRevenueCatEvent(app, revenueCatWebhookAuthToken, payload);

    assert.equal(replay.status, 202);
    assert.equal(replay.body.data.accepted, false);

    const statusResponse = await requestJson<SubscriptionStatusResponse>(
      app,
      "GET",
      "/subscription/status",
      undefined,
      { headers: authHeaders(user) }
    );

    assert.equal(statusResponse.body.data.entitlements[0]?.status, "ACTIVE");
  });

  it("rejects RevenueCat webhooks with invalid authorization", async () => {
    const { app } = createAuthTestApp();
    const response = await requestJson<ApiErrorResponse>(
      app,
      "POST",
      "/subscriptions/revenuecat/webhook",
      {
        event: {
          id: "event-active",
          app_user_id: "user-1",
          type: "INITIAL_PURCHASE",
          entitlement_id: "pro"
        }
      },
      { headers: { authorization: "Bearer wrong-token" } }
    );

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, "AUTHENTICATION_REQUIRED");
  });
});

async function sendRevenueCatEvent(
  app: Parameters<typeof requestJson>[0],
  token: string,
  event: Record<string, unknown>
) {
  return requestJson<SubscriptionEventAcceptedResponse>(
    app,
    "POST",
    "/subscriptions/revenuecat/webhook",
    { event },
    { headers: { authorization: `Bearer ${token}` } }
  );
}
