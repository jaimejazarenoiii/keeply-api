import type {
  AuthStore,
  CreateAuthSessionInput,
  CreateUserInput
} from "../../src/models/auth.store";
import type {
  CreateSubscriptionEventInput,
  SubscriptionStore,
  UpsertSubscriptionCustomerInput,
  UpsertSubscriptionEntitlementInput,
  UpsertSubscriptionProductInput
} from "../../src/models/subscription.store";

export type TestUserStatus = "ACTIVE" | "DISABLED" | "DELETED";

export interface TestUserRecord {
  _id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
  passwordHash: string;
  status: TestUserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestAuthSessionRecord {
  _id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestSubscriptionEntitlementRecord {
  _id: string;
  userId: string;
  provider: "REVENUECAT";
  entitlementKey: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "REVOKED" | "UNKNOWN";
  externalProductId?: string;
  currentPeriodEndsAt?: Date;
  lastEventAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestSubscriptionEventRecord {
  _id: string;
  provider: "REVENUECAT";
  externalEventId: string;
  externalCustomerId: string;
  userId?: string;
  eventType: string;
  occurredAt: Date;
  processedAt: Date;
  payload: Record<string, unknown>;
}

export interface TestSubscriptionCustomerRecord {
  _id: string;
  userId: string;
  provider: "REVENUECAT";
  externalCustomerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestSubscriptionProductRecord {
  _id: string;
  provider: "REVENUECAT";
  externalProductId: string;
  entitlementKey: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InMemoryAuthStore implements AuthStore {
  private readonly users = new Map<string, TestUserRecord>();
  private readonly sessions = new Map<string, TestAuthSessionRecord>();

  async createUser(input: CreateUserInput): Promise<TestUserRecord> {
    const now = new Date();
    const user = {
      ...input,
      email: input.email.toLowerCase(),
      createdAt: now,
      updatedAt: now
    };

    this.users.set(user._id, user);

    return user;
  }

  async findUserById(id: string): Promise<TestUserRecord | null> {
    return this.users.get(id) ?? null;
  }

  async findUserByEmail(email: string): Promise<TestUserRecord | null> {
    const normalizedEmail = email.toLowerCase();

    return [...this.users.values()].find((user) => user.email === normalizedEmail) ?? null;
  }

  async createSession(input: CreateAuthSessionInput): Promise<TestAuthSessionRecord> {
    const now = new Date();
    const session = {
      ...input,
      createdAt: now,
      updatedAt: now
    };

    this.sessions.set(session._id, session);

    return session;
  }

  async findSessionByRefreshTokenHash(hash: string): Promise<TestAuthSessionRecord | null> {
    return [...this.sessions.values()].find((session) => session.refreshTokenHash === hash) ?? null;
  }

  async revokeSession(
    id: string,
    revokedAt: Date = new Date()
  ): Promise<TestAuthSessionRecord | null> {
    const session = this.sessions.get(id);

    if (!session) {
      return null;
    }

    const updated = {
      ...session,
      revokedAt,
      updatedAt: revokedAt
    };

    this.sessions.set(id, updated);

    return updated;
  }
}

export class InMemorySubscriptionStore implements SubscriptionStore {
  private readonly customers = new Map<string, TestSubscriptionCustomerRecord>();
  private readonly products = new Map<string, TestSubscriptionProductRecord>();
  private readonly entitlements = new Map<string, TestSubscriptionEntitlementRecord>();
  private readonly events = new Map<string, TestSubscriptionEventRecord>();

  async upsertCustomer(
    input: UpsertSubscriptionCustomerInput
  ): Promise<TestSubscriptionCustomerRecord> {
    const key = `${input.provider}:${input.externalCustomerId}`;
    const existing = this.customers.get(key);
    const now = new Date();
    const customer = {
      _id: existing?._id ?? `customer-${this.customers.size + 1}`,
      ...input,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    this.customers.set(key, customer);

    return customer;
  }

  async upsertProduct(
    input: UpsertSubscriptionProductInput
  ): Promise<TestSubscriptionProductRecord> {
    const key = `${input.provider}:${input.externalProductId}`;
    const existing = this.products.get(key);
    const now = new Date();
    const product = {
      _id: existing?._id ?? `product-${this.products.size + 1}`,
      ...input,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    this.products.set(key, product);

    return product;
  }

  async upsertEntitlement(
    input: UpsertSubscriptionEntitlementInput
  ): Promise<TestSubscriptionEntitlementRecord> {
    const key = `${input.userId}:${input.provider}:${input.entitlementKey}`;
    const existing = this.entitlements.get(key);
    const now = new Date();
    const entitlement = {
      _id: existing?._id ?? `entitlement-${this.entitlements.size + 1}`,
      ...input,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    this.entitlements.set(key, entitlement);

    return entitlement;
  }

  async listEntitlements(userId: string): Promise<TestSubscriptionEntitlementRecord[]> {
    return [...this.entitlements.values()].filter((entitlement) => entitlement.userId === userId);
  }

  async findEntitlement(
    userId: string,
    provider: "REVENUECAT",
    entitlementKey: string
  ): Promise<TestSubscriptionEntitlementRecord | null> {
    return this.entitlements.get(`${userId}:${provider}:${entitlementKey}`) ?? null;
  }

  async createEvent(input: CreateSubscriptionEventInput): Promise<TestSubscriptionEventRecord> {
    const key = `${input.provider}:${input.externalEventId}`;
    const event = {
      _id: `event-${this.events.size + 1}`,
      ...input
    };

    this.events.set(key, event);

    return event;
  }

  async findEvent(
    provider: TestSubscriptionEventRecord["provider"],
    externalEventId: string
  ): Promise<TestSubscriptionEventRecord | null> {
    return this.events.get(`${provider}:${externalEventId}`) ?? null;
  }
}
