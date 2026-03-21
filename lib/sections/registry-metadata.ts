/**
 * セクションレジストリ - メタデータのみ（サーバー互換）
 *
 * React.lazy() を含まないため、Server Actions・Server Components から安全にインポートできる。
 * コンポーネントを含むフルの SECTION_REGISTRY は lib/sections/registry.ts ('use client') を参照。
 */

import type {
  SectionMetadata,
  SectionCategory,
  SectionCategoryDefinition,
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
 * セクションメタデータ登録マップ（コンポーネントなし）
 */
export const SECTION_METADATA_REGISTRY: Record<string, SectionMetadata> = {
  'profile-card': {
    type: 'profile-card',
    label: 'プロフィール',
    icon: 'User',
    description: '名前と自己紹介',
    category: 'main',
    priority: 'high',
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
    defaultData: { questions: [] },
  },
  links: {
    type: 'links',
    label: 'リンク',
    icon: 'Link',
    description: 'SNS・Webサイトリンク',
    category: 'links',
    priority: 'medium',
    defaultData: { items: [] },
  },
  'icon-links': {
    type: 'icon-links',
    label: 'アイコンリンク',
    icon: 'Link2',
    description: 'SNS・連絡先のコンパクト表示',
    category: 'links',
    priority: 'medium',
    defaultData: { items: [] },
  },
  'link-list': {
    type: 'link-list',
    label: 'リンクリスト',
    icon: 'List',
    description: 'リンク一覧（カード形式）',
    category: 'links',
    priority: 'low',
    defaultData: { items: [] },
  },
  header: {
    type: 'header',
    label: '見出し',
    icon: 'Heading',
    description: 'セクションの区切り',
    category: 'structure',
    priority: 'medium',
    defaultData: { text: '見出し', level: 'h2' },
  },
  'long-text': {
    type: 'long-text',
    label: '長文',
    icon: 'FileText',
    description: 'マークダウン対応の詳細テキスト',
    category: 'content',
    priority: 'low',
    defaultData: { content: '' },
  },
  'bar-graph': {
    type: 'bar-graph',
    label: '横棒グラフ',
    icon: 'BarChart2',
    description: 'スキルや数値の視覚化',
    category: 'data',
    priority: 'medium',
    defaultData: { items: [] },
  },
  'circular-stat': {
    type: 'circular-stat',
    label: '円形スタット',
    icon: 'PieChart',
    description: 'ステータスや比率の円グラフ表示',
    category: 'data',
    priority: 'medium',
    defaultData: {
      items: [
        { id: 'sample-1', value: 80, centerChar: 'A', iconName: 'Zap', label: 'STR', color: '#f87171', sortOrder: 0 },
        { id: 'sample-2', value: 95, centerChar: 'S', iconName: 'Star', label: 'INT', subLabel: 'MAX', color: '#60a5fa', sortOrder: 1 },
        { id: 'sample-3', value: 45, centerChar: 'C', iconName: 'Heart', label: 'VIT', color: '#4ade80', sortOrder: 2 },
      ],
    },
  },
  'image-hero': {
    type: 'image-hero',
    label: 'ヒーロー画像',
    icon: 'PanelTop',
    description: '全画面ヒーロー画像（PC: 16:9 / モバイル: 3:4）',
    category: 'image',
    fullBleed: true,
    priority: 'high',
    maxInstances: 1,
    defaultData: {
      item: {
        id: '',
        imageKey: undefined,
        sortOrder: 0,
      },
      mobileImageKey: undefined,
      characterImageKey: undefined,
      speeches: [],
      speechDisplayMode: 'sequential',
    },
    defaultSettings: {
      paddingTop: { mobile: 'none' },
      paddingBottom: { mobile: 'none' },
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
  news: {
    type: 'news',
    label: 'NEWS',
    icon: 'Newspaper',
    description: 'ニュース記事カード',
    category: 'content',
    priority: 'medium',
    maxInstances: 1,
    defaultData: {},
  },
  'video-gallery': {
    type: 'video-gallery',
    label: '動画ギャラリー',
    icon: 'PlaySquare',
    description: 'YouTube動画をギャラリー形式で表示',
    category: 'video',
    priority: 'low',
    defaultData: { items: [] },
  },
  'videos-profile': {
    type: 'videos-profile',
    label: '動画ページプロフィール',
    icon: 'Film',
    description: '動画ページのタイトルと説明',
    category: 'main',
    priority: 'high',
    maxInstances: 1,
    page: 'videos',
    defaultData: {
      title: '動画',
      description: '',
    },
  },
  'youtube-latest': {
    type: 'youtube-latest',
    label: 'YouTube最新動画',
    icon: 'Rss',
    description: 'チャンネルの最新動画を自動表示',
    category: 'video',
    priority: 'medium',
    maxInstances: 1,
    page: 'videos',
    defaultData: {
      channelId: '',
      rssFeedLimit: 6,
    },
  },
  'youtube-recommended': {
    type: 'youtube-recommended',
    label: 'YouTubeおすすめ動画',
    icon: 'ThumbsUp',
    description: 'おすすめのYouTube動画を表示',
    category: 'video',
    priority: 'medium',
    maxInstances: 1,
    page: 'videos',
    defaultData: {
      items: [],
    },
  },
  'niconico-recommended': {
    type: 'niconico-recommended',
    label: 'ニコニコおすすめ動画',
    icon: 'Tv2',
    description: 'おすすめのニコニコ動画を表示',
    category: 'video',
    priority: 'medium',
    page: 'videos',
    defaultData: {
      items: [],
    },
  },
}

// モジュールレベルでキャッシュ（毎回 Object.values() を呼ばない）
const _allMetadata = Object.values(SECTION_METADATA_REGISTRY)

/**
 * セクションメタデータを取得
 */
export function getSectionMetadata(
  sectionType: string
): SectionMetadata | undefined {
  return SECTION_METADATA_REGISTRY[sectionType]
}

/**
 * 全てのセクションメタデータを取得
 */
export function getAllSectionMetadata(): SectionMetadata[] {
  return _allMetadata
}

/**
 * カテゴリ別にセクションメタデータを取得
 */
export function getSectionMetadataByCategory(
  category: SectionCategory
): SectionMetadata[] {
  return _allMetadata.filter((s) => s.category === category)
}

/**
 * カテゴリ定義を取得
 */
export function getCategoryDefinition(
  category: SectionCategory
): SectionCategoryDefinition | undefined {
  return SECTION_CATEGORIES[category]
}

// モジュールレベルでキャッシュ
const _allCategories = Object.entries(SECTION_CATEGORIES).map(([key, definition]) => ({
  key: key as SectionCategory,
  definition,
}))

/**
 * 全てのカテゴリ定義を取得
 */
export function getAllCategories(): Array<{
  key: SectionCategory
  definition: SectionCategoryDefinition
}> {
  return _allCategories
}

/**
 * ページ別にセクションメタデータを取得
 */
export function getSectionMetadataByPage(page: 'profile' | 'videos'): SectionMetadata[] {
  if (page === 'videos') {
    return _allMetadata.filter((s) => s.page === 'videos')
  }
  // profile: page未指定（undefined）またはpage='profile'
  return _allMetadata.filter((s) => !s.page || s.page === 'profile')
}
