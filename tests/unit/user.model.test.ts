import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { UserModel } from "../../src/models/user.model";

describe("UserModel", () => {
  it("defines email and status indexes", () => {
    const schemaIndexes = UserModel.schema.indexes() as Array<
      [Record<string, unknown>, Record<string, unknown>]
    >;
    const indexes = schemaIndexes.map(([fields]) => fields);
    const hasIndex = (expectedFields: Record<string, 1>): boolean =>
      indexes.some((fields) =>
        Object.entries(expectedFields).every(
          ([fieldName, direction]) => fields[fieldName] === direction
        )
      );

    assert.equal(hasIndex({ email: 1 }), true);
    assert.equal(hasIndex({ status: 1 }), true);
  });

  it("omits passwordHash by default", () => {
    const passwordPath = UserModel.schema.path("passwordHash");

    assert.equal(passwordPath.options.select, false);
  });
});
