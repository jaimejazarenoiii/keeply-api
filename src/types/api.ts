import type { ApiErrorPayload } from "./errors";
import type { AuthTokenDto, AuthUserDto } from "./auth";
import type { ItemPath, NodeDto, TreeNode } from "./node";
import type { SubscriptionEventAcceptedDto, SubscriptionStatusDto } from "./subscription";

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

export type AuthTokenResponse = ApiSuccessResponse<AuthTokenDto>;

export type AuthUserResponse = ApiSuccessResponse<AuthUserDto>;

export type SubscriptionStatusResponse = ApiSuccessResponse<SubscriptionStatusDto>;

export type SubscriptionEventAcceptedResponse = ApiSuccessResponse<SubscriptionEventAcceptedDto>;
