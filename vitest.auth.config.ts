import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vitest configuration specifically for Better Auth testing
 * 
 * This configuration is optimized for testing auth functionality
 * with proper mocking and environment setup
 */

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global setup and teardown
    setupFiles: [
      './src/test/utils/test-setup.ts'
    ],
    
    // Test file patterns for auth tests
    include: [
      'src/test/**/*.test.{ts,tsx}',
      'src/test/**/*.spec.{ts,tsx}'
    ],
    
    // Exclude non-auth related tests when running auth-specific tests
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/tests/e2e/**',
      '**/playwright/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
    ],
    
    // Global test configuration
    globals: true,
    
    // Test timeout settings
    testTimeout: 10000, // 10 seconds for most tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
    
    // Coverage configuration for auth code
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/auth*.ts',
        'src/components/providers/AuthProvider.tsx',
        'src/stores/auth-store.ts',
        'middleware.ts'
      ],
      exclude: [
        'src/test/**',
        'tests/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/node_modules/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Reporting
    reporter: ['verbose', 'json', 'html'],
    
    // Environment variables for testing
    env: {
      NODE_ENV: 'test',
      BETTER_AUTH_SECRET: 'test-secret-key-for-testing-only',
      BETTER_AUTH_URL: 'http://localhost:3001/api/auth',
      GOOGLE_CLIENT_ID: 'mock-google-client-id',
      GOOGLE_CLIENT_SECRET: 'mock-google-client-secret',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test'
    },
    
    // Retry failed tests
    retry: 2,
    
    // Run tests in parallel
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },
    
    // Mock settings
    mockReset: true,
    clearMocks: true,
    restoreMocks: true
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/types': resolve(__dirname, './src/types'),
      '@/stores': resolve(__dirname, './src/stores'),
      '@/test': resolve(__dirname, './src/test')
    }
  },
  
  // Define for global constants
  define: {
    'process.env.NODE_ENV': '"test"'
  },
  
  // ESBuild options for JSX
  esbuild: {
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment'
  }
});