import { HydratedDocument, Model, Schema, model, models } from "mongoose";
import type { UserRecord, UserStatus } from "../types/auth";

export type UserDocument = HydratedDocument<UserRecord>;

export type UserModel = Model<UserRecord>;

const userStatuses: UserStatus[] = ["ACTIVE", "DISABLED", "DELETED"];

const userSchema = new Schema<UserRecord>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    profileImageUrl: {
      type: String,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    status: {
      type: String,
      enum: userStatuses,
      default: "ACTIVE",
      required: true,
      index: true
    }
  },
  {
    collection: "users",
    timestamps: true
  }
);

export const UserModel =
  (models.User as UserModel | undefined) ?? model<UserRecord>("User", userSchema);
