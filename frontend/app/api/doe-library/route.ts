import { NextResponse } from 'next/server'

import { listDoeLibraryCases } from '@/lib/server/doe-library-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const cases = await listDoeLibraryCases()
  return NextResponse.json(cases)
}
