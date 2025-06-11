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
| `admin` | 管理者画面 | Shield（赤） | 400px | 管理者メニュー、AdminSidebarContent表示 |
| `user-profile` | プロフィール | UserCircle（青） | 48px | コンパクト設定画面 |
| `public` | 公開ページ | Building（緑） | 280px | 最小限のナビゲーション |
| `minimal` | 最小構成 | - | 250px | サイドバー・フッター非表示 |

## モバイル対応

### モバイルフッター
- PC版FirstSidebarのアイコンを下部固定で表示
- 幅: 固定18rem（288px）
- 制御: `mobileFooter.hide`で表示/非表示

### モバイルSheet
- ハンバーガーメニューでSecondSidebarの内容を表示
- 幅: 固定18rem（288px）
- トグル: SidebarTriggerで開閉

## SecondSidebarコンテンツ管理

### サイドバーコンテンツの追加

```tsx
// components/sidebar-content/CustomContent.tsx
export function CustomContent() {
  return <div>カスタムコンテンツ</div>
}

// lib/sidebar-content-registry.tsx
export const sidebarContentRegistry = {
  admin: () => <AdminSidebarContent />,
  custom: () => <CustomContent />,  // 追加
}

// lib/layout-config.ts
admin: {
  secondSidebar: {
    content: getSidebarContent("admin"),
  },
}
```

## 設定可能な要素

### ヘッダー
- `title`: タイトル文字列
- `hideUserMenu`: ユーザーメニューの非表示
- `hideNotifications`: 通知エリアの非表示
- `hideSidebarTrigger`: ハンバーガーメニューの非表示
- `hideModeToggle`: テーマ切り替えボタンの非表示

### FirstSidebar
- `brand`: ブランドアイコン・ロゴ設定
- `navItems`: ナビゲーション項目
- `user`: ユーザー情報
- `hideUser`: ユーザー情報の非表示
- `hide`: サイドバー全体の非表示

### SecondSidebar
- `content`: React.ReactNodeコンテンツ

### モバイルフッター
- `hide`: モバイルフッターの非表示

### 全体レイアウト
- `sidebarWidth`: サイドバー全体幅

## ファイル構成

```
components/
├── layout/
│   ├── BaseLayout.tsx          # メインコンポーネント
│   ├── Header.tsx              # ヘッダー
│   ├── Sidebar.tsx             # サイドバー
│   ├── MobileFooter.tsx        # モバイルフッター
│   └── MobileSidebarSheet.tsx  # モバイルSheet
├── sidebar-content/
│   └── AdminSidebarContent.tsx # 管理者用コンテンツ
└── theme-provider.tsx          # テーマシステム

lib/
├── layout-config.ts            # バリアント設定
└── sidebar-content-registry.tsx # コンテンツ一元管理
```

## 実装例

### カスタマイズ例
```tsx
// app/admin/layout.tsx
const overrides: LayoutOverrides = {
  header: { title: "カスタム管理画面" },
  mobileFooter: { hide: true },  // モバイルフッター非表示
  firstSidebar: {
    brand: {
      icon: Star,
      iconBgColor: "bg-yellow-500",
      title: "Custom Admin"
    }
  }
}

return (
  <BaseLayout variant="admin" overrides={overrides}>
    {children}
  </BaseLayout>
)
```