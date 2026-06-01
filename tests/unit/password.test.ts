import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword, verifyPassword } from "../../src/utils/password";

describe("password utilities", () => {
  it("hashes passwords with a unique salt", async () => {
    const first = await hashPassword("correct-horse-battery-staple");
    const second = await hashPassword("correct-horse-battery-staple");

    assert.notEqual(first, "correct-horse-battery-staple");
    assert.notEqual(first, second);
    assert.match(first, /^scrypt\$/);
    assert.match(second, /^scrypt\$/);
  });

  it("verifies matching passwords and rejects mismatches", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");

    assert.equal(await verifyPassword("correct-horse-battery-staple", hash), true);
    assert.equal(await verifyPassword("wrong-password", hash), false);
  });

  it("rejects malformed hashes", async () => {
    assert.equal(await verifyPassword("password", "not-a-valid-hash"), false);
  });
});
