import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'zoozoo@zaazaa.com';
  const name = 'Official PRD User Test Account';

  const password = '123456789.A';

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password,
    },
    create: {
      email,
      name,
      password,
    },
  });

  console.log(`Seeded test account: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
