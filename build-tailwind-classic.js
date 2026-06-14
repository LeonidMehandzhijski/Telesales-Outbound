const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Building Tailwind CSS...');

try {
  // Use npx to run tailwindcss directly
  const command = `npx tailwindcss -i ./src/index.css -o ./src/tailwind.css --config ./tailwind.config.js`;
  console.log(`🔨 Running: ${command}`);
  
  execSync(command, { stdio: 'inherit' });
  console.log('✅ Tailwind CSS built successfully!');
} catch (error) {
  console.error('❌ Failed to build Tailwind CSS');
  console.error(error.message);
  process.exit(1);
}
