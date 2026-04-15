import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // Start with Vercel environment variables (these change with each deployment)
  const serverTime = new Date().toISOString();
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || '';
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || '';
  
  let buildInfo = {
    // Primary: use Vercel deployment ID if available
    buildId: deploymentId || `local-${Date.now()}`,
    buildTime: serverTime,
    commitSha: commitSha || 'local',
    deploymentUrl: process.env.VERCEL_URL || '',
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    // Add server time to verify response is fresh
    serverTime: serverTime,
    // Vercel specific
    vercelDeploymentId: deploymentId,
    vercelGitCommitSha: commitSha
  };

  // Try to read build info from file (generated at build time)
  try {
    const buildInfoPath = join(process.cwd(), 'public', 'build-info.json');
    const buildInfoContent = await readFile(buildInfoPath, 'utf-8');
    const savedBuildInfo = JSON.parse(buildInfoContent);
    
    // Use file buildId if available and no deployment ID
    if (savedBuildInfo.buildId && !deploymentId) {
      buildInfo.buildId = savedBuildInfo.buildId;
    }
    
    // Always use file buildTime if available
    if (savedBuildInfo.buildTime) {
      buildInfo.buildTime = savedBuildInfo.buildTime;
    }
    
    buildInfo = {
      ...buildInfo,
      ...savedBuildInfo,
      // Keep server time for freshness check
      serverTime: serverTime,
      vercelDeploymentId: deploymentId,
      vercelGitCommitSha: commitSha
    };
  } catch {
    // File doesn't exist, use defaults
    console.log('No build-info.json found, using defaults');
  }

  // Add headers to prevent ALL caching
  return NextResponse.json(buildInfo, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Response-Time': Date.now().toString()
    }
  });
}
