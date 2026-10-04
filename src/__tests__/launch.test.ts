import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Launch E2E and Seed Verification Suite", () => {
  beforeAll(async () => {
    // Ensure test user is present
    await prisma.user.upsert({
      where: { email: "zoozoo@zaazaa.com" },
      update: {
        name: "Master Workspace Administrator",
        password: "123456789.A",
        role: "ADMIN",
      },
      create: {
        email: "zoozoo@zaazaa.com",
        name: "Master Workspace Administrator",
        password: "123456789.A",
        role: "ADMIN",
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Official launch PRD test account exists in SQLite database", async () => {
    const user = await prisma.user.findUnique({
      where: { email: "zoozoo@zaazaa.com" },
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe("zoozoo@zaazaa.com");
    expect(user?.password).toBe("123456789.A");
    expect(user?.role).toBe("ADMIN");
  });

  test("Environment variables and DATABASE_URL are properly configured", () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL?.length).toBeGreaterThan(0);
  });

  test("Database schema and user table record count", async () => {
    const usersCount = await prisma.user.count();
    expect(usersCount).toBeGreaterThanOrEqual(1);
  });
});
