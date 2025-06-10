export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">プロフィール設定</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">個人情報</h2>
          <div className="bg-card text-card-foreground p-6 rounded-lg border">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">名前</label>
                <p className="text-muted-foreground">shadcn</p>
              </div>
              <div>
                <label className="text-sm font-medium">メールアドレス</label>
                <p className="text-muted-foreground">m@example.com</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">設定</h2>
          <div className="bg-card text-card-foreground p-6 rounded-lg border">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">言語設定</label>
                <p className="text-muted-foreground">日本語</p>
              </div>
              <div>
                <label className="text-sm font-medium">テーマ</label>
                <p className="text-muted-foreground">システム</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}