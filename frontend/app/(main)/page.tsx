import Link from 'next/link'
import { ArrowRight, Bug, ShieldAlert, Workflow } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const capabilityCards = [
  {
    title: '数据过度暴露检测',
    description: '围绕 source、sink 与调用链，识别哪些工具读取、拼接或传递了超出任务所需的敏感数据。',
    icon: ShieldAlert,
  },
  {
    title: '组合式漏洞检测',
    description: '分析多个工具在同一条执行链上的组合风险，定位越权调用、外发扩散和链路放大问题。',
    icon: Workflow,
  },
  {
    title: '恶意 Skill 检测',
    description: '针对可疑 Skill 的描述、能力边界与潜在行为进行审查，辅助识别高风险恶意能力包。',
    icon: Bug,
  },
] as const

export default function HomePage() {
  return (
    <section className="safe-home-screen">
      <div className="safe-home-stage">
        <div className="safe-home-grid" aria-hidden="true" />

        <div className="safe-home-hero">
          <span className="home-eyebrow">SAFE-AGENT</span>

          <div className="safe-home-heading">
            <h1 className="hero-title-massive safe-home-title" data-text="SAFE-Agent">
              SAFE-Agent
            </h1>
            <p className="safe-home-subtitle">智能体应用安全合规检测平台</p>
          </div>

          <p className="hero-subtitle safe-home-copy">
            面向工具 metadata 输入，聚焦三类安全能力：数据过度暴露检测、组合式漏洞检测与恶意 Skill 检测。
            首页仅保留最核心的平台介绍，后续扩展能力再逐步增加。
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
                <CardContent className="p-6">
                  <div className="bento-icon bg-white/72 dark:bg-slate-900/72">
                    <item.icon className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                  </div>
                  <h2 className="mt-5 font-display text-[1.85rem] leading-tight text-slate-950 dark:text-slate-50">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
