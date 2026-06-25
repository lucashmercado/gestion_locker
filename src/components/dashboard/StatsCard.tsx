import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface StatsCardProps {
  label: string
  value: string | number
  icon: ReactNode
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  delay?: number
}

const colorMap = {
  blue: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', icon: 'rgba(59,130,246,0.2)', text: '#60a5fa' },
  green: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: 'rgba(16,185,129,0.2)', text: '#10b981' },
  yellow: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
  red: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', icon: 'rgba(239,68,68,0.2)', text: '#ef4444' },
  purple: { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)', icon: 'rgba(139,92,246,0.2)', text: '#a78bfa' },
}

export function StatsCard({ label, value, icon, trend, color = 'blue', delay = 0 }: StatsCardProps) {
  const c = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="card glass-hover relative overflow-hidden"
      style={{ background: c.bg, borderColor: c.border }}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl"
        style={{ background: c.text }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            {label}
          </p>
          <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {value}
          </p>
          {trend && (
            <p className="text-xs mt-1" style={{ color: trend.value >= 0 ? '#10b981' : '#ef4444' }}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: c.icon, color: c.text }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  )
}
