import { BaseLayout } from "@/components/layout/BaseLayout"

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const secondSidebarContent = (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">ユーザープロフィール</h2>
        <div className="space-y-4">
          <div className="bg-card text-card-foreground p-4 rounded-lg border">
            <h3 className="font-medium mb-2">基本情報</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">名前:</span>
                <span className="ml-2">田中 太郎</span>
              </div>
              <div>
                <span className="text-muted-foreground">ハンドル:</span>
                <span className="ml-2">@tanaka_taro</span>
              </div>
              <div>
                <span className="text-muted-foreground">登録日:</span>
                <span className="ml-2">2024年1月1日</span>
              </div>
            </div>
          </div>
          
          <div className="bg-card text-card-foreground p-4 rounded-lg border">
            <h3 className="font-medium mb-2">統計</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">投稿数:</span>
                <span className="ml-2">42</span>
              </div>
              <div>
                <span className="text-muted-foreground">フォロワー:</span>
                <span className="ml-2">128</span>
              </div>
              <div>
                <span className="text-muted-foreground">フォロー中:</span>
                <span className="ml-2">85</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <BaseLayout 
      variant="user-profile"
      overrides={{
        secondSidebar: {
          content: secondSidebarContent
        }
      }}
    >
      {children}
    </BaseLayout>
  )
}