import type { PartWithSpecs, CompatibilityIssue } from '../types'
import { getString, getStringArray } from '../spec-accessors'

/**
 * マザーボード ↔ ケース フォームファクタ一致チェック
 */
export function checkMotherboardCase(parts: PartWithSpecs[]): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = []
  const motherboard = parts.find((p) => p.partType === 'MOTHERBOARD')
  const pcCase = parts.find((p) => p.partType === 'CASE')

  if (!motherboard || !pcCase) return issues

  const mbFormFactor = getString(motherboard.specs, 'formFactor')?.toUpperCase()
  const caseFormFactors = getStringArray(pcCase.specs, 'formFactor')?.map((s) => s.toUpperCase())

  if (mbFormFactor && caseFormFactors && caseFormFactors.length > 0) {
    if (!caseFormFactors.includes(mbFormFactor)) {
      issues.push({
        severity: 'error',
        message: `マザーボードのフォームファクタ(${mbFormFactor})がケースの対応フォームファクタ(${caseFormFactors.join(', ')})に含まれていません`,
        parts: ['MOTHERBOARD', 'CASE'],
        rule: 'motherboard-case-formfactor',
      })
    }
  }

  return issues
}
