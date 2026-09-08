import { describe, it, expect } from "bun:test";
import { PrismaClient } from "@prisma/client";

describe("Launch Readiness & Database Seeding Integration Tests", () => {
  it("should verify process environment configuration", () => {
    expect(process.env.DATABASE_URL).toBeDefined();
  });

  it("should verify persistent test user seeding via Prisma", async () => {
    const prisma = new PrismaClient();
    try {
      const email = "zoozoo@zaazaa.com";
      const user = await prisma.user.findUnique({
        where: { email },
      });
      expect(user).not.toBeNull();
      expect(user?.email).toBe(email);
    } finally {
      await prisma.$disconnect();
    }
  });
});
