import type { CSSProperties } from 'react'
import type { Metadata } from 'next'

import './globals.css'
import { QueryProvider } from '@/lib/queryClient'
import { ThemeProvider } from '@/components/common/theme-provider'
import { Toaster } from '@/components/ui/sonner'

const fontVariables: CSSProperties = {
  '--font-body': '"Segoe UI"',
  '--font-cjk': '"Microsoft YaHei"',
  '--font-display': '"Trebuchet MS"',
  '--font-accent': '"Segoe UI Semibold"',
  '--font-mono': '"Consolas"',
  '--font-mono-alt': '"Courier New"',
} as CSSProperties

export const metadata: Metadata = {
  title: 'SAFE-Agent | 智能体应用安全合规检测平台',
  description: 'SAFE-Agent 支持输入工具 metadata 列表，统一检测数据过度暴露与组合式漏洞，并输出工具级审计报告。',
  icons: {
    icon: '/web_logo.png',
    shortcut: '/web_logo.png',
    apple: '/web_logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning style={fontVariables}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <QueryProvider>
            {children}
            <Toaster position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
