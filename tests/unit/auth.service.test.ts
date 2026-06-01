import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthService } from "../../src/modules/auth/auth.service";
import { InMemoryAuthStore } from "../helpers/in-memory-auth-store";
import { createTestAuthTokenConfig } from "../helpers/auth";

function createService() {
  const store = new InMemoryAuthStore();

  return {
    store,
    service: new AuthService(store, createTestAuthTokenConfig())
  };
}

describe("AuthService", () => {
  it("registers a user and rejects duplicate emails", async () => {
    const { service } = createService();

    const first = await service.register({
      email: "CJ@example.com",
      password: "correct-horse-battery-staple",
      name: "CJ"
    });

    assert.equal(first.user.email, "cj@example.com");
    assert.equal(first.tokenType, "Bearer");
    await assert.rejects(
      () =>
        service.register({
          email: "cj@example.com",
          password: "correct-horse-battery-staple",
          name: "CJ"
        }),
      /Email is already registered/
    );
  });

  it("rejects invalid credentials", async () => {
    const { service } = createService();

    await service.register({
      email: "cj@example.com",
      password: "correct-horse-battery-staple",
      name: "CJ"
    });

    await assert.rejects(
      () =>
        service.login({
          email: "cj@example.com",
          password: "wrong-password"
        }),
      /Invalid email or password/
    );
  });

  it("rotates refresh tokens", async () => {
    const { service } = createService();
    const registered = await service.register({
      email: "cj@example.com",
      password: "correct-horse-battery-staple",
      name: "CJ"
    });

    const refreshed = await service.refresh({
      refreshToken: registered.refreshToken
    });

    assert.notEqual(refreshed.refreshToken, registered.refreshToken);
    await assert.rejects(
      () =>
        service.refresh({
          refreshToken: registered.refreshToken
        }),
      /Session is expired or revoked/
    );
  });

  it("rejects disabled users during login", async () => {
    const { service, store } = createService();

    await store.createUser({
      _id: "user-1",
      email: "cj@example.com",
      name: "CJ",
      passwordHash: "unused",
      status: "DISABLED"
    });

    await assert.rejects(
      () =>
        service.login({
          email: "cj@example.com",
          password: "correct-horse-battery-staple"
        }),
      /Invalid email or password/
    );
  });
});
