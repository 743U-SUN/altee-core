import type { PartWithSpecs, CompatibilityIssue } from '../types'
import { getNumber } from '../spec-accessors'

const PSU_MINIMUM_HEADROOM_RATIO = 1.2
const PSU_RECOMMENDED_HEADROOM_RATIO = 1.5

/**
 * PSU容量 vs 合計TDPチェック
 */
export function checkPsuWattage(parts: PartWithSpecs[]): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = []
  const psu = parts.find((p) => p.partType === 'PSU')

  if (!psu) return issues

  const psuWattage = getNumber(psu.specs, 'wattage')
  if (!psuWattage) return issues

  // TDP未設定パーツの警告（CPU/GPUのみ対象）
  const powerParts = parts.filter((p) => ['CPU', 'GPU'].includes(p.partType))
  const missingTdpParts = powerParts.filter((p) => p.tdp == null)

  if (missingTdpParts.length > 0) {
    issues.push({
      severity: 'info',
      message: `${missingTdpParts.map((p) => p.name).join(', ')}のTDP情報がないため、電力計算が不正確な可能性があります`,
      parts: missingTdpParts.map((p) => p.partType),
      rule: 'psu-missing-tdp',
    })
  }

  // 全パーツのTDPを合計
  const totalTdp = parts.reduce((sum, part) => {
    return sum + (part.tdp ?? 0)
  }, 0)

  if (totalTdp === 0) return issues // TDP情報なし

  // GPU推奨PSUとの比較
  const gpu = parts.find((p) => p.partType === 'GPU')
  const gpuRecommendedPsu = gpu ? getNumber(gpu.specs, 'recommendedPsu') : undefined

  if (gpuRecommendedPsu && psuWattage < gpuRecommendedPsu) {
    issues.push({
      severity: 'warning',
      message: `PSU容量(${psuWattage}W)がGPUの推奨PSU容量(${gpuRecommendedPsu}W)を下回っています`,
      parts: ['PSU', 'GPU'],
      rule: 'psu-gpu-recommended',
    })
  }

  // 合計TDP vs PSU容量
  if (psuWattage < totalTdp) {
    issues.push({
      severity: 'error',
      message: `PSU容量(${psuWattage}W)が全パーツの合計TDP(${totalTdp}W)を下回っています`,
      parts: ['PSU'],
      rule: 'psu-total-tdp',
    })
  } else if (psuWattage < totalTdp * PSU_MINIMUM_HEADROOM_RATIO) {
    issues.push({
      severity: 'warning',
      message: `PSU容量(${psuWattage}W)が合計TDP(${totalTdp}W)に対して余裕が少ない可能性があります（推奨: ${Math.ceil(totalTdp * PSU_RECOMMENDED_HEADROOM_RATIO)}W以上）`,
      parts: ['PSU'],
      rule: 'psu-headroom',
    })
  }

  return issues
}
