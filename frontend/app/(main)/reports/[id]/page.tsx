import { redirect } from 'next/navigation'

import { resolveScanIdByReportId } from '@/lib/server/scan-service'

type PageProps = {
  params: {
    id: string
  }
}

export default async function ReportDetailRedirectPage({ params }: PageProps) {
  const scanId = await resolveScanIdByReportId(params.id)
  redirect(scanId ? `/scans/${scanId}` : '/scans')
}
