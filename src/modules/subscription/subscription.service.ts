import type { AuthStore } from "../../models/auth.store";
import { authStore } from "../../models/auth.store";
import type { SubscriptionStore } from "../../models/subscription.store";
import { subscriptionStore } from "../../models/subscription.store";
import type {
  SubscriptionEntitlementStatus,
  SubscriptionEventAcceptedDto,
  SubscriptionEventRawPayload,
  SubscriptionStatusDto
} from "../../types/subscription";
import { ApiError } from "../../utils/errors";

export interface RevenueCatWebhookInput {
  payload: SubscriptionEventRawPayload;
}

interface ParsedRevenueCatEvent {
  externalEventId: string;
  externalCustomerId: string;
  eventType: string;
  externalProductId?: string;
  entitlementKey: string;
  originalTransactionId?: string;
  occurredAt: Date;
  currentPeriodEndsAt?: Date;
  payload: SubscriptionEventRawPayload;
}

export class SubscriptionService {
  constructor(
    private readonly store: SubscriptionStore = subscriptionStore,
    private readonly users: AuthStore = authStore
  ) {}

  async getStatus(userId: string): Promise<SubscriptionStatusDto> {
    const entitlements = await this.store.listEntitlements(userId);

    return {
      entitlements: entitlements.map((entitlement) => ({
        key: entitlement.entitlementKey,
        status: entitlement.status,
        ...(entitlement.currentPeriodEndsAt
          ? { currentPeriodEndsAt: entitlement.currentPeriodEndsAt.toISOString() }
          : {})
      }))
    };
  }

  async processRevenueCatWebhook(
    input: RevenueCatWebhookInput
  ): Promise<SubscriptionEventAcceptedDto> {
    const event = parseRevenueCatEvent(input.payload);
    const existingEvent = await this.store.findEvent("REVENUECAT", event.externalEventId);

    if (existingEvent) {
      return { accepted: false };
    }

    const user = await this.users.findUserById(event.externalCustomerId);
    const userId = user?._id;

    await this.store.createEvent({
      provider: "REVENUECAT",
      externalEventId: event.externalEventId,
      externalCustomerId: event.externalCustomerId,
      ...(userId ? { userId } : {}),
      eventType: event.eventType,
      ...(event.externalProductId ? { externalProductId: event.externalProductId } : {}),
      entitlementKey: event.entitlementKey,
      occurredAt: event.occurredAt,
      processedAt: new Date(),
      payload: event.payload
    });

    if (!userId) {
      return { accepted: true };
    }

    await this.store.upsertCustomer({
      userId,
      provider: "REVENUECAT",
      externalCustomerId: event.externalCustomerId
    });

    if (event.externalProductId) {
      await this.store.upsertProduct({
        provider: "REVENUECAT",
        externalProductId: event.externalProductId,
        entitlementKey: event.entitlementKey
      });
    }

    const existingEntitlement = await this.store.findEntitlement(
      userId,
      "REVENUECAT",
      event.entitlementKey
    );

    if (
      existingEntitlement?.lastEventAt &&
      existingEntitlement.lastEventAt.getTime() > event.occurredAt.getTime()
    ) {
      return { accepted: true };
    }

    await this.store.upsertEntitlement({
      userId,
      provider: "REVENUECAT",
      entitlementKey: event.entitlementKey,
      status: statusFromRevenueCatEvent(event.eventType),
      ...(event.externalProductId ? { externalProductId: event.externalProductId } : {}),
      ...(event.originalTransactionId
        ? { originalTransactionId: event.originalTransactionId }
        : {}),
      ...(event.currentPeriodEndsAt ? { currentPeriodEndsAt: event.currentPeriodEndsAt } : {}),
      lastEventAt: event.occurredAt
    });

    return { accepted: true };
  }
}

function parseRevenueCatEvent(payload: SubscriptionEventRawPayload): ParsedRevenueCatEvent {
  const eventPayload = getObject(payload.event) ?? payload;
  const eventType = requireString(eventPayload.type, "event.type");
  const externalEventId =
    optionalString(eventPayload.id) ??
    optionalString(eventPayload.event_id) ??
    `${requireString(eventPayload.app_user_id, "event.app_user_id")}:${eventType}:${getEventTimestamp(
      eventPayload
    ).getTime()}`;
  const externalCustomerId = requireString(eventPayload.app_user_id, "event.app_user_id");
  const entitlementKey =
    optionalString(eventPayload.entitlement_id) ??
    optionalString(eventPayload.entitlement_identifier) ??
    "default";
  const externalProductId = optionalString(eventPayload.product_id);

  return {
    externalEventId,
    externalCustomerId,
    eventType,
    ...(externalProductId ? { externalProductId } : {}),
    entitlementKey,
    ...(optionalString(eventPayload.original_transaction_id)
      ? { originalTransactionId: optionalString(eventPayload.original_transaction_id) }
      : {}),
    occurredAt: getEventTimestamp(eventPayload),
    ...(getExpirationTimestamp(eventPayload)
      ? { currentPeriodEndsAt: getExpirationTimestamp(eventPayload) }
      : {}),
    payload
  };
}

function getObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be a non-empty string`);
  }

  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function getEventTimestamp(eventPayload: Record<string, unknown>): Date {
  const timestamp =
    optionalNumber(eventPayload.event_timestamp_ms) ??
    optionalNumber(eventPayload.event_timestamp) ??
    optionalNumber(eventPayload.purchased_at_ms) ??
    Date.now();

  return new Date(timestamp);
}

function getExpirationTimestamp(eventPayload: Record<string, unknown>): Date | undefined {
  const timestamp =
    optionalNumber(eventPayload.expiration_at_ms) ?? optionalNumber(eventPayload.expires_at_ms);

  return timestamp === undefined ? undefined : new Date(timestamp);
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function statusFromRevenueCatEvent(eventType: string): SubscriptionEntitlementStatus {
  const normalized = eventType.toUpperCase();

  if (["EXPIRATION", "BILLING_ISSUE"].includes(normalized)) {
    return "EXPIRED";
  }

  if (["CANCELLATION", "REFUND", "REVOCATION", "SUBSCRIBER_ALIAS"].includes(normalized)) {
    return "REVOKED";
  }

  if (
    [
      "INITIAL_PURCHASE",
      "RENEWAL",
      "UNCANCELLATION",
      "PRODUCT_CHANGE",
      "SUBSCRIPTION_EXTENDED"
    ].includes(normalized)
  ) {
    return "ACTIVE";
  }

  return "UNKNOWN";
}

export const subscriptionService = new SubscriptionService();
