import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ApiErrorResponse, AuthTokenResponse, AuthUserResponse } from "../../src/types/api";
import { authHeaders, createAuthTestApp } from "../helpers/auth";
import { requestJson } from "../helpers/http";

describe("Auth API", () => {
  it("registers, returns the current user, refreshes, and logs out", async () => {
    const { app } = createAuthTestApp();
    const registered = await requestJson<AuthTokenResponse>(app, "POST", "/auth/register", {
      email: "CJ@example.com",
      password: "correct-horse-battery-staple",
      name: "CJ",
      profileImageUrl: "https://example.com/cj.jpg"
    });

    assert.equal(registered.status, 201);
    assert.equal(registered.body.data.user.email, "cj@example.com");
    assert.equal(registered.body.data.user.name, "CJ");
    assert.equal(registered.body.data.user.profileImageUrl, "https://example.com/cj.jpg");
    assert.equal(registered.body.data.tokenType, "Bearer");
    assert.equal(typeof registered.body.data.accessToken, "string");
    assert.equal(typeof registered.body.data.refreshToken, "string");

    const me = await requestJson<AuthUserResponse>(app, "GET", "/auth/me", undefined, {
      headers: authHeaders(registered.body.data)
    });

    assert.equal(me.status, 200);
    assert.equal(me.body.data.email, "cj@example.com");

    const refreshed = await requestJson<AuthTokenResponse>(app, "POST", "/auth/refresh", {
      refreshToken: registered.body.data.refreshToken
    });

    assert.equal(refreshed.status, 200);
    assert.notEqual(refreshed.body.data.refreshToken, registered.body.data.refreshToken);

    const logout = await requestJson<undefined>(app, "POST", "/auth/logout", {
      refreshToken: refreshed.body.data.refreshToken
    });

    assert.equal(logout.status, 204);

    const reused = await requestJson<ApiErrorResponse>(app, "POST", "/auth/refresh", {
      refreshToken: refreshed.body.data.refreshToken
    });

    assert.equal(reused.status, 401);
    assert.equal(reused.body.error.code, "SESSION_REVOKED");
  });

  it("rejects duplicate registration and invalid credentials", async () => {
    const { app } = createAuthTestApp();

    await requestJson<AuthTokenResponse>(app, "POST", "/auth/register", {
      email: "cj@example.com",
      password: "correct-horse-battery-staple",
      name: "CJ"
    });

    const duplicate = await requestJson<ApiErrorResponse>(app, "POST", "/auth/register", {
      email: "CJ@example.com",
      password: "correct-horse-battery-staple",
      name: "CJ"
    });

    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, "EMAIL_ALREADY_EXISTS");

    const invalidLogin = await requestJson<ApiErrorResponse>(app, "POST", "/auth/login", {
      email: "cj@example.com",
      password: "wrong-password"
    });

    assert.equal(invalidLogin.status, 401);
    assert.equal(invalidLogin.body.error.code, "INVALID_CREDENTIALS");
  });

  it("requires bearer auth for current user", async () => {
    const { app } = createAuthTestApp();
    const response = await requestJson<ApiErrorResponse>(app, "GET", "/auth/me");

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, "AUTHENTICATION_REQUIRED");
  });
});
