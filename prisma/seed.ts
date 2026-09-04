import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const testUser = await prisma.user.upsert({
    where: { email: 'zoozoo@zaazaa.com' },
    update: {
      name: 'PRD Official Launch Test User',
    },
    create: {
      email: 'zoozoo@zaazaa.com',
      name: 'PRD Official Launch Test User',
    },
  });

  console.log('Seeded persistent PRD launch test user:', testUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
