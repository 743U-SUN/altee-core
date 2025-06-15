import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const protectedPaths = ['/admin', '/user'];
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );
  
  if (isProtectedPath && !req.auth) {
    return NextResponse.redirect(new URL('/auth/signin', req.nextUrl));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/user/:path*']
};