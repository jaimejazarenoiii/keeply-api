import type { ApiErrorPayload } from "./errors";
import type { ItemPath, NodeDto, TreeNode } from "./node";

export interface ApiSuccessResponse<TData> {
  data: TData;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

export type NodeResponse = ApiSuccessResponse<NodeDto>;

export type NodeListResponse = ApiSuccessResponse<NodeDto[]>;

export type SpaceListResponse = ApiSuccessResponse<NodeDto[]>;

export type TreeResponse = ApiSuccessResponse<TreeNode>;

export type ItemPathResponse = ApiSuccessResponse<ItemPath>;
