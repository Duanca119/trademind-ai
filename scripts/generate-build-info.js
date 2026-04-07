#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a unique build ID using multiple Vercel environment variables
// Priority: VERCEL_GIT_COMMIT_SHA + timestamp for uniqueness
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || 'local';
const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || '';
const buildTime = new Date().toISOString();

// Create a unique build ID that changes with each deployment
// Format: commitSha-timestamp to ensure uniqueness
const buildId = deploymentId 
  ? `${commitSha.substring(0, 7)}-${deploymentId.substring(0, 8)}`
  : `${commitSha.substring(0, 7)}-${Date.now()}`;

const buildInfo = {
  buildId: buildId,
  buildTime: buildTime,
  commitSha: commitSha.substring(0, 7),
  deploymentUrl: process.env.VERCEL_URL || '',
  env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
};

const outputPath = path.join(__dirname, '..', 'public', 'build-info.json');

fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

console.log('✅ Build info generated:');
console.log(`   Build ID: ${buildInfo.buildId}`);
console.log(`   Build Time: ${buildInfo.buildTime}`);
console.log(`   Commit: ${buildInfo.commitSha}`);
console.log(`   Environment: ${buildInfo.env}`);
