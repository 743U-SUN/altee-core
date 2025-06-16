import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const protectedPaths = ['/admin', '/user'];
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );
  
  if (isProtectedPath) {
    // セッション情報はlayout.tsxで詳細チェックするため、middlewareでは基本的な認証チェックのみ
    const sessionToken = req.cookies.get('authjs.session-token') || req.cookies.get('__Secure-authjs.session-token');
    
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/auth/signin', req.nextUrl));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/user/:path*']
};