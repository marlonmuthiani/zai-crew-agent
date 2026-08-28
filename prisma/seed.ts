import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Official Launch Test Account Credentials
const TEST_USER_EMAIL = 'zoozoo@zaazaa.com';
const TEST_USER_PASSWORD = '123456789.A';

async function main() {
  console.log('Seeding official PRD launch test user...');
  console.log(`Credentials -> Email: ${TEST_USER_EMAIL} | Password: ${TEST_USER_PASSWORD}`);

  const testUser = await prisma.user.upsert({
    where: { email: TEST_USER_EMAIL },
    update: {
      name: 'PRD Official Launch Test Account',
    },
    create: {
      email: TEST_USER_EMAIL,
      name: 'PRD Official Launch Test Account',
    },
  });

  console.log(`Seeded launch test user: ${testUser.email} (ID: ${testUser.id})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
