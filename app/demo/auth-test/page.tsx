import { auth } from "@/auth"
import { signIn, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"

async function handleSignIn() {
  "use server"
  await signIn()
}

async function handleGoogleSignIn() {
  "use server"
  await signIn("google")
}

async function handleDiscordSignIn() {
  "use server"
  await signIn("discord")
}

async function handleSignOut() {
  "use server"
  await signOut()
}

export default async function AuthTestPage() {
  const session = await auth()

  // ログイン中の場合、アカウント情報も取得
  let userDetails = null
  if (session?.user?.id) {
    userDetails = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            type: true
          }
        },
        sessions: {
          select: {
            expires: true,
            sessionToken: true
          },
          orderBy: {
            expires: 'desc'
          },
          take: 1
        }
      }
    })
  }

  return (
    <div className="container mx-auto p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">NextAuth v5 認証テスト</h1>
      
      {/* 基本セッション情報 */}
      <div className="bg-gray-100 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">セッション情報</h2>
        {session ? (
          <div className="space-y-2 text-gray-800">
            <p><strong className="text-gray-900">認証状態:</strong> ✅ ログイン済み</p>
            <p><strong className="text-gray-900">ユーザーID:</strong> {session.user.id}</p>
            <p><strong className="text-gray-900">名前:</strong> {session.user.name}</p>
            <p><strong className="text-gray-900">メール:</strong> {session.user.email}</p>
            <p><strong className="text-gray-900">ロール:</strong> <span className={`px-2 py-1 rounded text-sm ${session.user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{session.user.role}</span></p>
            <p><strong className="text-gray-900">アクティブ:</strong> {session.user.isActive ? '✅' : '❌'}</p>
            
            {/* プロフィール画像情報 */}
            <div className="mt-4">
              <p><strong className="text-gray-900">プロフィール画像:</strong></p>
              <div className="ml-4 space-y-1 text-gray-700">
                <p>現在の画像: {session.user.image ? '✅ 設定済み' : '❌ なし'}</p>
              </div>
            </div>

            {/* 現在の画像を表示 */}
            {session.user.image && (
              <div className="mt-4">
                <p><strong className="text-gray-900">現在のプロフィール画像:</strong></p>
                <div className="flex gap-4 mt-2">
                  <div className="text-center">
                    <Image 
                      src={session.user.image} 
                      alt="Profile Picture" 
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full"
                    />
                    <p className="text-xs mt-1 text-gray-600">最新ログイン</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-800"><strong className="text-gray-900">認証状態:</strong> ❌ 未ログイン</p>
        )}
      </div>

      {/* 詳細アカウント情報（ログイン中のみ表示） */}
      {session && userDetails && (
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">アカウント詳細情報</h2>
          <div className="space-y-4 text-blue-800">
            
            {/* 連携アカウント */}
            <div>
              <p><strong className="text-blue-900">連携アカウント:</strong></p>
              {userDetails.accounts.length > 0 ? (
                <ul className="ml-4 space-y-1">
                  {userDetails.accounts.map((account) => (
                    <li key={account.provider} className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        account.provider === 'google' ? 'bg-blue-100 text-blue-800' : 
                        account.provider === 'discord' ? 'bg-indigo-100 text-indigo-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {account.provider.toUpperCase()}
                      </span>
                      <span className="text-sm text-blue-600">ID: {account.providerAccountId}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ml-4 text-blue-600">連携アカウントなし</p>
              )}
            </div>

            {/* セッション情報 */}
            <div>
              <p><strong className="text-blue-900">セッション情報:</strong></p>
              {userDetails.sessions.length > 0 ? (
                <div className="ml-4">
                  <p className="text-sm text-blue-700">有効期限: {new Date(userDetails.sessions[0].expires).toLocaleString('ja-JP')}</p>
                  <p className="text-sm text-blue-600">トークン: {userDetails.sessions[0].sessionToken.substring(0, 20)}...</p>
                </div>
              ) : (
                <p className="ml-4 text-blue-600">アクティブセッションなし</p>
              )}
            </div>

            {/* データベース情報 */}
            <div>
              <p><strong className="text-blue-900">データベース情報:</strong></p>
              <div className="ml-4 text-sm space-y-1 text-blue-700">
                <p>作成日: {new Date(userDetails.createdAt).toLocaleString('ja-JP')}</p>
                <p>更新日: {new Date(userDetails.updatedAt).toLocaleString('ja-JP')}</p>
                <p>OAuth認証: ✅ Google/Discordにて認証済み</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* アクション部分 */}
      <div className="space-y-4">
        {session ? (
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <h2 className="text-xl font-semibold mb-4 text-red-800">認証解除</h2>
            <p className="text-red-700 mb-4">ログアウトすると、現在のセッションが終了します。再度アクセスするには再ログインが必要です。</p>
            <form action={handleSignOut}>
              <button 
                type="submit"
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                🚪 ログアウト
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex space-x-4">
              <form action={handleGoogleSignIn} className="inline">
                <button 
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Googleでログイン
                </button>
              </form>
              
              <form action={handleDiscordSignIn} className="inline">
                <button 
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded flex items-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0188 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9460 2.4189-2.1568 2.4189Z"/>
                  </svg>
                  Discordでログイン
                </button>
              </form>
            </div>
            
            <div className="text-center text-gray-500">または</div>
            
            <form action={handleSignIn} className="text-center">
              <button 
                type="submit"
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
              >
                統合ログインページ
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">認証テストリンク</h2>
        <div className="space-y-2">
          <p>
            <Link href="/admin" className="text-blue-600 hover:underline">
              管理者ページ（権限必要）
            </Link>
          </p>
          <p>
            <Link href="/api/auth/signin" className="text-blue-600 hover:underline">
              サインインページ
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}