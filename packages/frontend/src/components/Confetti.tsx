import { useMemo } from 'react'

const COLORS = ['#0EA5E9', '#F97316', '#FBBF24', '#A78BFA', '#22C55E', '#F472B6']
const SHAPES = ['circle', 'square', 'triangle'] as const
const PARTICLE_COUNT = 30

interface Particle {
  id: number
  color: string
  shape: typeof SHAPES[number]
  left: number
  delay: number
  duration: number
  size: number
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    shape: SHAPES[i % SHAPES.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    size: 6 + Math.random() * 8,
  }))
}

function ParticleShape({ particle }: { particle: Particle }) {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${particle.left}%`,
    top: '-10px',
    width: particle.size,
    height: particle.size,
    animation: `confetti-fall ${particle.duration}s ease-in ${particle.delay}s forwards, confetti-shake ${particle.duration * 0.5}s ease-in-out ${particle.delay}s infinite`,
  }

  if (particle.shape === 'circle') {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: particle.color,
          borderRadius: '50%',
        }}
      />
    )
  }

  if (particle.shape === 'triangle') {
    return (
      <div
        style={{
          ...baseStyle,
          width: 0,
          height: 0,
          borderLeft: `${particle.size / 2}px solid transparent`,
          borderRight: `${particle.size / 2}px solid transparent`,
          borderBottom: `${particle.size}px solid ${particle.color}`,
          backgroundColor: 'transparent',
        }}
      />
    )
  }

  return (
    <div
      style={{
        ...baseStyle,
        backgroundColor: particle.color,
        borderRadius: '2px',
      }}
    />
  )
}

export function Confetti() {
  const particles = useMemo(generateParticles, [])

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <ParticleShape key={p.id} particle={p} />
      ))}
    </div>
  )
}
