import Link from 'next/link'

import { SkillPeckerConsole } from '@/components/skillpecker/skillpecker-console'
import { SkillPeckerShell } from '@/components/skillpecker/skillpecker-shell'
import { Button } from '@/components/ui/button'

export default function SkillPeckerConsolePage() {
  return (
    <SkillPeckerShell
      eyebrow="SkillPecker"
      title="扫描控制台"
      description="上传 ZIP 压缩包或本地文件夹，发起异步扫描任务，并在统一队列中查看结果。"
      actions={
        <Link href="/skillpecker/library">
          <Button variant="outline">查看恶意 Skill 库</Button>
        </Link>
      }
    >
      <SkillPeckerConsole />
    </SkillPeckerShell>
  )
}
