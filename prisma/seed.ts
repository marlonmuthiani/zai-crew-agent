import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const testAccountEmail = 'zoozoo@zaazaa.com'
  const testAccountPassword = '123456789.A'

  const user = await prisma.user.upsert({
    where: { email: testAccountEmail },
    update: {
      password: testAccountPassword,
      name: 'Official Launch Test User',
      role: 'admin',
    },
    create: {
      email: testAccountEmail,
      name: 'Official Launch Test User',
      password: testAccountPassword,
      role: 'admin',
    },
  })

  console.log('Seeded persistent launch test account:', user.email)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error during seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
