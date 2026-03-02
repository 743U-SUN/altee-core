'use client'

import { Suspense, useState, useMemo, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type {
  UserSection,
  BaseSectionEditorProps,
  SectionSettings,
  SectionBackgroundPreset,
} from '@/types/profile-sections'
import { getSectionDefinition } from '@/lib/sections'
import { getEditorDefinition } from '@/lib/sections/editor-registry'
import { resolvePreset } from '@/lib/sections/background-utils'
import { SectionBand } from '@/components/profile/SectionBand'
import { EditableSectionWrapper } from './EditableSectionWrapper'
import { SectionStylePanel } from './SectionStylePanel'
import { DeleteConfirmModal } from '@/app/dashboard/profile-editor/components/DeleteConfirmModal'
import { moveSectionOrder, deleteSection } from '@/app/actions/user/section-actions'

interface EditableSectionRendererProps {
  sections: UserSection[]
  presets?: SectionBackgroundPreset[]
}

/**
 * 編集可能なセクションレンダラー
 * 各セクションを SectionBand + EditableSectionWrapper でラップして、
 * 背景プレビュー・削除・並び替え・編集・スタイル設定機能を提供
 */
export function EditableSectionRenderer({
  sections,
  presets = [],
}: EditableSectionRendererProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<UserSection | null>(null)
  const [editTarget, setEditTarget] = useState<UserSection | null>(null)
  const [styleTarget, setStyleTarget] = useState<UserSection | null>(null)

  // リアルタイムプレビュー用のローカル設定（セクションID → SectionSettings）
  const [localSettings, setLocalSettings] = useState<Record<string, SectionSettings>>({})

  const visibleSections = useMemo(
    () => sections.filter((s) => s.isVisible).sort((a, b) => a.sortOrder - b.sortOrder),
    [sections]
  )

  const handleMove = useCallback(async (sectionId: string, direction: 'up' | 'down') => {
    const result = await moveSectionOrder(sectionId, direction)
    if (result.success) {
      startTransition(() => {
        router.refresh()
      })
    } else {
      toast.error(result.error || 'セクションの移動に失敗しました')
    }
  }, [router, startTransition])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return

    const result = await deleteSection(deleteTarget.id)

    if (result.success) {
      setDeleteTarget(null)
      startTransition(() => {
        router.refresh()
      })
    } else {
      toast.error(result.error || 'セクションの削除に失敗しました')
    }
  }, [deleteTarget, router, startTransition])

  const handleEditClose = useCallback(() => {
    setEditTarget(null)
  }, [])

  // スタイルパネルの設定変更（リアルタイムプレビュー用）
  const handleSettingsChange = useCallback(
    (settings: SectionSettings) => {
      if (!styleTarget) return
      setLocalSettings((prev) => ({ ...prev, [styleTarget.id]: settings }))
    },
    [styleTarget]
  )

  // スタイルパネルを閉じる（ローカル設定をクリアして router.refresh）
  const handleStyleClose = useCallback(() => {
    if (styleTarget) {
      setLocalSettings((prev) => {
        const next = { ...prev }
        delete next[styleTarget.id]
        return next
      })
    }
    setStyleTarget(null)
    startTransition(() => {
      router.refresh()
    })
  }, [styleTarget, router, startTransition])

  return (
    <>
      {visibleSections.map((section, index) => {
        const definition = getSectionDefinition(section.sectionType)
        if (!definition) return null

        // ローカル設定があればそちらを優先（リアルタイムプレビュー）
        const serverSettings = section.settings
        const settings = localSettings[section.id] ?? serverSettings
        const preset = resolvePreset(settings?.background, presets)
        const Component = definition.component
        const isFirst = index === 0
        const isLast = index === visibleSections.length - 1

        return (
          <SectionBand
            key={section.id}
            settings={settings}
            preset={preset}
            fullBleed={definition.fullBleed}
          >
            <EditableSectionWrapper
              isFirst={isFirst}
              isLast={isLast}
              onMoveUp={() => handleMove(section.id, 'up')}
              onMoveDown={() => handleMove(section.id, 'down')}
              onEdit={() => setEditTarget(section)}
              onStyleEdit={() => setStyleTarget(section)}
              onDelete={() => setDeleteTarget(section)}
            >
              <Component section={section} isEditable={false} />
            </EditableSectionWrapper>
          </SectionBand>
        )
      })}

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <DeleteConfirmModal
          open={true}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onConfirm={handleDelete}
          sectionName={getSectionDefinition(deleteTarget.sectionType)?.label || 'セクション'}
        />
      )}

      {/* 編集モーダル（動的インポート） */}
      {editTarget &&
        (() => {
          const editorDef = getEditorDefinition(editTarget.sectionType)
          if (!editorDef) {
            console.warn(`Unknown section type: ${editTarget.sectionType}`)
            return null
          }

          const EditorComponent = editorDef.component
          const props: BaseSectionEditorProps = {
            isOpen: true,
            onClose: handleEditClose,
            sectionId: editTarget.id,
            currentData: editTarget.data,
            ...(editorDef.needsTitle && {
              currentTitle: editTarget.title ?? undefined,
            }),
          }

          return (
            <Suspense
              fallback={
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">読み込み中...</p>
                  </div>
                </div>
              }
            >
              <EditorComponent {...props} />
            </Suspense>
          )
        })()}

      {/* スタイル設定パネル */}
      {styleTarget && (
        <SectionStylePanel
          isOpen={true}
          onClose={handleStyleClose}
          sectionId={styleTarget.id}
          currentSettings={styleTarget.settings}
          presets={presets}
          onSettingsChange={handleSettingsChange}
        />
      )}
    </>
  )
}
