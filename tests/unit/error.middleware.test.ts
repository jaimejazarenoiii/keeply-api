import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NextFunction, Request, Response } from "express";
import { errorMiddleware } from "../../src/middleware/error.middleware";
import { ApiError } from "../../src/utils/errors";

interface CapturedResponse {
  statusCode?: number;
  body?: unknown;
}

function createResponse(): Response & CapturedResponse {
  const captured: CapturedResponse = {};

  return {
    status(statusCode: number) {
      captured.statusCode = statusCode;
      return this;
    },
    json(body: unknown) {
      captured.body = body;
      return this;
    },
    get statusCode() {
      return captured.statusCode;
    },
    get body() {
      return captured.body;
    }
  } as Response & CapturedResponse;
}

describe("errorMiddleware", () => {
  it("normalizes ApiError responses", () => {
    const response = createResponse();
    const error = new ApiError(400, "VALIDATION_ERROR", "Invalid input");

    errorMiddleware(error, {} as Request, response, (() => undefined) as NextFunction);

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input"
      }
    });
  });
});
