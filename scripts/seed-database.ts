import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

// Production safety check
if (process.env.NODE_ENV === 'production') {
  console.error('❌ SECURITY ERROR: Database seeding is not allowed in production!');
  process.exit(1);
}

const prisma = new PrismaClient();

// Predefined data for consistency
const TATTOO_STYLES = [
  'Traditional', 'Realistic', 'Watercolor', 'Geometric', 'Tribal', 
  'Japanese', 'Neo-traditional', 'Blackwork', 'Fine Line', 'Portrait'
];

const TATTOO_PLACEMENTS = [
  'Arm', 'Leg', 'Back', 'Chest', 'Shoulder', 'Forearm', 'Wrist', 
  'Ankle', 'Ribcage', 'Neck', 'Hand', 'Foot'
];

const SIZES = ['Small', 'Medium', 'Large', 'Extra Large'];

const SPECIALTIES = [
  'Portrait Work', 'Color Tattoos', 'Black & Grey', 'Fine Line', 
  'Traditional', 'Realistic', 'Geometric', 'Watercolor'
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.tattooSession.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.tattooDesign.deleteMany();
    await prisma.client.deleteMany();
    await prisma.tattooArtist.deleteMany();
    await prisma.auditLog.deleteMany();

    // Create Tattoo Artists
    console.log('👨‍🎨 Creating tattoo artists...');
    const artists: any[] = [];
    for (let i = 0; i < 5; i++) {
      const artist = await prisma.tattooArtist.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          specialties: faker.helpers.arrayElements(SPECIALTIES, { min: 2, max: 4 }),
          hourlyRate: faker.number.float({ min: 100, max: 300, multipleOf: 25 }),
          isActive: faker.datatype.boolean({ probability: 0.9 }),
          portfolio: [
            faker.image.url({ width: 400, height: 400 }),
            faker.image.url({ width: 400, height: 400 }),
            faker.image.url({ width: 400, height: 400 })
          ],
          bio: faker.lorem.paragraph(),
          createdAt: faker.date.past({ years: 2 }),
        }
      });
      artists.push(artist);
    }

    // Create Clients
    console.log('👥 Creating clients...');
    const clients: any[] = [];
    for (let i = 0; i < 50; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const client = await prisma.client.create({
        data: {
          firstName,
          lastName,
          email: faker.internet.email({ firstName, lastName }),
          phone: faker.phone.number(),
          dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
          emergencyName: faker.person.fullName(),
          emergencyPhone: faker.phone.number(),
          emergencyRel: faker.helpers.arrayElement(['Spouse', 'Parent', 'Sibling', 'Friend', 'Partner']),
          allergies: faker.helpers.maybe(() => 
            faker.helpers.arrayElements(['Latex', 'Antibiotics', 'Ink pigments', 'Adhesives'], { min: 1, max: 2 })
          ) || [],
          medicalConds: faker.helpers.maybe(() => 
            faker.helpers.arrayElements(['Diabetes', 'Heart condition', 'Blood clotting disorder', 'Skin condition'], { min: 1, max: 2 })
          ) || [],
          preferredArtist: faker.helpers.maybe(() => faker.helpers.arrayElement(artists).name),
          createdAt: faker.date.past({ years: 1 }),
        }
      });
      clients.push(client);
    }

    // Create Tattoo Designs
    console.log('🎨 Creating tattoo designs...');
    const designs: any[] = [];
    for (let i = 0; i < 30; i++) {
      const design = await prisma.tattooDesign.create({
        data: {
          title: faker.helpers.arrayElement([
            'Dragon Sleeve', 'Rose Bouquet', 'Geometric Mandala', 'Portrait Study',
            'Traditional Eagle', 'Watercolor Butterfly', 'Tribal Pattern', 'Fine Line Flowers',
            'Japanese Koi', 'Realistic Lion', 'Abstract Waves', 'Gothic Cross'
          ]),
          description: faker.lorem.sentences(2),
          style: faker.helpers.arrayElement(TATTOO_STYLES),
          tags: faker.helpers.arrayElements(
            ['colorful', 'detailed', 'minimalist', 'bold', 'delicate', 'abstract', 'realistic'], 
            { min: 2, max: 4 }
          ),
          imageUrl: faker.image.url({ width: 600, height: 600 }),
          artistId: faker.helpers.arrayElement(artists).id,
          isPublic: faker.datatype.boolean({ probability: 0.8 }),
          estimatedHours: faker.number.float({ min: 2, max: 12, multipleOf: 0.5 }),
          popularity: faker.number.int({ min: 0, max: 100 }),
          createdAt: faker.date.past({ years: 1 }),
        }
      });
      designs.push(design);
    }

    // Create Tattoo Sessions (past 6 months)
    console.log('🎯 Creating tattoo sessions...');
    const sessions: any[] = [];
    for (let i = 0; i < 80; i++) {
      const artist = faker.helpers.arrayElement(artists);
      const client = faker.helpers.arrayElement(clients);
      const appointmentDate = faker.date.recent({ days: 180 });
      const estimatedHours = faker.number.float({ min: 2, max: 8, multipleOf: 0.5 });
      const hourlyRate = Number(artist.hourlyRate);
      const totalCost = estimatedHours * hourlyRate;
      const depositAmount = totalCost * 0.3; // 30% deposit
      const paidAmount = faker.helpers.arrayElement([
        depositAmount, // Just deposit
        totalCost * 0.5, // Half paid
        totalCost, // Fully paid
      ]);

      const session = await prisma.tattooSession.create({
        data: {
          clientId: client.id,
          artistId: artist.id,
          appointmentDate,
          duration: Math.round(estimatedHours * 60), // Convert to minutes
          status: faker.helpers.weightedArrayElement([
            { weight: 60, value: 'COMPLETED' },
            { weight: 20, value: 'SCHEDULED' },
            { weight: 10, value: 'IN_PROGRESS' },
            { weight: 8, value: 'CANCELLED' },
            { weight: 2, value: 'NO_SHOW' }
          ]),
          designDescription: faker.lorem.sentences(2),
          placement: faker.helpers.arrayElement(TATTOO_PLACEMENTS),
          size: faker.helpers.arrayElement(SIZES),
          style: faker.helpers.arrayElement(TATTOO_STYLES),
          referenceImages: [
            faker.image.url({ width: 400, height: 400 }),
            faker.image.url({ width: 400, height: 400 })
          ],
          hourlyRate,
          estimatedHours,
          depositAmount,
          totalCost,
          paidAmount,
          notes: faker.helpers.maybe(() => faker.lorem.sentence()),
          aftercareProvided: faker.datatype.boolean({ probability: 0.7 }),
          consentSigned: faker.datatype.boolean({ probability: 0.95 }),
          createdAt: appointmentDate,
          updatedAt: faker.date.between({ from: appointmentDate, to: new Date() }),
        }
      });
      sessions.push(session);
    }

    // Create Appointments (future and recent)
    console.log('📅 Creating appointments...');
    for (let i = 0; i < 40; i++) {
      const artist = faker.helpers.arrayElement(artists);
      const client = faker.helpers.arrayElement(clients);
      const scheduledDate = faker.helpers.arrayElement([
        faker.date.future({ years: 0.2 }), // Future appointments
        faker.date.recent({ days: 30 }), // Recent appointments
      ]);

      await prisma.appointment.create({
        data: {
          clientId: client.id,
          artistId: artist.id,
          scheduledDate,
          duration: faker.number.int({ min: 120, max: 480 }), // 2-8 hours in minutes
          status: faker.helpers.weightedArrayElement([
            { weight: 40, value: 'SCHEDULED' },
            { weight: 30, value: 'CONFIRMED' },
            { weight: 15, value: 'COMPLETED' },
            { weight: 10, value: 'CANCELLED' },
            { weight: 5, value: 'IN_PROGRESS' }
          ]),
          type: faker.helpers.weightedArrayElement([
            { weight: 60, value: 'TATTOO_SESSION' },
            { weight: 25, value: 'CONSULTATION' },
            { weight: 10, value: 'TOUCH_UP' },
            { weight: 5, value: 'REMOVAL' }
          ]),
          notes: faker.helpers.maybe(() => faker.lorem.sentence()),
          reminderSent: faker.datatype.boolean({ probability: 0.6 }),
          createdAt: faker.date.past({ years: 0.1 }),
        }
      });
    }

    // Create Audit Logs
    console.log('📋 Creating audit logs...');
    const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN'];
    const resources = ['Client', 'TattooSession', 'Appointment', 'TattooDesign', 'User'];
    
    for (let i = 0; i < 200; i++) {
      await prisma.auditLog.create({
        data: {
          userId: faker.helpers.maybe(() => 'admin_user_id'),
          action: faker.helpers.arrayElement(actions),
          resource: faker.helpers.arrayElement(resources),
          resourceId: faker.helpers.maybe(() => faker.string.alphanumeric(25)),
          ip: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
          timestamp: faker.date.recent({ days: 30 }),
          metadata: {
            endpoint: faker.helpers.arrayElement(['/api/admin/customers', '/api/admin/sessions', '/api/admin/appointments']),
            duration: faker.number.int({ min: 50, max: 2000 }),
            success: faker.datatype.boolean({ probability: 0.9 })
          }
        }
      });
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`Created:
    - ${artists.length} artists
    - ${clients.length} clients  
    - ${designs.length} designs
    - ${sessions.length} tattoo sessions
    - 40 appointments
    - 200 audit logs`);

    // Test analytics endpoint
    console.log('\n🧪 Testing analytics endpoint...');
    const response = await fetch('http://localhost:3001/api/admin/analytics');
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Analytics data sample:', {
        totalRevenue: data.totalRevenue,
        activeClients: data.activeClients,
        monthlySessions: data.monthlySessions,
        topArtists: data.topArtists.length
      });
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;