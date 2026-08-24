import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const officialUser = await prisma.user.upsert({
    where: { email: 'zoozoo@zaazaa.com' },
    update: {
      name: 'Official PRD Launch User',
    },
    create: {
      email: 'zoozoo@zaazaa.com',
      name: 'Official PRD Launch User',
    },
  });

  console.log('Official PRD Launch User seeded successfully:', officialUser);
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
