import { NextRequest, NextResponse } from 'next/server'

import { testConnection } from '@/lib/server/agentraft-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const result = await testConnection(payload.url)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : '测试连接失败。'
    return NextResponse.json({ message }, { status: 400 })
  }
}
