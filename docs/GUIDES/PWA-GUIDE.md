# PWA実装ガイド - altee-core

## 🎯 目的
スマートフォンでアプリライクな表示を実現（ブラウザUI非表示）

## 📋 実装内容

### 1. app/manifest.ts 作成
```typescript
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Altee Core - モバイルアプリ',
    short_name: 'Altee',
    description: 'Next.js 15 + App Router による高性能Webアプリケーション',
    start_url: '/',
    display: 'standalone', // ブラウザUI完全非表示
    background_color: '#0f172a',
    theme_color: '#1e293b',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities'],
    lang: 'ja',
    scope: '/',
    icons: [
      { src: '/pwa/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
}
```

### 2. app/layout.tsx メタデータ追加
```typescript
export const metadata: Metadata = {
  // 既存設定...
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Altee Core',
  },
}
```

### 3. アイコン配置
```
public/pwa/
├── icon-192x192.png
└── icon-512x512.png
```

## ✅ 確認方法

### 開発時の注意
- **`npm run dev`**: PWA機能は動作しない
- **`npm run build && npm run start`**: 本番ビルドが必須

### 動作確認
1. **Chrome DevTools**: Application → Manifest で設定確認
2. **manifest.webmanifest**: `/manifest.webmanifest` にアクセス可能
3. **実機確認**: スマホで「ホーム画面に追加」→ スタンドアロンモード起動

### Lighthouse PWA診断
❌ **2024年に削除済み** - 手動確認のみ

## 🎉 実現された機能
- ✅ ホーム画面インストール
- ✅ ブラウザUI完全非表示
- ✅ アプリ風起動
- ✅ 通常ネットワーク通信（キャッシュなし）

---
*実装日: 2025-01-11*