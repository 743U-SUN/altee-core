'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="max-w-md w-full space-y-8 text-center">
                {/* エラーアイコン */}
                <div className="space-y-2">
                    <div className="flex justify-center">
                        <AlertCircle className="h-24 w-24 text-destructive" />
                    </div>
                    <h1 className="text-4xl font-bold text-foreground">
                        エラーが発生しました
                    </h1>
                    <h2 className="text-xl text-muted-foreground">
                        Something went wrong
                    </h2>
                </div>

                {/* エラーメッセージ */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="p-4 bg-muted rounded-md text-left">
                        <p className="text-sm font-mono text-destructive break-all">
                            {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                {/* アクションボタン */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={reset}
                        variant="default"
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        もう一度試す
                    </Button>

                    <Button
                        onClick={() => window.location.href = '/'}
                        variant="outline"
                        className="gap-2"
                    >
                        <Home className="h-4 w-4" />
                        ホームへ移動
                    </Button>
                </div>

                {/* 追加情報 */}
                <div className="pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                        問題が解決しない場合は、ページを再読み込みするか、お問い合わせください。
                    </p>
                </div>
            </div>
        </div>
    )
}
