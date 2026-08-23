import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding official launch user test account...')

  const testUser = await prisma.user.upsert({
    where: { email: 'zoozoo@zaazaa.com' },
    update: {
      name: 'Official PRD User Test Account',
      password: '123456789.A',
    },
    create: {
      email: 'zoozoo@zaazaa.com',
      name: 'Official PRD User Test Account',
      password: '123456789.A',
    },
  })

  console.log('Official launch user test account seeded successfully:', testUser.email)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
