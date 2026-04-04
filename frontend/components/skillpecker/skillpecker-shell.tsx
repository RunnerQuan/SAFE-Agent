'use client'

import { ReactNode } from 'react'

import { SkillPeckerSectionNav } from '@/components/skillpecker/skillpecker-section-nav'

type SkillPeckerShellVariant = 'overview' | 'console' | 'library'

type SkillPeckerShellMetric = {
  label: string
  value: string
}

interface SkillPeckerShellProps {
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
  titleClassName?: string
  descriptionClassName?: string
  variant?: SkillPeckerShellVariant
  metrics?: SkillPeckerShellMetric[]
}

export function SkillPeckerShell({
  title,
  description,
  actions,
  children,
  titleClassName,
  descriptionClassName,
  variant = 'overview',
  metrics = [],
}: SkillPeckerShellProps) {
  return (
    <section className="skillpecker-module-grid">
      <header className={`glass-panel skillpecker-module-hero skillpecker-module-hero-${variant} rounded-[2rem] p-6 sm:p-7`}>
        <div className="skillpecker-hero-grid">
          <div className="skillpecker-hero-copy">
            <h1
              className={[
                'font-display text-3xl font-medium tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl',
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
            {actions ? <div className="skillpecker-hero-actions">{actions}</div> : null}
          </div>

          <div className="skillpecker-hero-aside" aria-hidden="true">
            <div className="skillpecker-hero-visual">
              <div className="skillpecker-hero-orbit">
                <span className="skillpecker-hero-orbit-ring skillpecker-hero-orbit-ring-lg" />
                <span className="skillpecker-hero-orbit-ring skillpecker-hero-orbit-ring-sm" />
                <span className="skillpecker-hero-orbit-node skillpecker-hero-orbit-node-a" />
                <span className="skillpecker-hero-orbit-node skillpecker-hero-orbit-node-b" />
                <span className="skillpecker-hero-orbit-node skillpecker-hero-orbit-node-c" />
              </div>
              <div className="skillpecker-hero-tracks">
                <span />
                <span />
                <span />
              </div>
              <div className="skillpecker-hero-bars">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="skillpecker-hero-scanline" />
            </div>
            {metrics.length ? (
              <div className="skillpecker-hero-metrics">
                {metrics.map((metric) => (
                  <div key={`${metric.label}-${metric.value}`} className="skillpecker-hero-metric-pill">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <SkillPeckerSectionNav />
        </div>
      </header>

      {children}
    </section>
  )
}
