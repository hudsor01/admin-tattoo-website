const fs = require('fs');
const { execSync } = require('child_process');

// Read .env file
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');

const envVars = {};

// Parse .env file
envLines.forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=');
      // Remove quotes if present
      value = value.replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  }
});

console.log('🚀 Environment variables to push:');
Object.keys(envVars).forEach(key => {
  console.log(`  ${key}=${envVars[key].substring(0, 20)}...`);
});

console.log('\n📝 Copy and paste these commands to push to Vercel:');
console.log('=====================================');

Object.keys(envVars).forEach(key => {
  const value = envVars[key];
  console.log(`npx vercel env add ${key} production --force`);
  console.log(`# Then paste: ${value}`);
  console.log('');
});
