import { PrismaClient, UserRole, UserType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create initial admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "Example",
      email: "admin@example.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
      userType: UserType.ADMIN,
      isActive: true,
    },
  });

  console.log("✅ Created admin user:", adminUser.email);

  // Create sample users for testing (optional)
  const sampleUsers = [
    {
      firstName: "John",
      lastName: "Editor",
      email: "editor@example.com",
      role: UserRole.EDITOR,
    },
    {
      firstName: "Jane",
      lastName: "Approver",
      email: "approver@example.com",
      role: UserRole.APPROVER,
    },
    {
      firstName: "Bob",
      lastName: "Viewer",
      email: "viewer@example.com",
      role: UserRole.VIEWER,
    },
  ];

  for (const userData of sampleUsers) {
    const hashedSamplePassword = await bcrypt.hash("password123", 12);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: hashedSamplePassword,
        userType: UserType.USER,
        isActive: true,
        createdBy: adminUser.id,
      },
    });

    console.log("✅ Created sample user:", user.email);
  }

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
