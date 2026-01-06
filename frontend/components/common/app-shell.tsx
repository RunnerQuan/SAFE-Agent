'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Bot,
  Scan,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AnimatedBackground } from './animated-background'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { title: '控制台', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Agent管理', href: '/agents', icon: Bot },
  { title: '检测任务', href: '/scans', icon: Scan },
  { title: '检测报告', href: '/reports', icon: FileText },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <AnimatedBackground />

      <div className="relative flex min-h-screen">
        {/* Sidebar - 使用CSS transition代替Framer Motion提升性能 */}
        <aside
          className="fixed left-0 top-0 z-40 h-screen transition-[width] duration-200 ease-out will-change-[width]"
          style={{ width: collapsed ? 80 : 280 }}
        >
          <div className="h-full flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-2xl">
            {/* Logo */}
            <div className="h-20 flex items-center justify-between px-4 border-b border-white/5">
              <Link href="/dashboard" className="flex items-center gap-3">
                <motion.div
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Animated border */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 animate-spin-slow opacity-75 blur-sm" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500" />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-[10px] bg-black/80">
                    <Shield className="h-5 w-5 text-cyan-400" />
                  </div>
                </motion.div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="font-display text-xl font-bold gradient-text-animated">
                        SAFE
                      </span>
                      <span className="font-display text-xl font-bold text-white/80">
                        -Agent
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </div>

            {/* Navigation - 减少stagger延迟 */}
            <nav className="flex-1 flex flex-col gap-2 p-4">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <div
                    key={item.href}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <Link href={item.href}>
                      <div
                        className={cn(
                          'relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 hover:translate-x-1',
                          isActive
                            ? 'text-white'
                            : 'text-white/50 hover:text-white/80'
                        )}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute inset-0 rounded-xl"
                            style={{
                              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(139, 92, 246, 0.15))',
                              border: '1px solid rgba(34, 211, 238, 0.3)',
                            }}
                            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                          />
                        )}

                        {/* Left glow indicator for active */}
                        {isActive && (
                          <motion.div
                            className="absolute -left-8 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gradient-to-b from-cyan-400 to-purple-500"
                            layoutId="activeIndicator"
                          />
                        )}

                        <item.icon className={cn(
                          'relative h-5 w-5 transition-colors',
                          isActive ? 'text-cyan-400' : ''
                        )} />

                        <AnimatePresence>
                          {!collapsed && (
                            <motion.span
                              className="relative"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              {item.title}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </nav>

            {/* Status indicator */}
            <div className="p-4 border-t border-white/5">
              <AnimatePresence>
                {!collapsed ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <div className="relative">
                      <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-emerald-400">系统运行正常</div>
                      <div className="text-xs text-white/40">Mock 模式已启用</div>
                    </div>
                    <Zap className="h-4 w-4 text-emerald-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center"
                  >
                    <div className="relative">
                      <div className="h-3 w-3 rounded-full bg-emerald-400" />
                      <div className="absolute inset-0 h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Collapse toggle */}
            <div className="p-4 border-t border-white/5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
                className="w-full justify-center hover:bg-white/5"
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    <span>收起菜单</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content - 使用CSS transition代替Framer Motion */}
        <main
          className="flex-1 transition-[margin-left] duration-200 ease-out will-change-[margin-left]"
          style={{ marginLeft: collapsed ? 80 : 280 }}
        >
          {/* Topbar */}
          <header className="sticky top-0 z-30 h-20 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
            <div className="flex h-full items-center justify-between px-8">
              <div>
                <h1 className="font-display text-2xl font-bold gradient-text">
                  智能体应用安全合规检测平台
                </h1>
                <p className="text-sm text-white/40 mt-1">
                  AI Agent Security & Compliance Detection Platform
                </p>
              </div>
              <div className="flex items-center gap-6">
                {/* Decorative element */}
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-75" />
                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse delay-150" />
                  </div>
                  <span className="text-xs text-white/60 font-medium">v1.0.0</span>
                </div>
              </div>
            </div>
          </header>

          {/* Page content - 优化页面切换动画 */}
          <div className="p-8">
            <div className="animate-page-enter">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
