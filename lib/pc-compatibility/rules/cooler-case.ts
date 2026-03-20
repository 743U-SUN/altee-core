import type { PartWithSpecs, CompatibilityIssue } from '../types'
import { getNumber } from '../spec-accessors'

/**
 * クーラー高さ ↔ ケース許容高さチェック
 */
export function checkCoolerCase(parts: PartWithSpecs[]): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = []
  const cooler = parts.find((p) => p.partType === 'COOLER')
  const pcCase = parts.find((p) => p.partType === 'CASE')

  if (!cooler || !pcCase) return issues

  const coolerHeight = getNumber(cooler.specs, 'heightMm')
  const maxCoolerHeight = getNumber(pcCase.specs, 'maxCoolerHeightMm')

  if (coolerHeight && maxCoolerHeight && coolerHeight > maxCoolerHeight) {
    issues.push({
      severity: 'error',
      message: `クーラーの高さ(${coolerHeight}mm)がケースの最大クーラー高(${maxCoolerHeight}mm)を超えています`,
      parts: ['COOLER', 'CASE'],
      rule: 'cooler-case-height',
    })
  }

  return issues
}
