import type { ApiErrorPayload } from "./errors";
import type { ItemPath, NodeRecord, TreeNode } from "./node";

export interface ApiSuccessResponse<TData> {
  data: TData;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

export type NodeResponse = ApiSuccessResponse<NodeRecord>;

export type SpaceListResponse = ApiSuccessResponse<NodeRecord[]>;

export type TreeResponse = ApiSuccessResponse<TreeNode>;

export type ItemPathResponse = ApiSuccessResponse<ItemPath>;
