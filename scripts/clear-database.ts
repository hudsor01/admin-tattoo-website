import { prisma } from '../src/lib/database';

async function clearDatabase() {
  console.log('🧹 Clearing database...');

  try {
    // Clear in correct order to avoid foreign key constraint issues
    await prisma.tattooSession.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.tattooDesign.deleteMany();
    await prisma.client.deleteMany();
    await prisma.tattooArtist.deleteMany();
    await prisma.auditLog.deleteMany();

    console.log('✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the clearer
if (require.main === module) {
  clearDatabase();
}

export default clearDatabase;