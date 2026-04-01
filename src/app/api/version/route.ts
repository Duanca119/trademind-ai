import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  let buildInfo = {
    version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
    buildTime: new Date().toISOString(),
    deployedAt: process.env.VERCEL_DEPLOYMENT_ID || Date.now().toString(),
    env: process.env.NODE_ENV
  };

  // Try to read build info from file (generated at build time)
  try {
    const buildInfoPath = join(process.cwd(), 'public', 'build-info.json');
    const buildInfoContent = await readFile(buildInfoPath, 'utf-8');
    const savedBuildInfo = JSON.parse(buildInfoContent);
    buildInfo = {
      ...buildInfo,
      ...savedBuildInfo
    };
  } catch {
    // File doesn't exist, use defaults
  }

  // Add headers to prevent caching
  return NextResponse.json(buildInfo, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    }
  });
}
