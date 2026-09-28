import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'zoozoo@zaazaa.com'
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Official PRD User Test Account',
      password: '123456789.A',
    },
    create: {
      email,
      name: 'Official PRD User Test Account',
      password: '123456789.A',
    },
  })
  console.log('Seeded test user:', user)
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
