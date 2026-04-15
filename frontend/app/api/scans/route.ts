import { NextRequest, NextResponse } from 'next/server'

import { createScan, listScans } from '@/lib/server/scan-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get('agentId') || undefined
  const light = request.nextUrl.searchParams.get('light') === 'true'
  const limitStr = request.nextUrl.searchParams.get('limit')
  const limit = limitStr ? parseInt(limitStr, 10) : undefined
  const offsetStr = request.nextUrl.searchParams.get('offset')
  const offset = offsetStr ? parseInt(offsetStr, 10) : undefined

  const scans = await listScans({ agentId, light, limit, offset })
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
