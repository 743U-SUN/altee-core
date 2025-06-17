import { auth } from "@/auth"
import { redirect } from "next/navigation"

/**
 * 管理者権限チェック関数
 * ADMIN権限かつアクティブなユーザーのみ許可
 */
export async function requireAdmin() {
  const session = await auth()
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
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/auth/signin")
  }
  return session
}