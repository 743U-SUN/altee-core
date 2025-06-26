// ユーザーデータ関連の型定義

/**
 * ユーザーデータ
 */
export interface UserData {
  id: string
  userId: string
  icon: string          // Lucideアイコン名
  field: string         // 項目名（例: "身長", "体重", "好きなもの"）
  value: string         // 値（例: "175cm", "65kg", "読書"）
  sortOrder: number     // 表示順序
  isVisible: boolean    // 表示/非表示
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * ユーザーデータ作成用の型
 */
export interface CreateUserDataInput {
  icon: string
  field: string
  value: string
  isVisible?: boolean
}

/**
 * ユーザーデータ更新用の型
 */
export interface UpdateUserDataInput {
  icon?: string
  field?: string
  value?: string
  isVisible?: boolean
}

/**
 * APIレスポンス用の型
 */
export interface UserDataApiResponse {
  success: boolean
  data?: UserData
  error?: string
}

export interface UserDataListApiResponse {
  success: boolean
  data?: UserData[]
  error?: string
}

/**
 * 並び替え用の型
 */
export interface ReorderUserDataInput {
  dataIds: string[]
}

/**
 * よく使用されるLucideアイコンのプリセット
 */
export const COMMON_ICONS = [
  // 人物・プロフィール
  { name: "User", label: "ユーザー" },
  { name: "Users", label: "グループ" },
  { name: "UserCheck", label: "認証済みユーザー" },
  { name: "Crown", label: "王冠" },
  
  // 身体・健康
  { name: "Activity", label: "活動" },
  { name: "Heart", label: "ハート" },
  { name: "Zap", label: "エネルギー" },
  { name: "Scale", label: "体重計" },
  
  // 評価・お気に入り
  { name: "Star", label: "星" },
  { name: "ThumbsUp", label: "いいね" },
  { name: "Award", label: "賞" },
  { name: "Medal", label: "メダル" },
  
  // 趣味・興味
  { name: "Book", label: "本" },
  { name: "Music", label: "音楽" },
  { name: "Camera", label: "カメラ" },
  { name: "Gamepad2", label: "ゲーム" },
  { name: "Palette", label: "アート" },
  { name: "Coffee", label: "コーヒー" },
  { name: "Utensils", label: "料理" },
  
  // スポーツ・運動
  { name: "Dumbbell", label: "ダンベル" },
  { name: "Bike", label: "自転車" },
  { name: "Mountain", label: "山" },
  { name: "Waves", label: "波" },
  
  // 場所・移動
  { name: "Home", label: "家" },
  { name: "MapPin", label: "場所" },
  { name: "Car", label: "車" },
  { name: "Plane", label: "飛行機" },
  
  // 時間・スケジュール
  { name: "Calendar", label: "カレンダー" },
  { name: "Clock", label: "時計" },
  { name: "Sun", label: "太陽" },
  { name: "Moon", label: "月" },
  
  // コミュニケーション
  { name: "Mail", label: "メール" },
  { name: "Phone", label: "電話" },
  { name: "MessageCircle", label: "メッセージ" },
  { name: "Globe", label: "地球" },
  
  // 仕事・学習
  { name: "Briefcase", label: "仕事" },
  { name: "GraduationCap", label: "卒業帽" },
  { name: "Code", label: "コード" },
  { name: "Laptop", label: "ノートPC" },
  
  // その他
  { name: "Gift", label: "ギフト" },
  { name: "Tag", label: "タグ" },
  { name: "Flag", label: "フラグ" },
  { name: "Target", label: "ターゲット" },
] as const

/**
 * アイコン名の型
 */
export type IconName = typeof COMMON_ICONS[number]['name']