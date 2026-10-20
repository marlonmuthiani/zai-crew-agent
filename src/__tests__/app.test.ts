import { describe, expect, test } from 'bun:test';
import { PrismaClient } from '@prisma/client';

describe('Launch & Environment Readiness Tests', () => {
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
