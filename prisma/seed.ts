import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if a default user exists
  const userCount = await prisma.user.count();
  
  if (userCount === 0) {
    console.log('Creating default user...');
    
    // Create a default user
    const user = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        name: 'Demo User',
        subscription: {
          create: {
            plan: 'free',
            status: 'active',
            minutesAllowed: 60,
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          }
        }
      }
    });
    
    console.log(`Created default user with ID: ${user.id}`);
  } else {
    console.log('Default user already exists. Skipping seed.');
  }
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 