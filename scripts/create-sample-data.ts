#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleData() {
  try {
    console.log('🎨 Creating sample data for dashboard...\n');

    // Create sample tattoo artist
    const artist = await prisma.tattooArtist.upsert({
      where: { email: 'artist@ink37tattoos.com' },
      update: {},
      create: {
        name: 'Alex Ink',
        email: 'artist@ink37tattoos.com',
        phone: '+1-555-0199',
        specialties: ['Traditional', 'Realism', 'Black & Grey'],
        hourlyRate: 150.00,
        isActive: true,
        portfolio: ['portfolio1.jpg', 'portfolio2.jpg'],
        bio: 'Professional tattoo artist with 10+ years of experience'
      }
    });

    console.log(`✅ Created artist: ${artist.name}`);

    // Create sample clients
    const clients = await Promise.all([
      prisma.client.upsert({
        where: { email: 'john.doe@example.com' },
        update: {},
        create: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0101',
          dateOfBirth: new Date('1990-05-15'),
          emergencyName: 'Jane Doe',
          emergencyPhone: '+1-555-0102',
          emergencyRel: 'Wife',
          allergies: [],
          medicalConds: [],
          preferredArtist: 'Alex Ink'
        }
      }),
      prisma.client.upsert({
        where: { email: 'sara.smith@example.com' },
        update: {},
        create: {
          firstName: 'Sara',
          lastName: 'Smith',
          email: 'sara.smith@example.com',
          phone: '+1-555-0103',
          dateOfBirth: new Date('1985-08-22'),
          emergencyName: 'Mike Smith',
          emergencyPhone: '+1-555-0104',
          emergencyRel: 'Husband',
          allergies: [],
          medicalConds: [],
          preferredArtist: 'Alex Ink'
        }
      }),
      prisma.client.upsert({
        where: { email: 'mike.wilson@example.com' },
        update: {},
        create: {
          firstName: 'Mike',
          lastName: 'Wilson',
          email: 'mike.wilson@example.com',
          phone: '+1-555-0105',
          dateOfBirth: new Date('1992-12-03'),
          emergencyName: 'Lisa Wilson',
          emergencyPhone: '+1-555-0106',
          emergencyRel: 'Sister',
          allergies: ['Latex'],
          medicalConds: ['Previous tattoo healing issues'],
          preferredArtist: 'Alex Ink'
        }
      })
    ]);

    console.log(`✅ Created ${clients.length} clients`);

    // Create sample appointments
    const appointments = await Promise.all([
      prisma.appointment.create({
        data: {
          clientId: clients[0].id,
          artistId: artist.id,
          type: 'CONSULTATION',
          status: 'CONFIRMED',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          duration: 60,
          notes: 'Sleeve consultation - discuss design ideas'
        }
      }),
      prisma.appointment.create({
        data: {
          clientId: clients[1].id,
          artistId: artist.id,
          type: 'TATTOO_SESSION',
          status: 'CONFIRMED',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
          duration: 240,
          notes: 'Back piece session 2 of 4'
        }
      }),
      prisma.appointment.create({
        data: {
          clientId: clients[2].id,
          artistId: artist.id,
          type: 'TATTOO_SESSION',
          status: 'COMPLETED',
          scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          duration: 120,
          notes: 'Small cover-up completed'
        }
      })
    ]);

    console.log(`✅ Created ${appointments.length} appointments`);

    // Create sample tattoo sessions
    const sessions = await Promise.all([
      prisma.tattooSession.create({
        data: {
          clientId: clients[1].id,
          artistId: artist.id,
          appointmentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
          duration: 180,
          status: 'COMPLETED',
          designDescription: 'Phoenix rising from ashes',
          placement: 'Back',
          size: 'Large (8+ inches)',
          style: 'Realism',
          referenceImages: ['session1_before.jpg', 'session1_after.jpg'],
          hourlyRate: 150.00,
          estimatedHours: 6.0,
          depositAmount: 200.00,
          totalCost: 850.00,
          paidAmount: 850.00,
          notes: 'First session of back piece - outline completed',
          aftercareProvided: true,
          consentSigned: true
        }
      }),
      prisma.tattooSession.create({
        data: {
          clientId: clients[2].id,
          artistId: artist.id,
          appointmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          duration: 120,
          status: 'COMPLETED',
          designDescription: 'Cover-up rose design',
          placement: 'Forearm',
          size: 'Small (2-4 inches)',
          style: 'Traditional',
          referenceImages: ['coverup_before.jpg', 'coverup_after.jpg'],
          hourlyRate: 150.00,
          estimatedHours: 2.0,
          depositAmount: 100.00,
          totalCost: 300.00,
          paidAmount: 300.00,
          notes: 'Cover-up successful, client very happy',
          aftercareProvided: true,
          consentSigned: true
        }
      }),
      prisma.tattooSession.create({
        data: {
          clientId: clients[0].id,
          artistId: artist.id,
          appointmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          duration: 240,
          status: 'IN_PROGRESS',
          designDescription: 'Geometric sleeve start',
          placement: 'Upper Arm',
          size: 'Medium (4-6 inches)',
          style: 'Black & Grey',
          referenceImages: ['sleeve_progress1.jpg'],
          hourlyRate: 150.00,
          estimatedHours: 4.0,
          depositAmount: 150.00,
          totalCost: 650.00,
          paidAmount: 150.00,
          notes: 'First session of sleeve - great progress',
          aftercareProvided: true,
          consentSigned: true
        }
      })
    ]);

    console.log(`✅ Created ${sessions.length} tattoo sessions`);

    // Create sample designs for gallery
    const designs = await Promise.all([
      prisma.tattooDesign.create({
        data: {
          artistId: artist.id,
          title: 'Phoenix Rising',
          description: 'Detailed realism phoenix with vibrant colors',
          style: 'Realism',
          imageUrl: 'designs/phoenix_realism.jpg',
          tags: ['phoenix', 'bird', 'fire', 'mythology', 'colorful'],
          isPublic: true,
          estimatedHours: 12.0,
          popularity: 85
        }
      }),
      prisma.tattooDesign.create({
        data: {
          artistId: artist.id,
          title: 'Geometric Mandala',
          description: 'Intricate geometric mandala design',
          style: 'Geometric',
          imageUrl: 'designs/geometric_mandala.jpg',
          tags: ['mandala', 'geometric', 'symmetrical', 'meditation'],
          isPublic: true,
          estimatedHours: 8.0,
          popularity: 72
        }
      }),
      prisma.tattooDesign.create({
        data: {
          artistId: artist.id,
          title: 'Traditional Rose',
          description: 'Classic American traditional rose',
          style: 'Traditional',
          imageUrl: 'designs/traditional_rose.jpg',
          tags: ['rose', 'traditional', 'classic', 'bold'],
          isPublic: true,
          estimatedHours: 3.0,
          popularity: 95
        }
      })
    ]);

    console.log(`✅ Created ${designs.length} tattoo designs`);

    // Summary
    console.log('\n🎉 Sample data creation completed!');
    console.log('\n📊 Dashboard should now display:');
    console.log(`   • Revenue: $${sessions.reduce((sum, s) => sum + Number(s.totalCost), 0)}`);
    console.log(`   • Clients: ${clients.length}`);
    console.log(`   • Appointments: ${appointments.length}`);
    console.log(`   • Sessions: ${sessions.length}`);
    console.log(`   • Designs: ${designs.length}`);
    console.log('\n✨ Your admin dashboard is ready for production!');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();