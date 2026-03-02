import { z } from "zod"

// ===== 定数定義 =====

export const SPECIES_OPTIONS = [
  "人間", "悪魔", "天使", "エルフ", "獣人", "吸血鬼", "竜人", "妖精", "幽霊", "AI", "その他",
] as const

export const ELEMENT_OPTIONS = [
  "火", "水", "氷", "雷", "風", "地", "光", "闇", "無", "その他",
] as const

export const GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "unknown", label: "不明" },
  { value: "other", label: "その他" },
] as const

export const AFFILIATION_TYPE_OPTIONS = [
  { value: "individual", label: "個人" },
  { value: "agency", label: "事務所" },
] as const

export const STREAMING_STYLE_OPTIONS = [
  "ゲーム実況", "歌枠", "雑談", "ASMR", "お絵描き", "料理", "企画", "朗読", "ホラー", "凸待ち", "その他",
] as const

export const STREAMING_TIMEZONE_OPTIONS = [
  { value: "朝", label: "朝 (6-12時)" },
  { value: "昼", label: "昼 (12-17時)" },
  { value: "夕方", label: "夕方 (17-21時)" },
  { value: "夜", label: "夜 (21-25時)" },
  { value: "深夜", label: "深夜 (25-6時)" },
] as const

export const STREAMING_FREQUENCY_OPTIONS = [
  { value: "daily", label: "毎日" },
  { value: "4-6", label: "週4-6回" },
  { value: "2-3", label: "週2-3回" },
  { value: "weekly", label: "週1回" },
  { value: "irregular", label: "不定期" },
] as const

export const LANGUAGE_OPTIONS = [
  "日本語", "英語", "中国語", "韓国語", "スペイン語", "その他",
] as const

export const ACTIVITY_STATUS_OPTIONS = [
  { value: "active", label: "活動中" },
  { value: "hiatus", label: "休止中" },
  { value: "retired", label: "引退" },
] as const

export const GAME_PLATFORM_OPTIONS = [
  "PC", "PS5", "Switch", "XBOX", "スマホ", "その他",
] as const

export const GAME_GENRE_OPTIONS = [
  "RPG", "FPS", "TPS", "アクション", "MMORPG", "シミュレーション", "パズル", "音ゲー", "ホラー", "その他",
] as const

export const COLLAB_STATUS_OPTIONS = [
  { value: "open", label: "コラボ可" },
  { value: "same_gender", label: "同性とコラボ可" },
  { value: "closed", label: "今はNG" },
] as const

export const PLATFORM_OPTIONS = [
  { value: "youtube", label: "YouTube" },
  { value: "twitch", label: "Twitch" },
  { value: "niconico", label: "ニコニコ" },
  { value: "twicas", label: "ツイキャス" },
  { value: "showroom", label: "SHOWROOM" },
  { value: "iriam", label: "IRIAM" },
  { value: "reality", label: "REALITY" },
  { value: "17live", label: "17LIVE" },
  { value: "mildom", label: "ミルダム" },
  { value: "kick", label: "Kick" },
  { value: "other", label: "その他" },
] as const

// ===== Zod バリデーション =====

export const basicInfoSchema = z.object({
  iconImageKey: z.string().optional().nullable(),
  characterName: z.string().max(50, "キャラクターネームは50文字以内で入力してください").optional().nullable(),
  nameReading: z.string().max(50, "読み方は50文字以内で入力してください").optional().nullable(),
  gender: z.string().optional().nullable(),
  birthdayMonth: z.number().int().min(1).max(12).optional().nullable(),
  birthdayDay: z.number().int().min(1).max(31).optional().nullable(),
  species: z.string().max(30, "種族は30文字以内で入力してください").optional().nullable(),
  element: z.string().max(30, "属性は30文字以内で入力してください").optional().nullable(),
  debutDate: z.string().optional().nullable(), // ISO string
  fanName: z.string().max(30, "ファンネームは30文字以内で入力してください").optional().nullable(),
  fanMark: z.string().max(10, "推しマークは10文字以内で入力してください").optional().nullable(),
  illustrator: z.string().max(50, "ママは50文字以内で入力してください").optional().nullable(),
  modeler: z.string().max(50, "パパは50文字以内で入力してください").optional().nullable(),
  affiliationType: z.string().optional().nullable(),
  affiliation: z.string().max(50, "所属名は50文字以内で入力してください").optional().nullable(),
})

export type BasicInfoInput = z.infer<typeof basicInfoSchema>

const platformAccountSchema = z.object({
  platform: z.string(),
  url: z.string().optional().nullable(),
  isActive: z.boolean(),
})

export const activitySettingsSchema = z.object({
  platformAccounts: z.array(platformAccountSchema),
  streamingStyles: z.array(z.string()),
  streamingTimezones: z.array(z.string()),
  streamingFrequency: z.string().optional().nullable(),
  languages: z.array(z.string()),
  activityStatus: z.string().optional().nullable(),
})

export type ActivitySettingsInput = z.infer<typeof activitySettingsSchema>

export const gameSettingsSchema = z.object({
  gamePlatforms: z.array(z.string()),
  gameGenres: z.array(z.string()),
  nowPlaying: z.string().max(100, "今プレイ中のゲームは100文字以内で入力してください").optional().nullable(),
})

export type GameSettingsInput = z.infer<typeof gameSettingsSchema>

export const collabSettingsSchema = z.object({
  collabStatus: z.string().optional().nullable(),
  collabComment: z.string().max(500, "コラボコメントは500文字以内で入力してください").optional().nullable(),
})

export type CollabSettingsInput = z.infer<typeof collabSettingsSchema>

// ===== Prisma → Form defaultValues 変換 =====

/**
 * CharacterInfo (Prisma) → BasicInfoInput (Form) の変換
 * debutDate: Date → string (YYYY-MM-DD) の変換を行う
 */
export function toBasicInfoDefaults(data: {
  iconImageKey?: string | null
  characterName?: string | null
  nameReading?: string | null
  gender?: string | null
  birthdayMonth?: number | null
  birthdayDay?: number | null
  species?: string | null
  element?: string | null
  debutDate?: Date | null
  fanName?: string | null
  fanMark?: string | null
  illustrator?: string | null
  modeler?: string | null
  affiliationType?: string | null
  affiliation?: string | null
} | null): BasicInfoInput {
  return {
    iconImageKey: data?.iconImageKey ?? null,
    characterName: data?.characterName ?? null,
    nameReading: data?.nameReading ?? null,
    gender: data?.gender ?? null,
    birthdayMonth: data?.birthdayMonth ?? null,
    birthdayDay: data?.birthdayDay ?? null,
    species: data?.species ?? null,
    element: data?.element ?? null,
    debutDate: data?.debutDate
      ? new Date(data.debutDate).toISOString().split("T")[0]
      : null,
    fanName: data?.fanName ?? null,
    fanMark: data?.fanMark ?? null,
    illustrator: data?.illustrator ?? null,
    modeler: data?.modeler ?? null,
    affiliationType: data?.affiliationType ?? null,
    affiliation: data?.affiliation ?? null,
  }
}
