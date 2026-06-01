import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SubscriptionCustomerModel,
  SubscriptionEntitlementModel,
  SubscriptionEventModel,
  SubscriptionProductModel
} from "../../src/models/subscription.model";

describe("subscription models", () => {
  it("defines unique lookup indexes for customers, products, entitlements, and events", () => {
    assertHasIndex(SubscriptionCustomerModel.schema.indexes(), {
      provider: 1,
      externalCustomerId: 1
    });
    assertHasIndex(SubscriptionProductModel.schema.indexes(), {
      provider: 1,
      externalProductId: 1
    });
    assertHasIndex(SubscriptionEntitlementModel.schema.indexes(), {
      userId: 1,
      provider: 1,
      entitlementKey: 1
    });
    assertHasIndex(SubscriptionEventModel.schema.indexes(), {
      provider: 1,
      externalEventId: 1
    });
  });
});

function assertHasIndex(
  indexes: Array<[Record<string, unknown>, Record<string, unknown>]>,
  expectedFields: Record<string, number>
): void {
  assert.equal(
    indexes.some(([fields, options]) => {
      return (
        options.unique === true &&
        Object.entries(expectedFields).every(([field, direction]) => fields[field] === direction)
      );
    }),
    true,
    `Expected unique index ${JSON.stringify(expectedFields)}`
  );
}
