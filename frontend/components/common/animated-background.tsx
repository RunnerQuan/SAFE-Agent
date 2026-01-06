'use client'

import { useMemo } from 'react'

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-mesh" />

      {/* Animated grid - 使用CSS动画，更高效 */}
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* Floating orbs - 使用CSS动画代替Framer Motion */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-float-slow will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          top: '10%',
          left: '10%',
        }}
      />

      <div
        className="absolute w-[600px] h-[600px] rounded-full animate-float-medium will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
          filter: 'blur(80px)',
          top: '50%',
          right: '5%',
        }}
      />

      <div
        className="absolute w-[400px] h-[400px] rounded-full animate-float-fast will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          bottom: '10%',
          left: '30%',
        }}
      />

      {/* Particles - 减少数量并使用CSS动画 */}
      <ParticleField />

      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      {/* Corner decorations - 静态元素，无需动画 */}
      <div className="absolute top-20 left-20 w-32 h-32 border border-cyan-500/10 rounded-full" />
      <div className="absolute top-24 left-24 w-24 h-24 border border-purple-500/10 rounded-full" />
      <div className="absolute bottom-20 right-20 w-40 h-40 border border-cyan-500/10 rounded-full" />
      <div className="absolute bottom-24 right-24 w-32 h-32 border border-purple-500/10 rounded-full" />
    </div>
  )
}

// 优化的粒子组件 - 减少数量，使用CSS动画
function ParticleField() {
  // 使用 useMemo 避免每次渲染重新生成粒子
  const particles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 10 + (i * 12) % 80,
      y: 15 + (i * 17) % 70,
      size: 2 + (i % 3),
      delay: i * 0.5,
    })), []
  )

  return (
    <div className="absolute inset-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-cyan-400/20 animate-particle will-change-transform"
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

// Animated lines component
export function AnimatedLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Horizontal lines */}
        {[20, 40, 60, 80].map((y, i) => (
          <motion.line
            key={`h-${i}`}
            x1="0%"
            y1={`${y}%`}
            x2="100%"
            y2={`${y}%`}
            stroke="url(#line-gradient)"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.3 }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </svg>
    </div>
  )
}

// Glowing orb component for decoration
export function GlowingOrb({
  size = 200,
  color = 'cyan',
  className = '',
}: {
  size?: number
  color?: 'cyan' | 'purple' | 'pink'
  className?: string
}) {
  const colors = {
    cyan: 'rgba(34, 211, 238, 0.15)',
    purple: 'rgba(139, 92, 246, 0.15)',
    pink: 'rgba(236, 72, 153, 0.15)',
  }

  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${colors[color]} 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}
