import { NextRequest, NextResponse } from "next/server"
import { RESERVED_HANDLES } from "./lib/reserved-handles"

// システムルート（@なしでアクセス可能）
const SYSTEM_ROUTES = [
  ...RESERVED_HANDLES,
  '_next',
  'favicon.ico',
  'manifest.webmanifest',
  'api',
  // 'devices' removed in Phase 10 (Device system deleted)
  'items',   // /itemsページ
] as const

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // 認証保護パス
  const protectedPaths = ['/admin', '/user']
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