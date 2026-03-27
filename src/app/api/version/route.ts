import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
    buildTime: new Date().toISOString(),
    deployedAt: process.env.VERCEL_DEPLOYMENT_ID || Date.now().toString(),
    env: process.env.NODE_ENV
  });
}
