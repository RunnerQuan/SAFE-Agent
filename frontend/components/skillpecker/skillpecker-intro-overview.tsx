'use client'

import type { LucideIcon } from 'lucide-react'
import { Archive, ScanSearch, Workflow } from 'lucide-react'
import { Bar, BarChart, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { SkillPeckerStatCard } from '@/components/skillpecker/skillpecker-stat-card'
import { Card } from '@/components/ui/card'
import { useSkillPeckerOverview } from '@/lib/skillpecker/hooks'
import { SkillPeckerChartDatum } from '@/lib/skillpecker/types'

const capabilityCards: Array<{
  title: string
  copy: string
  icon: LucideIcon
  iconTone: 'queue' | 'drill' | 'library'
}> = [
  {
    title: '异步任务队列',
    copy: '支持批量提交 Skill 扫描任务，自动排队执行，后台持续处理，无需等待，结果实时返回。',
    icon: Workflow,
    iconTone: 'queue',
  },
  {
    title: '意图驱动检测',
    copy: '从用户原始意图图谱出发，识别 Skill 的偏离行为；捕捉隐式执行、越权访问与异常调用路径。',
    icon: ScanSearch,
    iconTone: 'drill',
  },
  {
    title: '持久化样本库',
    copy: '自动沉淀检测结果与恶意样本；支持检索、复现与安全审计，构建专属威胁知识库。',
    icon: Archive,
    iconTone: 'library',
  },
]

function formatPercent(part: number, total: number) {
  if (!total) {
    return '0.0%'
  }

  return `${((part / total) * 100).toFixed(1)}%`
}

function ProblemTypeTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: SkillPeckerChartDatum; value?: number }>
}) {
  const datum = payload?.[0]?.payload
  if (!active || !datum) {
    return null
  }

  const total = payload?.reduce((sum, item) => sum + (item.payload?.value ?? 0), 0) ?? datum.value

  return (
    <div className="skillpecker-chart-tooltip">
      <p className="font-medium text-slate-900">{datum.label}</p>
      <p className="mt-1 text-sm text-slate-600">
        数量：{datum.value} · 占比：{formatPercent(datum.value, total)}
      </p>
    </div>
  )
}

function MetricTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: SkillPeckerChartDatum }>
}) {
  const datum = payload?.[0]?.payload
  if (!active || !datum) {
    return null
  }

  return (
    <div className="skillpecker-chart-tooltip">
      <p className="font-medium text-slate-900">{datum.label}</p>
      <p className="mt-1 text-sm text-slate-600">数量：{datum.value}</p>
    </div>
  )
}

export function SkillPeckerIntroOverview() {
  const overviewQuery = useSkillPeckerOverview()
  const data = overviewQuery.data

  const riskBreakdown = data?.riskBreakdown ?? []
  const primaryRiskGroups = data?.primaryRiskGroups ?? []
  const businessCategoryTop = data?.businessCategoryTop ?? []
  const metrics = data?.metrics ?? []
  const riskTotal = riskBreakdown.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="skillpecker-overview-stack">
      <section className="skillpecker-overview-capability-grid">
        {capabilityCards.map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.title} className="skillpecker-capability-card spotlight-hover p-8">
              <div className={`skillpecker-capability-icon skillpecker-capability-icon-${item.iconTone}`}>
                <Icon className="h-7 w-7" strokeWidth={2.1} />
              </div>
              <h3 className="mt-6 font-display text-[2rem] leading-tight text-slate-950 dark:text-slate-50">{item.title}</h3>
              <p className="mt-4 text-lg leading-9 text-slate-600 dark:text-slate-300">{item.copy}</p>
            </Card>
          )
        })}
      </section>

      <section className="skillpecker-analytics-stack">
        <div className="grid gap-4 lg:grid-cols-3">
          {metrics.map((metric) => (
            <SkillPeckerStatCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              accent={metric.accent}
              className="skillpecker-overview-stat"
              centered
            />
          ))}
        </div>

        <div className="skillpecker-analytics-grid">
          <Card className="skillpecker-chart-card skillpecker-chart-card-problem">
            <div className="skillpecker-chart-head">
              <h3 className="skillpecker-chart-title">问题类型分布</h3>
            </div>
            <div className="skillpecker-chart-canvas skillpecker-chart-canvas-donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskBreakdown}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={78}
                    outerRadius={116}
                    paddingAngle={3}
                    labelLine
                    label={({ payload }) =>
                      payload ? `${payload.label}\n${payload.value} (${formatPercent(payload.value, riskTotal)})` : ''
                    }
                  >
                    {riskBreakdown.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ProblemTypeTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="skillpecker-chart-card">
            <div className="skillpecker-chart-head">
              <h3 className="skillpecker-chart-title">主风险类别</h3>
            </div>
            <div className="skillpecker-chart-canvas">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={primaryRiskGroups} layout="vertical" margin={{ top: 8, right: 18, left: 12, bottom: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={126}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#475569', fontSize: 16, fontWeight: 800 }}
                  />
                  <Tooltip content={<MetricTooltip />} />
                  <Bar dataKey="value" radius={[999, 999, 999, 999]} barSize={20}>
                    {primaryRiskGroups.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                    <LabelList dataKey="value" position="right" fill="#0f172a" fontSize={14} fontWeight={900} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="skillpecker-chart-card skillpecker-chart-card-wide">
            <div className="skillpecker-chart-head">
              <h3 className="skillpecker-chart-title">问题Skill业务分类TOP10</h3>
            </div>
            <div className="skillpecker-chart-canvas skillpecker-chart-canvas-wide">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={businessCategoryTop} layout="vertical" margin={{ top: 8, right: 18, left: 18, bottom: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={100}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#475569', fontSize: 16, fontWeight: 800 }}
                  />
                  <Tooltip content={<MetricTooltip />} />
                  <Bar dataKey="value" radius={[999, 999, 999, 999]} barSize={18}>
                    {businessCategoryTop.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                    <LabelList dataKey="value" position="right" fill="#0f172a" fontSize={14} fontWeight={900} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
