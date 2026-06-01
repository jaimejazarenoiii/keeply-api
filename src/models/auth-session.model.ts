import { HydratedDocument, Model, Schema, model, models } from "mongoose";
import type { AuthSessionRecord } from "../types/auth";

export type AuthSessionDocument = HydratedDocument<AuthSessionRecord>;

export type AuthSessionModel = Model<AuthSessionRecord>;

const authSessionSchema = new Schema<AuthSessionRecord>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      trim: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    revokedAt: {
      type: Date,
      default: null
    }
  },
  {
    collection: "auth_sessions",
    timestamps: true
  }
);

authSessionSchema.index({ userId: 1, revokedAt: 1 });

export const AuthSessionModel =
  (models.AuthSession as AuthSessionModel | undefined) ??
  model<AuthSessionRecord>("AuthSession", authSessionSchema);
