import type { Metadata } from 'next'
import {
  Fira_Code,
  Fira_Sans,
  IBM_Plex_Mono,
  Inter,
  Noto_Sans_SC,
  Plus_Jakarta_Sans,
} from 'next/font/google'

import './globals.css'
import { QueryProvider } from '@/lib/queryClient'
import { ThemeProvider } from '@/components/common/theme-provider'
import { Toaster } from '@/components/ui/sonner'

const bodyFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const cjkFont = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-cjk',
  display: 'swap',
})

const displayFont = Fira_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const accentFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-accent',
  display: 'swap',
})

const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

const monoAltFont = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono-alt',
  display: 'swap',
})

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
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${cjkFont.variable} ${displayFont.variable} ${accentFont.variable} ${monoFont.variable} ${monoAltFont.variable}`}
    >
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
