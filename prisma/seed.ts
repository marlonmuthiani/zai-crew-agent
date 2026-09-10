import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const testEmail = 'zoozoo@zaazaa.com';
  const testPassword = '123456789.A';

  const user = await prisma.user.upsert({
    where: { email: testEmail },
    update: {
      name: 'PRD Official Test User',
      password: testPassword,
    },
    create: {
      email: testEmail,
      name: 'PRD Official Test User',
      password: testPassword,
    },
  });

  console.log('Seeded persistent test user:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
