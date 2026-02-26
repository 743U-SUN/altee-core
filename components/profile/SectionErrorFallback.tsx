import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { getSectionDefinition } from '@/lib/sections/registry'

interface SectionErrorFallbackProps {
  sectionType: string
  error: Error
  onRetry: () => void
}

/**
 * セクションエラー時のフォールバック表示
 * SectionBand 内で使用（幅制御はSectionBandが担当）
 */
export function SectionErrorFallback({
  sectionType,
  error,
  onRetry,
}: SectionErrorFallbackProps) {
  const definition = getSectionDefinition(sectionType)
  const sectionLabel = definition?.label || sectionType

  return (
    <div className="w-full">
      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <h3 className="text-sm font-medium text-destructive mb-1">
          {sectionLabel}の読み込みに失敗しました
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          しばらく経ってからもう一度お試しください
        </p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          再読み込み
        </Button>

        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 text-xs text-left bg-muted p-2 rounded overflow-auto max-h-32">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        )}
      </div>
    </div>
  )
}
