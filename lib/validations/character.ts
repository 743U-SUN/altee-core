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
  iconImageKey: z.string().nullish(),
  characterName: z.string().max(30, "キャラクターネームは30文字以内で入力してください").nullish(),
  nameReading: z.string().max(50, "読み方は50文字以内で入力してください").nullish(),
  gender: z.enum(["male", "female", "unknown", "other"]).nullish(),
  // VTuber の誕生日は架空設定（2/30、13月生まれなど）が存在するため、
  // 月と日の組み合わせの整合性チェックは意図的に行わない。
  birthdayMonth: z.number().int().min(1).max(12).nullish(),
  birthdayDay: z.number().int().min(1).max(31).nullish(),
  species: z.string().max(30, "種族は30文字以内で入力してください").nullish(),
  element: z.string().max(30, "属性は30文字以内で入力してください").nullish(),
  debutDate: z.string().nullish(), // ISO string
  fanName: z.string().max(30, "ファンネームは30文字以内で入力してください").nullish(),
  fanMark: z.string().max(10, "推しマークは10文字以内で入力してください").nullish(),
  illustrator: z.string().max(50, "ママは50文字以内で入力してください").nullish(),
  modeler: z.string().max(50, "パパは50文字以内で入力してください").nullish(),
  affiliationType: z.enum(["individual", "agency"]).nullish(),
  affiliation: z.string().max(50, "所属名は50文字以内で入力してください").nullish(),
})

export type BasicInfoInput = z.infer<typeof basicInfoSchema>

const safeUrlSchema = z.string()
  .url("URLの形式が正しくありません")
  .refine(val => /^https?:\/\//.test(val), { message: "URLはhttp://またはhttps://で始まる必要があります" })

const platformAccountSchema = z.object({
  platform: z.enum(PLATFORM_OPTIONS.map((o) => o.value) as [string, ...string[]]),
  url: safeUrlSchema.nullish().or(z.literal("")),
  isActive: z.boolean(),
})

export const activitySettingsSchema = z.object({
  platformAccounts: z.array(platformAccountSchema).max(11),
  streamingStyles: z.array(z.string().max(100)).max(20),
  streamingTimezones: z.array(z.string().max(20)).max(10),
  streamingFrequency: z.enum(["daily", "4-6", "2-3", "weekly", "irregular"]).nullish(),
  languages: z.array(z.string().max(20)).max(10),
  activityStatus: z.enum(["active", "hiatus", "retired"]).nullish(),
})

export type ActivitySettingsInput = z.infer<typeof activitySettingsSchema>

export const gameSettingsSchema = z.object({
  gamePlatforms: z.array(z.string().max(50)).max(10),
  gameGenres: z.array(z.string().max(50)).max(20),
  nowPlaying: z.string().max(100, "今プレイ中のゲームは100文字以内で入力してください").nullish(),
})

export type GameSettingsInput = z.infer<typeof gameSettingsSchema>

export const collabSettingsSchema = z.object({
  collabStatus: z.enum(["open", "same_gender", "closed"]).nullish(),
  collabComment: z.string().max(500, "コラボコメントは500文字以内で入力してください").nullish(),
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
    gender: (data?.gender ?? null) as BasicInfoInput["gender"],
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
    affiliationType: (data?.affiliationType ?? null) as BasicInfoInput["affiliationType"],
    affiliation: data?.affiliation ?? null,
  }
}
