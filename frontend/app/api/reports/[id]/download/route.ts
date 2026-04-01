import { NextRequest, NextResponse } from 'next/server'

import { downloadReportFile } from '@/lib/server/scan-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const format = request.nextUrl.searchParams.get('format') === 'pdf' ? 'pdf' : 'json'
    const file = await downloadReportFile(context.params.id, format)

    return new NextResponse(new Uint8Array(file.data), {
      status: 200,
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.filename}"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '导出报告失败。'
    return NextResponse.json({ message }, { status: 400 })
  }
}
