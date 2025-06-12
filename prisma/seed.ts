import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin users
  const adminUser1 = await prisma.user.upsert({
    where: { email: 'ink37tattoos@gmail.com' },
    update: {},
    create: {
      email: 'ink37tattoos@gmail.com',
      name: 'Ink37 Admin',
      role: 'admin',
      emailVerified: true,
    }
  })

  const adminUser2 = await prisma.user.upsert({
    where: { email: 'fennyg83@gmail.com' },
    update: {},
    create: {
      email: 'fennyg83@gmail.com',
      name: 'Fernando Govea',
      role: 'admin',
      emailVerified: true,
    }
  })

  console.log('✅ Admin users created:', { adminUser1, adminUser2 })

  // Create tattoo artists
  const fernando = await prisma.tattooArtist.create({
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

  const maya = await prisma.tattooArtist.create({
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

  // Create clients
  const clients = [
    {
      firstName: 'Sarah',
      lastName: 'Martinez',
      email: 'sarah.martinez@email.com',
      phone: '+1-555-1001',
      dateOfBirth: new Date('1992-05-15'),
      emergencyName: 'Carlos Martinez',
      emergencyPhone: '+1-555-1002',
      emergencyRel: 'Husband',
      allergies: [],
      medicalConds: [],
      preferredArtist: fernando.id
    },
    {
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@email.com',
      phone: '+1-555-1003',
      dateOfBirth: new Date('1988-11-22'),
      emergencyName: 'Lisa Johnson',
      emergencyPhone: '+1-555-1004',
      emergencyRel: 'Wife',
      allergies: [],
      medicalConds: [],
      preferredArtist: maya.id
    },
    {
      firstName: 'Emma',
      lastName: 'Davis',
      email: 'emma.davis@email.com',
      phone: '+1-555-1005',
      dateOfBirth: new Date('1995-08-03'),
      emergencyName: 'Robert Davis',
      emergencyPhone: '+1-555-1006',
      emergencyRel: 'Father',
      allergies: ['Latex'],
      medicalConds: [],
      preferredArtist: fernando.id
    },
    {
      firstName: 'Carlos',
      lastName: 'Wilson',
      email: 'carlos.wilson@email.com',
      phone: '+1-555-1007',
      dateOfBirth: new Date('1990-02-14'),
      emergencyName: 'Ana Wilson',
      emergencyPhone: '+1-555-1008',
      emergencyRel: 'Sister',
      allergies: [],
      medicalConds: [],
      preferredArtist: maya.id
    },
    {
      firstName: 'Ana',
      lastName: 'Lopez',
      email: 'ana.lopez@email.com',
      phone: '+1-555-1009',
      dateOfBirth: new Date('1993-12-08'),
      emergencyName: 'Miguel Lopez',
      emergencyPhone: '+1-555-1010',
      emergencyRel: 'Brother',
      allergies: [],
      medicalConds: [],
      preferredArtist: fernando.id
    }
  ]

  const createdClients = []
  for (const clientData of clients) {
    const client = await prisma.client.create({ data: clientData })
    createdClients.push(client)
  }

  // Create tattoo sessions
  const sessions = [
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
  ]

  for (const sessionData of sessions) {
    await prisma.tattooSession.create({ data: sessionData })
  }

  // Create upcoming appointments
  const appointments = [
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
  ]

  for (const appointmentData of appointments) {
    await prisma.appointment.create({ data: appointmentData })
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
    await prisma.tattooDesign.create({ data: designData })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created:`)
  console.log(`   • 2 admin users`)
  console.log(`   • ${2} artists`)
  console.log(`   • ${createdClients.length} clients`)
  console.log(`   • ${sessions.length} tattoo sessions`)
  console.log(`   • ${appointments.length} appointments`)
  console.log(`   • ${designs.length} design portfolio items`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })