// セクションの共通インターフェース
export interface UserSection {
  id: string
  userId: string
  sectionType: string
  title: string | null
  page: string
  sortOrder: number
  isVisible: boolean
  data: unknown // セクション固有データ（型ガードで絞り込み: lib/sections/type-guards.ts）
  settings: SectionSettings | null // バンドの見た目設定（背景・パディング）
  createdAt: Date
  updatedAt: Date
}

// ===== SectionBand 設定 =====

/** セクションバンドの背景設定 */
export interface SectionBandBackground {
  type: 'inherit' | 'preset'
  presetId?: string // SectionBackgroundPreset.id
}

/** パディングサイズ（プリセット） */
export type SectionPaddingSize = 'none' | 'sm' | 'md' | 'lg' | 'xl'

/** パディング値（プリセット or カスタムpx） */
export type SectionPaddingValue = SectionPaddingSize | number

/** レスポンシブパディング */
export interface ResponsivePadding {
  mobile: SectionPaddingValue     // < 768px（必須）
  tablet?: SectionPaddingValue    // 768px〜1024px（省略時: mobile を継承）
  desktop?: SectionPaddingValue   // > 1024px（省略時: tablet を継承）
}

/** セクション設定（UserSection.settings の JSON 構造） */
export interface SectionSettings {
  background?: SectionBandBackground  // デフォルト: { type: 'inherit' }
  paddingTop?: ResponsivePadding      // デフォルト: { mobile: 'sm', desktop: 'md' }
  paddingBottom?: ResponsivePadding   // デフォルト: { mobile: 'sm', desktop: 'md' }
}

// ===== SectionBackgroundPreset の config 型 =====

/** solid: 単色 */
export interface SolidBgConfig {
  color: string // "#1a1a2e"
}

/** gradient: グラデーション */
export interface GradientBgConfig {
  type: 'linear' | 'radial' | 'conic'
  stops: { color: string; position: number }[]
  angle?: number // linear のみ
}

/** pattern: SVGパターン（繰り返し） */
export interface PatternBgConfig {
  svgDataUrl: string      // data:image/svg+xml;base64,...
  backgroundColor: string
  patternColor: string
  scale?: number
}

/** animated: CSS アニメーション */
export interface AnimatedBgConfig {
  cssClass: string
  keyframesName: string
  backgroundColor: string // fallback色
}

/** SectionBackgroundPreset の型 */
export interface SectionBackgroundPreset {
  id: string
  name: string
  category: 'solid' | 'gradient' | 'pattern' | 'animated'
  config: SolidBgConfig | GradientBgConfig | PatternBgConfig | AnimatedBgConfig
  thumbnailKey: string | null
  cssString: string | null
  isActive: boolean
  sortOrder: number
}

// セクションコンポーネントの共通Props
export interface BaseSectionProps {
  section: UserSection
  isEditable: boolean // ダッシュボード表示時: true
}

// 初期セクションタイプ
export const INITIAL_SECTION_TYPES = [
  'profile-card', // 名前、bio（固定、削除不可）
  'faq', // Q&A（旧FaqCategory/Question相当）
  'links', // リンク一覧（旧UserLink相当）
] as const

export type InitialSectionType = (typeof INITIAL_SECTION_TYPES)[number]

// profile-card セクションのdata構造
export interface ProfileCardData {
  characterName: string
  bio: string
  badgeLeft?: string       // 左バッジ (例: "RANK S")
  badgeRight?: string      // 右バッジ (例: "Assasin")
  avatarImageKey?: string  // 右上画像キー (MediaFile.storageKey)
}

// faq セクションのdata構造
export interface FAQData {
  questions: {
    id: string
    question: string
    answer: string
    iconName?: string  // Lucide icon name (例: "Heart", "Sun")
    sortOrder: number
  }[]
}

// links セクションのdata構造
export interface LinksData {
  items: {
    id: string
    url: string
    title: string
    description?: string       // 一言コメント（最大50文字）
    iconType: 'preset' | 'custom' | 'lucide'
    iconKey?: string           // preset icon key
    customIconUrl?: string     // custom uploaded icon URL
    lucideIconName?: string    // Lucide icon name
    sortOrder: number
  }[]
}

// header セクションのdata構造
export interface HeaderData {
  text: string
  level: 'h2' | 'h3' | 'h4'
}

// long-text セクションのdata構造
export interface LongTextData {
  content: string // Markdown対応
}

// bar-graph セクションのdata構造
export interface BarGraphData {
  items: {
    id: string
    label: string
    value: number
    maxValue: number
    sortOrder: number
  }[]
}

// circular-stat セクションのdata構造
export interface CircularStatItem {
  id: string // nanoid で生成
  value: number // 0-100 (パーセンテージ)
  centerChar: string // 1文字のみ (円の中央に表示)
  iconName?: string // Lucide icon name (ラベル左に表示)
  label: string // 最大10文字
  subLabel?: string // 最大10文字
  color: string // HEXカラー (円とcenterCharの色)
  sortOrder: number // 並び順
}

export interface CircularStatData {
  items: CircularStatItem[]
}

// image セクションのdata構造
export interface ImageSectionData {
  imageKey?: string           // MediaFile.storageKey
  altText?: string            // alt属性
  aspectRatio?: '16:9' | '3:1' | '4:3' | '1:1' | 'auto'
  objectFit?: 'cover' | 'contain'
  borderRadius?: 'none' | 'sm' | 'md' | 'lg'
  background?: {
    type: 'transparent' | 'color' | 'image'
    color?: string            // type='color'の場合
    imageKey?: string         // type='image'の場合
  }
}

// image-hero / image-grid-2 / image-grid-3 セクション用の共通アイテム構造
export interface ImageGridItem {
  id: string                 // nanoid()
  imageKey?: string          // MediaFile.storageKey
  title?: string             // 左下タイトル (最大30文字)
  subtitle?: string          // 左下サブタイトル/badge2 (最大20文字)
  overlayText?: string       // 右上バッジ (最大15文字)
  linkUrl?: string           // リンク先URL
  sortOrder: number          // 並び順 (2col/3colのみ使用)
}

// セリフアイテム（ImageHeroData.speeches の要素）
export interface SpeechBubbleItem {
  id: string           // nanoid()
  text: string         // セリフ本文（最大50文字）
  sortOrder: number    // 並び順
}

// image-hero セクションのdata構造
export interface ImageHeroData {
  item: ImageGridItem                         // PC背景画像（imageKeyのみ使用）
  mobileImageKey?: string                     // モバイル/タブレット背景画像（3:4推奨）
  characterImageKey?: string                  // キャラクター画像（9:16）
  speeches?: SpeechBubbleItem[]               // セリフリスト（最大10件）
  speechDisplayMode?: 'sequential' | 'random' // セリフ表示モード
}

// image-grid-2 セクションのdata構造
export interface ImageGrid2Data {
  items: [ImageGridItem, ImageGridItem]
}

// image-grid-3 セクションのdata構造
export interface ImageGrid3Data {
  items: [ImageGridItem, ImageGridItem, ImageGridItem]
}

// 背景設定の型
export interface BackgroundSettings {
  type: 'preset' | 'color' | 'image'
  color?: string          // type='color'の場合: HEXカラーコード
  imageKey?: string       // type='image'の場合: MediaFile.storageKey
  imageSource?: 'admin' | 'user' // 管理者用意 or ユーザーアップロード
}

// weekly-schedule セクションのdata構造
export interface WeeklyScheduleData {
  startDate: string    // "YYYY-MM-DD" 形式（開始日）
  imageKey?: string    // 右側背景画像（1:1推奨）
  schedules: string[]  // 長さ7、index=dayOffset(0-6) の予定テキスト
}

// youtube セクションのdata構造
export interface YoutubeSectionData {
  url: string
  videoId: string
  title?: string
  thumbnail?: string
  aspectRatio?: '16:9'
}

// timeline セクションのdata構造
export interface TimelineItem {
  id: string
  label: string         // 自由テキスト（"2023年" や "プロローグ" など）
  title: string
  description: string
  iconName?: string     // Lucide icon name
  sortOrder: number
}

export interface TimelineData {
  items: TimelineItem[]
}

// video-gallery セクションのdata構造
export interface VideoGalleryItem {
  id: string              // nanoid で生成
  videoId: string         // YouTube Video ID (11文字)
  url: string             // 元のURL
  title: string           // 動画タイトル（編集可能）
  thumbnail: string       // サムネイルURL
  sortOrder: number       // 並び順
}

export interface VideoGallerySectionData {
  items: VideoGalleryItem[]
}

// icon-links セクションのdata構造
export interface IconLinksData {
  items: {
    id: string
    url: string
    platform: string           // プラットフォーム名（hover時のtitle表示用）
    iconType: 'lucide' | 'custom'
    lucideIconName?: string    // Lucideアイコン名
    customIconUrl?: string     // カスタムアイコンURL
    sortOrder: number
  }[]
}

// link-list セクションのdata構造
export interface LinkListData {
  items: {
    id: string
    url: string
    title: string
    description?: string       // 説明文（任意・最大50文字）
    iconType: 'lucide' | 'custom'
    lucideIconName?: string
    customIconUrl?: string
    sortOrder: number
  }[]
}

// character-profile セクションのdata構造
export interface CharacterProfileData {
  characterImageKey?: string        // キャラクター画像（9:16縦長）
  characterBackgroundKey?: string   // 背景画像（オプション）
  name: string                      // キャラクター名
  tagline?: string                  // キャッチコピー
  bio?: string                      // 自己紹介文
  badgeLeft?: string                // 左バッジ
  badgeRight?: string               // 右バッジ
  characterPosition: 'left' | 'right'  // キャラ画像位置
  showSocialLinks: boolean          // SNSリンク表示
  socialLinks?: {                   // SNSリンクリスト（showSocialLinks=trueの場合）
    id: string
    url: string
    platform: 'x' | 'youtube' | 'twitch' | 'discord' | 'github' | 'other'
    iconName?: string               // Lucide icon name (platform='other'の場合)
  }[]
}

// videos-profile セクションのdata構造
export interface VideosProfileData {
  title: string
  description?: string
}

// youtube-latest セクションのdata構造
export interface YouTubeLatestData {
  channelId: string
  rssFeedLimit: number
}

// youtube-recommended セクションのdata構造
export interface YouTubeRecommendedData {
  items: {
    id: string
    videoId: string
    title: string
    thumbnail: string
    sortOrder: number
  }[]
}

// niconico-recommended セクションのdata構造
export interface NiconicoRecommendedData {
  items: {
    id: string
    videoId: string
    title: string
    thumbnail: string
    sortOrder: number
  }[]
}

// themeSettings JSON構造
export interface ThemeSettings {
  // テーマプリセット
  themePreset: string // デフォルト: 'claymorphic'

  // フォント設定
  fontFamily: string // デフォルト: 'Inter'

  // 表示/非表示設定
  visibility: {
    banner: boolean // バナー画像（デフォルト: false）
    character: boolean // キャラクター画像（デフォルト: true）
    gameButton: boolean // ゲームボタン（デフォルト: false）
    snsButton: boolean // SNSシェアボタン（デフォルト: false）
    notification: boolean // 通知アイコン（デフォルト: false）
    newsPage: boolean // NEWSページ（デフォルト: true）
  }

  // 背景設定
  background?: BackgroundSettings

  // カラーカスタマイズ
  headerColor?: string     // ヘッダー背景色（null = テーマデフォルト）
  headerTextColor?: string // ヘッダー文字色（null = テーマデフォルト）
  accentColor?: string     // アクセント色（null = テーマデフォルト）

  // ネームカード設定
  namecard?: {
    type: 'preset' | 'color' | 'image'
    color?: string     // type='color'の場合: HEXカラーコード
    imageKey?: string  // type='preset'/'image'の場合: MediaFile.storageKey
    textColor?: string // 文字色（未設定時はテーマデフォルト）
  }

  // 上級者向けカスタマイズ
  customOverrides?: Record<string, string>
}

// デフォルトのテーマ設定
export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  themePreset: 'claymorphic',
  fontFamily: 'Inter',
  visibility: {
    banner: false,
    character: true,
    gameButton: true,
    snsButton: true,
    notification: true,
    newsPage: true,
  },
}

// =============================================================================
// エディタモーダルの共通インターフェース
// =============================================================================

/**
 * 全エディタモーダルの共通props
 * @template T - セクション固有のデータ型
 */
export interface BaseSectionEditorProps<T = unknown> {
  /** モーダルの開閉状態 */
  isOpen: boolean
  /** 閉じるハンドラ */
  onClose: () => void
  /** セクションID */
  sectionId: string
  /** セクション固有のデータ */
  currentData: T
  /** セクションタイトル（オプショナル） */
  currentTitle?: string
}

// 各エディタの具体的な型定義
export type ProfileCardEditModalProps = BaseSectionEditorProps<ProfileCardData>
export type FAQEditModalProps = BaseSectionEditorProps<FAQData>
export type LinksEditModalProps = BaseSectionEditorProps<LinksData>
export type IconLinksEditModalProps = BaseSectionEditorProps<IconLinksData>
export type LinkListEditModalProps = BaseSectionEditorProps<LinkListData>
export type HeaderEditModalProps = BaseSectionEditorProps<HeaderData>
export type LongTextEditModalProps = BaseSectionEditorProps<LongTextData>
export type BarGraphEditModalProps = BaseSectionEditorProps<BarGraphData>
export type YoutubeSectionModalProps = BaseSectionEditorProps<YoutubeSectionData>
export type WeeklyScheduleEditModalProps = BaseSectionEditorProps<WeeklyScheduleData>
export type TimelineEditModalProps = BaseSectionEditorProps<TimelineData>
export type VideoGallerySectionModalProps = BaseSectionEditorProps<VideoGallerySectionData>
export type CircularStatEditModalProps = BaseSectionEditorProps<CircularStatData>
export type ImageHeroEditModalProps = BaseSectionEditorProps<ImageHeroData>
export type ImageGrid2EditModalProps = BaseSectionEditorProps<ImageGrid2Data>
export type ImageGrid3EditModalProps = BaseSectionEditorProps<ImageGrid3Data>
export type CharacterProfileEditModalProps = BaseSectionEditorProps<CharacterProfileData>
export type VideosProfileEditModalProps = BaseSectionEditorProps<VideosProfileData>
export type YouTubeLatestEditModalProps = BaseSectionEditorProps<YouTubeLatestData>
export type YouTubeRecommendedEditModalProps = BaseSectionEditorProps<YouTubeRecommendedData>
export type NiconicoRecommendedEditModalProps = BaseSectionEditorProps<NiconicoRecommendedData>
