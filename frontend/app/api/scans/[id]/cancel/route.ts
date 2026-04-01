import { NextRequest, NextResponse } from 'next/server'

import { cancelScanEntry } from '@/lib/server/scan-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

export async function POST(_: NextRequest, context: RouteContext) {
  try {
    const scan = await cancelScanEntry(context.params.id)
    return NextResponse.json(scan)
  } catch (error) {
    const message = error instanceof Error ? error.message : '取消任务失败。'
    return NextResponse.json({ message }, { status: 400 })
  }
}
