'use client'

import type { CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ScanLine, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { AnimatedBackground } from './animated-background'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  description: string
}

const navItems: NavItem[] = [
  { title: '首页', href: '/', icon: Home, description: '平台概览与三类检测能力入口。' },
  { title: '技能可信安全检测', href: '/skillpecker', icon: ShieldCheck, description: '技能可信安全检测工作台与恶意技能样本库。' },
  { title: '工具链风险分析', href: '/scans', icon: ScanLine, description: '统一发起工具链联合检测，跟踪执行状态并查看 DOE 与组合式漏洞结果。' },
]

function SectionIntro({ pathname }: { pathname: string }) {
  const current = navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))

  if (pathname === '/' || pathname.startsWith('/scans')) {
    return null
  }

  return (
    <section className="glass-panel rounded-[2rem] p-6 lg:p-7">
      <span className="section-tag">SAFE-Agent</span>
      <div className="mt-4 flex flex-col gap-4">
        <div className="max-w-3xl">
          <h1 className="font-display text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            {current?.title ?? '平台'}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {current?.description ?? '统一处理工具 metadata 输入、检测任务执行与联合结果查看。'}
          </p>
        </div>
      </div>
    </section>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isSkillPecker = pathname === '/skillpecker' || pathname.startsWith('/skillpecker/')
  const hideTimerRef = useRef<number | null>(null)
  const topbarRef = useRef<HTMLElement | null>(null)
  const lastYRef = useRef(0)

  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [topbarHeight, setTopbarHeight] = useState(156)

  useEffect(() => {
    const showTopbar = () => {
      setHidden(false)
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }

    const scheduleHide = (currentY: number) => {
      if (currentY < 64) return
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
      }
      hideTimerRef.current = window.setTimeout(() => {
        setHidden(true)
      }, 320)
    }

    const onScroll = () => {
      const currentY = window.scrollY
      const delta = currentY - lastYRef.current
      lastYRef.current = currentY

      setScrolled(currentY > 8)

      if (isSkillPecker) {
        setHidden(currentY > 8)
        return
      }

      if (currentY <= 20) {
        showTopbar()
        return
      }

      if (delta < -4) {
        showTopbar()
      } else if (delta > 4) {
        scheduleHide(currentY)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (isSkillPecker) {
        return
      }

      if (event.clientY <= 96) {
        showTopbar()
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointerMove)
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
      }
    }
  }, [isSkillPecker])

  useEffect(() => {
    const element = topbarRef.current
    if (!element) {
      return
    }

    const updateHeight = () => {
      const nextHeight = Math.ceil(element.getBoundingClientRect().height)
      if (nextHeight > 0) {
        setTopbarHeight(nextHeight)
      }
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
    })

    observer.observe(element)
    window.addEventListener('resize', updateHeight, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  const topbarClassName = useMemo(
    () => cn('topbar-shell', hidden && 'is-hidden', scrolled && 'is-scrolled'),
    [hidden, scrolled]
  )

  const shellStyle = useMemo(
    () =>
      ({
        '--app-topbar-height': `${topbarHeight}px`,
        '--app-topbar-offset': `calc(${topbarHeight}px + 0.75rem)`,
      }) as CSSProperties,
    [topbarHeight]
  )

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={shellStyle}>
      <AnimatedBackground />

      <header ref={topbarRef} className={topbarClassName}>
        <div className="topbar">
          <a
            href="https://sse.sysu.edu.cn/"
            className="corner-school-brand"
            aria-label="中山大学软件工程学院"
            target="_blank"
            rel="noreferrer"
          >
            <span className="corner-school-brand-frame">
              <Image
                className="corner-school-brand-logo"
                src="/school_logo.png"
                alt="中山大学软件工程学院"
                width={560}
                height={110}
                priority
              />
            </span>
          </a>

          <div className="topbar-center">
            <div className="topbar-brand">
              <Link href="/" className="brandmark" aria-label="返回 SAFE-Agent 首页" title="返回首页">
                <span className="brandmark-tool-badge">
                  <Image className="brandmark-tool-logo" src="/web_logo.png" alt="SAFE-Agent 标志" width={72} height={72} priority />
                </span>
                <span className="brandmark-copy">
                  <span className="brandmark-text">SAFE-Agent</span>
                </span>
              </Link>

              <nav className="main-nav">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <Link key={item.href} href={item.href} className={cn('nav-link', isActive && 'is-active')}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

          <div className="topbar-balance" aria-hidden="true" />
        </div>
      </header>

      {isHome ? (
        <main className="relative z-10 px-0 pb-0" style={{ paddingTop: 'var(--app-topbar-offset)' }}>
          <div className="animate-page-enter">{children}</div>
        </main>
      ) : isSkillPecker ? (
        <main className="skillpecker-main relative z-10 px-3 pb-6 sm:px-4 lg:px-5">
          <div className="skillpecker-page-shell animate-page-enter">{children}</div>
        </main>
      ) : (
        <main className="relative z-10 px-4 pb-20 sm:px-6 lg:px-8" style={{ paddingTop: 'var(--skillpecker-top-gap)' }}>
          <div className="page-shell space-y-8">
            <SectionIntro pathname={pathname} />
            <div className="animate-page-enter">{children}</div>
          </div>
        </main>
      )}
    </div>
  )
}
