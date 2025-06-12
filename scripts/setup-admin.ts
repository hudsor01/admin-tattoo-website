/**
 * Simple Production Admin Setup
 * 
 * Secure admin user creation for small-scale deployment (max 2 users)
 */

import { prisma } from '../src/lib/database'
import { auth } from '../src/lib/auth'

interface CreateAdminParams {
  email: string
  password: string
  name: string
}

/**
 * Create admin user securely
 * Use this once during initial setup
 */
export async function createAdminUser({ email, password, name }: CreateAdminParams) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format')
  }

  // Validate password strength (minimum for small system)
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters')
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    throw new Error('User already exists')
  }

  // Count existing admin users
  const adminCount = await prisma.user.count({
    where: { role: 'admin' }
  })

  if (adminCount >= 2) {
    throw new Error('Maximum number of admin users (2) already reached')
  }

  try {
    // Create user through Better Auth
    const result = await auth.api.signUpEmail({
      body: { email, password, name }
    })

    if (!result?.user) {
      throw new Error('Failed to create user account')
    }

    // Update role to admin
    const adminUser = await prisma.user.update({
      where: { id: result.user.id },
      data: { 
        role: 'admin',
        emailVerified: true 
      }
    })

    console.log(`✅ Admin user created: ${email}`)
    return {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    }

  } catch (error) {
    console.error('Failed to create admin user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Simple CLI setup script
 * Run with: npm run setup-admin
 */
async function setupAdminCLI() {
  if (process.env.NODE_ENV === 'production') {
    console.log('🔒 Setting up admin user for production...')
  }

  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve)
    })
  }

  try {
    console.log('👤 Admin User Setup')
    console.log('==================')
    
    const email = await question('Email: ')
    const name = await question('Full Name: ')
    
    // Hide password input
    process.stdout.write('Password: ')
    process.stdin.setRawMode(true)
    let password = ''
    
    await new Promise<void>((resolve) => {
      process.stdin.on('data', (char) => {
        const c = char.toString()
        if (c === '\r' || c === '\n') {
          console.log() // New line
          resolve()
        } else if (c === '\u0003') { // Ctrl+C
          process.exit(1)
        } else if (c === '\u007f') { // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1)
            process.stdout.write('\b \b')
          }
        } else {
          password += c
          process.stdout.write('*')
        }
      })
    })
    
    process.stdin.setRawMode(false)

    if (!email || !name || !password) {
      throw new Error('All fields are required')
    }

    const user = await createAdminUser({ email, password, name })
    
    console.log('✅ Admin user created successfully!')
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    
  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

// Run CLI if called directly
if (require.main === module) {
  setupAdminCLI()
}

export { setupAdminCLI }
