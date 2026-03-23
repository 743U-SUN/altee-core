import { NextRequest, NextResponse } from "next/server"
import { RESERVED_HANDLES } from "./lib/reserved-handles"

// システムルート（@なしでアクセス可能）
const SYSTEM_ROUTES = [
  ...RESERVED_HANDLES,
  '_next',
  'favicon.ico',
  'manifest.webmanifest',
  'api',
  'items',      // /itemsページ
  'serwist',    // PWA service worker route
  'sw',         // Service worker
] as const

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // メンテナンスモード
  if (process.env.MAINTENANCE_MODE === 'true') {
    // メンテナンスページ自体と静的アセットはスキップ
    if (pathname !== '/maintenance' && !pathname.startsWith('/_next') && !pathname.startsWith('/pwa/')) {
      // バイパス cookie があればスキップ
      const bypass = req.cookies.get('maintenance_bypass')
      if (bypass?.value !== process.env.MAINTENANCE_BYPASS_SECRET) {
        // シークレットパラメータでバイパス cookie を付与
        const bypassParam = req.nextUrl.searchParams.get('bypass')
        if (bypassParam && bypassParam === process.env.MAINTENANCE_BYPASS_SECRET) {
          const url = new URL(pathname, req.url)
          const res = NextResponse.redirect(url)
          res.cookies.set('maintenance_bypass', bypassParam, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 86400,
          })
          return res
        }

        return NextResponse.rewrite(new URL('/maintenance', req.url))
      }
    }
  }

  // 認証保護パス
  const protectedPaths = ['/admin', '/dashboard']
  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  )

  if (isProtectedPath) {
    const sessionToken = req.cookies.get('authjs.session-token') || req.cookies.get('__Secure-authjs.session-token')

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/auth/signin', req.nextUrl))
    }
  }

  // @なしのユーザーハンドルアクセスを@付きにリダイレクト
  if (!pathname.startsWith('/@') && !pathname.startsWith('/_next')) {
    const segments = pathname.split('/').filter(Boolean)
    const firstSegment = segments[0]

    // システムルートでない場合、@付きURLにリダイレクト
    if (firstSegment && !(SYSTEM_ROUTES as readonly string[]).includes(firstSegment)) {
      return NextResponse.redirect(new URL(`/@${pathname.slice(1)}`, req.url), 308)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
