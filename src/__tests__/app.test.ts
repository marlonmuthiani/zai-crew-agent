import { describe, expect, test, beforeAll } from 'bun:test';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../../prisma/seed';

describe('Launch & Environment Readiness Tests', () => {
  beforeAll(async () => {
    await seedDatabase();
  });
  test('Prisma DB schema connects and PRD User exists', async () => {
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: 'zoozoo@zaazaa.com' },
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe('zoozoo@zaazaa.com');
    expect(user?.password).toBe('123456789.A');
    await prisma.$disconnect();
  });
});
