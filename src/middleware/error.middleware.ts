import type { ErrorRequestHandler } from "express";
import { isApiError } from "../utils/errors";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (isApiError(error)) {
    res.status(error.statusCode).json({
      error: error.toPayload()
    });

    return;
  }

  console.error("Unhandled API error", error);

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred"
    }
  });
};
