import Link from 'next/link'
import { ArrowRight, Bug, ExternalLink, ShieldAlert, Workflow } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const capabilityCards = [
  {
    title: '数据过度暴露检测',
    description: '围绕 source、sink 与调用链，识别哪些工具读取、拼接或传递了超出任务所需的敏感数据。',
    icon: ShieldAlert,
    href: '/scans/new',
    cta: '发起检测',
    iconWrapClassName: 'bento-icon bento-icon-sky',
    iconClassName: 'h-5 w-5 text-sky-600 dark:text-sky-300',
  },
  {
    title: '组合式漏洞检测',
    description: '分析多个工具在同一条执行链上的组合风险，定位越权调用、外发扩散和链路放大问题。',
    icon: Workflow,
    href: '/scans/new',
    cta: '查看任务',
    iconWrapClassName: 'bento-icon bento-icon-amber',
    iconClassName: 'h-5 w-5 text-amber-600 dark:text-amber-300',
  },
  {
    title: '智能体 Skill 可信安全检测',
    description: '针对可疑 Skill 的描述、能力边界与潜在行为进行审查，辅助识别高风险恶意能力包。',
    icon: Bug,
    href: '/skillpecker',
    cta: '打开模块',
    iconWrapClassName: 'bento-icon bento-icon-emerald',
    iconClassName: 'h-5 w-5 text-emerald-600 dark:text-emerald-300',
  },
] as const

export default function HomePage() {
  return (
    <section className="safe-home-screen">
      <div className="safe-home-stage">
        <div className="safe-home-grid" aria-hidden="true" />

        <div className="safe-home-hero">
          <div className="safe-home-heading">
            <h1 className="safe-home-title" aria-label="SAFE-Agent">
              <span className="safe-home-title-base">SAFE-Agent</span>
              <span className="safe-home-title-glow" aria-hidden="true">
                SAFE-Agent
              </span>
              <span className="safe-home-title-sheen" aria-hidden="true">
                SAFE-Agent
              </span>
            </h1>
            <p className="safe-home-subtitle">智能体应用安全合规检测平台</p>
          </div>

          <p className="hero-subtitle safe-home-copy">
            聚焦三类智能体安全能力：数据过度暴露检测、组合式漏洞检测与智能体 Skill 可信安全检测。
          </p>

          <div className="safe-home-actions">
            <Link href="/scans/new">
              <Button size="lg">
                新建任务
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/reports">
              <Button size="lg" variant="outline">
                查看报告
              </Button>
            </Link>
          </div>

          <div className="feature-bento-grid safe-home-card-grid">
            {capabilityCards.map((item) => (
              <Card key={item.title} className="bento-card spotlight-hover rounded-[2rem]">
                <CardContent className="flex h-full flex-col p-5">
                  <div className={item.iconWrapClassName}>
                    <item.icon className={item.iconClassName} />
                  </div>
                  <h2 className="mt-4 font-display text-[1.7rem] font-bold leading-tight text-slate-950 dark:text-slate-50">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-[1rem] leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                  <Link
                    href={item.href}
                    className="mt-auto pt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition-colors hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                  >
                    <span>{item.cta}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
