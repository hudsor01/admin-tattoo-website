import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'
import {
  paginationSchema,
  dateRangeSchema,
  secureEmailSchema,
  securePasswordSchema,
  secureNameSchema,
  securePhoneSchema,
  createCustomerSchema,
  updateCustomerSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  createPaymentSchema,
  updatePaymentSchema,
  createGalleryItemSchema,
  updateGalleryItemSchema,
  appointmentFilterSchema,
  customerFilterSchema,
  loginSchema,
  signupSchema,
  fileUploadSchema,
  analyticsFilterSchema,
  rateLimitSchema,
  auditLogSchema,
  apiResponseSchema,
  paginatedResponseSchema
} from '@/lib/validations'

// Mock sanitization functions
vi.mock('@/lib/sanitization', () => ({
  sanitizeString: vi.fn((str: string) => str),
  sanitizeEmail: vi.fn((email: string) => email),
  sanitizePhone: vi.fn((phone: string) => phone),
  containsSuspiciousPatterns: vi.fn(() => false)
}))

describe('validations.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('paginationSchema', () => {
    it('should validate valid pagination data', () => {
      const valid = { page: 1, limit: 10 }
      expect(paginationSchema.parse(valid)).toEqual(valid)
    })

    it('should provide defaults for missing fields', () => {
      expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 10 })
    })

    it('should coerce string numbers', () => {
      expect(paginationSchema.parse({ page: '2', limit: '20' })).toEqual({ page: 2, limit: 20 })
    })

    it('should enforce maximum limits', () => {
      expect(() => paginationSchema.parse({ page: 1001 })).toThrow()
      expect(() => paginationSchema.parse({ limit: 101 })).toThrow()
    })

    it('should reject negative values', () => {
      expect(() => paginationSchema.parse({ page: -1 })).toThrow()
      expect(() => paginationSchema.parse({ limit: -5 })).toThrow()
    })

    it('should reject zero values', () => {
      expect(() => paginationSchema.parse({ page: 0 })).toThrow()
      expect(() => paginationSchema.parse({ limit: 0 })).toThrow()
    })
  })

  describe('dateRangeSchema', () => {
    it('should validate valid date range', () => {
      const valid = {
        from: '2024-01-01T00:00:00Z',
        to: '2024-12-31T23:59:59Z'
      }
      expect(dateRangeSchema.parse(valid)).toEqual(valid)
    })

    it('should accept missing dates', () => {
      expect(dateRangeSchema.parse({})).toEqual({})
      expect(dateRangeSchema.parse({ from: '2024-01-01T00:00:00Z' })).toEqual({ from: '2024-01-01T00:00:00Z' })
    })

    it('should reject invalid date range (end before start)', () => {
      const invalid = {
        from: '2024-12-31T23:59:59Z',
        to: '2024-01-01T00:00:00Z'
      }
      expect(() => dateRangeSchema.parse(invalid)).toThrow('End date must be after start date')
    })

    it('should accept same dates', () => {
      const same = {
        from: '2024-06-15T12:00:00Z',
        to: '2024-06-15T12:00:00Z'
      }
      expect(dateRangeSchema.parse(same)).toEqual(same)
    })

    it('should reject invalid datetime format', () => {
      expect(() => dateRangeSchema.parse({ from: 'invalid-date' })).toThrow()
    })
  })

  describe('secureEmailSchema', () => {
    it('should validate correct emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin+tag@company.org'
      ]
      
      validEmails.forEach(email => {
        expect(secureEmailSchema.parse(email)).toBe(email)
      })
    })

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      expect(() => secureEmailSchema.parse(longEmail)).toThrow('Email too long')
    })

    it('should reject emails with double @', () => {
      expect(() => secureEmailSchema.parse('user@@example.com')).toThrow()
    })

    it('should reject emails with double dots', () => {
      expect(() => secureEmailSchema.parse('user..name@example.com')).toThrow()
    })

    it('should reject emails starting/ending with dots', () => {
      expect(() => secureEmailSchema.parse('.user@example.com')).toThrow()
      expect(() => secureEmailSchema.parse('user@example.com.')).toThrow()
    })

    it('should validate RFC compliance', () => {
      expect(() => secureEmailSchema.parse('user@')).toThrow()
      expect(() => secureEmailSchema.parse('@example.com')).toThrow()
      expect(() => secureEmailSchema.parse('user@domain')).toThrow()
    })

    it('should reject local part > 64 chars', () => {
      const longLocal = 'a'.repeat(65) + '@example.com'
      expect(() => secureEmailSchema.parse(longLocal)).toThrow()
    })

    it('should reject domain > 253 chars', () => {
      const longDomain = 'user@' + 'a'.repeat(250) + '.com'
      expect(() => secureEmailSchema.parse(longDomain)).toThrow()
    })
  })

  describe('securePasswordSchema', () => {
    it('should validate strong password', () => {
      const strongPassword = 'StrongPass123!'
      expect(securePasswordSchema.parse(strongPassword)).toBe(strongPassword)
    })

    it('should reject short passwords', () => {
      expect(() => securePasswordSchema.parse('Short1!')).toThrow('Password must be at least 12 characters')
    })

    it('should reject long passwords', () => {
      const longPassword = 'A'.repeat(130) + '1!'
      expect(() => securePasswordSchema.parse(longPassword)).toThrow('Password too long')
    })

    it('should require uppercase letter', () => {
      expect(() => securePasswordSchema.parse('nouppercase123!')).toThrow()
    })

    it('should require lowercase letter', () => {
      expect(() => securePasswordSchema.parse('NOLOWERCASE123!')).toThrow()
    })

    it('should require number', () => {
      expect(() => securePasswordSchema.parse('NoNumbersHere!')).toThrow()
    })

    it('should require special character', () => {
      expect(() => securePasswordSchema.parse('NoSpecialChar123')).toThrow()
    })

    it('should reject common weak passwords', () => {
      const weakPasswords = [
        'Password123!',
        'Qwerty123456!',
        'Admin123456!',
        '123456789Abc!'
      ]
      
      weakPasswords.forEach(password => {
        expect(() => securePasswordSchema.parse(password)).toThrow('Password is too common')
      })
    })
  })

  describe('secureNameSchema', () => {
    it('should validate correct names', () => {
      const validNames = [
        'John Doe',
        "O'Connor",
        'Mary-Jane'
      ]
      
      validNames.forEach(name => {
        expect(secureNameSchema.parse(name)).toBe(name)
      })
    })

    it('should reject empty names', () => {
      expect(() => secureNameSchema.parse('')).toThrow('Name is required')
    })

    it('should reject long names', () => {
      const longName = 'A'.repeat(101)
      expect(() => secureNameSchema.parse(longName)).toThrow('Name too long')
    })

    it('should reject invalid characters', () => {
      const invalidNames = ['John123', 'User@email', 'Name<script>']
      
      invalidNames.forEach(name => {
        expect(() => secureNameSchema.parse(name)).toThrow('Name contains invalid characters')
      })
    })
  })

  describe('securePhoneSchema', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '555-123-4567'
      ]
      
      validPhones.forEach(phone => {
        expect(securePhoneSchema.parse(phone)).toBe(phone)
      })
    })

    it('should accept empty string', () => {
      expect(securePhoneSchema.parse('')).toBe('')
    })

    it('should accept undefined', () => {
      expect(securePhoneSchema.parse(undefined)).toBeUndefined()
    })

    it('should reject invalid formats', () => {
      const invalidPhones = ['123', 'abc-def-ghij', '0123456789']
      
      invalidPhones.forEach(phone => {
        expect(() => securePhoneSchema.parse(phone)).toThrow()
      })
    })

    it('should reject long phone numbers', () => {
      const longPhone = '1'.repeat(21)
      expect(() => securePhoneSchema.parse(longPhone)).toThrow('Phone number too long')
    })
  })

  describe('createCustomerSchema', () => {
    const validCustomer = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      dateOfBirth: '1990-01-01',
      address: '123 Main St',
      emergencyContact: 'Jane Doe (555) 123-4567',
      medicalConditions: 'None',
      allergies: 'None',
      notes: 'Regular customer'
    }

    it('should validate complete customer data', () => {
      expect(createCustomerSchema.parse(validCustomer)).toEqual(expect.objectContaining(validCustomer))
    })

    it('should validate minimal customer data', () => {
      const minimal = { name: 'John Doe' }
      expect(createCustomerSchema.parse(minimal)).toEqual(expect.objectContaining(minimal))
    })

    it('should validate age restrictions', () => {
      const tooYoung = { ...validCustomer, dateOfBirth: '2010-01-01' }
      const tooOld = { ...validCustomer, dateOfBirth: '1800-01-01' }
      
      expect(() => createCustomerSchema.parse(tooYoung)).toThrow('Invalid age')
      expect(() => createCustomerSchema.parse(tooOld)).toThrow('Invalid age')
    })

    it('should validate date format', () => {
      const invalidDate = { ...validCustomer, dateOfBirth: '01/01/1990' }
      expect(() => createCustomerSchema.parse(invalidDate)).toThrow('Invalid date format')
    })

    it('should enforce field length limits', () => {
      const longAddress = { ...validCustomer, address: 'A'.repeat(501) }
      const longNotes = { ...validCustomer, notes: 'A'.repeat(2001) }
      
      expect(() => createCustomerSchema.parse(longAddress)).toThrow('Address too long')
      expect(() => createCustomerSchema.parse(longNotes)).toThrow('Notes too long')
    })
  })

  describe('updateCustomerSchema', () => {
    const validUpdate = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Updated Name',
      email: 'updated@example.com'
    }

    it('should validate customer update', () => {
      expect(updateCustomerSchema.parse(validUpdate)).toEqual(validUpdate)
    })

    it('should require valid UUID', () => {
      const invalidId = { ...validUpdate, id: 'invalid-uuid' }
      expect(() => updateCustomerSchema.parse(invalidId)).toThrow('Invalid customer ID')
    })

    it('should allow partial updates', () => {
      const partial = { id: validUpdate.id, name: 'New Name' }
      expect(updateCustomerSchema.parse(partial)).toEqual(partial)
    })
  })

  describe('createAppointmentSchema', () => {
    const validAppointment = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      type: 'CONSULTATION' as const,
      appointmentDate: '2024-12-01T10:00:00Z'
    }

    it('should validate appointment creation', () => {
      expect(createAppointmentSchema.parse(validAppointment)).toEqual(expect.objectContaining(validAppointment))
    })

    it('should validate appointment types', () => {
      const validTypes = ['CONSULTATION', 'TATTOO_SESSION', 'TOUCH_UP', 'REMOVAL']
      
      validTypes.forEach(type => {
        const appointment = { ...validAppointment, type }
        expect(createAppointmentSchema.parse(appointment)).toEqual(expect.objectContaining({ type }))
      })
    })

    it('should reject invalid appointment type', () => {
      const invalid = { ...validAppointment, type: 'INVALID_TYPE' }
      expect(() => createAppointmentSchema.parse(invalid)).toThrow()
    })

    it('should validate datetime format', () => {
      const invalidDate = { ...validAppointment, appointmentDate: '2024-12-01' }
      expect(() => createAppointmentSchema.parse(invalidDate)).toThrow('Invalid appointment date')
    })

    it('should validate duration constraints', () => {
      const zeroDuration = { ...validAppointment, duration: 0 }
      const negativeDuration = { ...validAppointment, duration: -1 }
      
      expect(() => createAppointmentSchema.parse(zeroDuration)).toThrow('Duration must be positive')
      expect(() => createAppointmentSchema.parse(negativeDuration)).toThrow('Duration must be positive')
    })
  })

  describe('createPaymentSchema', () => {
    const validPayment = {
      appointmentId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 100.50,
      method: 'card' as const,
      status: 'completed' as const
    }

    it('should validate payment creation', () => {
      expect(createPaymentSchema.parse(validPayment)).toEqual(validPayment)
    })

    it('should validate payment methods', () => {
      const validMethods = ['cash', 'card', 'transfer', 'venmo', 'zelle']
      
      validMethods.forEach(method => {
        const payment = { ...validPayment, method }
        expect(createPaymentSchema.parse(payment)).toEqual(expect.objectContaining({ method }))
      })
    })

    it('should validate payment statuses', () => {
      const validStatuses = ['pending', 'completed', 'failed', 'refunded']
      
      validStatuses.forEach(status => {
        const payment = { ...validPayment, status }
        expect(createPaymentSchema.parse(payment)).toEqual(expect.objectContaining({ status }))
      })
    })

    it('should reject zero/negative amounts', () => {
      const zeroAmount = { ...validPayment, amount: 0 }
      const negativeAmount = { ...validPayment, amount: -10 }
      
      expect(() => createPaymentSchema.parse(zeroAmount)).toThrow('Amount must be greater than 0')
      expect(() => createPaymentSchema.parse(negativeAmount)).toThrow('Amount must be greater than 0')
    })
  })

  describe('createGalleryItemSchema', () => {
    const validGalleryItem = {
      title: 'Beautiful Tattoo',
      imageUrl: 'https://example.com/image.jpg',
      featured: false
    }

    it('should validate gallery item creation', () => {
      expect(createGalleryItemSchema.parse(validGalleryItem)).toEqual(expect.objectContaining(validGalleryItem))
    })

    it('should require valid URL', () => {
      const invalidUrl = { ...validGalleryItem, imageUrl: 'not-a-url' }
      expect(() => createGalleryItemSchema.parse(invalidUrl)).toThrow('Invalid image URL')
    })

    it('should validate tag limits', () => {
      const tooManyTags = { 
        ...validGalleryItem, 
        tags: Array(11).fill('tag')
      }
      expect(() => createGalleryItemSchema.parse(tooManyTags)).toThrow('Too many tags')
    })

    it('should validate tag length', () => {
      const longTag = { 
        ...validGalleryItem, 
        tags: ['A'.repeat(51)]
      }
      expect(() => createGalleryItemSchema.parse(longTag)).toThrow('Tag too long')
    })

    it('should set default featured value', () => {
      const result = createGalleryItemSchema.parse(validGalleryItem)
      expect(result.featured).toBe(false)
    })
  })

  describe('appointmentFilterSchema', () => {
    it('should validate appointment filters', () => {
      const filter = {
        status: ['SCHEDULED', 'CONFIRMED'] as const,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z'
      }
      expect(appointmentFilterSchema.parse(filter)).toEqual(expect.objectContaining(filter))
    })

    it('should provide defaults', () => {
      const result = appointmentFilterSchema.parse({})
      expect(result.limit).toBe(20)
      expect(result.offset).toBe(0)
    })

    it('should validate status values', () => {
      const invalidStatus = { status: ['INVALID_STATUS'] }
      expect(() => appointmentFilterSchema.parse(invalidStatus)).toThrow()
    })
  })

  describe('loginSchema', () => {
    it('should validate login credentials', () => {
      const login = {
        email: 'user@example.com',
        password: 'password123'
      }
      expect(loginSchema.parse(login)).toEqual(login)
    })

    it('should require password', () => {
      const noPassword = { email: 'user@example.com', password: '' }
      expect(() => loginSchema.parse(noPassword)).toThrow('Password is required')
    })
  })

  describe('signupSchema', () => {
    const validSignup = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!'
    }

    it('should validate signup data', () => {
      expect(signupSchema.parse(validSignup)).toEqual(validSignup)
    })

    it('should require password confirmation match', () => {
      const mismatch = { ...validSignup, confirmPassword: 'DifferentPass123!' }
      expect(() => signupSchema.parse(mismatch)).toThrow("Passwords don't match")
    })
  })

  describe('fileUploadSchema', () => {
    const validFile = {
      filename: 'image.jpg',
      mimetype: 'image/jpeg' as const,
      size: 1024 * 1024 // 1MB
    }

    it('should validate file upload', () => {
      expect(fileUploadSchema.parse(validFile)).toEqual(validFile)
    })

    it('should validate allowed file types', () => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
      
      validTypes.forEach(mimetype => {
        const file = { ...validFile, mimetype }
        expect(fileUploadSchema.parse(file)).toEqual(expect.objectContaining({ mimetype }))
      })
    })

    it('should reject large files', () => {
      const largeFile = { ...validFile, size: 11 * 1024 * 1024 } // 11MB
      expect(() => fileUploadSchema.parse(largeFile)).toThrow('File too large')
    })

    it('should reject invalid filename characters', () => {
      const invalidFile = { ...validFile, filename: 'file with spaces.jpg' }
      expect(() => fileUploadSchema.parse(invalidFile)).toThrow('Invalid filename characters')
    })

    it('should reject negative file size', () => {
      const invalidSize = { ...validFile, size: -1 }
      expect(() => fileUploadSchema.parse(invalidSize)).toThrow('Invalid file size')
    })
  })

  describe('analyticsFilterSchema', () => {
    it('should validate analytics filters', () => {
      const filter = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        metrics: ['bookings', 'revenue'] as const,
        period: 'month' as const
      }
      expect(analyticsFilterSchema.parse(filter)).toEqual(filter)
    })

    it('should provide default period', () => {
      const result = analyticsFilterSchema.parse({})
      expect(result.period).toBe('month')
    })

    it('should validate metric values', () => {
      const validMetrics = ['bookings', 'revenue', 'customers', 'retention']
      
      validMetrics.forEach(metric => {
        const filter = { metrics: [metric] }
        expect(analyticsFilterSchema.parse(filter)).toEqual(expect.objectContaining(filter))
      })
    })

    it('should validate period values', () => {
      const validPeriods = ['day', 'week', 'month', 'year']
      
      validPeriods.forEach(period => {
        const filter = { period }
        expect(analyticsFilterSchema.parse(filter)).toEqual(expect.objectContaining({ period }))
      })
    })
  })

  describe('rateLimitSchema', () => {
    it('should validate rate limit data', () => {
      const rateLimit = {
        ip: '192.168.1.1',
        endpoint: '/api/admin/dashboard',
        timestamp: Date.now()
      }
      expect(rateLimitSchema.parse(rateLimit)).toEqual(rateLimit)
    })

    it('should validate IP addresses', () => {
      const validIPs = ['192.168.1.1', '::1', '2001:db8::1']
      
      validIPs.forEach(ip => {
        const rateLimit = { ip, endpoint: '/test', timestamp: Date.now() }
        expect(rateLimitSchema.parse(rateLimit)).toEqual(expect.objectContaining({ ip }))
      })
    })

    it('should reject invalid IP addresses', () => {
      const invalidIP = { ip: 'not-an-ip', endpoint: '/test', timestamp: Date.now() }
      expect(() => rateLimitSchema.parse(invalidIP)).toThrow()
    })
  })

  describe('auditLogSchema', () => {
    const validAuditLog = {
      action: 'CREATE' as const,
      resource: 'customer',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      timestamp: '2024-06-15T12:00:00Z'
    }

    it('should validate audit log', () => {
      expect(auditLogSchema.parse(validAuditLog)).toEqual(validAuditLog)
    })

    it('should validate action types', () => {
      const validActions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN']
      
      validActions.forEach(action => {
        const log = { ...validAuditLog, action }
        expect(auditLogSchema.parse(log)).toEqual(expect.objectContaining({ action }))
      })
    })

    it('should handle optional fields', () => {
      const withOptionals = {
        ...validAuditLog,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        resourceId: '123e4567-e89b-12d3-a456-426614174000',
        metadata: { key: 'value' }
      }
      expect(auditLogSchema.parse(withOptionals)).toEqual(withOptionals)
    })
  })

  describe('apiResponseSchema', () => {
    it('should validate API response', () => {
      const response = {
        success: true,
        data: { id: 1, name: 'test' },
        message: 'Success'
      }
      expect(apiResponseSchema.parse(response)).toEqual(response)
    })

    it('should validate error response', () => {
      const errorResponse = {
        success: false,
        error: 'Something went wrong'
      }
      expect(apiResponseSchema.parse(errorResponse)).toEqual(errorResponse)
    })
  })

  describe('paginatedResponseSchema', () => {
    it('should validate paginated response', () => {
      const response = {
        success: true,
        data: [{ id: 1 }, { id: 2 }],
        pagination: {
          total: 2,
          limit: 10,
          offset: 0,
          hasMore: false
        }
      }
      expect(paginatedResponseSchema.parse(response)).toEqual(response)
    })

    it('should validate empty paginated response', () => {
      const response = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false
        }
      }
      expect(paginatedResponseSchema.parse(response)).toEqual(response)
    })
  })

  describe('edge cases and error conditions', () => {
    it('should handle null and undefined values appropriately', () => {
      expect(() => paginationSchema.parse(null)).toThrow()
      expect(() => secureEmailSchema.parse(null)).toThrow()
      expect(() => securePasswordSchema.parse(undefined)).toThrow()
    })

    it('should handle type coercion correctly', () => {
      expect(paginationSchema.parse({ page: '1', limit: '10' })).toEqual({ page: 1, limit: 10 })
    })

    it('should maintain referential integrity in nested schemas', () => {
      const customerWithAppointment = {
        name: 'John Doe',
        email: 'john@example.com'
      }
      expect(createCustomerSchema.parse(customerWithAppointment)).toEqual(expect.objectContaining(customerWithAppointment))
    })
  })
})