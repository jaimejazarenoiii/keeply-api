import { AuthSessionModel } from "./auth-session.model";
import { UserModel } from "./user.model";
import type { AuthSessionRecord, UserRecord } from "../types/auth";

export type CreateUserInput = Omit<UserRecord, "createdAt" | "updatedAt">;

export type CreateAuthSessionInput = Omit<AuthSessionRecord, "createdAt" | "updatedAt">;

export interface AuthStore {
  createUser(input: CreateUserInput): Promise<UserRecord>;
  findUserById(id: string): Promise<UserRecord | null>;
  findUserByEmail(email: string, includePasswordHash?: boolean): Promise<UserRecord | null>;
  createSession(input: CreateAuthSessionInput): Promise<AuthSessionRecord>;
  findSessionByRefreshTokenHash(hash: string): Promise<AuthSessionRecord | null>;
  revokeSession(id: string, revokedAt?: Date): Promise<AuthSessionRecord | null>;
}

function normalizeUserRecord(user: unknown): UserRecord {
  const raw = user as UserRecord & {
    _id: { toString(): string };
    createdAt?: Date;
    updatedAt?: Date;
  };

  return {
    ...raw,
    _id: raw._id.toString(),
    createdAt: raw.createdAt ?? new Date(),
    updatedAt: raw.updatedAt ?? new Date()
  };
}

function normalizeAuthSessionRecord(session: unknown): AuthSessionRecord {
  const raw = session as AuthSessionRecord & {
    _id: { toString(): string };
    createdAt?: Date;
    updatedAt?: Date;
  };

  return {
    ...raw,
    _id: raw._id.toString(),
    createdAt: raw.createdAt ?? new Date(),
    updatedAt: raw.updatedAt ?? new Date()
  };
}

export class MongooseAuthStore implements AuthStore {
  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const user = await UserModel.create(input);
    const rawUser = user.toObject() as UserRecord;

    return normalizeUserRecord(rawUser);
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const user = await UserModel.findById(id).lean();

    return user ? normalizeUserRecord(user) : null;
  }

  async findUserByEmail(email: string, includePasswordHash = false): Promise<UserRecord | null> {
    const query = UserModel.findOne({ email: email.toLowerCase() });
    const user = await (includePasswordHash ? query.select("+passwordHash") : query).lean();

    return user ? normalizeUserRecord(user) : null;
  }

  async createSession(input: CreateAuthSessionInput): Promise<AuthSessionRecord> {
    const session = await AuthSessionModel.create(input);

    return normalizeAuthSessionRecord(session.toObject());
  }

  async findSessionByRefreshTokenHash(hash: string): Promise<AuthSessionRecord | null> {
    const session = await AuthSessionModel.findOne({ refreshTokenHash: hash }).lean();

    return session ? normalizeAuthSessionRecord(session) : null;
  }

  async revokeSession(id: string, revokedAt: Date = new Date()): Promise<AuthSessionRecord | null> {
    const session = await AuthSessionModel.findByIdAndUpdate(
      id,
      { revokedAt },
      {
        new: true,
        runValidators: true
      }
    ).lean();

    return session ? normalizeAuthSessionRecord(session) : null;
  }
}

export const authStore = new MongooseAuthStore();
