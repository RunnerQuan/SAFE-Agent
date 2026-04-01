import { NextRequest, NextResponse } from 'next/server'

import { getScanLogs } from '@/lib/server/scan-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

export async function GET(_: NextRequest, context: RouteContext) {
  const logs = await getScanLogs(context.params.id)
  return NextResponse.json(logs)
}
