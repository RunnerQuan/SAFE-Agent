'use client'

import { ReactNode } from 'react'

import { SkillPeckerSectionNav } from '@/components/skillpecker/skillpecker-section-nav'

interface SkillPeckerShellProps {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
  titleClassName?: string
  descriptionClassName?: string
}

export function SkillPeckerShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  titleClassName,
  descriptionClassName,
}: SkillPeckerShellProps) {
  return (
    <section className="skillpecker-module-grid">
      <header className="glass-panel skillpecker-module-hero rounded-[2rem] p-6 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <span className="section-tag">{eyebrow}</span>
            <h1
              className={[
                'mt-4 font-display text-3xl font-medium tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl',
                titleClassName,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {title}
            </h1>
            <p
              className={[
                'mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300',
                descriptionClassName,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {description}
            </p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        <div className="mt-6">
          <SkillPeckerSectionNav />
        </div>
      </header>

      {children}
    </section>
  )
}
