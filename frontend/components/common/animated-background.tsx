'use client'

import { useMemo } from 'react'

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute inset-0 grid-bg opacity-35" />

      <div
        className="absolute left-[8%] top-[10%] h-[460px] w-[460px] rounded-full animate-float-slow will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(14,165,233,0.16) 0%, transparent 68%)',
          filter: 'blur(64px)',
        }}
      />

      <div
        className="absolute right-[4%] top-[32%] h-[560px] w-[560px] rounded-full animate-float-medium will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.13) 0%, transparent 70%)',
          filter: 'blur(72px)',
        }}
      />

      <div
        className="absolute bottom-[8%] left-[30%] h-[380px] w-[380px] rounded-full animate-float-fast will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 68%)',
          filter: 'blur(56px)',
        }}
      />

      <ParticleField />

      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/25 to-transparent" />
      <div className="absolute left-16 top-16 h-28 w-28 rounded-full border border-sky-300/10" />
      <div className="absolute bottom-16 right-16 h-36 w-36 rounded-full border border-emerald-300/10" />
    </div>
  )
}

function ParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: 8 + (i * 11) % 84,
        y: 12 + (i * 17) % 76,
        size: 2 + (i % 3),
        delay: i * 0.4,
      })),
    []
  )

  return (
    <div className="absolute inset-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-sky-300/25 animate-particle will-change-transform"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  )
}