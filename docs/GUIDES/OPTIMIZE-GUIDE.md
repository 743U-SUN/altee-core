# パフォーマンス最適化ガイド - altee-core

## 🚀 Dynamic Imports最適化

### 実装済み最適化

**1. AdminSidebarContent（最高優先度）**
- ファイル: `lib/sidebar-content-registry.tsx`
- 理由: 管理者専用機能、一般ユーザーには不要
- 設定: `ssr: false`, loading状態あり

**2. MobileSidebarSheet（高優先度）**
- ファイル: `components/layout/Sidebar.tsx`
- 理由: モバイル専用コンポーネント、デスクトップでは不要
- 設定: `ssr: false`, loading状態なし

**3. MobileFooter（高優先度）**
- ファイル: `components/layout/BaseLayout.tsx`
- 理由: モバイル専用フッター、デスクトップでは不要
- 設定: `ssr: false`, loading状態なし

**4. NavUserHeader（中優先度）**
- ファイル: `components/layout/Header.tsx`
- 理由: ユーザー操作時のみ必要なドロップダウンメニュー
- 設定: `ssr: false`, アバター風loading状態

**5. NavUser（中優先度）**
- ファイル: `components/layout/Sidebar.tsx`
- 理由: ユーザー操作時のみ必要なドロップダウンメニュー
- 設定: `ssr: false`, loading状態あり

**6. ModeToggle（低優先度）**
- ファイル: `components/layout/Header.tsx`
- 理由: 使用頻度が低いテーマ切り替え機能
- 設定: `ssr: false`, ボタン風loading状態

### 最適化パターン

**管理者専用コンポーネント**
```typescript
const AdminComponent = dynamic(
  () => import("./AdminComponent").then(mod => ({ default: mod.AdminComponent })),
  { 
    loading: () => <div className="p-4 animate-pulse">Loading...</div>,
    ssr: false
  }
)
```

**モバイル専用コンポーネント**
```typescript
const MobileComponent = dynamic(
  () => import("./MobileComponent").then(mod => ({ default: mod.MobileComponent })),
  { 
    loading: () => null,
    ssr: false
  }
)
```

**ユーザー操作コンポーネント**
```typescript
const InteractiveComponent = dynamic(
  () => import("./InteractiveComponent").then(mod => ({ default: mod.InteractiveComponent })),
  { 
    loading: () => <div className="w-8 h-8 bg-muted animate-pulse rounded" />,
    ssr: false
  }
)
```

### 効果

- **初期バンドルサイズ削減**: 管理者専用・モバイル専用コンポーネントを分離
- **読み込み速度向上**: 必要時のみコンポーネントを読み込み
- **UX改善**: 適切なloading状態でユーザー体験を維持

### 注意点

- `ssr: false`設定により、サーバーサイドレンダリングを無効化
- loading状態は視覚的フィードバックを提供
- YAGNIの原則に従い、実際に使用中のコンポーネントのみ最適化

---
*実装日: 2025-06-11*