import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const officialEmail = 'zoozoo@zaazaa.com'
  const officialPassword = '123456789.A'

  const user = await prisma.user.upsert({
    where: { email: officialEmail },
    update: {
      name: 'PRD Launch Test Account',
    },
    create: {
      email: officialEmail,
      name: 'PRD Launch Test Account',
    },
  })

  console.log(`✅ Official PRD Launch Test Account seeded: email=${user.email}, password=${officialPassword}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
