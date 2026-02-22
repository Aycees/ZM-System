import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Seed default settings ---
  const settings = [
    { key: 'overtime_rate_per_hour', value: '100' },
    { key: 'oncall_rate_per_day', value: '0' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
    console.log(`  ✅ Setting: ${setting.key} = ${setting.value}`);
  }

  // --- Seed default admin account ---
  const adminUsername = 'admin';
  const adminPassword = 'admin123'; // Change this in production!

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`  ✅ Admin user created: ${adminUsername} / ${adminPassword}`);
  } else {
    console.log(`  ℹ️  Admin user already exists: ${adminUsername}`);
  }

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
