import type { PartWithSpecs, CompatibilityIssue } from '../types'
import { getString, getStringArray } from '../spec-accessors'

/**
 * クーラー ↔ CPU ソケット互換チェック
 */
export function checkCoolerCpu(parts: PartWithSpecs[]): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = []
  const cpu = parts.find((p) => p.partType === 'CPU')
  const cooler = parts.find((p) => p.partType === 'COOLER')

  if (!cpu || !cooler) return issues

  const cpuSocket = getString(cpu.specs, 'socket')?.toUpperCase()
  const coolerSockets = getStringArray(cooler.specs, 'sockets')?.map((s) => s.toUpperCase())

  if (cpuSocket && coolerSockets && coolerSockets.length > 0) {
    if (!coolerSockets.includes(cpuSocket)) {
      issues.push({
        severity: 'error',
        message: `クーラーの対応ソケット(${coolerSockets.join(', ')})にCPUのソケット(${cpuSocket})が含まれていません`,
        parts: ['COOLER', 'CPU'],
        rule: 'cooler-cpu-socket',
      })
    }
  }

  return issues
}
