import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@ink37tattoos.com' },
      include: {
        accounts: true
      }
    })
    
    if (user) {
      console.log('✅ Admin user found:')
      console.log('ID:', user.id)
      console.log('Email:', user.email)
      console.log('Role:', user.role)
      console.log('EmailVerified:', user.emailVerified)
      console.log('Accounts:', user.accounts.length)
    } else {
      console.log('❌ Admin user not found')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()