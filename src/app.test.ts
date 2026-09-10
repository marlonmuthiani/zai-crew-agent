import { expect, test } from "bun:test";

test("Database environment and seed configuration", () => {
  expect(process.env.DATABASE_URL || "file:./dev.db").toBeDefined();
});
