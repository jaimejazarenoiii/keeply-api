export type SubscriptionProvider = "REVENUECAT";

export type SubscriptionEntitlementStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "EXPIRED"
  | "REVOKED"
  | "UNKNOWN";

export type SubscriptionEventRawPayload = Record<string, unknown>;

export interface SubscriptionCustomerRecord {
  _id: string;
  userId: string;
  provider: SubscriptionProvider;
  externalCustomerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionProductRecord {
  _id: string;
  provider: SubscriptionProvider;
  externalProductId: string;
  entitlementKey: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionEntitlementRecord {
  _id: string;
  userId: string;
  provider: SubscriptionProvider;
  entitlementKey: string;
  status: SubscriptionEntitlementStatus;
  externalProductId?: string;
  originalTransactionId?: string;
  currentPeriodEndsAt?: Date;
  lastEventAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionEventRecord {
  _id: string;
  provider: SubscriptionProvider;
  externalEventId: string;
  externalCustomerId: string;
  userId?: string;
  eventType: string;
  externalProductId?: string;
  entitlementKey?: string;
  occurredAt: Date;
  processedAt: Date;
  payload: SubscriptionEventRawPayload;
}

export interface SubscriptionStatusDto {
  entitlements: Array<{
    key: string;
    status: SubscriptionEntitlementStatus;
    currentPeriodEndsAt?: string;
  }>;
}

export interface SubscriptionEventAcceptedDto {
  accepted: boolean;
}
