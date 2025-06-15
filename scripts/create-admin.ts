import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

function generateId() {
  return randomBytes(16).toString('hex')
}

async function createAdmin() {
  try {
    console.log('Creating admin user...')
    
    const email = 'admin@ink37tattoos.com'
    const password = 'admin123456'
    
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      console.log('Admin user already exists!')
      
      // Update the password to make sure it's correct
      const hashedPassword = await bcrypt.hash(password, 12)
      
      // Find or create account
      const account = await prisma.account.upsert({
        where: {
          providerId_accountId: {
            providerId: 'credential',
            accountId: existingUser.id
          }
        },
        update: {
          password: hashedPassword
        },
        create: {
          id: generateId(),
          userId: existingUser.id,
          accountId: existingUser.id,
          providerId: 'credential',
          type: 'credential',
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      
      console.log('✅ Admin password updated!')
      return
    }
    
    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 12)
    const userId = generateId()
    
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        name: 'Admin User',
        emailVerified: true,
        role: 'admin'
      }
    })
    
    // Create credential account
    await prisma.account.create({
      data: {
        id: generateId(),
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        type: 'credential',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Admin user created successfully!')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()