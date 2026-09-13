import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function main() {
  const launchUserEmail = 'zoozoo@zaazaa.com'
  const launchUserPassword = '123456789.A'

  const user = await prisma.user.upsert({
    where: { email: launchUserEmail },
    update: {
      name: 'Launch Test User',
      password: launchUserPassword,
      role: 'ADMIN',
    },
    create: {
      email: launchUserEmail,
      name: 'Launch Test User',
      password: launchUserPassword,
      role: 'ADMIN',
    },
  })

  console.log(`Successfully seeded launch user: ${user.email}`)
  return user
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
