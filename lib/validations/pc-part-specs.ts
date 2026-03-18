import { z } from 'zod'

// ===== カテゴリ別 specs JSON スキーマ =====

export const cpuSpecsSchema = z.object({
  socket: z.string().min(1, 'ソケットは必須です'), // "AM5", "LGA1700"
  cores: z.number().int().positive().optional(),
  threads: z.number().int().positive().optional(),
  baseClock: z.number().positive().optional(), // GHz
  boostClock: z.number().positive().optional(), // GHz
  memoryType: z.array(z.string()).optional(), // ["DDR5", "DDR4"]
  integratedGraphics: z.string().optional(), // "Intel UHD 770" or null
})

export const gpuSpecsSchema = z.object({
  chipName: z.string().min(1, 'チップ名は必須です'), // "RTX 4090"
  vram: z.number().int().positive().optional(), // GB
  vramType: z.string().optional(), // "GDDR6X"
  lengthMm: z.number().int().positive().optional(), // mm
  slots: z.number().positive().optional(), // 2.5, 3 etc
  powerConnectors: z.string().optional(), // "1x 16-pin"
  recommendedPsu: z.number().int().positive().optional(), // W
})

export const motherboardSpecsSchema = z.object({
  socket: z.string().min(1, 'ソケットは必須です'),
  chipset: z.string().optional(), // "Z790", "B650"
  formFactor: z.string().min(1, 'フォームファクタは必須です'), // "ATX", "mATX", "ITX"
  memoryType: z.string().optional(), // "DDR5"
  memorySlots: z.number().int().positive().optional(),
  maxMemoryGb: z.number().int().positive().optional(),
  m2Slots: z.number().int().nonnegative().optional(),
})

export const ramSpecsSchema = z.object({
  memoryType: z.string().min(1, 'メモリタイプは必須です'), // "DDR5"
  capacityGb: z.number().int().positive().optional(), // 1枚あたり
  modules: z.number().int().positive().optional(), // 枚数
  speed: z.number().int().positive().optional(), // MHz
  latency: z.string().optional(), // "CL36"
})

export const storageSpecsSchema = z.object({
  storageType: z.string().min(1, 'ストレージタイプは必須です'), // "NVMe SSD", "SATA SSD", "HDD"
  capacityGb: z.number().int().positive().optional(),
  interface: z.string().optional(), // "PCIe 4.0 x4", "SATA III"
  formFactor: z.string().optional(), // "M.2 2280", "2.5inch"
  readSpeed: z.number().int().positive().optional(), // MB/s
  writeSpeed: z.number().int().positive().optional(), // MB/s
})

export const psuSpecsSchema = z.object({
  wattage: z.number().int().positive('ワット数は必須です'), // W
  efficiency: z.string().optional(), // "80 PLUS Gold"
  modularity: z.string().optional(), // "フルモジュラー", "セミモジュラー", "非モジュラー"
  formFactor: z.string().optional(), // "ATX", "SFX"
})

export const caseSpecsSchema = z.object({
  formFactor: z.array(z.string()).min(1, 'フォームファクタは必須です'), // ["ATX", "mATX", "ITX"]
  maxGpuLengthMm: z.number().int().positive().optional(),
  maxCoolerHeightMm: z.number().int().positive().optional(),
})

export const coolerSpecsSchema = z.object({
  coolerType: z.string().min(1, 'クーラータイプは必須です'), // "空冷", "簡易水冷", "本格水冷"
  sockets: z.array(z.string()).optional(), // ["AM5", "LGA1700"]
  heightMm: z.number().int().positive().optional(), // 空冷時の高さ
  radiatorSize: z.number().int().positive().optional(), // 水冷時のラジエーターサイズ (mm): 120, 240, 360
})

// その他（自由入力）
export const otherSpecsSchema = z.object({
  description: z.string().optional(),
})

// ===== Discriminated Union =====

export const pcPartSpecsByType = {
  CPU: cpuSpecsSchema,
  GPU: gpuSpecsSchema,
  MOTHERBOARD: motherboardSpecsSchema,
  RAM: ramSpecsSchema,
  STORAGE: storageSpecsSchema,
  PSU: psuSpecsSchema,
  CASE: caseSpecsSchema,
  COOLER: coolerSpecsSchema,
  OTHER: otherSpecsSchema,
} as const

export type PcPartSpecsByType = {
  CPU: z.infer<typeof cpuSpecsSchema>
  GPU: z.infer<typeof gpuSpecsSchema>
  MOTHERBOARD: z.infer<typeof motherboardSpecsSchema>
  RAM: z.infer<typeof ramSpecsSchema>
  STORAGE: z.infer<typeof storageSpecsSchema>
  PSU: z.infer<typeof psuSpecsSchema>
  CASE: z.infer<typeof caseSpecsSchema>
  COOLER: z.infer<typeof coolerSpecsSchema>
  OTHER: z.infer<typeof otherSpecsSchema>
}

// ===== PcPartSpec 入力バリデーション =====

export const pcPartSpecInputSchema = z.object({
  partType: z.enum(['CPU', 'GPU', 'MOTHERBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLER', 'OTHER']),
  chipMakerId: z.string().optional().nullable(),
  tdp: z.number().int().nonnegative().optional().nullable(),
  releaseDate: z.string().optional().nullable(), // ISO date string
  specs: z.record(z.unknown()), // 実際のバリデーションは partType に応じて動的に行う
})

export type PcPartSpecInput = z.infer<typeof pcPartSpecInputSchema>

/**
 * partType に応じた specs のバリデーション
 */
export function validateSpecs(partType: keyof typeof pcPartSpecsByType, specs: unknown) {
  const schema = pcPartSpecsByType[partType]
  return schema.safeParse(specs)
}

// ===== UI用のフィールド定義 =====

interface SpecFieldDef {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'multi-text'
  placeholder?: string
  options?: { value: string; label: string }[]
  required?: boolean
  unit?: string
}

import type { PcPartType } from '@prisma/client'

export const specFieldsByType: Record<PcPartType, SpecFieldDef[]> = {
  // --- プロセッサ系 ---
  CPU: [
    { key: 'socket', label: 'ソケット', type: 'text', placeholder: 'AM5, LGA1700', required: true },
    { key: 'cores', label: 'コア数', type: 'number', placeholder: '16' },
    { key: 'threads', label: 'スレッド数', type: 'number', placeholder: '32' },
    { key: 'baseClock', label: 'ベースクロック', type: 'number', placeholder: '3.4', unit: 'GHz' },
    { key: 'boostClock', label: 'ブーストクロック', type: 'number', placeholder: '5.7', unit: 'GHz' },
    { key: 'memoryType', label: '対応メモリ', type: 'multi-text', placeholder: 'DDR5, DDR4' },
    { key: 'integratedGraphics', label: '内蔵GPU', type: 'text', placeholder: 'Intel UHD 770' },
  ],
  // --- グラフィックス ---
  GPU: [
    { key: 'chipName', label: 'チップ名', type: 'text', placeholder: 'RTX 4090', required: true },
    { key: 'vram', label: 'VRAM', type: 'number', placeholder: '24', unit: 'GB' },
    { key: 'vramType', label: 'VRAMタイプ', type: 'text', placeholder: 'GDDR6X' },
    { key: 'lengthMm', label: '長さ', type: 'number', placeholder: '336', unit: 'mm' },
    { key: 'slots', label: 'スロット数', type: 'number', placeholder: '3' },
    { key: 'powerConnectors', label: '電源コネクタ', type: 'text', placeholder: '1x 16-pin' },
    { key: 'recommendedPsu', label: '推奨PSU容量', type: 'number', placeholder: '850', unit: 'W' },
  ],
  // --- ボード・メモリ・ストレージ ---
  MOTHERBOARD: [
    { key: 'socket', label: 'ソケット', type: 'text', placeholder: 'AM5, LGA1700', required: true },
    { key: 'chipset', label: 'チップセット', type: 'text', placeholder: 'Z790, B650' },
    { key: 'formFactor', label: 'フォームファクタ', type: 'select', required: true, options: [
      { value: 'ATX', label: 'ATX' },
      { value: 'Micro-ATX', label: 'Micro-ATX' },
      { value: 'Mini-ITX', label: 'Mini-ITX' },
      { value: 'E-ATX', label: 'E-ATX' },
    ] },
    { key: 'memoryType', label: 'メモリタイプ', type: 'text', placeholder: 'DDR5' },
    { key: 'memorySlots', label: 'メモリスロット数', type: 'number', placeholder: '4' },
    { key: 'maxMemoryGb', label: '最大メモリ', type: 'number', placeholder: '128', unit: 'GB' },
    { key: 'm2Slots', label: 'M.2スロット数', type: 'number', placeholder: '4' },
  ],
  RAM: [
    { key: 'memoryType', label: 'メモリタイプ', type: 'text', placeholder: 'DDR5', required: true },
    { key: 'capacityGb', label: '容量（1枚）', type: 'number', placeholder: '16', unit: 'GB' },
    { key: 'modules', label: '枚数', type: 'number', placeholder: '2' },
    { key: 'speed', label: '速度', type: 'number', placeholder: '6000', unit: 'MHz' },
    { key: 'latency', label: 'レイテンシ', type: 'text', placeholder: 'CL36' },
  ],
  STORAGE: [
    { key: 'storageType', label: 'ストレージタイプ', type: 'select', required: true, options: [
      { value: 'NVMe SSD', label: 'NVMe SSD' },
      { value: 'SATA SSD', label: 'SATA SSD' },
      { value: 'HDD', label: 'HDD' },
    ] },
    { key: 'capacityGb', label: '容量', type: 'number', placeholder: '1000', unit: 'GB' },
    { key: 'interface', label: 'インターフェース', type: 'text', placeholder: 'PCIe 4.0 x4' },
    { key: 'formFactor', label: 'フォームファクタ', type: 'text', placeholder: 'M.2 2280' },
    { key: 'readSpeed', label: '読込速度', type: 'number', placeholder: '7000', unit: 'MB/s' },
    { key: 'writeSpeed', label: '書込速度', type: 'number', placeholder: '5500', unit: 'MB/s' },
  ],
  // --- 電源・ケース・冷却 ---
  PSU: [
    { key: 'wattage', label: 'ワット数', type: 'number', placeholder: '850', unit: 'W', required: true },
    { key: 'efficiency', label: '変換効率', type: 'select', options: [
      { value: '80 PLUS', label: '80 PLUS' },
      { value: '80 PLUS Bronze', label: '80 PLUS Bronze' },
      { value: '80 PLUS Silver', label: '80 PLUS Silver' },
      { value: '80 PLUS Gold', label: '80 PLUS Gold' },
      { value: '80 PLUS Platinum', label: '80 PLUS Platinum' },
      { value: '80 PLUS Titanium', label: '80 PLUS Titanium' },
    ] },
    { key: 'modularity', label: 'モジュラー', type: 'select', options: [
      { value: 'フルモジュラー', label: 'フルモジュラー' },
      { value: 'セミモジュラー', label: 'セミモジュラー' },
      { value: '非モジュラー', label: '非モジュラー' },
    ] },
    { key: 'formFactor', label: 'フォームファクタ', type: 'select', options: [
      { value: 'ATX', label: 'ATX' },
      { value: 'SFX', label: 'SFX' },
      { value: 'SFX-L', label: 'SFX-L' },
    ] },
  ],
  CASE: [
    { key: 'formFactor', label: '対応フォームファクタ', type: 'multi-text', placeholder: 'ATX, mATX, ITX', required: true },
    { key: 'maxGpuLengthMm', label: '最大GPU長', type: 'number', placeholder: '400', unit: 'mm' },
    { key: 'maxCoolerHeightMm', label: '最大クーラー高', type: 'number', placeholder: '170', unit: 'mm' },
  ],
  COOLER: [
    { key: 'coolerType', label: 'クーラータイプ', type: 'select', required: true, options: [
      { value: '空冷', label: '空冷' },
      { value: '簡易水冷', label: '簡易水冷' },
      { value: '本格水冷', label: '本格水冷' },
    ] },
    { key: 'sockets', label: '対応ソケット', type: 'multi-text', placeholder: 'AM5, LGA1700' },
    { key: 'heightMm', label: '高さ（空冷時）', type: 'number', placeholder: '158', unit: 'mm' },
    { key: 'radiatorSize', label: 'ラジエーターサイズ（水冷時）', type: 'number', placeholder: '360', unit: 'mm' },
  ],
  // --- その他 ---
  OTHER: [
    { key: 'description', label: '説明', type: 'text', placeholder: '自由入力' },
  ],
}
