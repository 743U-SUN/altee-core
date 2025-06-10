# BaseLayout System Guide

BaseLayoutは設定駆動で柔軟なレイアウトを提供するコンポーネントシステムです。

## 推奨使用方法：layout.tsxベース

```tsx
// app/admin/layout.tsx
import { BaseLayout } from "@/components/layout/BaseLayout"

export default function AdminLayout({ children }) {
  return (
    <BaseLayout variant="admin">
      {children}
    </BaseLayout>
  )
}

// app/admin/page.tsx
export default function AdminPage() {
  return <div>管理画面コンテンツ</div>  // BaseLayoutは不要
}
```

## 直接使用（ルートページなど）

```tsx
// app/page.tsx
import { BaseLayout } from "@/components/layout/BaseLayout"

export default function HomePage() {
  return (
    <BaseLayout variant="default">
      <div>ホームページコンテンツ</div>
    </BaseLayout>
  )
}
```

## バリアント（プリセット）

| バリアント | 用途 | ブランド | サイドバー幅 | 特徴 |
|-----------|------|------|----------|------|
| `default` | 一般ページ | Command（黒） | 350px | Homeアイコン、ユーザーメニュー |
| `admin` | 管理者画面 | Shield（赤） | 400px | 管理者メニュー、広めレイアウト |
| `user-profile` | プロフィール | UserCircle（青） | 300px | コンパクト設定画面 |
| `public` | 公開ページ | Building（緑） | 280px | 最小限のナビゲーション |
| `minimal` | 最小構成 | - | 250px | サイドバー・ユーザーメニュー非表示 |

## レイアウト継承とオーバーライド

### 基本継承
```
app/
├── admin/
│   ├── layout.tsx          # BaseLayout variant="admin"（全admin配下に適用）
│   ├── page.tsx            # 管理ダッシュボード
│   └── users/
│       └── page.tsx        # 自動的にadminバリアント継承
```

### 特別ページでのオーバーライド
```tsx
// app/admin/layout.tsx
export default function AdminLayout({ children }) {
  return (
    <BaseLayout 
      variant="admin"
      overrides={{
        header: { title: "カスタムタイトル" },
        secondSidebar: { content: <AdminTools /> }
      }}
    >
      {children}
    </BaseLayout>
  )
}
```

## 設定可能な要素

### ヘッダー
- `title`: タイトル文字列
- `rightContent`: カスタムコンテンツ（ボタンなど）
- `hideUserMenu`: ユーザーメニューの非表示

### サイドバー
- `brand`: ブランドアイコン・ロゴ設定
  - `icon`: アイコンコンポーネント
  - `iconBgColor`: アイコン背景色（Tailwindクラス）
  - `title`: タイトル文字列
  - `subtitle`: サブタイトル文字列
  - `url`: リンク先URL
- `navItems`: ナビゲーション項目
- `hideUser`: ユーザー情報の非表示
- `hide`: サイドバー全体の非表示

### セカンドサイドバー
- `content`: カスタムコンテンツ
- `hide`: 非表示設定

### 全体レイアウト
- `sidebarWidth`: サイドバー全体幅（First + Second の合計）

## ファイル構成

```
components/layout/
├── BaseLayout.tsx    # メインコンポーネント
├── Header.tsx        # ヘッダー
└── Sidebar.tsx       # サイドバー

lib/
└── layout-config.ts  # バリアント設定
```

## 実装例

### ディレクトリ構成
```
app/
├── layout.tsx              # ルートレイアウト
├── page.tsx                # ホーム（BaseLayout直接使用）
├── dashboard/
│   ├── layout.tsx          # variant="default"
│   └── page.tsx            # ダッシュボード内容
├── admin/
│   ├── layout.tsx          # variant="admin"
│   ├── page.tsx            # 管理ダッシュボード
│   └── users/
│       └── page.tsx        # admin継承
└── profile/
    ├── layout.tsx          # variant="user-profile"
    └── page.tsx            # プロフィール設定
```

### カスタマイズ例
```tsx
// app/admin/layout.tsx
import { Star } from "lucide-react"

export default function AdminLayout({ children }) {
  return (
    <BaseLayout 
      variant="admin"
      overrides={{
        sidebarWidth: "450px",  // サイドバー全体幅 (First 48px + Second 402px)
        firstSidebar: {
          brand: {
            icon: Star,
            iconBgColor: "bg-yellow-500",
            title: "Custom Admin",
            subtitle: "v2.0"
          }
        },
        secondSidebar: {
          content: <AdminTools />  // Second Sidebarにコンテンツ表示
        }
      }}
    >
      {children}
    </BaseLayout>
  )
}
```