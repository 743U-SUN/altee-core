import { getUserDetail } from "@/app/actions/user-management"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UserActions } from "./components/UserActions"
import { ArrowLeft, Calendar, Shield, User, Mail, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params

  try {
    const user = await getUserDetail(id)

    return (
      <div className="flex flex-col gap-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">ユーザー詳細</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                  <AvatarFallback className="text-lg">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{user.name || "名前未設定"}</h3>
                  <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">メールアドレス</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ロール</label>
                  <div className="mt-1">
                    <Badge variant={user.role === "ADMIN" ? "destructive" : user.role === "USER" ? "default" : "secondary"}>
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">状態</label>
                  <div className="mt-1">
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "アクティブ" : "非アクティブ"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">登録日</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long", 
                        day: "numeric"
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {user.image && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">プロフィール画像</label>
                  <div className="flex items-center gap-2 mt-1">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{user.image}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OAuth連携情報 */}
          <Card>
            <CardHeader>
              <CardTitle>OAuth連携アカウント</CardTitle>
            </CardHeader>
            <CardContent>
              {user.accounts.length > 0 ? (
                <div className="space-y-3">
                  {user.accounts.map((account, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {account.provider === "google" && (
                            <div className="w-4 h-4 rounded-full bg-red-500"></div>
                          )}
                          {account.provider === "discord" && (
                            <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{account.provider}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {account.providerAccountId}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">連携済み</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  OAuth連携アカウントはありません
                </p>
              )}
            </CardContent>
          </Card>

          {/* セッション情報 */}
          <Card>
            <CardHeader>
              <CardTitle>最近のセッション</CardTitle>
            </CardHeader>
            <CardContent>
              {user.sessions.length > 0 ? (
                <div className="space-y-3">
                  {user.sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">セッション</p>
                        <p className="text-xs text-muted-foreground">
                          期限: {new Date(session.expires).toLocaleString("ja-JP")}
                        </p>
                      </div>
                      <Badge variant={new Date(session.expires) > new Date() ? "default" : "secondary"}>
                        {new Date(session.expires) > new Date() ? "有効" : "期限切れ"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  アクティブなセッションはありません
                </p>
              )}
            </CardContent>
          </Card>

          {/* 統計情報 */}
          <Card>
            <CardHeader>
              <CardTitle>アクティビティ統計</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{user._count.sessions}</div>
                  <div className="text-sm text-muted-foreground">総セッション数</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{user._count.accounts}</div>
                  <div className="text-sm text-muted-foreground">連携アカウント</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{user._count.posts}</div>
                  <div className="text-sm text-muted-foreground">投稿数</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-muted-foreground">登録日数</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 管理操作 */}
          <UserActions user={user} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("UserDetail error:", error)
    notFound()
  }
}