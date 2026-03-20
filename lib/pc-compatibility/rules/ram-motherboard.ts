import type { PartWithSpecs, CompatibilityIssue } from '../types'
import { getString, getNumber } from '../spec-accessors'

/**
 * RAM ↔ マザーボード DDR規格・スロット数チェック
 */
export function checkRamMotherboard(parts: PartWithSpecs[]): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = []
  const ramParts = parts.filter((p) => p.partType === 'RAM')
  const motherboard = parts.find((p) => p.partType === 'MOTHERBOARD')

  if (ramParts.length === 0 || !motherboard) return issues

  const mbMemoryType = getString(motherboard.specs, 'memoryType')?.toUpperCase()
  const mbMemorySlots = getNumber(motherboard.specs, 'memorySlots')

  // DDR規格チェック
  for (const ram of ramParts) {
    const ramMemoryType = getString(ram.specs, 'memoryType')?.toUpperCase()
    if (ramMemoryType && mbMemoryType && ramMemoryType !== mbMemoryType) {
      issues.push({
        severity: 'error',
        message: `RAM(${ramMemoryType})とマザーボードの対応メモリ(${mbMemoryType})が一致しません: ${ram.name}`,
        parts: ['RAM', 'MOTHERBOARD'],
        rule: 'ram-motherboard-type',
      })
    }
  }

  // スロット数チェック
  const totalModules = ramParts.reduce((sum, ram) => {
    const modules = getNumber(ram.specs, 'modules')
    return sum + (modules ?? 1)
  }, 0)

  if (mbMemorySlots && totalModules > mbMemorySlots) {
    issues.push({
      severity: 'error',
      message: `RAMモジュール数(${totalModules}枚)がマザーボードのスロット数(${mbMemorySlots})を超えています`,
      parts: ['RAM', 'MOTHERBOARD'],
      rule: 'ram-motherboard-slots',
    })
  }

  return issues
}
