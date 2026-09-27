import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const testEmail = 'zoozoo@zaazaa.com';
  const testName = 'PRD Test Account';
  const testPassword = '123456789.A';

  const user = await prisma.user.upsert({
    where: { email: testEmail },
    update: {
      name: testName,
      password: testPassword,
    },
    create: {
      email: testEmail,
      name: testName,
      password: testPassword,
    },
  });

  console.log(`Persistent PRD Launch Test Account provisioned: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
