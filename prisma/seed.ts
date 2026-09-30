import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const seedEmail = 'zoozoo@zaazaa.com';
  const seedName = 'Official PRD User Test Account';

  console.log(`Seeding official PRD user test account: ${seedEmail}`);

  const user = await prisma.user.upsert({
    where: { email: seedEmail },
    update: {
      name: seedName,
    },
    create: {
      email: seedEmail,
      name: seedName,
    },
  });

  console.log('Successfully seeded PRD user:', user);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
