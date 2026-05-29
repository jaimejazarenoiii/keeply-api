export type ApiErrorCode =
  | "INVALID_MOVE"
  | "CIRCULAR_REFERENCE"
  | "NOT_FOUND"
  | "INVALID_PARENT_TYPE"
  | "SPACE_MISMATCH"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}
