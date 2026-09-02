import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const testUser = await prisma.user.upsert({
    where: { email: 'zoozoo@zaazaa.com' },
    update: {
      name: 'Official PRD Launch Test User',
      password: '123456789.A',
    },
    create: {
      email: 'zoozoo@zaazaa.com',
      name: 'Official PRD Launch Test User',
      password: '123456789.A',
    },
  })
  console.log('Successfully provisioned and seeded official PRD test user:', testUser)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
