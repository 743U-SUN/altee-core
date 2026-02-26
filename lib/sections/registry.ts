import { lazy } from 'react'
import type {
  SectionDefinition,
  SectionCategoryDefinition,
  SectionCategory,
} from './types'

/**
 * セクションカテゴリキー型（後方互換性のため）
 */
export type SectionCategoryKey = SectionCategory

/**
 * セクションカテゴリ定義
 */
export const SECTION_CATEGORIES: Record<SectionCategory, SectionCategoryDefinition> = {
  main: {
    label: 'メインコンテンツ',
    icon: 'User',
    description: 'プロフィール・キャラクター情報',
  },
  image: {
    label: '画像コンテンツ',
    icon: 'Image',
    description: 'バナー・ギャラリー・装飾画像',
  },
  links: {
    label: 'リンク',
    icon: 'Link',
    description: 'SNS・Webサイトへのリンク',
  },
  content: {
    label: 'テキストコンテンツ',
    icon: 'FileText',
    description: '説明文・Q&A・長文',
  },
  data: {
    label: 'データ・グラフ',
    icon: 'BarChart2',
    description: 'スキル・数値の視覚化',
  },
  video: {
    label: '動画',
    icon: 'Video',
    description: 'YouTube動画・ギャラリー',
  },
  structure: {
    label: '構造',
    icon: 'Heading',
    description: '見出し・区切り・余白',
  },
}

/**
 * セクション登録マップ
 * 各セクションに priority, fullBleed を設定し、component を lazy() でラップ
 */
export const SECTION_REGISTRY: Record<string, SectionDefinition> = {
  'profile-card': {
    type: 'profile-card',
    label: 'プロフィール',
    icon: 'User',
    description: '名前と自己紹介',
    category: 'main',
    priority: 'high',
    component: lazy(() => import('@/components/user-profile/sections/ProfileCardSection').then(m => ({ default: m.ProfileCardSection }))),
    defaultData: {
      characterName: 'Character Name',
      bio: 'Tagline / Catch Copy',
      badgeLeft: 'Badge Left',
      badgeRight: 'Badge Right',
      avatarImageKey: undefined,
    },
  },
  'character-profile': {
    type: 'character-profile',
    label: 'キャラクタープロフィール',
    icon: 'UserCircle',
    description: 'キャラクター画像付きプロフィール',
    category: 'main',
    priority: 'high',
    maxInstances: 1,
    component: lazy(() => import('@/components/user-profile/sections/CharacterProfileSection').then(m => ({ default: m.CharacterProfileSection }))),
    defaultData: {
      name: 'Character Name',
      tagline: 'Tagline / Catch Copy',
      bio: '',
      badgeLeft: '',
      badgeRight: '',
      characterPosition: 'left',
      showSocialLinks: false,
    },
  },
  faq: {
    type: 'faq',
    label: 'Q&A',
    icon: 'HelpCircle',
    description: 'よくある質問',
    category: 'content',
    priority: 'medium',
    component: lazy(() => import('@/components/user-profile/sections/FAQSection').then(m => ({ default: m.FAQSection }))),
    defaultData: { questions: [] },
  },
  links: {
    type: 'links',
    label: 'リンク',
    icon: 'Link',
    description: 'SNS・Webサイトリンク',
    category: 'links',
    priority: 'medium',
    component: lazy(() => import('@/components/user-profile/sections/LinksSection').then(m => ({ default: m.LinksSection }))),
    defaultData: { items: [] },
  },
  'icon-links': {
    type: 'icon-links',
    label: 'アイコンリンク',
    icon: 'Link2',
    description: 'SNS・連絡先のコンパクト表示',
    category: 'links',
    priority: 'medium',
    component: lazy(() => import('@/components/user-profile/sections/IconLinksSection').then(m => ({ default: m.IconLinksSection }))),
    defaultData: { items: [] },
  },
  'link-list': {
    type: 'link-list',
    label: 'リンクリスト',
    icon: 'List',
    description: 'リンク一覧（カード形式）',
    category: 'links',
    priority: 'low',
    component: lazy(() => import('@/components/user-profile/sections/LinkListSection').then(m => ({ default: m.LinkListSection }))),
    defaultData: { items: [] },
  },
  header: {
    type: 'header',
    label: '見出し',
    icon: 'Heading',
    description: 'セクションの区切り',
    category: 'structure',
    priority: 'medium',
    component: lazy(() => import('@/components/user-profile/sections/HeaderSection').then(m => ({ default: m.HeaderSection }))),
    defaultData: { text: '見出し', level: 'h2' },
  },
  'long-text': {
    type: 'long-text',
    label: '長文',
    icon: 'FileText',
    description: 'マークダウン対応の詳細テキスト',
    category: 'content',
    priority: 'low',
    component: lazy(() => import('@/components/user-profile/sections/LongTextSection').then(m => ({ default: m.LongTextSection }))),
    defaultData: { content: '' },
  },
  'bar-graph': {
    type: 'bar-graph',
    label: '横棒グラフ',
    icon: 'BarChart2',
    description: 'スキルや数値の視覚化',
    category: 'data',
    priority: 'medium',
    component: lazy(() => import('@/components/user-profile/sections/BarGraphSection').then(m => ({ default: m.BarGraphSection }))),
    defaultData: { items: [] },
  },
  'circular-stat': {
    type: 'circular-stat',
    label: '円形スタット',
    icon: 'PieChart',
    description: 'ステータスや比率の円グラフ表示',
    category: 'data',
    priority: 'medium',
    component: lazy(() => import('@/components/user-profile/sections/CircularStatSection').then(m => ({ default: m.CircularStatSection }))),
    defaultData: {
      items: [
        { id: 'sample-1', value: 80, centerChar: 'A', iconName: 'Zap', label: 'STR', color: '#f87171', sortOrder: 0 },
        { id: 'sample-2', value: 95, centerChar: 'S', iconName: 'Star', label: 'INT', subLabel: 'MAX', color: '#60a5fa', sortOrder: 1 },
        { id: 'sample-3', value: 45, centerChar: 'C', iconName: 'Heart', label: 'VIT', color: '#4ade80', sortOrder: 2 },
      ],
    },
  },
  image: {
    type: 'image',
    label: '画像',
    icon: 'Image',
    description: 'バナー画像や装飾画像',
    category: 'image',
    priority: 'low',
    component: lazy(() => import('@/components/user-profile/sections/ImageSection').then(m => ({ default: m.ImageSection }))),
    defaultData: {
      aspectRatio: '16:9',
      objectFit: 'cover',
      borderRadius: 'md',
      background: { type: 'transparent' },
    },
  },
  'image-hero': {
    type: 'image-hero',
    label: 'ヒーロー画像',
    icon: 'PanelTop',
    description: '大きなバナー画像（21:9）',
    category: 'image',
    fullBleed: true,
    priority: 'high',
    maxInstances: 1,
    component: lazy(() => import('@/components/user-profile/sections/ImageHeroSection').then(m => ({ default: m.ImageHeroSection }))),
    defaultData: {
      item: {
        id: '',
        imageKey: undefined,
        title: '',
        subtitle: '',
        overlayText: '',
        linkUrl: '',
        sortOrder: 0,
      },
    },
  },
  'image-grid-2': {
    type: 'image-grid-2',
    label: '画像グリッド (2列)',
    icon: 'Columns2',
    description: '2枚の画像を横並びで表示',
    category: 'image',
    priority: 'low',
    maxInstances: 1,
    component: lazy(() => import('@/components/user-profile/sections/ImageGrid2Section').then(m => ({ default: m.ImageGrid2Section }))),
    defaultData: {
      items: [
        { id: '', imageKey: undefined, title: '', subtitle: '', overlayText: '', linkUrl: '', sortOrder: 0 },
        { id: '', imageKey: undefined, title: '', subtitle: '', overlayText: '', linkUrl: '', sortOrder: 1 },
      ],
    },
  },
  'image-grid-3': {
    type: 'image-grid-3',
    label: '画像グリッド (3列)',
    icon: 'Columns3',
    description: '3枚の画像を横並びで表示',
    category: 'image',
    priority: 'low',
    maxInstances: 1,
    component: lazy(() => import('@/components/user-profile/sections/ImageGrid3Section').then(m => ({ default: m.ImageGrid3Section }))),
    defaultData: {
      items: [
        { id: '', imageKey: undefined, title: '', subtitle: '', overlayText: '', linkUrl: '', sortOrder: 0 },
        { id: '', imageKey: undefined, title: '', subtitle: '', overlayText: '', linkUrl: '', sortOrder: 1 },
        { id: '', imageKey: undefined, title: '', subtitle: '', overlayText: '', linkUrl: '', sortOrder: 2 },
      ],
    },
  },
  youtube: {
    type: 'youtube',
    label: 'Youtube動画',
    icon: 'Youtube',
    description: 'Youtube動画を埋め込み',
    category: 'video',
    priority: 'low',
    component: lazy(() => import('@/components/user-profile/sections/YoutubeSection').then(m => ({ default: m.YoutubeSection }))),
    defaultData: {
      url: '',
      videoId: '',
      title: '',
      thumbnail: '',
      aspectRatio: '16:9',
    },
  },
  'weekly-schedule': {
    type: 'weekly-schedule',
    label: '週間スケジュール',
    icon: 'CalendarDays',
    description: '1週間の予定表',
    category: 'content',
    priority: 'low',
    component: lazy(() => import('@/components/user-profile/sections/WeeklyScheduleSection').then(m => ({ default: m.WeeklyScheduleSection }))),
    defaultData: {
      startDate: '',
      schedules: ['', '', '', '', '', '', ''],
    },
  },
  timeline: {
    type: 'timeline',
    label: '活動年表',
    icon: 'Clock',
    description: '時系列での活動・歴史',
    category: 'content',
    priority: 'low',
    component: lazy(() => import('@/components/user-profile/sections/TimelineSection').then(m => ({ default: m.TimelineSection }))),
    defaultData: {
      items: [
        {
          id: 'sample-1',
          label: 'LABEL',
          title: 'TITLE',
          description: 'DESCRIPTION',
          iconName: 'Star',
          sortOrder: 0,
        },
      ],
    },
  },
  'video-gallery': {
    type: 'video-gallery',
    label: '動画ギャラリー',
    icon: 'PlaySquare',
    description: 'YouTube動画をギャラリー形式で表示',
    category: 'video',
    priority: 'low',
    component: lazy(() => import('@/components/user-profile/sections/VideoGallerySection').then(m => ({ default: m.VideoGallerySection }))),
    defaultData: { items: [] },
  },
}

/**
 * セクション定義を取得
 */
export function getSectionDefinition(
  sectionType: string
): SectionDefinition | undefined {
  return SECTION_REGISTRY[sectionType]
}

/**
 * 全てのセクション定義を取得
 */
export function getAllSectionDefinitions(): SectionDefinition[] {
  return Object.values(SECTION_REGISTRY)
}

/**
 * カテゴリ別にセクション定義を取得
 */
export function getSectionsByCategory(
  category: SectionCategory
): SectionDefinition[] {
  return Object.values(SECTION_REGISTRY).filter(
    (section) => section.category === category
  )
}

/**
 * カテゴリ定義を取得
 */
export function getCategoryDefinition(
  category: SectionCategory
): SectionCategoryDefinition | undefined {
  return SECTION_CATEGORIES[category]
}

/**
 * 全てのカテゴリ定義を取得
 */
export function getAllCategories(): Array<{
  key: SectionCategory
  definition: SectionCategoryDefinition
}> {
  return Object.entries(SECTION_CATEGORIES).map(([key, definition]) => ({
    key: key as SectionCategory,
    definition,
  }))
}

/**
 * 高優先度セクションをpreload
 *
 * Note: React.lazy()でラップされたコンポーネントは、
 * React 19のuse()やSuspenseによって自動的に適切なタイミングで読み込まれるため、
 * 明示的なpreloadは通常不要です。この関数は将来の最適化のために保持されています。
 */
export async function preloadHighPrioritySections(): Promise<void> {
  return Promise.resolve()
}
