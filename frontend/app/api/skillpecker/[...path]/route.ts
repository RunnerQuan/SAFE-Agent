import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const upstreamBase = process.env.SKILLPECKER_API_BASE ?? 'http://127.0.0.1:8010/api'
const hopByHopHeaders = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

function copyHeaders(source: Headers) {
  const headers = new Headers()

  source.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

  return headers
}

function buildUpstreamUrl(request: NextRequest, path: string[]) {
  const base = upstreamBase.endsWith('/') ? upstreamBase : `${upstreamBase}/`
  const url = new URL(path.map(encodeURIComponent).join('/'), base)
  url.search = request.nextUrl.search
  return url
}

async function forward(request: NextRequest, path: string[]) {
  const url = buildUpstreamUrl(request, path)
  const headers = copyHeaders(request.headers)
  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
    cache: 'no-store',
    redirect: 'manual',
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = request.body
    init.duplex = 'half'
  }

  try {
    const response = await fetch(url, init)

    return new NextResponse(response.body, {
      status: response.status,
      headers: copyHeaders(response.headers),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '上游服务不可用。'

    return NextResponse.json(
      {
        message: 'SkillPecker 服务当前不可用，请先启动 SAFE-Agent 仓库内置的 skillpecker 后端服务。',
        detail: message,
        upstream: upstreamBase,
      },
      { status: 503 }
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params.path)
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params.path)
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params.path)
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params.path)
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params.path)
}
