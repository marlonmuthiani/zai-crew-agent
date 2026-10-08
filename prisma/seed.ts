import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'zoozoo@zaazaa.com';
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Official PRD User',
    },
    create: {
      email,
      name: 'Official PRD User',
    },
  });

  console.log(`✅ Provisioned Official PRD User Test Account: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
