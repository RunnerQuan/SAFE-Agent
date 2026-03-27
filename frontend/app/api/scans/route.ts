import { NextRequest, NextResponse } from 'next/server'

import { createScan, listScans } from '@/lib/server/agentraft-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get('agentId') || undefined
  const scans = await listScans({ agentId })
  return NextResponse.json(scans)
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const scan = await createScan(payload)
    return NextResponse.json(scan, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建任务失败。'
    return NextResponse.json({ message }, { status: 400 })
  }
}
