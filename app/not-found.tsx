'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="max-w-md w-full space-y-8 text-center">
                {/* 404アイコン */}
                <div className="space-y-2">
                    <h1 className="text-8xl font-bold text-primary">404</h1>
                    <h2 className="text-2xl font-semibold text-foreground">
                        ページが見つかりません
                    </h2>
                </div>

                {/* 説明文 */}
                <p className="text-muted-foreground">
                    お探しのページは存在しないか、移動または削除された可能性があります。
                </p>

                {/* アクションボタン */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={() => window.history.back()}
                        variant="outline"
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        前のページへ戻る
                    </Button>

                    <Link href="/">
                        <Button className="gap-2 w-full sm:w-auto">
                            <Home className="h-4 w-4" />
                            ホームへ移動
                        </Button>
                    </Link>
                </div>

                {/* 追加情報 */}
                <div className="pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                        問題が解決しない場合は、お問い合わせください。
                    </p>
                </div>
            </div>
        </div>
    )
}
