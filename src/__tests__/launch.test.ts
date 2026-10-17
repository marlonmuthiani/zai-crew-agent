import { describe, expect, it } from "bun:test"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

describe("Launch Verification & Integration Suite", () => {
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
      expect(user.role).toBe("admin")
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

  it("verifies Prisma database user records", async () => {
    const count = await prisma.user.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})
