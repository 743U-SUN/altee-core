import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Discord from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // ブラックリストチェック
      if (user.email) {
        const blacklisted = await prisma.blacklistedEmail.findUnique({
          where: { email: user.email }
        });
        if (blacklisted) {
          return false;
        }
      }
      
      return true;
    },
    async session({ session, user }) {
      // 管理者権限の自動付与（初回セッション時）
      if (session.user?.email) {
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        if (adminEmails.includes(session.user.email)) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
          }).catch(() => {}); // エラー無視（既にADMINの場合）
        }
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          role: true,
          isActive: true,
          image: true,
          googleImageUrl: true,
          discordImageUrl: true,
          preferredImageProvider: true,
          customImageKey: true,
        }
      });

      // OAuth画像URLの同期処理
      if (dbUser?.image) {
        try {
          // ユーザーのすべてのアカウント情報を取得
          const userAccounts = await prisma.account.findMany({
            where: { userId: user.id },
            select: { provider: true }
          });
          
          const updateData: any = {};
          
          // 各プロバイダーに対して、専用フィールドが空の場合のみ画像URLを設定
          for (const account of userAccounts) {
            if (account.provider === 'google' && !dbUser.googleImageUrl) {
              updateData.googleImageUrl = dbUser.image;
            } else if (account.provider === 'discord' && !dbUser.discordImageUrl) {
              updateData.discordImageUrl = dbUser.image;
            }
          }
          
          if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
              where: { id: user.id },
              data: updateData
            });
            // 更新されたデータをdbUserに反映
            Object.assign(dbUser, updateData);
          }
        } catch (error) {
          console.log('Failed to sync OAuth images:', error);
        }
      }
      
      session.user = {
        ...session.user,
        id: user.id,
        role: dbUser?.role || 'USER',
        isActive: dbUser?.isActive || false,
        profileImages: {
          google: dbUser?.googleImageUrl,
          discord: dbUser?.discordImageUrl,
          preferred: dbUser?.preferredImageProvider,
          custom: dbUser?.customImageKey,
        }
      };
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});

// v5では個別にexportする
export { auth as getSession };