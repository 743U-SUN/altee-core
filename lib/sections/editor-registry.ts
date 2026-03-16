import { lazy, type ComponentType } from 'react'
import type { BaseSectionEditorProps } from '@/types/profile-sections'

/**
 * エディタ定義
 */
interface EditorDefinition {
  /** 動的インポートされるコンポーネント */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<BaseSectionEditorProps<any>>
  /** currentTitle を使用するか */
  needsTitle: boolean
}

/**
 * エディタレジストリ
 * セクションタイプをキーとして、エディタコンポーネントを管理
 */
export const EDITOR_REGISTRY: Record<string, EditorDefinition> = {
  'profile-card': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/ProfileCardEditModal').then(
        (m) => ({ default: m.ProfileCardEditModal })
      )
    ),
    needsTitle: false,
  },
  'character-profile': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/CharacterProfileEditModal').then(
        (m) => ({ default: m.CharacterProfileEditModal })
      )
    ),
    needsTitle: false,
  },
  faq: {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/FAQEditModal').then(
        (m) => ({ default: m.FAQEditModal })
      )
    ),
    needsTitle: true,
  },
  links: {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/LinksEditModal').then(
        (m) => ({ default: m.LinksEditModal })
      )
    ),
    needsTitle: false,
  },
  'icon-links': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/IconLinksEditModal').then(
        (m) => ({ default: m.IconLinksEditModal })
      )
    ),
    needsTitle: false,
  },
  'link-list': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/LinkListEditModal').then(
        (m) => ({ default: m.LinkListEditModal })
      )
    ),
    needsTitle: false,
  },
  header: {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/HeaderEditModal').then(
        (m) => ({ default: m.HeaderEditModal })
      )
    ),
    needsTitle: false,
  },
  'long-text': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/LongTextEditModal').then(
        (m) => ({ default: m.LongTextEditModal })
      )
    ),
    needsTitle: true,
  },
  'bar-graph': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/BarGraphEditModal').then(
        (m) => ({ default: m.BarGraphEditModal })
      )
    ),
    needsTitle: true,
  },
  youtube: {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/YoutubeSectionModal').then(
        (m) => ({ default: m.YoutubeSectionModal })
      )
    ),
    needsTitle: false,
  },
  'weekly-schedule': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/WeeklyScheduleEditModal').then(
        (m) => ({ default: m.WeeklyScheduleEditModal })
      )
    ),
    needsTitle: true,
  },
  timeline: {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/TimelineEditModal').then(
        (m) => ({ default: m.TimelineEditModal })
      )
    ),
    needsTitle: true,
  },
  'video-gallery': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/VideoGallerySectionModal').then(
        (m) => ({ default: m.VideoGallerySectionModal })
      )
    ),
    needsTitle: false,
  },
  'circular-stat': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/CircularStatEditModal').then(
        (m) => ({ default: m.CircularStatEditModal })
      )
    ),
    needsTitle: true,
  },
  'image-hero': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/ImageHeroEditModal').then(
        (m) => ({ default: m.ImageHeroEditModal })
      )
    ),
    needsTitle: false,
  },
  'image-grid-2': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/ImageGrid2EditModal').then(
        (m) => ({ default: m.ImageGrid2EditModal })
      )
    ),
    needsTitle: false,
  },
  'image-grid-3': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/ImageGrid3EditModal').then(
        (m) => ({ default: m.ImageGrid3EditModal })
      )
    ),
    needsTitle: false,
  },
  'videos-profile': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/VideosProfileEditModal').then(
        (m) => ({ default: m.VideosProfileEditModal })
      )
    ),
    needsTitle: false,
  },
  'youtube-latest': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/YouTubeLatestEditModal').then(
        (m) => ({ default: m.YouTubeLatestEditModal })
      )
    ),
    needsTitle: false,
  },
  'youtube-recommended': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/YouTubeRecommendedEditModal').then(
        (m) => ({ default: m.YouTubeRecommendedEditModal })
      )
    ),
    needsTitle: false,
  },
  'niconico-recommended': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/NiconicoRecommendedEditModal').then(
        (m) => ({ default: m.NiconicoRecommendedEditModal })
      )
    ),
    needsTitle: false,
  },
}

/**
 * エディタ定義を取得
 * @param sectionType - セクションタイプ
 * @returns エディタ定義（存在しない場合はnull）
 */
export function getEditorDefinition(sectionType: string): EditorDefinition | null {
  return EDITOR_REGISTRY[sectionType] ?? null
}
