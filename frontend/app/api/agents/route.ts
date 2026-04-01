import { NextRequest, NextResponse } from 'next/server'

import { createAgent, listAgents } from '@/lib/server/scan-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const agents = await listAgents()
  return NextResponse.json(agents)
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const agent = await createAgent(payload)
    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建智能体失败。'
    return NextResponse.json({ message }, { status: 400 })
  }
}
