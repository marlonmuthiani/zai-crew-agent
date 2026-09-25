import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'zoozoo@zaazaa.com' },
    update: {
      name: 'Official PRD Test User',
      password: '123456789.A',
    },
    create: {
      email: 'zoozoo@zaazaa.com',
      name: 'Official PRD Test User',
      password: '123456789.A',
    },
  });

  console.log('Seeded PRD Test User:', user.email);
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
