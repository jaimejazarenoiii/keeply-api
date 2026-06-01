export type UserStatus = "ACTIVE" | "DISABLED" | "DELETED";

export interface UserRecord {
  _id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
  passwordHash: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSessionRecord {
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

export interface AuthUserDto {
  id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
}

export interface AuthTokenDto {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUserDto;
}

export interface AccessTokenClaims {
  sub: string;
  email: string;
  name: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}
