import { NextRequest, NextResponse } from 'next/server'

import { listReports } from '@/lib/server/scan-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const reports = await listReports({
    agentId: params.get('agentId') || undefined,
    risk: params.get('risk') || undefined,
    type: params.get('type') || undefined,
  })

  return NextResponse.json(reports)
}
