/**
 * specs: Record<string, unknown> から型安全に値を取得するユーティリティ
 * 互換性ルールで unsafe な `as` キャストを排除するために使用
 */

export function getString(specs: Record<string, unknown>, key: string): string | undefined {
  const val = specs[key]
  return typeof val === 'string' ? val : undefined
}

export function getNumber(specs: Record<string, unknown>, key: string): number | undefined {
  const val = specs[key]
  return typeof val === 'number' ? val : undefined
}

export function getStringArray(specs: Record<string, unknown>, key: string): string[] | undefined {
  const val = specs[key]
  if (!Array.isArray(val)) return undefined
  return val.every((v) => typeof v === 'string') ? val : undefined
}
