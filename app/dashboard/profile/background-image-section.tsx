import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function BackgroundImageSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>背景画像</CardTitle>
        <CardDescription>管理者が用意した背景画像から選択します</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-32 w-full rounded-lg bg-muted overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">背景画像選択機能は後で実装予定</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}