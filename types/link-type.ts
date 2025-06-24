// リンクタイプ関連の型定義

export interface LinkTypeIcon {
  id: string
  linkTypeId: string
  iconKey: string
  iconName: string
  isDefault: boolean
  sortOrder: number
  createdAt: Date | string
  updatedAt: Date | string
}

export interface LinkType {
  id: string
  name: string
  displayName: string
  urlPattern?: string | null
  isCustom: boolean
  isActive: boolean
  sortOrder: number
  createdAt: Date | string
  updatedAt: Date | string
  icons?: LinkTypeIcon[] // 複数アイコンオプション
  _count?: {
    userLinks: number
  }
}

// 作成・更新用の型
export interface CreateLinkTypeIconData {
  iconKey: string
  iconName: string
  isDefault?: boolean
  sortOrder?: number
}

export interface UpdateLinkTypeIconData {
  iconName?: string
  isDefault?: boolean
  sortOrder?: number
}

// APIレスポンス用の型
export interface LinkTypeIconApiResponse {
  success: boolean
  icon?: LinkTypeIcon
  error?: string
}

export interface LinkTypeIconsApiResponse {
  success: boolean
  icons?: LinkTypeIcon[]
  error?: string
}

// ユーザーリンク関連の型定義
export interface UserLink {
  id: string
  userId: string
  linkTypeId: string
  url: string
  customLabel: string | null
  customIconId: string | null
  selectedLinkTypeIconId?: string | null
  sortOrder: number
  isVisible: boolean
  createdAt: Date | string
  updatedAt: Date | string
  linkType: LinkType & {
    icons?: LinkTypeIcon[]
  }
  selectedLinkTypeIcon?: LinkTypeIcon | null
  customIcon: {
    id: string
    storageKey: string
    containerName: string
    originalName: string
    fileName: string
    fileSize: number
    mimeType: string
    uploadType: string
    uploaderId: string
    createdAt: Date | string
    updatedAt: Date | string
    deletedAt: Date | string | null
    deletedBy: string | null
    scheduledDeletionAt: Date | string | null
    description: string | null
    altText: string | null
    tags: unknown // JsonValue
  } | null
}