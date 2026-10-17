import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const testAccount = await prisma.user.upsert({
    where: { email: 'zoozoo@zaazaa.com' },
    update: {
      name: 'Official Launch PRD Test User',
      password: '123456789.A',
      role: 'admin',
    },
    create: {
      email: 'zoozoo@zaazaa.com',
      name: 'Official Launch PRD Test User',
      password: '123456789.A',
      role: 'admin',
    },
  })

  console.log('✅ Seeded persistent launch test account:', testAccount.email)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
