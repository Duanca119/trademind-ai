#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Paths
const buildInfoPath = path.join(__dirname, '..', 'public', 'build-info.json');
const swTemplatePath = path.join(__dirname, '..', 'public', 'sw.template.js');
const swOutputPath = path.join(__dirname, '..', 'public', 'sw.js');

// Read build info
let buildId = 'local-' + Date.now();
try {
  const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf-8'));
  buildId = buildInfo.buildId || buildId;
} catch (e) {
  console.log('⚠️  No build-info.json found, using fallback');
}

// Read sw template
let swContent;
try {
  swContent = fs.readFileSync(swTemplatePath, 'utf-8');
} catch (e) {
  // If no template, check if sw.js exists with placeholder
  try {
    swContent = fs.readFileSync(swOutputPath, 'utf-8');
  } catch (e2) {
    console.error('❌ No sw.template.js or sw.js found');
    process.exit(1);
  }
}

// Inject version - replace placeholder with actual build ID
// Escape the build ID to prevent injection issues
const safeBuildId = buildId.replace(/[^a-zA-Z0-9_-]/g, '-');
swContent = swContent.replace(/__SW_VERSION__/g, safeBuildId);

// Write the final sw.js
fs.writeFileSync(swOutputPath, swContent);

console.log('✅ Service Worker generated:');
console.log(`   Version: ${safeBuildId}`);
console.log(`   Output: ${swOutputPath}`);
