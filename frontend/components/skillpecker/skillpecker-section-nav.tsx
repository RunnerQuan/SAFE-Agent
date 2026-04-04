'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Database, LayoutPanelTop, ScanSearch } from 'lucide-react'

import { cn } from '@/lib/utils'

const sectionItems = [
  { href: '/skillpecker/overview', label: '工具总览', icon: LayoutPanelTop },
  { href: '/skillpecker/console', label: '扫描控制台', icon: ScanSearch },
  { href: '/skillpecker/library', label: '恶意技能库', icon: Database },
]

export function SkillPeckerSectionNav() {
  const pathname = usePathname()

  return (
    <nav className="skillpecker-route-nav" aria-label="SkillPecker sections">
      {sectionItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === '/skillpecker/overview' && (pathname === '/skillpecker' || pathname === '/skillpecker/intro'))
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn('skillpecker-route-link', active && 'is-active')}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-4 w-4" strokeWidth={2.1} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
