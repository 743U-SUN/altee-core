import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Discord from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { extractOAuthImageUrl, updateUserImage, isEmailBlacklisted } from "@/services/auth"

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
      // ブラックリストチェック
      if (user.email && await isEmailBlacklisted(user.email)) {
        return false
      }
      
      // OAuth画像URLを取得・更新
      if (!account || !profile || !user.id) return true
      
      const oauthImageUrl = extractOAuthImageUrl(account.provider, profile as any)
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
        // 管理者権限の自動付与
        if (session.user?.email) {
          const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
          if (adminEmails.includes(session.user.email)) {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: 'ADMIN' }
            }).catch(() => {}) // エラー無視（既にADMINの場合）
          }
        }

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
            isActive: true,
            image: true,
          }
        })

        if (!dbUser) {
          console.error('Database user not found during session callback:', user.id)
          // デフォルト値を返す
          session.user = {
            ...session.user,
            id: user.id,
            role: 'USER',
            isActive: true,
            image: session.user.image,
          }
          return session
        }

        // セッション時点での画像同期処理（signInコールバックで処理されなかった場合のフォールバック）
        if (session.user.image && session.user.image !== dbUser.image) {
          try {
            await updateUserImage(user.id, session.user.image)
            dbUser.image = session.user.image
          } catch (error) {
            console.error('Failed to update user image in session callback:', error)
          }
        }

        session.user = {
          ...session.user,
          id: user.id,
          role: dbUser.role || 'USER',
          isActive: dbUser.isActive,
          image: dbUser.image,
        }
        
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        // エラーが発生した場合もセッションを返す（最小限の情報で）
        session.user = {
          ...session.user,
          id: user.id,
          role: 'USER',
          isActive: true,
        }
        return session
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