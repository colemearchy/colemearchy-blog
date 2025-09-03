// Prisma postinstall script for Vercel
console.log('Running postinstall script...');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Current directory:', process.cwd());
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Check if prisma directory exists
  const prismaDir = path.join(process.cwd(), 'prisma');
  if (fs.existsSync(prismaDir)) {
    console.log('Prisma directory found');
  }
  
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate --schema=./prisma/schema.prisma', { 
    stdio: 'inherit',
    env: { ...process.env, PRISMA_GENERATE_NO_POSTINSTALL: 'true' }
  });
  
  console.log('Prisma Client generated successfully!');
  
  // List generated files
  const generatedPath = path.join(process.cwd(), 'node_modules/.prisma/client');
  if (fs.existsSync(generatedPath)) {
    console.log('Generated files:', fs.readdirSync(generatedPath));
  }
} catch (error) {
  console.error('Error generating Prisma Client:', error);
  console.error('Error details:', error.message);
  process.exit(1);
}