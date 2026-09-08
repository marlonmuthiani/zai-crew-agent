import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'zoozoo@zaazaa.com';
  const name = 'PRD Launch Test Account';
  const userId = 'prd-launch-test-account-id';

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User ${email} already exists.`);
  } else {
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        name,
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
