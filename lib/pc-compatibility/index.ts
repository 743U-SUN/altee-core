import type { PartWithSpecs, CompatibilityResult } from './types'
import { checkCpuMotherboard } from './rules/cpu-motherboard'
import { checkRamMotherboard } from './rules/ram-motherboard'
import { checkGpuCase } from './rules/gpu-case'
import { checkCoolerCpu } from './rules/cooler-cpu'
import { checkCoolerCase } from './rules/cooler-case'
import { checkMotherboardCase } from './rules/motherboard-case'
import { checkPsuWattage } from './rules/psu-wattage'

/**
 * ビルド内パーツの相性を一括チェック
 * スペック情報がないパーツはスキップされる
 */
export function checkBuildCompatibility(parts: PartWithSpecs[]): CompatibilityResult {
  const allIssues = [
    ...checkCpuMotherboard(parts),
    ...checkRamMotherboard(parts),
    ...checkGpuCase(parts),
    ...checkCoolerCpu(parts),
    ...checkCoolerCase(parts),
    ...checkMotherboardCase(parts),
    ...checkPsuWattage(parts),
  ]

  return {
    compatible: !allIssues.some((i) => i.severity === 'error'),
    issues: allIssues,
  }
}

export type { PartWithSpecs, CompatibilityResult, CompatibilityIssue, IssueSeverity } from './types'
