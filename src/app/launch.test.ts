import { describe, test, expect } from 'bun:test'
import { PrismaClient } from '@prisma/client'

describe('Launch Readiness Sanity Tests', () => {
  test('Prisma DB has seeded official test user', async () => {
    const prisma = new PrismaClient()
    const user = await prisma.user.findUnique({
      where: { email: 'zoozoo@zaazaa.com' },
    })
    expect(user).not.toBeNull()
    expect(user?.email).toBe('zoozoo@zaazaa.com')
    expect(user?.password).toBe('123456789.A')
    await prisma.$disconnect()
  })
})
