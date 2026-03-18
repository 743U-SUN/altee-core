import type { PartWithSpecs, CompatibilityIssue } from '../types'
import { getString } from '../spec-accessors'

/**
 * CPU ↔ マザーボード ソケット一致チェック
 */
export function checkCpuMotherboard(parts: PartWithSpecs[]): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = []
  const cpu = parts.find((p) => p.partType === 'CPU')
  const motherboard = parts.find((p) => p.partType === 'MOTHERBOARD')

  if (!cpu || !motherboard) return issues

  const cpuSocket = getString(cpu.specs, 'socket')?.toUpperCase()
  const mbSocket = getString(motherboard.specs, 'socket')?.toUpperCase()

  if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
    issues.push({
      severity: 'error',
      message: `CPUのソケット(${cpuSocket})とマザーボードのソケット(${mbSocket})が一致しません`,
      parts: ['CPU', 'MOTHERBOARD'],
      rule: 'cpu-motherboard-socket',
    })
  }

  return issues
}
