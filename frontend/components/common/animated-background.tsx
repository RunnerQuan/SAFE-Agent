'use client'

import { useEffect, useMemo, useRef } from 'react'

export function AnimatedBackground() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return

    let frame = 0
    let targetX = window.innerWidth * 0.46
    let targetY = window.innerHeight * 0.22
    let currentX = targetX
    let currentY = targetY

    const handleMove = (event: MouseEvent) => {
      targetX = event.clientX
      targetY = event.clientY
    }

    const animate = () => {
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
      glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
      frame = window.requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMove, { passive: true })
    frame = window.requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="global-ambient-bg" />
      <div className="app-grid-overlay" />
      <div className="app-noise-overlay" />

      <div
        ref={glowRef}
        className="absolute -left-48 -top-48 h-[30rem] w-[30rem] rounded-full bg-sky-300/40 blur-[120px]"
      />
      <div className="absolute right-[6%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-teal-300/20 blur-[130px] animate-float-medium" />
      <div className="absolute bottom-[4%] left-[28%] h-[20rem] w-[20rem] rounded-full bg-white/30 blur-[100px] animate-float-slow dark:bg-slate-700/30" />

      <div className="absolute inset-y-0 left-[8%] hidden xl:block">
        <div className="beam-line" />
      </div>
      <div className="absolute inset-y-0 left-[31%] hidden xl:block">
        <div className="beam-line teal" />
      </div>
      <div className="absolute inset-y-0 right-[29%] hidden xl:block">
        <div className="beam-line" />
      </div>
      <div className="absolute inset-y-0 right-[8%] hidden xl:block">
        <div className="beam-line teal" />
      </div>

      <ParticleField />
    </div>
  )
}

function ParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        size: 2 + (index % 4),
        left: 4 + ((index * 11) % 92),
        top: 6 + ((index * 17) % 82),
        delay: index * 0.32,
      })),
    []
  )

  return (
    <div className="absolute inset-0">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute animate-particle rounded-full bg-white/55 dark:bg-sky-100/30"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
