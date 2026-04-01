import Link from 'next/link'
import { ArrowRight, Bug, ExternalLink, ShieldAlert, Workflow } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const capabilityCards = [
  {
    title: '智能体 Skill 可信安全检测',
    description: '针对可疑 Skill 的描述、能力边界与潜在行为进行审查，辅助识别高风险恶意能力包。',
    icon: Bug,
    href: '/skillpecker',
    cta: '打开模块',
    iconWrapClassName: 'bento-icon bento-icon-emerald',
    iconClassName: 'h-5 w-5 text-emerald-600 dark:text-emerald-300',
  },
  {
    title: '数据过度暴露检测',
    description: '围绕 source、sink 与调用链识别超出任务必要范围的敏感数据读取、拼接与传递。',
    icon: ShieldAlert,
    href: '/scans/new',
    cta: '发起检测',
    iconWrapClassName: 'bento-icon bento-icon-sky',
    iconClassName: 'h-5 w-5 text-sky-600 dark:text-sky-300',
  },
  {
    title: '组合式漏洞检测',
    description: '分析多工具在同一执行链上的组合风险，定位越权调用、外发扩散和链路放大问题。',
    icon: Workflow,
    href: '/scans/new',
    cta: '发起检测',
    iconWrapClassName: 'bento-icon bento-icon-amber',
    iconClassName: 'h-5 w-5 text-amber-600 dark:text-amber-300',
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
            <Link href="/skillpecker">
              <Button size="lg">
                Skill安全检测
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/scans">
              <Button size="lg" variant="outline">
                工具链风险分析
              </Button>
            </Link>
          </div>

          <div className="feature-bento-grid safe-home-card-grid">
            {capabilityCards.map((item) => (
              <Card key={item.title} className="bento-card spotlight-hover rounded-[2rem]">
                <CardContent className="safe-home-card-content p-5">
                  <div className={item.iconWrapClassName}>
                    <item.icon className={item.iconClassName} />
                  </div>
                  <h2 className="safe-home-card-title">{item.title}</h2>
                  <p className="safe-home-card-description">{item.description}</p>
                  <Link href={item.href} className="safe-home-card-link">
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
