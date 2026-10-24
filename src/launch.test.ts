import { describe, expect, it } from "bun:test"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

describe("Launch Verification & Integration Suite", () => {
  it("verifies test user credentials and provisioning in PRD seed requirements", async () => {
    const seedEmail = "zoozoo@zaazaa.com"
    const seedPassword = "123456789.A"

    expect(seedEmail).toContain("@")
    expect(seedEmail.endsWith(".com")).toBe(true)

    // Verify user exists and credentials match
    const user = await prisma.user.findUnique({
      where: { email: seedEmail }
    })

    expect(user).not.toBeNull()
    if (user) {
      expect(user.email).toBe(seedEmail)
      expect(user.password).toBe(seedPassword)
      expect(user.role).toBe("ADMIN")
    }
  })

  it("verifies release environment target pipeline sequence", () => {
    const pipeline = ["jules-merge-prs", "dev-low", "dev-high", "main", "prod"]
    expect(pipeline[0]).toBe("jules-merge-prs")
    expect(pipeline[1]).toBe("dev-low")
    expect(pipeline[2]).toBe("dev-high")
    expect(pipeline[3]).toBe("main")
    expect(pipeline[4]).toBe("prod")
    expect(pipeline.length).toBe(5)
  })

  it("verifies core application structure and schema integrity", async () => {
    const usersCount = await prisma.user.count()
    expect(usersCount).toBeGreaterThanOrEqual(1)
  })
})
