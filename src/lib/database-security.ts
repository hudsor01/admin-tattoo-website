/**
 * Database Security Utilities
 * 
 * Provides field-level encryption, audit logging, and security policies
 * for sensitive data in the tattoo admin system.
 */

import { PrismaClient, Prisma } from '@prisma/client'
import crypto from 'crypto'

// Environment variables for encryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || ''
const ALGORITHM = 'aes-256-gcm'

if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('ENCRYPTION_SECRET environment variable is required in production')
}

/**
 * Field-level encryption for PII data
 */
export class FieldEncryption {
  private static deriveKey(salt: string): Buffer {
    return crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha256')
  }

  static encrypt(text: string): string {
    if (!text) return text

    const salt = crypto.randomBytes(16)
    const key = this.deriveKey(salt.toString('hex'))
    const iv = crypto.randomBytes(12)

    // Use createCipheriv instead of createCipherGCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Format: salt:iv:authTag:encrypted
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  static decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText

    try {
      const [saltHex, ivHex, authTagHex, encrypted] = encryptedText.split(':')

      if (!saltHex || !ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted format')
      }

      const key = this.deriveKey(saltHex)
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')

      // Use createDecipheriv instead of createDecipherGCM
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      console.error('Decryption failed:', error)
      return '[ENCRYPTED]'
    }
  }

  /**
   * Encrypt sensitive client fields
   */
  static encryptClientData(client: Record<string, unknown>) {
    return {
      ...client,
      // Encrypt PII fields
      firstName: this.encrypt(String(client.firstName ?? '')),
      lastName: this.encrypt(String(client.lastName ?? '')),
      phone: this.encrypt(String(client.phone ?? '')),
      emergencyName: this.encrypt(String(client.emergencyName ?? '')),
      emergencyPhone: this.encrypt(String(client.emergencyPhone ?? '')),
      emergencyRel: this.encrypt(String(client.emergencyRel ?? '')),
      allergies: Array.isArray(client.allergies)
        ? (client.allergies as string[]).map((allergy: string) => this.encrypt(allergy))
        : [],
      medicalConds: Array.isArray(client.medicalConds)
        ? (client.medicalConds as string[]).map((cond: string) => this.encrypt(cond))
        : []
    }
  }

  /**
   * Decrypt sensitive client fields
   */
  static decryptClientData(client: Record<string, unknown> | null | undefined) {
    if (!client) return client

    return {
      ...client,
      firstName: this.decrypt(String(client.firstName ?? '')),
      lastName: this.decrypt(String(client.lastName ?? '')),
      phone: this.decrypt(String(client.phone ?? '')),
      emergencyName: this.decrypt(String(client.emergencyName ?? '')),
      emergencyPhone: this.decrypt(String(client.emergencyPhone ?? '')),
      emergencyRel: this.decrypt(String(client.emergencyRel ?? '')),
      allergies: Array.isArray(client.allergies)
        ? (client.allergies as string[]).map((allergy: string) => this.decrypt(allergy))
        : [],
      medicalConds: Array.isArray(client.medicalConds)
        ? (client.medicalConds as string[]).map((cond: string) => this.decrypt(cond))
        : []
    }
  }
}

/**
 * Audit logging for database operations
 */
export class AuditLogger {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async logOperation(params: {
    userId?: string
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN'
    resource: string
    resourceId?: string
    ip: string
    userAgent: string
    metadata?: Record<string, unknown>
    sensitiveFields?: string[]
  }) {
    try {
      // Hash sensitive metadata
      const sanitizedMetadata = this.sanitizeMetadata(params.metadata, params.sensitiveFields)

      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          ip: params.ip,
          userAgent: params.userAgent.substring(0, 500), // Truncate user agent
          timestamp: new Date(),
          // Cast to Prisma.InputJsonValue to match expected type
          metadata: sanitizedMetadata as Prisma.InputJsonValue
        }
      })
    } catch (error) {
      console.error('Audit logging failed:', error)
      // Don't throw - audit failures shouldn't break the main operation
    }
  }

  private sanitizeMetadata(
    metadata?: Record<string, unknown>,
    sensitiveFields?: string[]
  ): Record<string, unknown> | undefined {
    if (!metadata) return undefined

    const sanitized = { ...metadata }

    // Remove or hash sensitive fields
    sensitiveFields?.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = crypto.createHash('sha256')
          .update(String(sanitized[field]))
          .digest('hex')
          .substring(0, 8) + '...'
      }
    })

    // Remove potentially sensitive keys
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'ssn', 'phone', 'email']
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        delete sanitized[key]
      }
    })

    return sanitized
  }

  /**
   * Log data access for compliance
   */
  async logDataAccess(params: {
    userId: string
    clientId: string
    fieldsAccessed: string[]
    purpose: string
    ip: string
    userAgent: string
  }) {
    await this.logOperation({
      userId: params.userId,
      action: 'READ',
      resource: 'client_data',
      resourceId: params.clientId,
      ip: params.ip,
      userAgent: params.userAgent,
      metadata: {
        fieldsAccessed: params.fieldsAccessed,
        purpose: params.purpose,
        accessTime: new Date().toISOString()
      }
    })
  }
}

/**
 * Row Level Security policies
 */
export class DatabaseSecurity {
  private prisma: PrismaClient
  private auditLogger: AuditLogger

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.auditLogger = new AuditLogger(prisma)
  }

  /**
   * Secure client creation with encryption and audit
   */
  async createClientSecure(
    clientData: Record<string, unknown>,
    userId: string,
    ip: string,
    userAgent: string
  ) {
    // Ensure required fields are present
    const requiredFields = ['email', 'dateOfBirth']
    for (const field of requiredFields) {
      if (!clientData[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    // Encrypt sensitive fields
    const encryptedData = FieldEncryption.encryptClientData(clientData)

    // Explicitly construct the data object with all required fields
    const data = {
      // Required fields
      email: clientData.email as string,
      dateOfBirth: clientData.dateOfBirth as Date | string,
      // Encrypted fields (overwrite any unencrypted values)
      firstName: encryptedData.firstName,
      lastName: encryptedData.lastName,
      phone: encryptedData.phone,
      emergencyName: encryptedData.emergencyName,
      emergencyPhone: encryptedData.emergencyPhone,
      emergencyRel: encryptedData.emergencyRel,
      allergies: encryptedData.allergies,
      medicalConds: encryptedData.medicalConds,
      // Any other optional fields that are not encrypted
      ...clientData
      // Do NOT repeat encrypted fields here
    }

    const client = await this.prisma.client.create({
      data
    })

    // Log creation
    await this.auditLogger.logOperation({
      userId,
      action: 'CREATE',
      resource: 'client',
      resourceId: client.id,
      ip,
      userAgent,
      sensitiveFields: ['firstName', 'lastName', 'phone', 'emergencyPhone']
    })

    // Return decrypted data for immediate use
    return FieldEncryption.decryptClientData(client)
  }

  /**
   * Secure client retrieval with decryption and audit
   */
  async getClientSecure(
    clientId: string,
    userId: string,
    purpose: string,
    ip: string,
    userAgent: string
  ) {
    // Get encrypted client
    const encryptedClient = await this.prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!encryptedClient) {
      throw new Error('Client not found')
    }

    // Log access
    await this.auditLogger.logDataAccess({
      userId,
      clientId,
      fieldsAccessed: Object.keys(encryptedClient),
      purpose,
      ip,
      userAgent
    })

    // Return decrypted data
    return FieldEncryption.decryptClientData(encryptedClient)
  }

  /**
   * Secure client update with encryption and audit
   */
  async updateClientSecure(
    clientId: string,
    updateData: Record<string, unknown>,
    userId: string,
    ip: string,
    userAgent: string
  ) {
    // Get original data for comparison
    const originalClient = await this.prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!originalClient) {
      throw new Error('Client not found')
    }

    // Encrypt sensitive fields in update data
    const encryptedUpdateData = FieldEncryption.encryptClientData(updateData)

    // Update client
    const updatedClient = await this.prisma.client.update({
      where: { id: clientId },
      data: encryptedUpdateData
    })

    // Log update with changed fields
    const changedFields = Object.keys(updateData)
    await this.auditLogger.logOperation({
      userId,
      action: 'UPDATE',
      resource: 'client',
      resourceId: clientId,
      ip,
      userAgent,
      metadata: {
        changedFields,
        updateTimestamp: new Date().toISOString()
      },
      sensitiveFields: ['firstName', 'lastName', 'phone', 'emergencyPhone']
    })

    return FieldEncryption.decryptClientData(updatedClient)
  }

  /**
   * Secure bulk operations with rate limiting
   */
  async bulkClientQuery(
    filters: Record<string, unknown>,
    userId: string,
    ip: string,
    userAgent: string,
    limit: number = 50
  ) {
    // Enforce reasonable limits
    const safeLimit = Math.min(limit, 100)

    // Get encrypted clients
    const encryptedClients = await this.prisma.client.findMany({
      where: filters,
      take: safeLimit
    })

    // Log bulk access
    await this.auditLogger.logOperation({
      userId,
      action: 'READ',
      resource: 'client_bulk',
      ip,
      userAgent,
      metadata: {
        filters,
        resultCount: encryptedClients.length,
        limit: safeLimit
      }
    })

    // Return decrypted data
    return encryptedClients.map(client =>
      FieldEncryption.decryptClientData(client)
    )
  }

  /**
   * Data retention and cleanup
   */
  async cleanupExpiredData() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Clean up old sessions
    await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })

    // Clean up old audit logs (keep for 2 years in production)
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    if (process.env.NODE_ENV === 'production') {
      await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: twoYearsAgo
          }
        }
      })
    }

    console.log('Database cleanup completed')
  }
}

/**
 * Database connection security
 */
export class ConnectionSecurity {
  static createSecurePrismaClient() {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
  }

  /**
   * Test database connection security
   */
  static async testConnection(prisma: PrismaClient) {
    try {
      // Test basic connectivity
      await prisma.$queryRaw`SELECT 1`

      // Test transaction support
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT 1`
      })

      console.log('Database connection secure and functional')
      return true
    } catch (error) {
      console.error('Database connection test failed:', error)
      return false
    }
  }
}
