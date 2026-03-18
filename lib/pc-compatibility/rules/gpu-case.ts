import type { PartWithSpecs, CompatibilityIssue } from '../types'
import { getNumber } from '../spec-accessors'

/**
 * GPU長 ↔ ケース許容長チェック
 */
export function checkGpuCase(parts: PartWithSpecs[]): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = []
  const gpu = parts.find((p) => p.partType === 'GPU')
  const pcCase = parts.find((p) => p.partType === 'CASE')

  if (!gpu || !pcCase) return issues

  const gpuLength = getNumber(gpu.specs, 'lengthMm')
  const maxGpuLength = getNumber(pcCase.specs, 'maxGpuLengthMm')

  if (gpuLength && maxGpuLength && gpuLength > maxGpuLength) {
    issues.push({
      severity: 'error',
      message: `GPUの長さ(${gpuLength}mm)がケースの最大GPU長(${maxGpuLength}mm)を超えています`,
      parts: ['GPU', 'CASE'],
      rule: 'gpu-case-length',
    })
  }

  return issues
}
