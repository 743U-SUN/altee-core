'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import type { CompatibilityResult, PartWithSpecs } from '@/lib/pc-compatibility'
import type { GuestPcPart } from '@/hooks/useGuestPcBuild'

interface CompatibilityCheckCardProps {
  parts: GuestPcPart[]
}

export function CompatibilityCheckCard({ parts }: CompatibilityCheckCardProps) {
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null)
  const [prevPartsLength, setPrevPartsLength] = useState(parts.length)

  // パーツ数が変わったら互換性チェック結果をクリア
  if (parts.length !== prevPartsLength) {
    setPrevPartsLength(parts.length)
    setCompatibility(null)
  }

  const runCompatibilityCheck = async () => {
    const { checkBuildCompatibility } = await import('@/lib/pc-compatibility')

    const partsWithSpecs: PartWithSpecs[] = parts
      .filter((p) => p.specs)
      .map((p) => ({
        partType: p.partType,
        name: p.name,
        specs: p.specs as Record<string, unknown>,
        tdp: p.tdp,
      }))

    if (partsWithSpecs.length < 2) {
      // toast は親に任せず、結果をセットして表示する
      setCompatibility({
        compatible: true,
        issues: [{ severity: 'info', message: '互換性チェックにはスペック情報のあるパーツが2つ以上必要です', parts: [], rule: 'minimum-parts' }],
      })
      return
    }

    const result = checkBuildCompatibility(partsWithSpecs)
    setCompatibility(result)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">互換性チェック</CardTitle>
        <Button variant="outline" size="sm" onClick={runCompatibilityCheck}>
          チェック実行
        </Button>
      </CardHeader>
      {compatibility && (
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {compatibility.compatible ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-700">互換性に問題はありません</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-700">互換性の問題が見つかりました</span>
                </>
              )}
            </div>

            {compatibility.issues.length > 0 && (
              <div className="space-y-2">
                {compatibility.issues.map((issue, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                      issue.severity === 'error'
                        ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
                        : issue.severity === 'warning'
                          ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
                          : 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                    }`}
                  >
                    {issue.severity === 'error' ? (
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : issue.severity === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            )}

            {compatibility.issues.length === 0 && compatibility.compatible && (
              <p className="text-sm text-muted-foreground">
                スペック情報のあるパーツ同士の互換性を確認しました。
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
