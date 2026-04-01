import { NextRequest, NextResponse } from 'next/server'

import { getReportDetail } from '@/lib/server/scan-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

export async function GET(_: NextRequest, context: RouteContext) {
  const report = await getReportDetail(context.params.id)
  if (!report) {
    return NextResponse.json({ message: '报告不存在。' }, { status: 404 })
  }

  return NextResponse.json(report)
}
