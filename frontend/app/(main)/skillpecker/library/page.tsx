import Link from 'next/link'

import { SkillPeckerLibrary } from '@/components/skillpecker/skillpecker-library'
import { SkillPeckerShell } from '@/components/skillpecker/skillpecker-shell'
import { Button } from '@/components/ui/button'

export default function SkillPeckerLibraryPage() {
  return (
    <SkillPeckerShell
      title="恶意技能库"
      description="按判定级别、业务分类和文档内容检索恶意样本，并在原生页面中展开查看扫描结果与技能文档。"
      variant="overview"
      titleClassName="skillpecker-overview-shell-title"
      descriptionClassName="skillpecker-overview-shell-description"
      actions={
        <Link href="/skillpecker/console">
          <Button variant="outline">返回扫描控制台</Button>
        </Link>
      }
    >
      <SkillPeckerLibrary />
    </SkillPeckerShell>
  )
}
