import {
  SubscriptionCustomerModel,
  SubscriptionEntitlementModel,
  SubscriptionEventModel,
  SubscriptionProductModel
} from "./subscription.model";
import type {
  SubscriptionCustomerRecord,
  SubscriptionEntitlementRecord,
  SubscriptionEventRecord,
  SubscriptionProductRecord,
  SubscriptionProvider
} from "../types/subscription";

export type UpsertSubscriptionCustomerInput = Omit<
  SubscriptionCustomerRecord,
  "_id" | "createdAt" | "updatedAt"
>;
export type UpsertSubscriptionProductInput = Omit<
  SubscriptionProductRecord,
  "_id" | "createdAt" | "updatedAt"
>;
export type UpsertSubscriptionEntitlementInput = Omit<
  SubscriptionEntitlementRecord,
  "_id" | "createdAt" | "updatedAt"
>;
export type CreateSubscriptionEventInput = Omit<SubscriptionEventRecord, "_id">;

export interface SubscriptionStore {
  upsertCustomer(input: UpsertSubscriptionCustomerInput): Promise<SubscriptionCustomerRecord>;
  upsertProduct(input: UpsertSubscriptionProductInput): Promise<SubscriptionProductRecord>;
  listEntitlements(userId: string): Promise<SubscriptionEntitlementRecord[]>;
  findEntitlement(
    userId: string,
    provider: SubscriptionProvider,
    entitlementKey: string
  ): Promise<SubscriptionEntitlementRecord | null>;
  upsertEntitlement(
    input: UpsertSubscriptionEntitlementInput
  ): Promise<SubscriptionEntitlementRecord>;
  findEvent(
    provider: SubscriptionProvider,
    externalEventId: string
  ): Promise<SubscriptionEventRecord | null>;
  createEvent(input: CreateSubscriptionEventInput): Promise<SubscriptionEventRecord>;
}

function normalizeRecord<TRecord extends { _id: unknown; createdAt?: Date; updatedAt?: Date }>(
  record: unknown
): TRecord {
  const raw = record as TRecord & {
    _id: { toString(): string };
  };

  return {
    ...raw,
    _id: raw._id.toString()
  };
}

function normalizeEvent(record: unknown): SubscriptionEventRecord {
  const raw = record as SubscriptionEventRecord & {
    _id: { toString(): string };
  };

  return {
    ...raw,
    _id: raw._id.toString()
  };
}

export class MongooseSubscriptionStore implements SubscriptionStore {
  async upsertCustomer(
    input: UpsertSubscriptionCustomerInput
  ): Promise<SubscriptionCustomerRecord> {
    const customer = await SubscriptionCustomerModel.findOneAndUpdate(
      {
        provider: input.provider,
        externalCustomerId: input.externalCustomerId
      },
      input,
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true
      }
    ).lean();

    return normalizeRecord<SubscriptionCustomerRecord>(customer);
  }

  async upsertProduct(input: UpsertSubscriptionProductInput): Promise<SubscriptionProductRecord> {
    const product = await SubscriptionProductModel.findOneAndUpdate(
      {
        provider: input.provider,
        externalProductId: input.externalProductId
      },
      input,
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true
      }
    ).lean();

    return normalizeRecord<SubscriptionProductRecord>(product);
  }

  async listEntitlements(userId: string): Promise<SubscriptionEntitlementRecord[]> {
    const entitlements = await SubscriptionEntitlementModel.find({ userId })
      .sort({ entitlementKey: 1 })
      .lean();

    return entitlements.map((entitlement) =>
      normalizeRecord<SubscriptionEntitlementRecord>(entitlement)
    );
  }

  async findEntitlement(
    userId: string,
    provider: SubscriptionProvider,
    entitlementKey: string
  ): Promise<SubscriptionEntitlementRecord | null> {
    const entitlement = await SubscriptionEntitlementModel.findOne({
      userId,
      provider,
      entitlementKey
    }).lean();

    return entitlement ? normalizeRecord<SubscriptionEntitlementRecord>(entitlement) : null;
  }

  async upsertEntitlement(
    input: UpsertSubscriptionEntitlementInput
  ): Promise<SubscriptionEntitlementRecord> {
    const entitlement = await SubscriptionEntitlementModel.findOneAndUpdate(
      {
        userId: input.userId,
        provider: input.provider,
        entitlementKey: input.entitlementKey
      },
      input,
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true
      }
    ).lean();

    return normalizeRecord<SubscriptionEntitlementRecord>(entitlement);
  }

  async findEvent(
    provider: SubscriptionProvider,
    externalEventId: string
  ): Promise<SubscriptionEventRecord | null> {
    const event = await SubscriptionEventModel.findOne({ provider, externalEventId }).lean();

    return event ? normalizeEvent(event) : null;
  }

  async createEvent(input: CreateSubscriptionEventInput): Promise<SubscriptionEventRecord> {
    const event = await SubscriptionEventModel.create(input);

    return normalizeEvent(event.toObject());
  }
}

export const subscriptionStore = new MongooseSubscriptionStore();
