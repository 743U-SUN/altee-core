# 認証システム実装計画（NextAuth v5 / Auth.js）

## 🎯 現在の状況（2025/6/15）

### ✅ 完了済み項目
- **NextAuth v5 基本実装**: auth.ts設定、API Route、データベーススキーマ
- **3層セキュリティアーキテクチャ**: Middleware → Layout → Page の認証チェック
- **OAuth設定**: Google・Discord プロバイダー（開発・本番環境）
- **管理者権限システム**: メール基準の自動ADMIN付与
- **認証テストページ**: `/demo/auth-test` で詳細なセッション情報表示

### ✅ 基盤実装完了（2025/6/15完了）
- **認証機能デバッグ**: OAuthAccountNotLinked・PrismaAdapterエラー解決
- **複数プロバイダー対応**: allowDangerousEmailAccountLinking設定
- **OAuth画像同期**: Google/Discord画像URLの適切な管理
- **テストページ最適化**: 混乱を招く表示の修正

### 🔄 次回実装予定
1. **本格ログインページ作成**: `/auth/signin` の UI実装
2. **本番環境認証確認**: VPS環境でのOAuth動作検証
3. **ログアウトフロー改善**: リダイレクト先とUX最適化

### 📋 将来のフェーズ
1. **ユーザー管理画面**: 管理者用のユーザー一覧・詳細表示
2. **Article作成システム**: 認証ベースのコンテンツ管理
3. **プロフィール機能**: 画像選択・設定画面

## 📁 実装済みファイル一覧

### 認証核心ファイル
- `auth.ts` - NextAuth v5メイン設定
- `app/api/auth/[...nextauth]/route.ts` - API Route（3行）
- `middleware.ts` - 3層セキュリティ Layer 1
- `app/admin/layout.tsx` - 3層セキュリティ Layer 2+3
- `types/next-auth.d.ts` - TypeScript型定義

### データベース
- `prisma/schema.prisma` - User/Account/Session/BlacklistedEmailモデル
- マイグレーション完了済み

### テスト・デバッグ
- `app/demo/auth-test/page.tsx` - 包括的認証テストページ

## 🔧 設計決定事項（実装済み）

### OAuth戦略
- **Google**: メインプロバイダー（ADMIN自動付与: itoryo2nd@gmail.com）
- **Discord**: サブプロバイダー（USER権限）
- **セッション**: Database Sessions（30日、24時間更新）

### プロフィール画像戦略
```typescript
// 実装済み: OAuth画像URL + ConoHaフォールバック
model User {
  googleImageUrl String?         // OAuth取得
  discordImageUrl String?        // OAuth取得
  preferredImageProvider String? // ユーザー選択
  customImageKey String?         // ConoHa保存
}
```

### 3層セキュリティ（実装済み）
1. **Middleware**: `/admin`, `/user` パス保護
2. **Layout**: 詳細認証・権限・アクティブ状態チェック
3. **Page**: 最終権限確認

## 🚨 重要な修正履歴

### OAuthAccountNotLinkedエラー修正
**問題**: signInコールバックでの複雑な処理がOAuth正常フローを阻害
**解決**: 
- signInコールバック: ブラックリストチェックのみ
- sessionコールバック: 管理者権限付与移動

### 型安全性確保
- demo/common/* 全コンポーネントの`any`型を`Record<string, unknown>`に修正
- ESLint/TypeScriptエラー0達成

## 📝 実装パターン（参考用）

### 認証チェック統一パターン
```typescript
// サーバーサイド
const session = await auth();
if (!session?.user?.email) redirect('/auth/signin');

// クライアントサイド  
const { data: session, status } = useSession();
```

### 管理者権限チェックパターン
```typescript
if (session?.user?.role !== 'ADMIN') {
  return <UnauthorizedComponent />;
}
```

## 🎯 次期実装アイテム

### 次回セッション: 認証UI完成（Priority: High）
- [x] `/auth/signin` ページ作成 - shadcn/ui使用、Google/Discordボタン
- [x] `/auth/error` ページ作成 - エラー別メッセージ表示
- [ ] 本番環境OAuth設定確認 - NEXTAUTH_URL等の環境変数
- [ ] 本番環境認証テスト - Vercel/VPS環境での動作確認
- [ ] ログアウト後リダイレクト設定 - UX改善

### Phase 2: ユーザー管理（Priority: Medium）
- [ ] 管理者用ユーザー一覧ページ (`/admin/users`)
- [ ] プロフィール画像選択機能
- [ ] アカウント有効・無効切り替え
- [ ] ブラックリスト管理UI

### Phase 3: Article システム
- [ ] Article作成・編集画面（認証必須）
- [ ] サムネイル画像アップロード
- [ ] Markdownエディタ統合

## 🔗 関連ドキュメント
- `docs/GUIDES/SECURITY-GUIDE.md` - 3層セキュリティ詳細
- `docs/article-system-plan.md` - Article実装計画（別ファイル）

---
**最終更新**: 2025/6/15 - NextAuth v5認証システム基盤完成、次フェーズ準備完了