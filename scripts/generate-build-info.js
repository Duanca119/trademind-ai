#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const buildInfo = {
  buildId: process.env.VERCEL_DEPLOYMENT_ID || `build-${Date.now()}`,
  buildTime: new Date().toISOString(),
  commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown',
  deploymentUrl: process.env.VERCEL_URL || ''
};

const outputPath = path.join(__dirname, '..', 'public', 'build-info.json');

fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

console.log('Build info generated:', buildInfo);
