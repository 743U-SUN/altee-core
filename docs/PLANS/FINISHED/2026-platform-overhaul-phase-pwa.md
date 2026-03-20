# Phase 1.5 (PWA対応): Serwist導入計画

> **親計画**: [2026-platform-overhaul.md](./2026-platform-overhaul.md)
> **作成日**: 2026-02-24
> **見積もり**: 1-2日
> **依存関係**: Phase 1完了後に開始（Phase 1.5として位置づけ）
> **ステータス**: ✅ 完了

---

## 概要

VTuber・配信者向けプロフィールページの大幅リデザイン計画（2026-platform-overhaul）において、公式PWA機能を提供します。
PWA対応により、スマートフォンでのネイティブアプリ化（ホーム画面追加）、プッシュ通知の基盤構築、パフォーマンスのさらなる向上（キャッシュ）を実現します。

Next.js 16 (App Router + Turbopack) 環境に適合する `@serwist/turbopack` を使用して実装します。

> **Note**: Next.js 16ではbuild時もTurbopackがデフォルトのため、`@serwist/next`ではなく`@serwist/turbopack`を使用します。

---

## タスク一覧

### PWA.1 パッケージのインストール（優先度: HIGH）✅

**見積もり**: 0.1日

#### 作業手順

```bash
npm i -D @serwist/turbopack esbuild esbuild-wasm serwist
```

#### 検証
- [x] `package.json` に `@serwist/turbopack` が追加されている
- [x] `esbuild` と `esbuild-wasm` がインストールされている

---

### PWA.2 Serwistプラグインの設定（優先度: HIGH）✅

**依存**: PWA.1
**見積もり**: 0.5日

#### 作業手順
`next.config.ts` を編集し、Serwistのプラグインでラップします。

```typescript
import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  // 既存の構成
};

export default withSerwist(nextConfig);
```

#### 検証
- [x] 開発サーバー起動時にエラーが出ない
- [x] `npm run build` が正常に完了する

---

### PWA.3 Route Handlerの作成（優先度: HIGH）✅

**依存**: PWA.2
**見積もり**: 0.5日

#### 作業手順
`app/serwist/[path]/route.ts` を作成し、Service Workerのルーティングを設定します。

```typescript
import { createSerwistRoute } from "@serwist/turbopack";

export const {
  dynamic,
  dynamicParams,
  revalidate,
  generateStaticParams,
  GET,
} = createSerwistRoute({
  swSrc: "app/sw.ts",
  additionalPrecacheEntries: [],
});
```

#### 検証
- [x] 型エラーが発生しない
- [x] ビルド後に `/serwist/sw.js` と `/serwist/sw.js.map` が生成される

---

### PWA.4 Service Workerの作成（優先度: HIGH）✅

**依存**: PWA.3
**見積もり**: 0.3日

#### 作業手順
`app/sw.ts` を作成し、PWAのキャッシュ戦略を定義します。

```typescript
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

#### 検証
- [x] 型エラーが発生しない

---

### PWA.5 SerwistRegisterコンポーネント（優先度: HIGH）✅

**依存**: PWA.4
**見積もり**: 0.3日

#### 作業手順
`components/pwa/SerwistRegister.tsx` を作成し、`@serwist/window`でService Workerを登録します。

```typescript
"use client";

import { useEffect } from "react";
import { Serwist } from "@serwist/window";

export function SerwistRegister({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const sw = new Serwist("/serwist/sw.js", { scope: "/", type: "classic" });
      sw.register();
    }
  }, []);

  return <>{children}</>;
}
```

`app/layout.tsx` でラップ:
```typescript
import { SerwistRegister } from "@/components/pwa/SerwistRegister";

// body内で
<SerwistRegister>
  {/* 他のProviders */}
</SerwistRegister>
```

#### 検証
- [x] 型エラーが発生しない

---

### PWA.6 マニフェストとメタデータ設定（優先度: HIGH）✅

**依存**: PWA.5
**見積もり**: 0.3日

#### 作業手順
1. `app/manifest.ts` をPWA要件に合わせて拡張（アイコンパス、色設定など）
2. `public/pwa/` ディレクトリに必要なサイズ（192x192, 512x512）のアプリアイコン画像を配置
3. `app/layout.tsx` の `viewport` に `themeColor` を追加、`metadata` に `icons` を追加

#### 検証
- [x] Chrome DevTools の Application > Manifest タブでエラーがない
- [x] Application > Service Workers で `sw.js` がアクティブになっている
- [ ] Chrome で「アプリをインストール」プロンプト（またはアイコン）が表示される（本番環境で確認）

---

## 完了チェックリスト

- [x] `@serwist/turbopack` がインストール・設定されている
- [x] `next.config.ts` に設定が統合されている
- [x] `app/serwist/[path]/route.ts` でService Workerルーティングが設定されている
- [x] `app/sw.ts` にキャッシュ戦略が定義されている
- [x] `components/pwa/SerwistRegister.tsx` でService Workerが登録される
- [x] `app/manifest.ts` が要件を満たすPWA用情報を返している
- [x] プロダクションビルド（`npm run build`）が成功する
- [ ] PWAとしてインストール可能かどうか（Lighthouse PWA検証）をパスする（本番環境で確認）

---

## ファイル構成

```
app/
├── sw.ts                           # Service Worker
├── serwist/
│   └── [path]/
│       └── route.ts                # Serwist Route Handler
├── manifest.ts                     # PWA Manifest
└── layout.tsx                      # SerwistRegisterでラップ

components/
└── pwa/
    └── SerwistRegister.tsx         # Service Worker登録コンポーネント

public/
└── pwa/
    ├── icon-192x192.png
    └── icon-512x512.png
```

---

## 親計画（2026-platform-overhaul.md）への統合方針

このフェーズはインフラ基盤に関わるため、**Phase 1直後（Phase 1.5）** に実施しました。

**理由:**
1. Phase 1（テーマシステム）とは直接的な依存関係がない
2. Phase 2以降のセクションシステム実装時にキャッシュ効果を検証可能
3. 見積もり1-2日と短く、全体スケジュールへの影響が小さい

**Phase順序:**
```
Phase 0 → Phase 1 → Phase 1.5 (PWA) ✅ → Phase 2 → ...
```
