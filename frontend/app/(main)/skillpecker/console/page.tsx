import Link from 'next/link'

import { SkillPeckerConsole } from '@/components/skillpecker/skillpecker-console'
import { SkillPeckerShell } from '@/components/skillpecker/skillpecker-shell'
import { Button } from '@/components/ui/button'

export default function SkillPeckerConsolePage() {
  return (
    <SkillPeckerShell
      title="扫描控制台"
      description="上传 ZIP 压缩包或本地文件夹，发起异步扫描任务，并在统一队列中查看结果。"
      variant="overview"
      titleClassName="skillpecker-overview-shell-title"
      descriptionClassName="skillpecker-overview-shell-description"
      actions={
        <Link href="/skillpecker/library">
          <Button variant="outline">查看恶意技能库</Button>
        </Link>
      }
    >
      <SkillPeckerConsole />
    </SkillPeckerShell>
  )
}
