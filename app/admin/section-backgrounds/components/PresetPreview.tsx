'use client'

import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface PresetPreviewProps {
  category: string
  config: Record<string, unknown>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-16 h-10 rounded',
  md: 'w-32 h-20 rounded-md',
  lg: 'w-full h-32 rounded-lg',
}

/**
 * 背景プリセットのライブプレビュー
 */
export function PresetPreview({ category, config, size = 'md', className }: PresetPreviewProps) {
  const style = resolvePreviewStyle(category, config)

  return (
    <div
      className={cn(
        sizeClasses[size],
        'border border-border shadow-sm',
        className
      )}
      style={style}
    />
  )
}

function resolvePreviewStyle(
  category: string,
  config: Record<string, unknown>
): CSSProperties {
  switch (category) {
    case 'solid': {
      return { backgroundColor: (config.color as string) || '#ccc' }
    }
    case 'gradient': {
      const type = (config.type as string) || 'linear'
      const stops = (config.stops as { color: string; position: number }[]) || []
      const angle = (config.angle as number) ?? 135
      const stopsStr = stops.map((s) => `${s.color} ${s.position}%`).join(', ')

      switch (type) {
        case 'linear':
          return { background: `linear-gradient(${angle}deg, ${stopsStr})` }
        case 'radial':
          return { background: `radial-gradient(circle, ${stopsStr})` }
        case 'conic':
          return { background: `conic-gradient(${stopsStr})` }
        default:
          return { background: `linear-gradient(135deg, ${stopsStr})` }
      }
    }
    default:
      return { backgroundColor: '#e5e7eb' }
  }
}
