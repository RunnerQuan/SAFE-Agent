import { NextRequest, NextResponse } from 'next/server'

import { getScan } from '@/lib/server/agentraft-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

export async function GET(_: NextRequest, context: RouteContext) {
  const scan = await getScan(context.params.id)
  if (!scan) {
    return NextResponse.json({ message: '任务不存在。' }, { status: 404 })
  }

  return NextResponse.json(scan)
}
