import { describe, test, expect } from 'bun:test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

describe('Launch Readiness & PRD Compliance', () => {
  test('LAUNCH_PRD.md exists and contains official test account credentials', () => {
    const prdPath = path.join(process.cwd(), 'LAUNCH_PRD.md');
    expect(fs.existsSync(prdPath)).toBe(true);

    const prdContent = fs.readFileSync(prdPath, 'utf-8');
    expect(prdContent).toContain('zoozoo@zaazaa.com');
    expect(prdContent).toContain('123456789.A');
    expect(prdContent).toContain('jules-merge-prs');
  });

  test('Official PRD user test account is provisioned in the database', async () => {
    const prisma = new PrismaClient();
    try {
      const testUser = await prisma.user.findUnique({
        where: { email: 'zoozoo@zaazaa.com' },
      });
      expect(testUser).not.toBeNull();
      expect(testUser?.email).toBe('zoozoo@zaazaa.com');
    } finally {
      await prisma.$disconnect();
    }
  });

  test('Package.json includes db:seed configuration', () => {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkgJson.scripts['db:seed']).toBe('bun prisma/seed.ts');
  });
});
