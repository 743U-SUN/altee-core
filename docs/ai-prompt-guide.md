# ユーザー管理システム実装計画

## 🎯 プロジェクト概要

**目的**: VTuber/配信者コミュニティサイト向けユーザー管理システム
**目標ユーザー数**: 10,000人
**管理者**: 基本1人（拡張可能）
**技術スタック**: Next.js 15 + Prisma + shadcn/ui + TypeScript

## 📋 機能要件

### 必須機能
- ✅ ユーザー一覧表示（ページング、検索、フィルタリング）
- ✅ ユーザー詳細表示（プロフィール、OAuth連携、セッション情報）
- ✅ ロール管理（ADMIN, USER, Guest）
- ✅ アカウント状態管理（アクティブ/非アクティブ）
- ✅ ユーザー強制削除（不適切ユーザー対応）
- ✅ ブラックリスト管理（メールアドレス登録/削除）
- ✅ 基本統計（総ユーザー数、新規登録数等）
- ✅ 強制ログアウト（セッション削除）

### 将来拡張
- 一括操作（複数ユーザー選択）
- CSVエクスポート
- 詳細ログ・監査機能

## 🏗 実装計画

### Phase 1: 基盤整備
**目標**: データベースとレイアウトの準備

#### 1.1 スキーマ更新
```prisma
enum UserRole {
  USER
  ADMIN  
  GUEST    // 新規追加
}
```

#### 1.2 基本レイアウト作成
- `/admin/users` - メインユーザー管理ページ
- `/admin/users/[id]` - ユーザー詳細ページ
- `/admin/blacklist` - ブラックリスト管理ページ

#### 1.3 Server Actions準備
- `app/actions/user-management.ts` - ユーザー操作
- `app/actions/blacklist.ts` - ブラックリスト操作

### Phase 2: コア機能実装
**目標**: 基本的なユーザー表示と検索機能

#### 2.1 ユーザー一覧ページ (`/admin/users`)
- ページング（20件/ページ）
- 基本情報表示（名前、メール、ロール、状態、登録日）
- shadcn/ui Table コンポーネント使用

#### 2.2 検索・フィルタリング機能
- テキスト検索（名前、メール）
- ロールフィルタ（ADMIN/USER/Guest）
- 状態フィルタ（アクティブ/非アクティブ）
- 登録日範囲フィルタ

#### 2.3 ユーザー詳細ページ (`/admin/users/[id]`)
- 基本プロフィール情報
- OAuth連携アカウント（Google/Discord）
- セッション情報・最終ログイン
- アクティビティ概要

### Phase 3: 管理機能実装
**目標**: ユーザー操作とセキュリティ機能

#### 3.1 ユーザー操作機能
- ロール変更（ドロップダウン + 確認ダイアログ）
- アカウント有効/無効切り替え
- ユーザー強制削除（確認ダイアログ + 理由入力）
- 強制ログアウト（全セッション削除）

#### 3.2 ブラックリスト管理 (`/admin/blacklist`)
- ブラックリストメール一覧
- 新規メール追加（理由入力）
- ブラックリスト削除
- 一括CSV追加

#### 3.3 セキュリティ機能
- 操作ログ記録（管理者アクション）
- 確認ダイアログ（危険な操作）
- エラーハンドリング

### Phase 4: 高度機能・UX改善
**目標**: 運用効率化と統計機能

#### 4.1 統計ダッシュボード (`/admin`)
- 総ユーザー数、アクティブユーザー数
- 新規登録数（日/週/月）
- ロール別ユーザー数
- OAuth連携状況

#### 4.2 一括操作機能
- 複数ユーザー選択（チェックボックス）
- 一括ロール変更
- 一括状態変更

#### 4.3 エクスポート機能
- ユーザーリストCSVエクスポート
- フィルタ条件でのエクスポート

## 🛠 技術仕様

### ディレクトリ構造
```
app/
├── admin/
│   ├── page.tsx                 # 統計ダッシュボード
│   ├── users/
│   │   ├── page.tsx            # ユーザー一覧
│   │   ├── [id]/
│   │   │   └── page.tsx        # ユーザー詳細
│   │   └── components/
│   │       ├── UserList.tsx
│   │       ├── UserFilters.tsx
│   │       └── UserActions.tsx
│   └── blacklist/
│       └── page.tsx            # ブラックリスト管理
├── actions/
│   ├── user-management.ts      # ユーザー操作
│   └── blacklist.ts           # ブラックリスト操作
└── components/admin/           # 管理画面共通コンポーネント
```

### Server Actions仕様
```typescript
// user-management.ts
- getUserList(filters, pagination)
- getUserDetail(userId)
- updateUserRole(userId, newRole)
- toggleUserActive(userId)
- deleteUser(userId, reason)
- forceLogout(userId)

// blacklist.ts  
- getBlacklistedEmails()
- addBlacklistedEmail(email, reason)
- removeBlacklistedEmail(id)
```

### shadcn/ui コンポーネント使用
- Table, TableHeader, TableBody, TableRow, TableCell
- Button, DropdownMenu, Dialog, AlertDialog
- Input, Select, Checkbox, Badge
- Pagination, Card, Tabs

## ✅ 実装チェックリスト

### Phase 1: 基盤整備
- [ ] UserRole enum に GUEST 追加
- [ ] Prismaマイグレーション作成・適用
- [ ] `/admin/users` ページ作成（空の状態）
- [ ] 基本レイアウト・ナビゲーション
- [ ] Server Actions ファイル作成

### Phase 2: コア機能
- [ ] ユーザー一覧表示（基本）
- [ ] ページング機能
- [ ] 検索機能（名前・メール）
- [ ] フィルタリング（ロール・状態・日付）
- [ ] ユーザー詳細ページ
- [ ] OAuth連携情報表示

### Phase 3: 管理機能
- [ ] ロール変更機能
- [ ] アカウント有効/無効切り替え
- [ ] ユーザー強制削除
- [ ] 強制ログアウト機能
- [ ] ブラックリスト管理ページ
- [ ] ブラックリスト CRUD操作

### Phase 4: 高度機能
- [ ] 統計ダッシュボード
- [ ] 一括操作機能
- [ ] CSVエクスポート
- [ ] エラーハンドリング改善
- [ ] 操作ログ機能

## 🚨 重要な実装ポイント

### セキュリティ
- すべての操作に認証・認可チェック
- 危険な操作（削除等）は確認ダイアログ必須
- Server Actions でのエラーハンドリング

### パフォーマンス
- ページング で大量データ対応
- インデックス最適化（検索対象フィールド）
- 適切なデータ取得（select で必要フィールドのみ）

### UX/UI
- shadcn/ui の統一されたデザイン
- ローディング状態の表示
- 適切なフィードバック（成功・エラーメッセージ）

### 運用考慮
- 操作ログ記録（誰が何をしたか）
- バックアップ前提での削除機能
- 復旧手順の文書化

## 📝 実装時の注意事項

1. **データベース操作**: 必ずtry-catchでエラーハンドリング
2. **UI一貫性**: shadcn/ui コンポーネントを統一使用
3. **権限チェック**: すべてのServer ActionでADMIN権限確認
4. **テスト**: `/demo/` ディレクトリでの動作確認
5. **文字エンコード**: UTF-8で日本語文字化け防止

---

**実装開始**: Phase 1から順次実装
**完成目標**: 実用的なユーザー管理システム
**拡張性**: 将来的な機能追加を考慮した設計