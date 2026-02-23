const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in database`);
    
    if (userCount === 0) {
      console.log('No users found. Please run npm run db:seed first.');
    } else {
      const users = await prisma.user.findMany({ take: 3 });
      console.log('Sample users:', users.map(u => u.name));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
