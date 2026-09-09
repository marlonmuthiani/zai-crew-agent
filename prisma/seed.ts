import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'zoozoo@zaazaa.com';
  const name = 'PRD Launch Test Account';
  const password = '123456789.A';
  const userId = 'prd-launch-test-account-id';

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: { name, password },
    });
    console.log(`User ${email} updated with persistent test credentials.`);
  } else {
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        name,
        password,
      },
    });
    console.log(`Successfully seeded persistent test user: ${user.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
