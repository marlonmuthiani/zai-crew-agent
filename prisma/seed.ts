import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "zoozoo@zaazaa.com";
  const password = "123456789.A";

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Master Workspace Administrator",
      password,
      role: "ADMIN",
    },
    create: {
      email,
      name: "Master Workspace Administrator",
      password,
      role: "ADMIN",
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
