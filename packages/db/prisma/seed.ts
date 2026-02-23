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

  // --- Seed default employees ---
  const employees = [
    {
      fullName: 'Maria Santos',
      address: '123 Rizal St, Barangay San Jose, Manila',
      contactNumber: '09171234567',
      emergencyContact: 'Pedro Santos - 09179876543',
      position: 'Warehouse Staff',
      dailyRate: 650,
      hireDate: new Date('2023-01-15'),
    },
    {
      fullName: 'Juan dela Cruz',
      address: '456 Mabini Ave, Barangay Poblacion, Quezon City',
      contactNumber: '09281234567',
      emergencyContact: 'Rosa dela Cruz - 09289876543',
      position: 'Delivery Driver',
      dailyRate: 700,
      hireDate: new Date('2022-06-01'),
    },
    {
      fullName: 'Ana Reyes',
      address: '789 Bonifacio Blvd, Barangay Sta. Cruz, Makati',
      contactNumber: '09391234567',
      emergencyContact: 'Carlos Reyes - 09399876543',
      position: 'Office Clerk',
      dailyRate: 600,
      hireDate: new Date('2024-03-10'),
    },
  ];

  for (const employee of employees) {
    const existing = await prisma.employee.findFirst({
      where: { fullName: employee.fullName },
    });

    if (!existing) {
      await prisma.employee.create({ data: employee });
      console.log(`  ✅ Employee created: ${employee.fullName}`);
    } else {
      console.log(`  ℹ️  Employee already exists: ${employee.fullName}`);
    }
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
