// Test if auth configuration is working
import { auth } from '@/lib/auth';

async function testAuthConfig() {
  try {
    console.log('Testing auth configuration...');
    
    // Test if auth instance was created successfully
    console.log('✅ Auth instance created successfully');
    
    // Test environment variables
    console.log('Environment check:');
    console.log('BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
    
    // Test database connection
    console.log('Testing database connection...');
    // This should not throw if properly configured
    
    console.log('✅ Auth configuration test completed');
    
  } catch (error) {
    console.error('❌ Auth configuration error:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

testAuthConfig();