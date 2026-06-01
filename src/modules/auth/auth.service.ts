import { createHash, randomBytes } from "node:crypto";
import { Types } from "mongoose";
import type { AccessTokenConfig } from "../../utils/tokens";
import type { AuthStore } from "../../models/auth.store";
import { authStore } from "../../models/auth.store";
import type { AuthTokenDto, AuthUserDto, UserRecord } from "../../types/auth";
import { ApiError } from "../../utils/errors";
import { hashPassword, verifyPassword } from "../../utils/password";
import { signAccessToken } from "../../utils/tokens";
import { requireNonEmptyString } from "../../utils/validation";

export interface RegisterUserInput {
  email: unknown;
  password: unknown;
  name: unknown;
  profileImageUrl?: unknown;
  userAgent?: string;
  ipAddress?: string;
}

export interface LoginUserInput {
  email: unknown;
  password: unknown;
  userAgent?: string;
  ipAddress?: string;
}

export interface RefreshSessionInput {
  refreshToken: unknown;
  userAgent?: string;
  ipAddress?: string;
}

export interface LogoutInput {
  refreshToken: unknown;
}

export class AuthService {
  constructor(
    private readonly store: AuthStore = authStore,
    private readonly tokenConfig?: AccessTokenConfig & { refreshTokenTtlDays: number }
  ) {}

  async register(input: RegisterUserInput): Promise<AuthTokenDto> {
    const email = normalizeEmail(input.email);
    await this.ensureEmailAvailable(email);

    const user = await this.createRegisteredUser(input, email);
    return this.issueTokenPair(user, input.userAgent, input.ipAddress);
  }

  async login(input: LoginUserInput): Promise<AuthTokenDto> {
    const email = normalizeEmail(input.email);
    const password = requirePassword(input.password);
    const user = await this.store.findUserByEmail(email, true);

    const activeUser = await this.ensureValidLogin(user, password);

    return this.issueTokenPair(activeUser, input.userAgent, input.ipAddress);
  }

  async refresh(input: RefreshSessionInput): Promise<AuthTokenDto> {
    const refreshToken = requireNonEmptyString(input.refreshToken, "refreshToken");
    const session = await this.store.findSessionByRefreshTokenHash(hashRefreshToken(refreshToken));

    ensureUsableSession(session);

    const user = await this.store.findUserById(session.userId);

    ensureSessionUser(user);

    await this.store.revokeSession(session._id);

    return this.issueTokenPair(user, input.userAgent, input.ipAddress);
  }

  async logout(input: LogoutInput): Promise<void> {
    const refreshToken = requireNonEmptyString(input.refreshToken, "refreshToken");
    const session = await this.store.findSessionByRefreshTokenHash(hashRefreshToken(refreshToken));

    if (!session) {
      throw new ApiError(401, "SESSION_REVOKED", "Session is expired or revoked");
    }

    await this.store.revokeSession(session._id);
  }

  async getCurrentUser(userId: string): Promise<AuthUserDto> {
    const user = await this.store.findUserById(userId);

    ensureActiveTokenUser(user);

    return toAuthUserDto(user);
  }

  private async ensureEmailAvailable(email: string): Promise<void> {
    if (await this.store.findUserByEmail(email)) {
      throw new ApiError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered");
    }
  }

  private async createRegisteredUser(input: RegisterUserInput, email: string): Promise<UserRecord> {
    const password = requirePassword(input.password);

    return this.store.createUser({
      _id: new Types.ObjectId().toHexString(),
      email,
      name: requireNonEmptyString(input.name, "name"),
      ...(input.profileImageUrl
        ? { profileImageUrl: requireNonEmptyString(input.profileImageUrl, "profileImageUrl") }
        : {}),
      passwordHash: await hashPassword(password),
      status: "ACTIVE"
    });
  }

  private async ensureValidLogin(user: UserRecord | null, password: string): Promise<UserRecord> {
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throwInvalidCredentials();
    }

    if (user.status !== "ACTIVE") {
      throwInvalidCredentials();
    }

    return user;
  }

  private async issueTokenPair(
    user: UserRecord,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthTokenDto> {
    const config = await this.getTokenConfig();
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

    await this.store.createSession({
      _id: new Types.ObjectId().toHexString(),
      userId: user._id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      ...(userAgent ? { userAgent } : {}),
      ...(ipAddress ? { ipAddress } : {}),
      expiresAt
    });

    return {
      accessToken: await signAccessToken(
        {
          sub: user._id,
          email: user.email,
          name: user.name
        },
        config
      ),
      refreshToken,
      tokenType: "Bearer",
      expiresIn: config.accessTokenTtlSeconds,
      user: toAuthUserDto(user)
    };
  }

  private async getTokenConfig(): Promise<AccessTokenConfig & { refreshTokenTtlDays: number }> {
    if (this.tokenConfig) {
      return this.tokenConfig;
    }

    const { env } = await import("../../config/env.js");

    return env.jwt;
  }
}

function normalizeEmail(value: unknown): string {
  const email = requireNonEmptyString(value, "email").toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "VALIDATION_ERROR", "email must be a valid email address");
  }

  return email;
}

function requirePassword(value: unknown): string {
  const password = requireNonEmptyString(value, "password");

  if (password.length < 8) {
    throw new ApiError(400, "VALIDATION_ERROR", "password must be at least 8 characters");
  }

  return password;
}

function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashRefreshToken(refreshToken: string): string {
  return createHash("sha256").update(refreshToken).digest("hex");
}

function ensureUsableSession(
  session: Awaited<ReturnType<AuthStore["findSessionByRefreshTokenHash"]>>
): asserts session is NonNullable<typeof session> {
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new ApiError(401, "SESSION_REVOKED", "Session is expired or revoked");
  }
}

function ensureSessionUser(user: UserRecord | null): asserts user is UserRecord {
  if (!user || user.status !== "ACTIVE") {
    throw new ApiError(401, "SESSION_REVOKED", "Session is expired or revoked");
  }
}

function ensureActiveTokenUser(user: UserRecord | null): asserts user is UserRecord {
  if (!user || user.status !== "ACTIVE") {
    throw new ApiError(401, "INVALID_TOKEN", "Invalid or expired access token");
  }
}

function throwInvalidCredentials(): never {
  throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
}

function toAuthUserDto(user: UserRecord): AuthUserDto {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    ...(user.profileImageUrl ? { profileImageUrl: user.profileImageUrl } : {})
  };
}

export const authService = new AuthService();
