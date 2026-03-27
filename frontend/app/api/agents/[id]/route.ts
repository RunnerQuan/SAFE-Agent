import { NextRequest, NextResponse } from 'next/server'

import { deleteAgentEntry, getAgent, updateAgentEntry } from '@/lib/server/agentraft-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

export async function GET(_: NextRequest, context: RouteContext) {
  const agent = await getAgent(context.params.id)
  if (!agent) {
    return NextResponse.json({ message: '智能体不存在。' }, { status: 404 })
  }

  return NextResponse.json(agent)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const payload = await request.json()
    const agent = await updateAgentEntry(context.params.id, payload)
    return NextResponse.json(agent)
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新智能体失败。'
    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    await deleteAgentEntry(context.params.id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除智能体失败。'
    return NextResponse.json({ message }, { status: 400 })
  }
}
