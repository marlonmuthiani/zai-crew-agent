import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'zoozoo@zaazaa.com';

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'PRD Official Test User',
    },
    create: {
      email,
      name: 'PRD Official Test User',
    },
  });

  console.log(`✅ Provisioned persistent PRD test account: ${user.email} (ID: ${user.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
