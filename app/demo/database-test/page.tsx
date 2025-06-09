import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { testConnection, createTestUser, getAllUsers, deleteAllTestUsers } from './actions'

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

export default async function DatabaseTestPage() {
  // 初期データ取得
  const users = await getAllUsers()

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">PostgreSQL + Prisma 動作テスト</h1>
        <p className="text-gray-600">開発環境でのデータベース接続と基本操作をテストします</p>
      </div>

      <div className="grid gap-6">
        {/* 接続テスト */}
        <Card>
          <CardHeader>
            <CardTitle>1. データベース接続テスト</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Prisma Clientでデータベースへの接続をテストします
            </p>
            <form action={testConnection}>
              <Button type="submit" variant="outline">
                接続テスト実行
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* CRUD操作テスト */}
        <Card>
          <CardHeader>
            <CardTitle>2. 基本CRUD操作テスト</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              User作成・取得・削除の基本操作をテストします
            </p>
            <div className="flex gap-2">
              <form action={createTestUser}>
                <Button type="submit" variant="default">
                  テストユーザー作成
                </Button>
              </form>
              <form action={deleteAllTestUsers}>
                <Button type="submit" variant="destructive">
                  全テストユーザー削除
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* データ表示 */}
        <Card>
          <CardHeader>
            <CardTitle>3. 現在のユーザーデータ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">総ユーザー数</Badge>
                <span className="font-mono">{users.length}</span>
              </div>
              
              {users.length > 0 ? (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">ユーザー一覧:</h4>
                  <div className="grid gap-2">
                    {users.map((user) => (
                      <div key={user.id} className="p-3 border rounded-lg">
                        <div className="font-mono text-sm text-gray-600">ID: {user.id}</div>
                        <div><strong>Name:</strong> {user.name || '(null)'}</div>
                        <div><strong>Email:</strong> {user.email}</div>
                        <div className="text-xs text-gray-500">
                          作成: {user.createdAt.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 mt-4">ユーザーデータがありません</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prisma Studio案内 */}
        <Card>
          <CardHeader>
            <CardTitle>4. Prisma Studio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              データベースの内容をGUIで確認できます
            </p>
            <a 
              href="http://localhost:5555" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button variant="outline">
                Prisma Studio を開く
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}