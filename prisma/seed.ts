import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** Creates or updates the official PRD test user in the configured database. */
async function main() {
  const testUser = await prisma.user.upsert({
    where: { email: 'zoozoo@zaazaa.com' },
    update: {
      name: 'Official PRD Lead Tester',
      password: '123456789.A',
    },
    create: {
      email: 'zoozoo@zaazaa.com',
      name: 'Official PRD Lead Tester',
      password: '123456789.A',
    },
  })

  console.log('Seeded official test user:', testUser)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
