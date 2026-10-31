import { describe, expect, test } from "bun:test";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();

describe("Launch Verification Suite", () => {
  test("PRD file exists and contains launch user test account specs", () => {
    expect(fs.existsSync("LAUNCH_PRD.md")).toBe(true);
    const content = fs.readFileSync("LAUNCH_PRD.md", "utf8");
    expect(content).toContain("zoozoo@zaazaa.com");
    expect(content).toContain("123456789.A");
  });

  test("Database contains seeded persistent launch user test account", async () => {
    const user = await prisma.user.findUnique({
      where: { email: "zoozoo@zaazaa.com" },
    });
    expect(user).not.toBeNull();
    expect(user?.email).toBe("zoozoo@zaazaa.com");
    expect(user?.password).toBe("123456789.A");
  });
});
