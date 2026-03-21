import 'server-only'
import { cache } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

/**
 * React.cache でラップした auth()
 * 1リクエスト内で複数回呼ばれても session callback の DB クエリは1回だけ実行される
 */
export const cachedAuth = cache(auth)

/**
 * 管理者権限チェック関数
 * ADMIN権限かつアクティブなユーザーのみ許可
 */
export async function requireAdmin() {
  const session = await cachedAuth()
  if (!session?.user?.email) {
    redirect("/auth/signin")
  }
  if (session.user.role !== "ADMIN" || !session.user.isActive) {
    redirect("/unauthorized")
  }
  return session
}

/**
 * ログイン済みユーザーチェック関数
 */
export async function requireAuth() {
  const session = await cachedAuth()
  if (!session?.user?.email) {
    redirect("/auth/signin")
  }
  if (!session.user.isActive) {
    redirect("/auth/suspended")
  }
  return session
}