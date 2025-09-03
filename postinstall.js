// Prisma postinstall script for Vercel
console.log('Running postinstall script...');
const { execSync } = require('child_process');

try {
  console.log('Generating Prisma Client...');
  execSync('prisma generate', { stdio: 'inherit' });
  console.log('Prisma Client generated successfully!');
} catch (error) {
  console.error('Error generating Prisma Client:', error);
  process.exit(1);
}