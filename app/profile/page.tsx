export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">最近の活動</h1>
        <p className="text-muted-foreground">田中 太郎さんの最新の投稿とアクティビティ</p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-card text-card-foreground p-4 rounded-lg border">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                T
              </div>
              <div>
                <p className="font-medium">新しい記事を投稿しました</p>
                <p className="text-sm text-muted-foreground">2時間前</p>
              </div>
            </div>
            <p className="text-sm">「Next.js 15の新機能について」という記事を公開しました。App Routerの最新アップデートについて詳しく解説しています。</p>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-4 rounded-lg border">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                T
              </div>
              <div>
                <p className="font-medium">プロフィールを更新しました</p>
                <p className="text-sm text-muted-foreground">1日前</p>
              </div>
            </div>
            <p className="text-sm">自己紹介とスキル情報を最新の状態に更新しました。</p>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-4 rounded-lg border">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                T
              </div>
              <div>
                <p className="font-medium">新しいフォロワー</p>
                <p className="text-sm text-muted-foreground">3日前</p>
              </div>
            </div>
            <p className="text-sm">5人の新しいユーザーがフォローを開始しました。</p>
          </div>
        </div>
      </div>

      <div className="bg-card text-card-foreground p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-3">人気の投稿</h2>
        <div className="space-y-3">
          <div className="p-3 bg-muted rounded-md">
            <h3 className="font-medium text-sm">React Server Componentsの基礎</h3>
            <p className="text-xs text-muted-foreground mt-1">125いいね • 23コメント</p>
          </div>
          <div className="p-3 bg-muted rounded-md">
            <h3 className="font-medium text-sm">TypeScriptの型安全性について</h3>
            <p className="text-xs text-muted-foreground mt-1">98いいね • 15コメント</p>
          </div>
        </div>
      </div>
    </div>
  )
}