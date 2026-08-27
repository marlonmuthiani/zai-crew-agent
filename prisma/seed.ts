import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const testUser = await prisma.user.upsert({
    where: { email: 'zoozoo@zaazaa.com' },
    update: {
      name: 'PRD Official Launch Tester',
      password: '123456789.A',
      role: 'admin',
    },
    create: {
      email: 'zoozoo@zaazaa.com',
      name: 'PRD Official Launch Tester',
      password: '123456789.A',
      role: 'admin',
    },
  });

  console.log('✅ Persistent PRD Launch Test Account seeded successfully:', testUser.email);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
