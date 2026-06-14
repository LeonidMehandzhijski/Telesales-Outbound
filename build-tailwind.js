const { spawnSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Tailwind CSS build...');

const nodePath = process.execPath;
const tailwindPath = path.join(process.cwd(), 'node_modules', 'tailwindcss', 'lib', 'cli.js');

console.log('📁 Using Node.js at:', nodePath);
console.log('📁 Using Tailwind at:', tailwindPath);

const result = spawnSync(
  nodePath,
  [
    tailwindPath,
    '--input', './src/index.css',
    '--output', './src/tailwind.css',
    '--config', './tailwind.config.js',
    '--postcss', './postcss.config.js'
  ],
  { stdio: 'inherit' }
);

if (result.status === 0) {
  console.log('✅ Tailwind CSS built successfully!');
} else {
  console.error('❌ Failed to build Tailwind CSS');
  process.exit(1);
}
