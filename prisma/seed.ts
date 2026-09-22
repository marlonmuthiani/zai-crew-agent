import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const testEmail = 'zoozoo@zaazaa.com'
  const testPassword = '123456789.A'
  const user = await prisma.user.upsert({
    where: { email: testEmail },
    update: { name: 'PRD Test Account', password: testPassword },
    create: {
      email: testEmail,
      name: 'PRD Test Account',
      password: testPassword,
    },
  })
  console.log('Seeded Official PRD User Test Account:', user)
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
