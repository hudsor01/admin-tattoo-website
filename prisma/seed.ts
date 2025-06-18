import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seeding database

  // Create admin users from environment variables (production-safe)
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
  const adminNames = process.env.ADMIN_NAMES?.split(',').map(name => name.trim()) || [];
  
  // Only create admin users if explicitly configured via environment
  if (adminEmails.length > 0) {
    console.warn(`Creating ${adminEmails.length} admin user(s) from environment configuration...`);
    
    for (let i = 0; i < adminEmails.length; i++) {
      const email = adminEmails[i];
      const name = adminNames[i] || email.split('@')[0]; // Use email prefix as fallback name
      
      if (email && email.includes('@')) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await prisma.user.upsert({
            where: { email },
            update: { role: 'admin' }, // Update existing users to admin role
            create: {
              email,
              name,
              role: 'admin',
              emailVerified: true,
            }
          });
          console.warn(`✓ Admin user created/updated: ${email}`);
        } catch (error) {
          console.error(`✗ Failed to create admin user ${email}:`, error);
        }
      } else {
        console.warn(`⚠ Skipping invalid email: ${email}`);
      }
    }
  } else {
    console.warn('⚠ No admin users configured. Set ADMIN_EMAILS environment variable to create admin accounts.');
    console.warn('Example: ADMIN_EMAILS="admin@example.com,admin2@example.com" ADMIN_NAMES="Admin One,Admin Two"');
  }

  // Create tattoo artists
  const fernando = await prisma.tattoo_artists.create({
    data: {
      name: 'Fernando Govea',
      email: 'fernando@ink37tattoos.com',
      phone: '+1-555-0101',
      specialties: ['Traditional', 'Neo-Traditional', 'Blackwork'],
      hourlyRate: 150.00,
      isActive: true,
      portfolio: [
        '/portfolio/fernando-1.jpg',
        '/portfolio/fernando-2.jpg',
        '/portfolio/fernando-3.jpg'
      ],
      bio: 'Master tattoo artist with 15+ years of experience specializing in traditional and neo-traditional styles.'
    }
  })

  const maya = await prisma.tattoo_artists.create({
    data: {
      name: 'Maya Rodriguez',
      email: 'maya@ink37tattoos.com',
      phone: '+1-555-0102',
      specialties: ['Realism', 'Color', 'Portraits'],
      hourlyRate: 175.00,
      isActive: true,
      portfolio: [
        '/portfolio/maya-1.jpg',
        '/portfolio/maya-2.jpg'
      ],
      bio: 'Realism specialist known for incredible portrait work and vibrant color pieces.'
    }
  })

  // Skip creating sample clients for production - start with clean slate
  console.warn('Skipping sample clients creation for production deployment');
  const createdClients: any[] = []; // Empty array for production

  // Create tattoo sessions only if we have clients
  const sessions = createdClients.length > 0 ? [
    {
      clientId: createdClients[0].id,
      artistId: fernando.id,
      appointmentDate: new Date('2024-12-15T14:30:00'),
      duration: 180, // 3 hours
      status: 'COMPLETED' as const,
      designDescription: 'Traditional Rose Shoulder Piece',
      placement: 'Right Shoulder',
      size: 'Medium (4-6 inches)',
      style: 'Traditional',
      referenceImages: ['/designs/rose-traditional.jpg'],
      hourlyRate: 150.00,
      estimatedHours: 3.0,
      depositAmount: 150.00,
      totalCost: 450.00,
      paidAmount: 450.00,
      notes: 'Beautiful traditional rose with thorns. Client very happy with result.',
      aftercareProvided: true,
      consentSigned: true
    },
    {
      clientId: createdClients[1].id,
      artistId: maya.id,
      appointmentDate: new Date('2024-12-16T11:00:00'),
      duration: 60, // 1 hour consultation
      status: 'COMPLETED' as const,
      designDescription: 'Full Sleeve Consultation',
      placement: 'Left Arm Full Sleeve',
      size: 'Large (Full Sleeve)',
      style: 'Realism',
      referenceImages: ['/designs/sleeve-concept.jpg'],
      hourlyRate: 175.00,
      estimatedHours: 1.0,
      depositAmount: 100.00,
      totalCost: 100.00,
      paidAmount: 100.00,
      notes: 'Consultation for full sleeve design. Wildlife theme with realistic animals.',
      aftercareProvided: false,
      consentSigned: true
    },
    {
      clientId: createdClients[2].id,
      artistId: fernando.id,
      appointmentDate: new Date('2024-12-17T16:00:00'),
      duration: 120, // 2 hours
      status: 'COMPLETED' as const,
      designDescription: 'Small Script Tattoo',
      placement: 'Right Wrist',
      size: 'Small (2-4 inches)',
      style: 'Script',
      referenceImages: ['/designs/script-sample.jpg'],
      hourlyRate: 150.00,
      estimatedHours: 2.0,
      depositAmount: 100.00,
      totalCost: 200.00,
      paidAmount: 200.00,
      notes: 'Delicate script tattoo with custom lettering.',
      aftercareProvided: true,
      consentSigned: true
    },
    {
      clientId: createdClients[3].id,
      artistId: maya.id,
      appointmentDate: new Date('2024-12-18T13:00:00'),
      duration: 240, // 4 hours
      status: 'IN_PROGRESS' as const,
      designDescription: 'Blackwork Geometric Design',
      placement: 'Back',
      size: 'Large (8+ inches)',
      style: 'Blackwork',
      referenceImages: ['/designs/geometric-blackwork.jpg'],
      hourlyRate: 175.00,
      estimatedHours: 4.0,
      depositAmount: 200.00,
      totalCost: 380.00,
      paidAmount: 200.00,
      notes: 'Complex geometric pattern in progress.',
      aftercareProvided: false,
      consentSigned: true
    },
    {
      clientId: createdClients[4].id,
      artistId: fernando.id,
      appointmentDate: new Date('2024-12-19T10:00:00'),
      duration: 90, // 1.5 hours
      status: 'SCHEDULED' as const,
      designDescription: 'Touch-up Session',
      placement: 'Previous tattoo on forearm',
      size: 'Touch-up',
      style: 'Traditional',
      referenceImages: [],
      hourlyRate: 150.00,
      estimatedHours: 1.5,
      depositAmount: 75.00,
      totalCost: 150.00,
      paidAmount: 75.00,
      notes: 'Touch-up for healing traditional piece from 6 months ago.',
      aftercareProvided: false,
      consentSigned: true
    }
  ] : []; // Close the conditional array

  for (const sessionData of sessions) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.tattoo_sessions.create({ data: sessionData })
  }

  // Create upcoming appointments only if we have clients
  const appointments = createdClients.length > 0 ? [
    {
      clientId: createdClients[0].id,
      artistId: fernando.id,
      scheduledDate: new Date('2024-12-22T15:00:00'),
      duration: 180,
      status: 'CONFIRMED' as const,
      type: 'TATTOO_SESSION' as const,
      notes: 'Second session for rose piece - adding color and details.'
    },
    {
      clientId: createdClients[1].id,
      artistId: maya.id,
      scheduledDate: new Date('2024-12-23T10:00:00'),
      duration: 300, // 5 hours
      status: 'SCHEDULED' as const,
      type: 'TATTOO_SESSION' as const,
      notes: 'First session for full sleeve - outline work.'
    }
  ] : []; // Close the conditional array

  for (const appointmentData of appointments) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.appointments.create({ data: appointmentData })
  }

  // Create some tattoo designs in portfolio
  const designs = [
    {
      title: 'Traditional Rose',
      description: 'Classic traditional style rose with thorns and leaves',
      style: 'Traditional',
      tags: ['rose', 'flowers', 'traditional', 'classic'],
      imageUrl: '/designs/traditional-rose.jpg',
      artistId: fernando.id,
      isPublic: true,
      estimatedHours: 3.0,
      popularity: 25
    },
    {
      title: 'Realistic Portrait',
      description: 'Photorealistic portrait tattoo in black and grey',
      style: 'Realism',
      tags: ['portrait', 'realism', 'black-grey', 'faces'],
      imageUrl: '/designs/realistic-portrait.jpg',
      artistId: maya.id,
      isPublic: true,
      estimatedHours: 8.0,
      popularity: 18
    },
    {
      title: 'Geometric Mandala',
      description: 'Complex geometric mandala design with intricate patterns',
      style: 'Geometric',
      tags: ['mandala', 'geometric', 'patterns', 'spiritual'],
      imageUrl: '/designs/geometric-mandala.jpg',
      artistId: maya.id,
      isPublic: true,
      estimatedHours: 6.0,
      popularity: 32
    }
  ]

  for (const designData of designs) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.tattoo_designs.create({ data: designData })
  }

  // Database seeded successfully
  // Database seeding completed:
  // - 2 admin users
  // - 2 artists
  // - Multiple clients
  // - Multiple sessions
  // - Multiple appointments
  // - Multiple designs
}

main()
  .catch((_e) => {
    // Database seeding failed
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })