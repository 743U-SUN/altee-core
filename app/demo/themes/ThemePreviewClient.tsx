'use client'

import { useState } from 'react'
import type { ThemePreset } from '@/lib/themes/types'

interface ThemePreviewClientProps {
  themes: ThemePreset[]
  cssVariableKeys: readonly string[]
}

/**
 * テーマプレビュー（クライアントコンポーネント）
 * テーマ選択・プレビュー・CSS変数表示
 */
export function ThemePreviewClient({ themes, cssVariableKeys }: ThemePreviewClientProps) {
  const [selectedId, setSelectedId] = useState<string>(themes[0]?.id ?? '')

  const selected = themes.find((t) => t.id === selectedId)

  return (
    <div className="space-y-8">
      {/* プレビューカード */}
      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* テーマプレビュー */}
          <div
            className="p-6 space-y-4"
            style={{
              ...Object.fromEntries(
                Object.entries(selected.variables)
              ),
              backgroundColor: selected.palette.background,
              borderRadius: selected.variables['--theme-card-radius'] ?? '12px',
            }}
          >
            <div
              className="p-5 space-y-3"
              style={{
                backgroundColor: selected.palette.cardBackground,
                boxShadow: selected.variables['--theme-card-shadow'] ?? 'none',
                borderRadius: selected.variables['--theme-card-radius'] ?? '12px',
              }}
            >
              <h3
                className="text-xl font-bold"
                style={{ color: selected.palette.text.primary }}
              >
                {selected.displayName}
              </h3>
              {selected.description && (
                <p className="text-sm" style={{ color: selected.palette.text.secondary }}>
                  {selected.description}
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: `${selected.palette.accent}20`,
                    color: selected.palette.text.accent,
                    border: `1px solid ${selected.palette.accent}40`,
                  }}
                >
                  {selected.palette.displayName}
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: `${selected.palette.accent}10`,
                    color: selected.palette.text.secondary,
                  }}
                >
                  {selected.base}
                </span>
              </div>
            </div>

            {/* カラーパレット */}
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: selected.palette.text.secondary }}>
                カラーパレット
              </p>
              <div className="flex gap-2">
                {[
                  { label: 'Primary', color: selected.palette.primary },
                  { label: 'Secondary', color: selected.palette.secondary },
                  { label: 'Accent', color: selected.palette.accent },
                  { label: 'BG', color: selected.palette.background },
                  { label: 'Card BG', color: selected.palette.cardBackground },
                ].map(({ label, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="text-[10px]" style={{ color: selected.palette.text.secondary }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 装飾設定 */}
            <div className="space-y-1">
              <p className="text-xs font-semibold" style={{ color: selected.palette.text.secondary }}>
                装飾設定
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(selected.decorations).map(([key, value]) => (
                  <span
                    key={key}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: selected.variables['--theme-bar-bg'] ?? '#f0f0f0',
                      color: selected.palette.text.secondary,
                    }}
                  >
                    {key}: <strong>{value}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CSS変数一覧 */}
          <div className="bg-gray-900 rounded-2xl p-5 overflow-auto max-h-[500px]">
            <p className="text-gray-400 text-xs font-semibold mb-3">CSS Variables</p>
            <div className="space-y-1 font-mono text-xs">
              {cssVariableKeys.map((varName) => {
                const value = selected.variables[varName]
                if (!value) return null
                const isColor = /^#[0-9a-fA-F]{3,8}$/.test(value)
                return (
                  <div key={varName} className="flex items-center gap-2">
                    {isColor && (
                      <div
                        className="w-3 h-3 rounded-sm border border-gray-600 flex-shrink-0"
                        style={{ backgroundColor: value }}
                      />
                    )}
                    <span className="text-purple-400">{varName}</span>
                    <span className="text-gray-500">:</span>
                    <span className="text-green-400 truncate" title={value}>{value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 全テーマ一覧（ミニプレビュー） */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">全テーマ ({themes.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedId(theme.id)}
              className={`
                rounded-xl p-3 text-left transition-all border-2
                ${selectedId === theme.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'}
              `}
              style={{ backgroundColor: theme.palette.background }}
            >
              <div className="flex gap-1 mb-2">
                {[theme.palette.primary, theme.palette.secondary, theme.palette.accent].map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-[11px] font-semibold truncate" style={{ color: theme.palette.text.primary }}>
                {theme.name}
              </p>
              <p className="text-[10px] truncate" style={{ color: theme.palette.text.secondary }}>
                {theme.palette.displayName}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
