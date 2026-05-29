import { HydratedDocument, Model, Schema, Types, model, models } from "mongoose";
import type { NodeImage, NodeRecord, NodeType } from "../types/node";

export type NodeDocument = HydratedDocument<NodeRecord>;

export type NodeModel = Model<NodeRecord>;

const nodeTypes: NodeType[] = ["SPACE", "CONTAINER", "ITEM"];

const imageSchema = new Schema<NodeImage>(
  {
    id: {
      type: String,
      default: () => new Types.ObjectId().toHexString(),
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    altText: {
      type: String,
      trim: true
    },
    sortOrder: {
      type: Number,
      required: true,
      min: 0
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
      required: true
    }
  },
  {
    _id: false
  }
);

const nodeSchema = new Schema<NodeRecord>(
  {
    type: {
      type: String,
      enum: nodeTypes,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    parentId: {
      type: String,
      default: null
    },
    spaceId: {
      type: String,
      required: true,
      index: true
    },
    images: {
      type: [imageSchema],
      default: []
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    collection: "nodes",
    timestamps: true
  }
);

nodeSchema.index({ parentId: 1 });
nodeSchema.index({ spaceId: 1, parentId: 1 });
nodeSchema.index({ type: 1, spaceId: 1 });

export const NodeModel =
  (models.Node as NodeModel | undefined) ?? model<NodeRecord>("Node", nodeSchema);
