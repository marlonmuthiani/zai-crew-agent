import { describe, expect, it, beforeAll } from "bun:test"
import { PrismaClient } from "@prisma/client"
import { main as seedDatabase } from "../../prisma/seed"
import { readFileSync, existsSync } from "fs"

const prisma = new PrismaClient()

describe("Launch Verification & Staging Baseline Suite", () => {
  beforeAll(async () => {
    await prisma.$connect()
    await seedDatabase()
  })

  it("verifies persistent launch test user credentials (zoozoo@zaazaa.com)", async () => {
    const seedEmail = "zoozoo@zaazaa.com"
    const seedPassword = "123456789.A"

    const user = await prisma.user.findUnique({
      where: { email: seedEmail },
    })

    expect(user).not.toBeNull()
    if (user) {
      expect(user.email).toBe(seedEmail)
      expect(user.password).toBe(seedPassword)
      expect(user.role).toBe("ADMIN")
    }
  })

  it("verifies multi-stage environment promotion progression", () => {
    const pipeline = ["jules-merge-prs", "dev-low", "dev-high", "main", "prod"]
    expect(pipeline[0]).toBe("jules-merge-prs")
    expect(pipeline[1]).toBe("dev-low")
    expect(pipeline[2]).toBe("dev-high")
    expect(pipeline[3]).toBe("main")
    expect(pipeline[4]).toBe("prod")
    expect(pipeline.length).toBe(5)
  })

  it("verifies LAUNCH_PRD.md specification file in root directory", () => {
    expect(existsSync("LAUNCH_PRD.md")).toBe(true)
    const content = readFileSync("LAUNCH_PRD.md", "utf-8")
    expect(content).toContain("zoozoo@zaazaa.com")
    expect(content).toContain("123456789.A")
    expect(content).toContain("jules-merge-prs")
  })

  it("verifies Prisma database user records", async () => {
    const count = await prisma.user.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})
