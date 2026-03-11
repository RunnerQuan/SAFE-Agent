'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  Activity,
  Bot,
  Bug,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Scan,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AnimatedBackground } from './animated-background'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { title: '安全总览', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Agent 资产', href: '/agents', icon: Bot },
  { title: '检测任务', href: '/scans', icon: Scan },
  { title: '审计报告', href: '/reports', icon: FileText },
]

interface AppShellProps {
  children: React.ReactNode
}

function CurrentSectionTitle({ pathname }: { pathname: string }) {
  const current = useMemo(
    () => navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)),
    [pathname]
  )

  return (
    <div>
      <p className="font-display text-xl font-semibold text-slate-900">{current?.title ?? '控制台'}</p>
      <p className="text-xs text-slate-600">AI Agent Security & Compliance Audit Platform</p>
    </div>
  )
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <div className="relative min-h-screen">
        <aside
          className="fixed left-0 top-0 z-40 hidden h-screen transition-[width] duration-200 ease-out lg:block"
          style={{ width: collapsed ? 92 : 292 }}
        >
          <div className="flex h-full flex-col border-r border-white/65 bg-white/52 backdrop-blur-2xl">
            <div className="flex h-20 items-center justify-between border-b border-white/70 px-4">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/80 bg-white/80 shadow-[0_10px_24px_rgba(41,55,79,0.12)]">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#ff9146]/35 to-[#14a689]/20 blur-sm" />
                  <Shield className="relative h-5 w-5 text-[#f27835]" />
                </div>
                {!collapsed && (
                  <div>
                    <p className="font-display text-lg font-semibold gradient-text">SAFE-Agent</p>
                    <p className="text-[11px] text-slate-500">Compliance Console</p>
                  </div>
                )}
              </Link>
            </div>

            <nav className="flex-1 space-y-2 p-4">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <div
                    key={item.href}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'group relative flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'border-[#ff9146]/45 bg-gradient-to-r from-[#ff9146]/20 to-[#14a689]/8 text-slate-900 shadow-[0_10px_22px_rgba(242,120,53,0.16)]'
                          : 'border-transparent text-slate-600 hover:border-white/80 hover:bg-white/70 hover:text-slate-900'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5',
                          isActive ? 'text-[#f27835]' : 'text-slate-500 group-hover:text-[#f27835]'
                        )}
                      />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </div>
                )
              })}
            </nav>

            {!collapsed && (
              <div className="mx-4 mb-4 rounded-xl border border-white/75 bg-white/70 p-3 shadow-[0_10px_24px_rgba(41,55,79,0.08)]">
                <p className="mb-2 text-xs font-semibold text-slate-700">核心工具</p>
                <div className="space-y-2">
                  <Link
                    href="/scans/new?preset=exposure"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#ff9146]/30 bg-[#ff9146]/10 px-3 py-2 text-xs text-[#c95f1f] transition-colors hover:bg-[#ff9146]/16"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Agent 数据过度暴露检测
                  </Link>
                  <Link
                    href="/scans/new?preset=fuzzing"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#14a689]/30 bg-[#14a689]/10 px-3 py-2 text-xs text-[#0d7f69] transition-colors hover:bg-[#14a689]/16"
                  >
                    <Bug className="h-3.5 w-3.5" />
                    Agent 漏洞挖掘
                  </Link>
                </div>
              </div>
            )}

            <div className="border-t border-white/70 p-4">
              <div
                className={cn(
                  'mb-3 rounded-xl border border-[#14a689]/28 bg-[#14a689]/10 px-3 py-2',
                  collapsed && 'mb-2 py-3'
                )}
              >
                {collapsed ? (
                  <div className="mx-auto h-2.5 w-2.5 rounded-full bg-[#14a689]" />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-[#0d7f69]">
                    <Activity className="h-3.5 w-3.5" />
                    <span>系统状态: 正常 (Mock 模式已启用)</span>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed((prev) => !prev)}
                className="w-full justify-center"
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="mr-1 h-4 w-4" />}
                {!collapsed && '收起导航'}
              </Button>
            </div>
          </div>
        </aside>

        <main
          className={cn(
            'min-h-screen transition-[margin-left] duration-200 ease-out',
            collapsed ? 'lg:ml-[92px]' : 'lg:ml-[292px]'
          )}
        >
          <header className="sticky top-0 z-30 border-b border-white/75 bg-white/54 backdrop-blur-2xl">
            <div className="flex h-16 items-center justify-between px-4 lg:h-20 lg:px-8">
              <CurrentSectionTitle pathname={pathname} />

              <div className="hidden items-center gap-2 md:flex">
                <Link href="/scans/new?preset=exposure">
                  <Button variant="outline" size="sm" className="h-9">
                    <Shield className="mr-1.5 h-4 w-4" />
                    数据暴露检测
                  </Button>
                </Link>
                <Link href="/scans/new?preset=fuzzing">
                  <Button variant="outline" size="sm" className="h-9">
                    <Bug className="mr-1.5 h-4 w-4" />
                    漏洞挖掘
                  </Button>
                </Link>
              </div>
            </div>

            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors',
                      isActive
                        ? 'border-[#ff9146]/45 bg-[#ff9146]/16 text-[#c95f1f]'
                        : 'border-white/75 bg-white/64 text-slate-600'
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.title}
                  </Link>
                )
              })}
            </div>
          </header>

          <div className="p-4 lg:p-8">
            <div className="animate-page-enter">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
