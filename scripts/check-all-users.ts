import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAllUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        accounts: true
      }
    })
    
    console.log(`Found ${users.length} users:`)
    
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`)
      console.log('ID:', user.id)
      console.log('Email:', user.email)
      console.log('Name:', user.name)
      console.log('Role:', user.role)
      console.log('EmailVerified:', user.emailVerified)
      console.log('Provider accounts:', user.accounts.map(acc => acc.providerId))
      console.log('Created:', user.createdAt)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllUsers()