'use client'

import { useMemo } from 'react'

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute inset-0 grid-bg opacity-20" />

      <div
        className="absolute left-[8%] top-[10%] h-[460px] w-[460px] rounded-full animate-float-slow will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(255,145,70,0.28) 0%, transparent 68%)',
          filter: 'blur(62px)',
        }}
      />

      <div
        className="absolute right-[4%] top-[32%] h-[560px] w-[560px] rounded-full animate-float-medium will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(20,166,137,0.22) 0%, transparent 70%)',
          filter: 'blur(68px)',
        }}
      />

      <div
        className="absolute bottom-[8%] left-[30%] h-[380px] w-[380px] rounded-full animate-float-fast will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.62) 0%, transparent 68%)',
          filter: 'blur(54px)',
        }}
      />

      <ParticleField />

      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff9146]/30 to-transparent" />
      <div className="absolute left-16 top-16 h-28 w-28 rounded-full border border-white/45" />
      <div className="absolute bottom-16 right-16 h-36 w-36 rounded-full border border-white/40" />
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
          className="absolute rounded-full bg-[#f27835]/35 animate-particle will-change-transform"
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
