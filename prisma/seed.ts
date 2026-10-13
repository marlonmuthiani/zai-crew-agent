import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const seedEmail = 'zoozoo@zaazaa.com'
  const seedPassword = '123456789.A'

  const user = await prisma.user.upsert({
    where: { email: seedEmail },
    update: {
      name: 'PRD Official Test Admin',
      password: seedPassword,
      role: 'ADMIN',
    },
    create: {
      email: seedEmail,
      name: 'PRD Official Test Admin',
      password: seedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Seeded PRD Test User:', user)
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
