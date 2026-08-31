import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const testUserEmail = 'zoozoo@zaazaa.com'
  const user = await prisma.user.upsert({
    where: { email: testUserEmail },
    update: {
      name: 'PRD Test User',
      password: '123456789.A',
    },
    create: {
      email: testUserEmail,
      name: 'PRD Test User',
      password: '123456789.A',
    },
  })
  console.log('Seeded persistent test account:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
