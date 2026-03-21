import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Discord from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { extractOAuthImageUrl, updateUserImage, isEmailBlacklisted, type OAuthProfile } from "@/services/auth/auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30日
    updateAge: 24 * 60 * 60,   // 24時間毎に更新
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "identify email"
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // MANAGEDプロフィール用メールドメインをブロック
      if (user.email?.endsWith('@altee.internal')) {
        return false
      }

      // ブラックリストチェック + アクティブ状態チェックを並列実行
      if (user.email) {
        const [blacklisted, dbUser] = await Promise.all([
          isEmailBlacklisted(user.email),
          prisma.user.findUnique({
            where: { email: user.email },
            select: { isActive: true }
          })
        ])

        if (blacklisted) {
          return false
        }

        if (dbUser && !dbUser.isActive) {
          return '/auth/suspended'
        }
      }

      // OAuth画像URLを取得・更新
      if (!account || !profile || !user.id) return true

      const oauthImageUrl = extractOAuthImageUrl(account.provider, profile as OAuthProfile)
      if (oauthImageUrl) {
        const updated = await updateUserImage(user.id, oauthImageUrl)
        if (updated) {
          user.image = oauthImageUrl
        }
      }

      return true
    },
    async session({ session, user }) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
            isActive: true,
            image: true,
            handle: true,
            characterInfo: {
              select: { characterName: true }
            },
          }
        })

        if (!dbUser) {
          session.user = {
            ...session.user,
            id: user.id,
            role: 'USER',
            isActive: false,
            image: session.user.image,
          }
          return session
        }

        // 管理者権限の自動付与（既にADMINなら不要）
        if (session.user?.email && dbUser.role !== 'ADMIN') {
          const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
          if (adminEmails.includes(session.user.email)) {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: 'ADMIN' }
            }).catch(() => { })
            dbUser.role = 'ADMIN'
          }
        }

        // セッション時点での画像同期処理（signInコールバックで処理されなかった場合のフォールバック）
        if (session.user.image && session.user.image !== dbUser.image) {
          try {
            await updateUserImage(user.id, session.user.image)
            dbUser.image = session.user.image
          } catch {
            // 画像更新失敗は無視（フォールバック処理）
          }
        }

        session.user = {
          ...session.user,
          id: user.id,
          role: dbUser.role || 'USER',
          isActive: dbUser.isActive,
          image: dbUser.image,
          handle: dbUser.handle,
          characterName: dbUser.characterInfo?.characterName ?? null,
        }

        return session
      } catch {
        // エラーが発生した場合もセッションを返す（最小限の情報で）
        session.user = {
          ...session.user,
          id: user.id,
          role: 'USER',
          isActive: false,
        }
        return session
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        // ローカルURLの場合はそのまま使用
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`
        }

        // 同じドメインの場合
        if (new URL(url).origin === baseUrl) {
          return url
        }

        // 外部URLの場合はbaseUrlを返す
        return baseUrl
      } catch {
        // URL解析エラーの場合はbaseURLを返す
        return baseUrl
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});

// v5では個別にexportする
export { auth as getSession };