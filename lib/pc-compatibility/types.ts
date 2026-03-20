import type { PcPartType } from '@prisma/client'

export type IssueSeverity = 'error' | 'warning' | 'info'

export interface CompatibilityIssue {
  severity: IssueSeverity
  message: string
  parts: PcPartType[] // 関連するパーツ種別
  rule: string // ルール名（デバッグ用）
}

export interface CompatibilityResult {
  compatible: boolean // error が0件ならtrue
  issues: CompatibilityIssue[]
}

export interface PartWithSpecs {
  partType: PcPartType
  name: string
  specs: Record<string, unknown>
  tdp?: number | null
}
