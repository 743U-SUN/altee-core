# 認証システム実装計画

## 設計原則
- **NextAuth統合**: Google・Discord OAuth認証
- **3層セキュリティ**: Middleware→Layout→Page の段階的認証チェック
- **最小権限の原則**: 必要最小限の権限のみ付与
- **セッション管理**: セキュリティと利便性のバランス

## 認証システム技術的決定事項

### 1. OAuth プロバイダー設定
- **Google OAuth**: メインプロバイダー（高信頼性・幅広いユーザー基盤）
- **Discord OAuth**: サブプロバイダー（コミュニティ特化）
- **開発・本番環境**: 各環境専用のOAuthアプリケーション作成

### 2. セッション戦略
**決定**: Database Sessions（推奨）
```typescript
// next-auth設定
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30日
    updateAge: 24 * 60 * 60,   // 24時間毎に更新
  },
  // ...
}
```

**理由**:
- サーバーサイドセッション無効化が可能（強制ログアウト）
- セッション情報の詳細追跡・監査が可能
- スケーラビリティ問題は現段階では無視可能
- JWTと比較してセキュリティリスクが低い

### 3. プロフィール画像戦略
**決定**: OAuth画像URL + ConoHaフォールバック
```typescript
model User {
  // OAuth画像URL保存
  googleImageUrl  String?
  discordImageUrl String?
  // ユーザー選択
  preferredImageProvider String? // "google" | "discord" | "custom"
  // カスタム画像（ConoHa保存）
  customImageKey String?
}
```

**理由**:
- OAuth画像の直接使用は可能だが、以下のリスク存在：
  - 外部サービス依存（可用性リスク）
  - プライバシー設定変更によるアクセス拒否
  - 大量同時リクエスト時のレート制限
- ハイブリッドアプローチで最適な UX とリスク軽減を両立

### 4. 管理権限付与戦略
**決定**: Email-based Admin Role Assignment
```typescript
model User {
  role UserRole @default(USER)
}

enum UserRole {
  USER
  ADMIN
}

model BlacklistedEmail {
  id    String @id @default(cuid())
  email String @unique
  reason String?
  createdAt DateTime @default(now())
}
```

**管理者昇格プロセス**:
1. 環境変数 `ADMIN_EMAILS` でホワイトリスト管理
2. 初回ログイン時に自動ロール付与
3. 既存ユーザーの手動昇格はDB直接操作（安全性重視）

**理由**:
- シンプルで確実な権限管理
- 不正昇格のリスク最小化
- 監査証跡の明確性

### 5. 開発環境OAuth設定
**決定**: 環境別OAuthアプリケーション
```
開発環境:
- Google: http://localhost:3000/api/auth/callback/google
- Discord: http://localhost:3000/api/auth/callback/discord

本番環境:
- Google: https://yourdomain.com/api/auth/callback/google
- Discord: https://yourdomain.com/api/auth/callback/discord
```

## データベーススキーマ（認証系）

```typescript
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  
  // プロフィール画像戦略
  googleImageUrl         String?
  discordImageUrl        String?
  preferredImageProvider String? // "google" | "discord" | "custom"
  customImageKey         String? // ConoHa Object Storage key
  
  // 権限管理
  role      UserRole @default(USER)
  isActive  Boolean  @default(true)
  
  // OAuth関連
  accounts Account[]
  sessions Session[]
  
  // アプリケーション関連
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("users")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
  @@map("verificationtokens")
}

enum UserRole {
  USER
  ADMIN
}

model BlacklistedEmail {
  id        String   @id @default(cuid())
  email     String   @unique
  reason    String?
  createdAt DateTime @default(now())
  
  @@map("blacklisted_emails")
}
```

## NextAuth設定実装

### 基本設定
```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30日
    updateAge: 24 * 60 * 60,   // 24時間毎に更新
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
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
      
      // 初回ログイン時の管理者権限付与
      if (user.email) {
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        if (adminEmails.includes(user.email)) {
          await prisma.user.upsert({
            where: { email: user.email },
            create: {
              email: user.email,
              name: user.name,
              role: 'ADMIN',
              googleImageUrl: account?.provider === 'google' ? profile?.picture : null,
              discordImageUrl: account?.provider === 'discord' ? profile?.avatar : null,
            },
            update: {
              role: 'ADMIN',
              ...(account?.provider === 'google' && { googleImageUrl: profile?.picture }),
              ...(account?.provider === 'discord' && { discordImageUrl: profile?.avatar }),
            }
          });
        }
      }
      
      return true;
    },
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          role: true,
          isActive: true,
          googleImageUrl: true,
          discordImageUrl: true,
          preferredImageProvider: true,
          customImageKey: true,
        }
      });
      
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
};

export default NextAuth(authOptions);
```

## 3層セキュリティ実装

### Layer 1: Middleware
```typescript
// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

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
```

### Layer 2: Admin Layout
```typescript
// app/admin/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }) {
  const session = await auth();
  
  // 認証チェック
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }
  
  // アクティブユーザーチェック
  if (!session.user.isActive) {
    redirect('/suspended');
  }
  
  // 管理者権限チェック
  if (session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }
  
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
```

### Layer 3: Page レベルチェック
```typescript
// app/admin/users/page.tsx
import { auth } from "@/lib/auth";

export default async function AdminUsersPage() {
  const session = await auth();
  
  // 最終権限確認（Layout通過後でも）
  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="error-page">
        <p>管理者権限が必要です</p>
      </div>
    );
  }
  
  return <UsersManagementContent />;
}
```

## プロフィール画像管理実装

### 画像URL取得ユーティリティ
```typescript
// lib/user-profile.ts
export function getUserProfileImageUrl(user: {
  googleImageUrl?: string | null;
  discordImageUrl?: string | null;
  preferredImageProvider?: string | null;
  customImageKey?: string | null;
}): string {
  // ユーザー指定のプロバイダーを優先
  if (user.preferredImageProvider === 'custom' && user.customImageKey) {
    return `/api/images/${user.customImageKey}`;
  }
  
  if (user.preferredImageProvider === 'google' && user.googleImageUrl) {
    return user.googleImageUrl;
  }
  
  if (user.preferredImageProvider === 'discord' && user.discordImageUrl) {
    return user.discordImageUrl;
  }
  
  // フォールバック: 利用可能な画像を順番に試行
  if (user.googleImageUrl) return user.googleImageUrl;
  if (user.discordImageUrl) return user.discordImageUrl;
  if (user.customImageKey) return `/api/images/${user.customImageKey}`;
  
  // デフォルト画像
  return '/images/default-avatar.svg';
}
```

## 実装チェックリスト

### Phase 1: 基本認証（Priority: Critical）
- [ ] NextAuth設定・OAuth Provider設定
- [ ] データベーススキーマ作成・マイグレーション
- [ ] 基本的なサインイン・サインアウト機能
- [ ] 3層セキュリティアーキテクチャ実装
- [ ] 開発環境OAuth設定

### Phase 2: ユーザー管理（Priority: High）
- [ ] プロフィール画像管理機能
- [ ] 管理者権限付与システム
- [ ] ユーザー一覧・詳細表示（管理者用）
- [ ] アカウント有効・無効切り替え
- [ ] ブラックリスト管理機能

### Phase 3: セキュリティ強化（Priority: Medium）
- [ ] セッション管理・強制ログアウト機能
- [ ] 管理者操作ログ記録
- [ ] 不正アクセス検知・通知
- [ ] セキュリティ設定画面

### Phase 4: UX改善（Priority: Low）
- [ ] プロフィール編集画面
- [ ] カスタムアバター画像アップロード
- [ ] アカウント設定画面
- [ ] ログイン履歴表示

## 実装順序と優先度
1. **NextAuth基本設定** → 即座に認証機能が使用可能
2. **3層セキュリティ** → セキュアな管理画面アクセス
3. **管理者権限システム** → Article作成に必要な権限制御
4. **プロフィール画像管理** → 記事作成者情報表示に必要
5. **追加セキュリティ機能** → 運用後の安全性向上