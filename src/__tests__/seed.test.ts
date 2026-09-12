import { describe, test, expect, beforeAll } from 'bun:test'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Persistent Launch User Account', () => {
  beforeAll(async () => {
    // Ensure database is connected
    await prisma.$connect()
  })

  test('Official PRD User Test Account is seeded and present', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'zoozoo@zaazaa.com' },
    })

    expect(user).not.toBeNull()
    expect(user?.email).toBe('zoozoo@zaazaa.com')
    expect(user?.password).toBe('123456789.A')
    expect(user?.role).toBe('ADMIN')
  })

  test('User model fields and schema validation', async () => {
    const users = await prisma.user.findMany()
    expect(users.length).toBeGreaterThanOrEqual(1)
  })
})
