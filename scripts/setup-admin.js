const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('Setting up admin user...');
    
    // First, ensure the database tables exist by testing a simple query
    try {
      await prisma.user.findFirst();
      console.log('✓ Database connection successful');
    } catch (error) {
      console.error('✗ Database connection failed:', error.message);
      console.log('Please ensure your database is set up and the schema has been deployed.');
      process.exit(1);
    }

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@ink37tattoos.com' }
    });

    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      
      // Update the user to ensure they have admin role
      await prisma.user.update({
        where: { email: 'admin@ink37tattoos.com' },
        data: {
          role: 'admin',
          isActive: true,
          emailVerified: true
        }
      });
      console.log('✓ Admin user updated with correct permissions');
    } else {
      // Create admin user with Better Auth - password is stored in Account table
      const admin = await prisma.user.create({
        data: {
          id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: 'admin@ink37tattoos.com',
          name: 'Admin User',
          role: 'admin',
          isActive: true,
          emailVerified: true,
          loginAttempts: 0
        }
      });

      // Create credential account with hashed password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123456', 12);
      
      await prisma.account.create({
        data: {
          userId: admin.id,
          accountId: admin.id,
          providerId: 'credential',
          type: 'credential',
          password: hashedPassword
        }
      });
      
      console.log('✓ Admin user created successfully');
      console.log('Email: admin@ink37tattoos.com');
      console.log('Password: admin123456');
    }

    // Ensure tattoo artist exists for appointments
    const existingArtist = await prisma.tattooArtist.findFirst({
      where: { name: 'Fernando Govea' }
    });

    if (!existingArtist) {
      await prisma.tattooArtist.create({
        data: {
          name: 'Fernando Govea',
          email: 'fernando@ink37tattoos.com',
          phone: '+1234567890',
          specialties: ['Traditional', 'Realism', 'Black and Grey'],
          hourlyRate: 150.00,
          isActive: true
        }
      });
      console.log('✓ Tattoo artist created');
    } else {
      console.log('✓ Tattoo artist already exists');
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\nYou can now log in with:');
    console.log('Email: admin@ink37tattoos.com');
    console.log('Password: admin123456');
    
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
