import { HydratedDocument, Model, Schema, model, models } from "mongoose";
import type {
  SubscriptionCustomerRecord,
  SubscriptionEntitlementRecord,
  SubscriptionEventRecord,
  SubscriptionProductRecord
} from "../types/subscription";

export type SubscriptionCustomerDocument = HydratedDocument<SubscriptionCustomerRecord>;
export type SubscriptionProductDocument = HydratedDocument<SubscriptionProductRecord>;
export type SubscriptionEntitlementDocument = HydratedDocument<SubscriptionEntitlementRecord>;
export type SubscriptionEventDocument = HydratedDocument<SubscriptionEventRecord>;

export type SubscriptionCustomerModel = Model<SubscriptionCustomerRecord>;
export type SubscriptionProductModel = Model<SubscriptionProductRecord>;
export type SubscriptionEntitlementModel = Model<SubscriptionEntitlementRecord>;
export type SubscriptionEventModel = Model<SubscriptionEventRecord>;

const providerSchemaField = {
  type: String,
  enum: ["REVENUECAT"],
  required: true,
  default: "REVENUECAT"
} as const;

const subscriptionCustomerSchema = new Schema<SubscriptionCustomerRecord>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    provider: providerSchemaField,
    externalCustomerId: {
      type: String,
      required: true
    }
  },
  {
    collection: "subscription_customers",
    timestamps: true
  }
);

subscriptionCustomerSchema.index({ provider: 1, externalCustomerId: 1 }, { unique: true });
subscriptionCustomerSchema.index({ userId: 1, provider: 1 }, { unique: true });

const subscriptionProductSchema = new Schema<SubscriptionProductRecord>(
  {
    provider: providerSchemaField,
    externalProductId: {
      type: String,
      required: true
    },
    entitlementKey: {
      type: String,
      required: true,
      index: true
    },
    displayName: {
      type: String,
      trim: true
    }
  },
  {
    collection: "subscription_products",
    timestamps: true
  }
);

subscriptionProductSchema.index({ provider: 1, externalProductId: 1 }, { unique: true });

const subscriptionEntitlementSchema = new Schema<SubscriptionEntitlementRecord>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    provider: providerSchemaField,
    entitlementKey: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "EXPIRED", "REVOKED", "UNKNOWN"],
      required: true,
      index: true
    },
    externalProductId: {
      type: String
    },
    originalTransactionId: {
      type: String
    },
    currentPeriodEndsAt: {
      type: Date
    },
    lastEventAt: {
      type: Date,
      index: true
    }
  },
  {
    collection: "subscription_entitlements",
    timestamps: true
  }
);

subscriptionEntitlementSchema.index(
  { userId: 1, provider: 1, entitlementKey: 1 },
  { unique: true }
);

const subscriptionEventSchema = new Schema<SubscriptionEventRecord>(
  {
    provider: providerSchemaField,
    externalEventId: {
      type: String,
      required: true
    },
    externalCustomerId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    externalProductId: {
      type: String
    },
    entitlementKey: {
      type: String
    },
    occurredAt: {
      type: Date,
      required: true,
      index: true
    },
    processedAt: {
      type: Date,
      required: true
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true
    }
  },
  {
    collection: "subscription_events"
  }
);

subscriptionEventSchema.index({ provider: 1, externalEventId: 1 }, { unique: true });

export const SubscriptionCustomerModel =
  (models.SubscriptionCustomer as SubscriptionCustomerModel | undefined) ??
  model<SubscriptionCustomerRecord>("SubscriptionCustomer", subscriptionCustomerSchema);

export const SubscriptionProductModel =
  (models.SubscriptionProduct as SubscriptionProductModel | undefined) ??
  model<SubscriptionProductRecord>("SubscriptionProduct", subscriptionProductSchema);

export const SubscriptionEntitlementModel =
  (models.SubscriptionEntitlement as SubscriptionEntitlementModel | undefined) ??
  model<SubscriptionEntitlementRecord>("SubscriptionEntitlement", subscriptionEntitlementSchema);

export const SubscriptionEventModel =
  (models.SubscriptionEvent as SubscriptionEventModel | undefined) ??
  model<SubscriptionEventRecord>("SubscriptionEvent", subscriptionEventSchema);
