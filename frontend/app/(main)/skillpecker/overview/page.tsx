import Link from 'next/link'

import { SkillPeckerIntroOverview } from '@/components/skillpecker/skillpecker-intro-overview'
import { SkillPeckerShell } from '@/components/skillpecker/skillpecker-shell'
import { Button } from '@/components/ui/button'

export default function SkillPeckerOverviewPage() {
  return (
    <SkillPeckerShell
      title="工具总览"
      description="基于用户意图解析与行为分析，精准识别权限滥用、隐蔽数据访问与潜在恶意路径。"
      variant="overview"
      titleClassName="skillpecker-overview-shell-title"
      descriptionClassName="skillpecker-overview-shell-description"
      actions={
        <>
          <Link href="/skillpecker/console">
            <Button>进入扫描控制台</Button>
          </Link>
          <Link href="/skillpecker/library">
            <Button variant="outline">查看恶意技能库</Button>
          </Link>
        </>
      }
    >
      <SkillPeckerIntroOverview />
    </SkillPeckerShell>
  )
}
