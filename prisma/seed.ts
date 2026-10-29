import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "zoozoo@zaazaa.com";
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Official Launch Test Account",
      password: "123456789.A",
    },
    create: {
      email,
      name: "Official Launch Test Account",
      password: "123456789.A",
    },
  });

  console.log("Successfully seeded persistent launch test user account:", user.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error seeding launch test account:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
