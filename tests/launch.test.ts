import { describe, expect, test } from "bun:test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Launch Readiness & Database Persistence Verification", () => {
  test("Official PRD Test User is provisioned and active", async () => {
    const user = await prisma.user.findUnique({
      where: { email: "zoozoo@zaazaa.com" },
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe("zoozoo@zaazaa.com");
    expect(user?.name).toBe("PRD Official Test User");
  });
});
