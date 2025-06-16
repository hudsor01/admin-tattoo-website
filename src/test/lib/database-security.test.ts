import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  encryptField,
  decryptField,
  encryptSensitiveFields,
  decryptSensitiveFields,
  hashPassword,
  verifyPassword,
  createAuditLog,
  getAuditLogs,
  secureDelete,
  cleanupExpiredData,
  sanitizeForAudit
} from '@/lib/database-security'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn()
    },
    client: {
      deleteMany: vi.fn()
    },
    appointment: {
      deleteMany: vi.fn(),
      findMany: vi.fn()
    },
    tattooSession: {
      deleteMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

// Mock environment variables
const originalEnv = process.env

describe('Database Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      ENCRYPTION_KEY: 'test-encryption-key-32-characters-long',
      BCRYPT_ROUNDS: '10'
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Field Encryption/Decryption', () => {
    it('should encrypt and decrypt field values', () => {
      const sensitiveData = 'user@example.com'
      
      const encrypted = encryptField(sensitiveData)
      expect(encrypted).not.toBe(sensitiveData)
      expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+$/) // format: iv:encryptedData
      
      const decrypted = decryptField(encrypted)
      expect(decrypted).toBe(sensitiveData)
    })

    it('should handle null and undefined values', () => {
      expect(encryptField(null)).toBeNull()
      expect(encryptField(undefined)).toBeUndefined()
      expect(decryptField(null)).toBeNull()
      expect(decryptField(undefined)).toBeUndefined()
    })

    it('should handle empty strings', () => {
      const encrypted = encryptField('')
      expect(encrypted).toBe('')
      
      const decrypted = decryptField('')
      expect(decrypted).toBe('')
    })

    it('should generate different encrypted values for same input', () => {
      const data = 'test@example.com'
      const encrypted1 = encryptField(data)
      const encrypted2 = encryptField(data)
      
      expect(encrypted1).not.toBe(encrypted2)
      expect(decryptField(encrypted1)).toBe(data)
      expect(decryptField(encrypted2)).toBe(data)
    })

    it('should handle malformed encrypted data gracefully', () => {
      expect(() => decryptField('invalid-format')).toThrow()
      expect(() => decryptField('invalid:format:extra')).toThrow()
      expect(() => decryptField('validformat:butbaddata')).toThrow()
    })

    it('should handle special characters and unicode', () => {
      const specialData = 'émojis🎯 & spëciål characters'
      const encrypted = encryptField(specialData)
      const decrypted = decryptField(encrypted)
      
      expect(decrypted).toBe(specialData)
    })
  })

  describe('Object Encryption/Decryption', () => {
    it('should encrypt sensitive fields in objects', () => {
      const clientData = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-1234',
        medicalInfo: {
          allergies: ['latex'],
          medications: ['aspirin']
        },
        publicField: 'not sensitive'
      }

      const encrypted = encryptSensitiveFields(clientData, ['email', 'phone', 'medicalInfo'])
      
      expect(encrypted.id).toBe('1')
      expect(encrypted.firstName).toBe('John')
      expect(encrypted.publicField).toBe('not sensitive')
      expect(encrypted.email).not.toBe('john.doe@example.com')
      expect(encrypted.phone).not.toBe('555-1234')
      expect(encrypted.medicalInfo).not.toEqual(clientData.medicalInfo)
    })

    it('should decrypt sensitive fields in objects', () => {
      const originalData = {
        email: 'test@example.com',
        phone: '555-9876',
        notes: 'confidential notes'
      }

      const encrypted = encryptSensitiveFields(originalData, ['email', 'phone', 'notes'])
      const decrypted = decryptSensitiveFields(encrypted, ['email', 'phone', 'notes'])
      
      expect(decrypted).toEqual(originalData)
    })

    it('should handle nested object encryption', () => {
      const data = {
        user: {
          email: 'nested@example.com',
          profile: {
            ssn: '123-45-6789'
          }
        }
      }

      const encrypted = encryptSensitiveFields(data, ['user.email', 'user.profile.ssn'])
      expect(encrypted.user.email).not.toBe('nested@example.com')
      expect(encrypted.user.profile.ssn).not.toBe('123-45-6789')

      const decrypted = decryptSensitiveFields(encrypted, ['user.email', 'user.profile.ssn'])
      expect(decrypted).toEqual(data)
    })

    it('should handle array fields', () => {
      const data = {
        medications: ['aspirin', 'ibuprofen'],
        allergies: ['peanuts', 'shellfish']
      }

      const encrypted = encryptSensitiveFields(data, ['medications', 'allergies'])
      expect(encrypted.medications).not.toEqual(data.medications)
      expect(encrypted.allergies).not.toEqual(data.allergies)

      const decrypted = decryptSensitiveFields(encrypted, ['medications', 'allergies'])
      expect(decrypted).toEqual(data)
    })

    it('should skip non-existent fields gracefully', () => {
      const data = { name: 'John', age: 30 }
      const encrypted = encryptSensitiveFields(data, ['email', 'phone', 'name'])
      
      expect(encrypted.name).not.toBe('John')
      expect(encrypted.age).toBe(30)
      expect(encrypted.email).toBeUndefined()
      expect(encrypted.phone).toBeUndefined()
    })
  })

  describe('Password Hashing', () => {
    it('should hash passwords securely', async () => {
      const password = 'securePassword123!'
      const hash = await hashPassword(password)
      
      expect(hash).not.toBe(password)
      expect(hash).toMatch(/^\$2[ayb]\$10\$/) // bcrypt format
      expect(hash.length).toBeGreaterThan(50)
    })

    it('should verify password against hash', async () => {
      const password = 'testPassword123'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
      
      const isInvalid = await verifyPassword('wrongPassword', hash)
      expect(isInvalid).toBe(false)
    })

    it('should handle empty passwords', async () => {
      await expect(hashPassword('')).rejects.toThrow()
      await expect(hashPassword(null as any)).rejects.toThrow()
      await expect(hashPassword(undefined as any)).rejects.toThrow()
    })

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(200)
      const hash = await hashPassword(longPassword)
      const isValid = await verifyPassword(longPassword, hash)
      
      expect(isValid).toBe(true)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'samePassword'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
      expect(await verifyPassword(password, hash1)).toBe(true)
      expect(await verifyPassword(password, hash2)).toBe(true)
    })
  })

  describe('Audit Logging', () => {
    it('should create audit log entries', async () => {
      const mockCreate = vi.mocked(prisma.auditLog.create)
      mockCreate.mockResolvedValue({
        id: '1',
        action: 'UPDATE',
        entityType: 'Client',
        entityId: 'client-1',
        userId: 'user-1',
        changes: { email: 'new@example.com' },
        metadata: { userAgent: 'test-agent' },
        timestamp: new Date(),
        ipAddress: '127.0.0.1'
      } as any)

      await createAuditLog({
        action: 'UPDATE',
        entityType: 'Client',
        entityId: 'client-1',
        userId: 'user-1',
        changes: { email: 'old@example.com' },
        metadata: { userAgent: 'test-agent', ipAddress: '127.0.0.1' }
      })

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          action: 'UPDATE',
          entityType: 'Client',
          entityId: 'client-1',
          userId: 'user-1',
          changes: { email: 'old@example.com' },
          metadata: { userAgent: 'test-agent', ipAddress: '127.0.0.1' },
          ipAddress: '127.0.0.1'
        }
      })
    })

    it('should sanitize sensitive data in audit logs', async () => {
      const sensitiveChanges = {
        email: 'test@example.com',
        password: 'secretPassword123',
        medicalInfo: { conditions: ['diabetes'] }
      }

      const sanitized = sanitizeForAudit(sensitiveChanges)
      
      expect(sanitized.email).toBe('test@example.com')
      expect(sanitized.password).toBe('[REDACTED]')
      expect(sanitized.medicalInfo).toBe('[REDACTED]')
    })

    it('should retrieve audit logs with filters', async () => {
      const mockFindMany = vi.mocked(prisma.auditLog.findMany)
      const mockLogs = [
        { id: '1', action: 'CREATE', entityType: 'Client' },
        { id: '2', action: 'UPDATE', entityType: 'Client' }
      ]
      mockFindMany.mockResolvedValue(mockLogs as any)

      const logs = await getAuditLogs({
        entityType: 'Client',
        entityId: 'client-1',
        limit: 10
      })

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          entityType: 'Client',
          entityId: 'client-1'
        },
        orderBy: { timestamp: 'desc' },
        take: 10
      })
      expect(logs).toEqual(mockLogs)
    })

    it('should handle audit log creation failures', async () => {
      const mockCreate = vi.mocked(prisma.auditLog.create)
      mockCreate.mockRejectedValue(new Error('Database error'))

      // Should not throw, but log error
      await expect(createAuditLog({
        action: 'CREATE',
        entityType: 'Client',
        entityId: 'client-1',
        userId: 'user-1',
        changes: {}
      })).resolves.not.toThrow()
    })
  })

  describe('Secure Delete Operations', () => {
    it('should perform secure delete with audit logging', async () => {
      const mockTransaction = vi.mocked(prisma.$transaction)
      const mockDeleteMany = vi.fn().mockResolvedValue({ count: 1 })
      const mockAuditCreate = vi.fn().mockResolvedValue({})

      mockTransaction.mockImplementation(async (fn) => {
        return await fn({
          client: { deleteMany: mockDeleteMany },
          auditLog: { create: mockAuditCreate }
        } as any)
      })

      await secureDelete('Client', { id: 'client-1' }, 'user-1')

      expect(mockTransaction).toHaveBeenCalled()
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { id: 'client-1' }
      })
      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DELETE',
          entityType: 'Client',
          entityId: 'client-1',
          userId: 'user-1'
        })
      })
    })

    it('should handle delete failures and rollback', async () => {
      const mockTransaction = vi.mocked(prisma.$transaction)
      mockTransaction.mockRejectedValue(new Error('Delete failed'))

      await expect(secureDelete('Client', { id: 'invalid' }, 'user-1'))
        .rejects.toThrow('Delete failed')
    })
  })

  describe('Data Cleanup Operations', () => {
    it('should cleanup expired appointments', async () => {
      const mockDeleteMany = vi.mocked(prisma.appointment.deleteMany)
      const mockFindMany = vi.mocked(prisma.appointment.findMany)
      
      mockFindMany.mockResolvedValue([
        { id: '1', scheduledDate: new Date('2023-01-01') },
        { id: '2', scheduledDate: new Date('2023-01-02') }
      ] as any)
      mockDeleteMany.mockResolvedValue({ count: 2 })

      const result = await cleanupExpiredData('appointments', 30)

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          scheduledDate: {
            lt: expect.any(Date)
          },
          status: {
            in: ['CANCELLED', 'COMPLETED']
          }
        },
        select: { id: true }
      })
      expect(mockDeleteMany).toHaveBeenCalled()
      expect(result.deletedCount).toBe(2)
    })

    it('should cleanup expired sessions', async () => {
      const mockDeleteMany = vi.mocked(prisma.tattooSession.deleteMany)
      mockDeleteMany.mockResolvedValue({ count: 5 })

      const result = await cleanupExpiredData('sessions', 90)

      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date)
          },
          status: 'COMPLETED'
        }
      })
      expect(result.deletedCount).toBe(5)
    })

    it('should handle cleanup errors gracefully', async () => {
      const mockDeleteMany = vi.mocked(prisma.appointment.deleteMany)
      mockDeleteMany.mockRejectedValue(new Error('Cleanup failed'))

      await expect(cleanupExpiredData('appointments', 30))
        .rejects.toThrow('Cleanup failed')
    })

    it('should validate cleanup parameters', async () => {
      await expect(cleanupExpiredData('invalid' as any, 30))
        .rejects.toThrow('Invalid entity type')
      
      await expect(cleanupExpiredData('appointments', -1))
        .rejects.toThrow('Days must be positive')
    })
  })

  describe('Environment and Configuration', () => {
    it('should require encryption key', () => {
      delete process.env.ENCRYPTION_KEY
      
      expect(() => encryptField('test')).toThrow('ENCRYPTION_KEY environment variable is required')
    })

    it('should handle invalid encryption key length', () => {
      process.env.ENCRYPTION_KEY = 'too-short'
      
      expect(() => encryptField('test')).toThrow()
    })

    it('should use configurable bcrypt rounds', async () => {
      process.env.BCRYPT_ROUNDS = '8'
      
      const password = 'testPassword'
      const hash = await hashPassword(password)
      
      expect(hash).toMatch(/^\$2[ayb]\$08\$/) // Should use 8 rounds
    })
  })

  describe('Data Sanitization', () => {
    it('should sanitize common sensitive fields', () => {
      const data = {
        email: 'test@example.com',
        password: 'secret123',
        token: 'jwt-token',
        apiKey: 'api-key-123',
        medicalInfo: { conditions: ['diabetes'] },
        notes: 'patient notes',
        regularField: 'public data'
      }

      const sanitized = sanitizeForAudit(data)

      expect(sanitized.email).toBe('test@example.com') // Email is allowed
      expect(sanitized.password).toBe('[REDACTED]')
      expect(sanitized.token).toBe('[REDACTED]')
      expect(sanitized.apiKey).toBe('[REDACTED]')
      expect(sanitized.medicalInfo).toBe('[REDACTED]')
      expect(sanitized.notes).toBe('patient notes') // Notes allowed but truncated
      expect(sanitized.regularField).toBe('public data')
    })

    it('should truncate long text fields', () => {
      const longText = 'a'.repeat(500)
      const data = { notes: longText }
      
      const sanitized = sanitizeForAudit(data)
      
      expect(sanitized.notes.length).toBeLessThanOrEqual(200)
      expect(sanitized.notes).toMatch(/\.\.\.$/) // Should end with ...
    })

    it('should handle nested objects in sanitization', () => {
      const data = {
        user: {
          email: 'test@example.com',
          password: 'secret'
        },
        metadata: {
          apiKey: 'key-123'
        }
      }

      const sanitized = sanitizeForAudit(data)
      
      expect(sanitized.user.email).toBe('test@example.com')
      expect(sanitized.user.password).toBe('[REDACTED]')
      expect(sanitized.metadata.apiKey).toBe('[REDACTED]')
    })
  })
})