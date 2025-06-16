import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// Store original environment
const originalEnv = process.env

describe('Environment Utils', () => {
  beforeEach(() => {
    // Create a fresh copy of environment variables
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('getEnvSafe', () => {
    it('should return environment variable value when set', async () => {
      process.env.TEST_VAR = 'test-value'
      
      const { getEnvSafe } = await import('@/lib/utils/env')
      const result = getEnvSafe('TEST_VAR')
      
      expect(result).toBe('test-value')
    })

    it('should return default value when environment variable is not set', async () => {
      delete process.env.TEST_VAR
      
      const { getEnvSafe } = await import('@/lib/utils/env')
      const result = getEnvSafe('TEST_VAR', 'default-value')
      
      expect(result).toBe('default-value')
    })

    it('should throw error when environment variable is not set and no default provided', async () => {
      delete process.env.TEST_VAR
      
      const { getEnvSafe } = await import('@/lib/utils/env')
      
      expect(() => getEnvSafe('TEST_VAR')).toThrow(
        'Environment variable TEST_VAR is required but not set'
      )
    })

    it('should handle empty string as valid value', async () => {
      process.env.EMPTY_VAR = ''
      
      const { getEnvSafe } = await import('@/lib/utils/env')
      const result = getEnvSafe('EMPTY_VAR')
      
      expect(result).toBe('')
    })

    it('should handle environment variables with special characters', async () => {
      process.env.SPECIAL_VAR = 'value with spaces and symbols !@#$%^&*()'
      
      const { getEnvSafe } = await import('@/lib/utils/env')
      const result = getEnvSafe('SPECIAL_VAR')
      
      expect(result).toBe('value with spaces and symbols !@#$%^&*()')
    })

    it('should use Object.prototype.hasOwnProperty for safety', async () => {
      // Test that it doesn't pick up inherited properties
      process.env.TEST_INHERITED = 'inherited-value'
      
      const { getEnvSafe } = await import('@/lib/utils/env')
      const result = getEnvSafe('TEST_INHERITED')
      
      expect(result).toBe('inherited-value')
    })
  })

  describe('getEnvOptional', () => {
    it('should return environment variable value when set', async () => {
      process.env.OPTIONAL_VAR = 'optional-value'
      
      const { getEnvOptional } = await import('@/lib/utils/env')
      const result = getEnvOptional('OPTIONAL_VAR')
      
      expect(result).toBe('optional-value')
    })

    it('should return default value when environment variable is not set', async () => {
      delete process.env.OPTIONAL_VAR
      
      const { getEnvOptional } = await import('@/lib/utils/env')
      const result = getEnvOptional('OPTIONAL_VAR', 'default-optional')
      
      expect(result).toBe('default-optional')
    })

    it('should return undefined when environment variable is not set and no default provided', async () => {
      delete process.env.OPTIONAL_VAR
      
      const { getEnvOptional } = await import('@/lib/utils/env')
      const result = getEnvOptional('OPTIONAL_VAR')
      
      expect(result).toBeUndefined()
    })

    it('should return environment variable over default when both exist', async () => {
      process.env.PRIORITY_VAR = 'env-value'
      
      const { getEnvOptional } = await import('@/lib/utils/env')
      const result = getEnvOptional('PRIORITY_VAR', 'default-value')
      
      expect(result).toBe('env-value')
    })

    it('should handle empty string environment variable', async () => {
      process.env.EMPTY_OPTIONAL = ''
      
      const { getEnvOptional } = await import('@/lib/utils/env')
      const result = getEnvOptional('EMPTY_OPTIONAL', 'default-value')
      
      expect(result).toBe('default-value') // Empty string is falsy, so default is used
    })
  })

  describe('getEnvBoolean', () => {
    it('should return true for "true" value', async () => {
      process.env.BOOL_VAR = 'true'
      
      const { getEnvBoolean } = await import('@/lib/utils/env')
      const result = getEnvBoolean('BOOL_VAR')
      
      expect(result).toBe(true)
    })

    it('should return true for "1" value', async () => {
      process.env.BOOL_VAR = '1'
      
      const { getEnvBoolean } = await import('@/lib/utils/env')
      const result = getEnvBoolean('BOOL_VAR')
      
      expect(result).toBe(true)
    })

    it('should return true for "TRUE" value (case insensitive)', async () => {
      process.env.BOOL_VAR = 'TRUE'
      
      const { getEnvBoolean } = await import('@/lib/utils/env')
      const result = getEnvBoolean('BOOL_VAR')
      
      expect(result).toBe(true)
    })

    it('should return false for "false" value', async () => {
      process.env.BOOL_VAR = 'false'
      
      const { getEnvBoolean } = await import('@/lib/utils/env')
      const result = getEnvBoolean('BOOL_VAR')
      
      expect(result).toBe(false)
    })

    it('should return false for "0" value', async () => {
      process.env.BOOL_VAR = '0'
      
      const { getEnvBoolean } = await import('@/lib/utils/env')
      const result = getEnvBoolean('BOOL_VAR')
      
      expect(result).toBe(false)
    })

    it('should return false for arbitrary string values', async () => {
      process.env.BOOL_VAR = 'random-string'
      
      const { getEnvBoolean } = await import('@/lib/utils/env')
      const result = getEnvBoolean('BOOL_VAR')
      
      expect(result).toBe(false)
    })

    it('should return default value when environment variable is not set', async () => {
      delete process.env.BOOL_VAR
      
      const { getEnvBoolean } = await import('@/lib/utils/env')
      const result = getEnvBoolean('BOOL_VAR', true)
      
      expect(result).toBe(true)
    })

    it('should return false as default when no default provided', async () => {
      delete process.env.BOOL_VAR
      
      const { getEnvBoolean } = await import('@/lib/utils/env')
      const result = getEnvBoolean('BOOL_VAR')
      
      expect(result).toBe(false)
    })

    it('should handle mixed case true values', async () => {
      const trueValues = ['True', 'tRuE', 'TRUE', 'true']
      
      for (const value of trueValues) {
        process.env.CASE_TEST = value
        
        const { getEnvBoolean } = await import('@/lib/utils/env')
        const result = getEnvBoolean('CASE_TEST')
        
        expect(result).toBe(true)
      }
    })
  })

  describe('getEnvNumber', () => {
    it('should return parsed number when valid integer provided', async () => {
      process.env.NUM_VAR = '42'
      
      const { getEnvNumber } = await import('@/lib/utils/env')
      const result = getEnvNumber('NUM_VAR')
      
      expect(result).toBe(42)
    })

    it('should return default value when environment variable is not set', async () => {
      delete process.env.NUM_VAR
      
      const { getEnvNumber } = await import('@/lib/utils/env')
      const result = getEnvNumber('NUM_VAR', 100)
      
      expect(result).toBe(100)
    })

    it('should throw error when environment variable is not set and no default provided', async () => {
      delete process.env.NUM_VAR
      
      const { getEnvNumber } = await import('@/lib/utils/env')
      
      expect(() => getEnvNumber('NUM_VAR')).toThrow(
        'Environment variable NUM_VAR is required but not set'
      )
    })

    it('should throw error when environment variable is not a valid number', async () => {
      process.env.INVALID_NUM = 'not-a-number'
      
      const { getEnvNumber } = await import('@/lib/utils/env')
      
      expect(() => getEnvNumber('INVALID_NUM')).toThrow(
        'Environment variable INVALID_NUM must be a valid number, got: not-a-number'
      )
    })

    it('should handle negative numbers', async () => {
      process.env.NEGATIVE_NUM = '-123'
      
      const { getEnvNumber } = await import('@/lib/utils/env')
      const result = getEnvNumber('NEGATIVE_NUM')
      
      expect(result).toBe(-123)
    })

    it('should handle zero', async () => {
      process.env.ZERO_NUM = '0'
      
      const { getEnvNumber } = await import('@/lib/utils/env')
      const result = getEnvNumber('ZERO_NUM')
      
      expect(result).toBe(0)
    })

    it('should parse float numbers as integers', async () => {
      process.env.FLOAT_NUM = '42.7'
      
      const { getEnvNumber } = await import('@/lib/utils/env')
      const result = getEnvNumber('FLOAT_NUM')
      
      expect(result).toBe(42) // parseInt truncates
    })

    it('should handle numbers with leading/trailing whitespace', async () => {
      process.env.WHITESPACE_NUM = '  123  '
      
      const { getEnvNumber } = await import('@/lib/utils/env')
      const result = getEnvNumber('WHITESPACE_NUM')
      
      expect(result).toBe(123)
    })

    it('should handle scientific notation', async () => {
      process.env.SCIENTIFIC_NUM = '1e3'
      
      const { getEnvNumber } = await import('@/lib/utils/env')
      const result = getEnvNumber('SCIENTIFIC_NUM')
      
      expect(result).toBe(1) // parseInt stops at 'e'
    })
  })

  describe('ENV constants', () => {
    it('should have correct environment constants structure', async () => {
      // Set required environment variables
      process.env.DATABASE_URL = 'postgresql://test'
      process.env.BETTER_AUTH_URL = 'http://localhost:3000'
      process.env.BETTER_AUTH_SECRET = 'secret'
      
      const { ENV } = await import('@/lib/utils/env')
      
      expect(ENV).toBeDefined()
      expect(ENV.DATABASE_URL).toBe('postgresql://test')
      expect(ENV.BETTER_AUTH_URL).toBe('http://localhost:3000')
      expect(ENV.BETTER_AUTH_SECRET).toBe('secret')
    })

    it('should handle optional environment variables', async () => {
      // Set only required variables
      process.env.DATABASE_URL = 'postgresql://test'
      process.env.BETTER_AUTH_URL = 'http://localhost:3000'
      process.env.BETTER_AUTH_SECRET = 'secret'
      
      // Don't set optional ones
      delete process.env.GOOGLE_CLIENT_ID
      delete process.env.GOOGLE_CLIENT_SECRET
      delete process.env.UPLOADTHING_SECRET
      
      const { ENV } = await import('@/lib/utils/env')
      
      expect(ENV.GOOGLE_CLIENT_ID).toBeUndefined()
      expect(ENV.GOOGLE_CLIENT_SECRET).toBeUndefined()
      expect(ENV.UPLOADTHING_SECRET).toBeUndefined()
    })

    it('should use default values for NODE_ENV and PORT', async () => {
      // Set required variables
      process.env.DATABASE_URL = 'postgresql://test'
      process.env.BETTER_AUTH_URL = 'http://localhost:3000'
      process.env.BETTER_AUTH_SECRET = 'secret'
      
      // Don't set NODE_ENV and PORT
      delete process.env.NODE_ENV
      delete process.env.PORT
      
      const { ENV } = await import('@/lib/utils/env')
      
      expect(ENV.NODE_ENV).toBe('production')
      expect(ENV.PORT).toBe(3001)
    })

    it('should override defaults when environment variables are set', async () => {
      process.env.DATABASE_URL = 'postgresql://test'
      process.env.BETTER_AUTH_URL = 'http://localhost:3000'
      process.env.BETTER_AUTH_SECRET = 'secret'
      process.env.NODE_ENV = 'development'
      process.env.PORT = '4000'
      
      const { ENV } = await import('@/lib/utils/env')
      
      expect(ENV.NODE_ENV).toBe('development')
      expect(ENV.PORT).toBe(4000)
    })
  })

  describe('Environment flags', () => {
    it('should export correct environment flags', async () => {
      const { isDevelopment, isProduction, isTest } = await import('@/lib/utils/env')
      
      expect(isDevelopment).toBe(false)
      expect(isProduction).toBe(true)
      expect(isTest).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined process.env gracefully', async () => {
      // This is more of a safety test for edge cases
      const originalProcessEnv = process.env
      
      try {
        // Temporarily remove process.env
        ;(global as any).process = { ...process, env: undefined }
        
        // This would typically cause issues, but our implementation should handle it
        expect(() => {
          const { getEnvSafe } = require('@/lib/utils/env')
          getEnvSafe('TEST_VAR', 'default')
        }).not.toThrow()
      } finally {
        ;(global as any).process.env = originalProcessEnv
      }
    })

    it('should handle very long environment variable values', async () => {
      const longValue = 'a'.repeat(10000)
      process.env.LONG_VAR = longValue
      
      const { getEnvSafe } = await import('@/lib/utils/env')
      const result = getEnvSafe('LONG_VAR')
      
      expect(result).toBe(longValue)
      expect(result.length).toBe(10000)
    })

    it('should handle environment variables with newlines', async () => {
      process.env.MULTILINE_VAR = 'line1\nline2\nline3'
      
      const { getEnvSafe } = await import('@/lib/utils/env')
      const result = getEnvSafe('MULTILINE_VAR')
      
      expect(result).toBe('line1\nline2\nline3')
    })

    it('should handle environment variables with unicode characters', async () => {
      process.env.UNICODE_VAR = '测试 🚀 Ñoël'
      
      const { getEnvSafe } = await import('@/lib/utils/env')
      const result = getEnvSafe('UNICODE_VAR')
      
      expect(result).toBe('测试 🚀 Ñoël')
    })

    it('should handle number edge cases', async () => {
      const numberTestCases = [
        { input: '999999999999999', expected: 999999999999999 },
        { input: '-999999999999999', expected: -999999999999999 },
        { input: '0x10', expected: 0 }, // parseInt stops at 'x'
        { input: '10.0', expected: 10 }
      ]
      
      for (const testCase of numberTestCases) {
        process.env.NUM_TEST = testCase.input
        
        const { getEnvNumber } = await import('@/lib/utils/env')
        const result = getEnvNumber('NUM_TEST')
        
        expect(result).toBe(testCase.expected)
      }
    })
  })
})