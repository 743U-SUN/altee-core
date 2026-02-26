'use client'

import { Suspense, useMemo } from 'react'
import type {
  UserSection,
  SectionBackgroundPreset,
} from '@/types/profile-sections'
import { getSectionDefinition } from '@/lib/sections/registry'
import { resolvePreset } from '@/lib/sections/background-utils'
import { SectionBand } from './SectionBand'
import { SectionSkeleton } from './SectionSkeleton'
import { SectionErrorFallback } from './SectionErrorFallback'
import { ErrorBoundary } from '@/components/error-boundary'

interface SectionRendererProps {
  sections: UserSection[]
  presets?: SectionBackgroundPreset[]
  isEditable?: boolean
}

/**
 * セクション一覧をレンダリング
 * - SectionBand でフルブリード帯を管理
 * - 遅延読み込み（Suspense + SectionSkeleton）
 * - エラーハンドリング（ErrorBoundary + SectionErrorFallback）
 */
export function SectionRenderer({
  sections,
  presets = [],
  isEditable = false,
}: SectionRendererProps) {
  const sortedSections = useMemo(
    () =>
      sections
        .filter((section) => section.isVisible)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [sections]
  )

  return (
    <div className="w-full">
      {sortedSections.map((section) => {
        const definition = getSectionDefinition(section.sectionType)
        if (!definition) {
          console.warn(`Unknown section type: ${section.sectionType}`)
          return null
        }

        const settings = section.settings
        const preset = resolvePreset(settings?.background, presets)
        const Component = definition.component

        return (
          <ErrorBoundary
            key={section.id}
            fallback={(error, reset) => (
              <SectionBand settings={settings} preset={preset} fullBleed={definition.fullBleed}>
                <SectionErrorFallback
                  sectionType={section.sectionType}
                  error={error}
                  onRetry={reset}
                />
              </SectionBand>
            )}
            onError={(error, errorInfo) => {
              if (process.env.NODE_ENV === 'production') {
                console.error('[SectionRenderer] Error:', error, errorInfo)
              }
            }}
          >
            <Suspense fallback={
              <SectionBand settings={settings} preset={preset} fullBleed={definition.fullBleed}>
                <SectionSkeleton />
              </SectionBand>
            }>
              <SectionBand
                settings={settings}
                preset={preset}
                fullBleed={definition.fullBleed}
              >
                <Component section={section} isEditable={isEditable} />
              </SectionBand>
            </Suspense>
          </ErrorBoundary>
        )
      })}
    </div>
  )
}
