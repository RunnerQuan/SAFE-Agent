import { NextResponse } from 'next/server'

import { getDashboardStats } from '@/lib/server/scan-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const stats = await getDashboardStats()
  return NextResponse.json(stats)
}
