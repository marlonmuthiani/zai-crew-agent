import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function main() {
  const seedEmail = "zoozoo@zaazaa.com";
  const seedPassword = "123456789.A";

  const user = await prisma.user.upsert({
    where: { email: seedEmail },
    update: {
      name: "PRD Official Test Admin",
      password: seedPassword,
      role: "ADMIN",
    },
    create: {
      email: seedEmail,
      name: "PRD Official Test Admin",
      password: seedPassword,
      role: "ADMIN",
    },
  });

  console.log("Successfully seeded persistent launch test user account:", user.email);
  return user;
}

if (require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error("Error seeding launch test account:", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
