# Tier 1 セキュリティ修正サマリー

実施日: 2026-03-18
対象: Server Actions + 認証基盤 + API Routes（CRITICAL 29件 / HIGH 55件）

---

## Phase 1: 認証基盤 (`auth.ts`)

- `allowDangerousEmailAccountLinking` を両プロバイダーから削除
- DB障害・ユーザー未発見時のフォールバックを `isActive: false` に変更（安全側倒し）
- admin role チェックを dbUser 取得後に移動し、既に ADMIN なら UPDATE スキップ
- `isEmailBlacklisted` + `findUnique` を `Promise.all` で並列化
- OAuth profile の型キャストを `Record<string, unknown>` → `OAuthProfile` に修正

## Phase 2: 認証統一

- 5ファイルの `auth()` + 手動チェックを `requireAuth()` / `requireAdmin()` に統一
- `requireAuth`/`requireAdmin` は try-catch の外に配置（`redirect()` が catch されない）
- 対象: link-type-actions, profile-actions, faq-actions, user-news-actions, admin-media-upload-actions

## Phase 3: キャッシュ無効化 + ログ

- `revalidatePath(\`/${handle}\`)` → `revalidatePath(\`/@${handle}\`)` に修正（3ファイル）
- gift-actions の全 `console.log` 削除
- user-management の PII（email）を含む console.log を userId のみに変更

## Phase 4: 入力バリデーション（バルク・ID）

- `lib/validations/shared.ts` 新規作成（`cuidSchema`, `cuidArraySchema`）
- bulk 操作に max 100 制限（user-management）
- CSV エクスポートにインジェクション対策（`escapeCsvValue`）
- user-news-admin-actions の ID パラメータに cuid 検証追加
- reorderSections に `cuidArraySchema` 適用

## Phase 5: 入力バリデーション（URL・XSS）

- LongTextSection の Markdown `<a>` に `href` プロトコル制限（`https?://` のみ）
- character.ts の platformAccount URL に `safeUrlSchema` 追加
- YouTube actions に URL 長さ制限（max 500）

## Phase 6: メディアアップロード

- サーバーサイド MIME ホワイトリスト + 10MB サイズ制限
- フォルダパス・トラバーサル防止（`FOLDER_TO_TYPE` ホワイトリスト + `..` 拒否）
- ファイル拡張子を MIME から導出（ユーザー提供ファイル名を使わない）
- `FormData.get('file')` に `instanceof File` チェック追加
- `uploadImagesAction` に max 10 ファイル / 並列度 3 制限
- `listImagesAction` で非 admin は自分の uploaderId のみ
- `deleteImageAction` のバケット名をサーバー固定値に
- `PutObjectCommand` に `CacheControl: 'public, max-age=31536000, immutable'`
- SVG sanitizer: `image`, `use` タグ削除 + `import 'server-only'` 追加
- image-processor: `import 'client-only'` 追加

## Phase 7: Webhook セキュリティ

- Twitch EventSub: `===` → `timingSafeEqual` によるタイミングセーフ比較
- YouTube PubSubHubbub: HMAC 署名検証追加（`X-Hub-Signature`）
- Health endpoint: `environment`, `service`, `version` フィールド削除 + `process.memoryUsage()` 重複呼出し修正

## Phase 8: トランザクション・データ整合性

- `createFaqCategory` / `createFaqQuestion`: count + create を `$transaction` に
- `createUserNews`: count + create を `$transaction` に
- `deleteArticle`: サムネイル + 記事削除を `$transaction` に
- `reorderRecommendedVideos`: `Promise.all` → `$transaction` に
- `deleteRecommendedVideo`: 削除 + 再採番を `$transaction` に
- `deleteUserGift`: 存在確認追加

## Phase 9: デッドコード削除 + 認可

- `platform-actions.ts` 削除（全関数未使用 + email 漏洩あり）
- `getUserProfile`: 非オーナーへの email 除外
- `getUserSections`: 非オーナーは `isVisible: true` のみ返す
- `createTwitchEventSubSubscription`: twitchUserId をクライアントからではなく DB から取得

## Phase 10: ストレージ重複 + エラーハンドリング

- `media-actions.ts`: 独自 `getS3Client()` 削除 → `lib/storage` の singleton 使用
- `cleanup-actions.ts`: `getDeletionStats` の `getAllStorageFiles` 重複呼出し解消

## Phase 11: パフォーマンス + DB スキーマ

- `stats.ts`: ネストされた `Promise.all` をフラットに並列化（8クエリ同時実行）
- `category-actions` / `tag-actions`: 関連 article に `take: 50` 制限
- Prisma スキーマ: Article に `authorId` / `thumbnailId`、UserNews に `thumbnailId` / `bodyImageId` インデックス追加

## Phase 12: Error Boundary + 残り

- `app/dashboard/error.tsx` 新規作成
- `updateUserHandle` の動的 import を静的 import に変更

---

## 検証結果

- `npx tsc --noEmit` — エラーゼロ
- `npm run lint` — エラー・警告ゼロ
- `npm run build` — ビルド成功
- `npx prisma validate` — スキーマ有効

## 未対応（要別対応）

- Prisma マイグレーション実行（インデックス追加分）: `DATABASE_URL="..." npm run db:migrate -- --name add_missing_fk_indexes`
- `allowDangerousEmailAccountLinking` 削除による既存マルチプロバイダーユーザーへの影響確認

---

# Tier 2 リファクタリングサマリー

実施日: 2026-03-19
対象: lib/, lib/queries/, lib/sections/, lib/themes/, lib/validations/, services/, types/
ソース: 4レビュードキュメント（Sessions 6-9）— CRITICAL 8件 / HIGH 26件 / MEDIUM 43件

---

## Phase 1: Structure Refactor（4ファイル）

### cookie-utils.ts → client/server 分割 + Secure フラグ (H-7, M-2)
- `lib/cookie-utils.ts` を `cookie-utils.client.ts`（document.cookie 操作）+ `cookie-utils.server.ts`（ヘッダーパース）に分割
- クライアント側の Cookie に `Secure` フラグ追加（HTTPS 時のみ）
- consumer（`NotificationIcon.tsx`）の import パスを更新

### sections/index.ts — barrel export 最適化 (H-6)
- `export * from './type-guards'` → 実際に使用される3関数のみ named export に変更
- tree-shaking 改善（未使用の型ガード関数がバンドルに含まれなくなる）

### themes/index.ts — 未使用 re-export 削除 (H-6)
- 個別プリセット定数（claymorphicWarm 等9個）の re-export を削除
- 外部コンシューマーからの参照ゼロを確認済み

### themes/preview.ts — クライアント境界 + 共通化 (M-2, M-6, M-7)
- `'use client'` ディレクティブ追加
- 重複していた CSS 変数適用 + クリーンアップロジックを `applyAndReturnCleanup()` に共通化
- CSS 変数キーの `--theme-` プレフィックス検証追加（CSS injection 対策）

---

## Phase 2: Data Layer Refactor（19ファイル）

### CRITICAL セキュリティ修正

#### link-validations.ts — ReDoS 対策 (C-1)
- ネスト量子化子（`(a+)+` 等）の検出ロジックを追加
- URL 長制限（2048）+ 無効 regex での `return false` は既に対応済み

#### youtube-pubsubhubbub.ts — Webhook 署名検証有効化 (C-1, H-3b, H-5, M-5)
- `hub.secret` パラメータ追加（`YOUTUBE_WEBHOOK_SECRET` 環境変数から取得）
- subscribe/unsubscribe の重複コード（90%同一）を `managePubSubSubscription()` に統合
- `console.log` 6箇所を全削除
- `channelId` に `encodeURIComponent()` 適用

#### youtube/route.ts — secret 未設定時の挙動修正
- `YOUTUBE_WEBHOOK_SECRET` 未設定時: `return true`（検証スキップ）→ `return false`（拒否）に変更

### server-only ガード一括追加（11ファイル）

| ファイル | 追加修正 |
|---------|---------|
| `lib/prisma.ts` | Pool 設定明示化（max, idleTimeout, connectionTimeout） |
| `lib/storage.ts` | 本番環境での credentials 必須バリデーション |
| `lib/storage-init.ts` | `console.log` 3箇所削除 |
| `lib/handle-utils.ts` | N+1 再帰クエリ → バッチクエリ化（`findMany` + `Set`） |
| `lib/queries/faq-queries.ts` | React.cache + isActive チェック + handleSchema 統合 |
| `lib/queries/news-queries.ts` | React.cache（3関数） |
| `lib/queries/video-queries.ts` | isActive チェック + handleSchema 統合 |
| `lib/queries/item-queries.ts` | React.cache + isActive チェック + handleSchema 統合 |
| `lib/sections/preset-queries.ts` | — |
| `services/twitch/twitch-api.ts` | EventSub を `Promise.all`/`Promise.allSettled` で並列化 + `encodeURIComponent` |
| `services/auth/auth.ts` | — |

### lib/queries/ 共通修正

- **handleSchema 統合**: 4ファイルの重複定義 → `lib/validations/shared.ts` の `queryHandleSchema` に集約
- **ハンドル正規化**: `normalizeHandle()`（`@`除去 + `toLowerCase()`）を全クエリに統一適用
- **React.cache()**: faq-queries, news-queries（3関数）, item-queries に追加
- **isActive チェック**: faq-queries, video-queries, item-queries に追加（BAN ユーザーのデータ非公開化）

### その他の修正

- `lib/user-data.ts` — `getUserNavData` を `React.cache()` でラップ
- `lib/validations/item.ts` — `amazonUrl` に Amazon ドメイン制約追加（`amazon.co.jp` / `amazon.com`）

---

## Phase 3: Quality Fixes（13ファイル）

### 型配置・命名修正
- `lib/themes/types.ts` — `SectionCategory` 型を `lib/sections/types.ts` から import + re-export に変更（重複定義解消）
- `types/userdata.ts` — `UserData` → `ProfileFieldData` にリネーム（`lib/layout-config.ts` の `UserData` との命名衝突回避）

### セキュリティ・データ整合性
- `lib/reserved-handles.ts` — `_next`, `serwist`, `sw` を予約語に追加（middleware `SYSTEM_ROUTES` との同期）
- `lib/theme-presets.ts` — `accentColor` に HEX カラーコード検証追加（CSS injection 対策）
- `lib/sections/background-utils.ts` — `as` 型アサーション2箇所にランタイム型チェック追加

### Dead code 削除
- `lib/sections/registry.ts` — no-op の `preloadHighPrioritySections()` 削除 + barrel から除外
- `lib/themes/registry.ts` — 未使用関数 `getThemesByBase()`, `getThemeCount()` 削除 + barrel から除外

### パフォーマンス改善
- `lib/themes/registry.ts` — `getAllThemes()` の毎回 `Array.from()` → モジュールレベルキャッシュ
- `services/youtube/youtube-api.ts` — `XMLParser` をモジュールレベルに巻き上げ + `encodeURIComponent`
- `services/niconico/niconico-api.ts` — 同上

### コード品質
- `lib/sections/type-guards.ts` — `getSectionData()` の `console.warn` 除去
- `lib/themes/compat.ts` — stale コメント（`// Phase 1.5で追加予定`）除去

---

## 検証結果

### ビルド検証（各 Phase 完了時）
- `npx tsc --noEmit` — エラーゼロ ✓
- `npm run lint` — エラー・警告ゼロ ✓
- `npm run build` — ビルド成功 ✓

### ブラウザ検証（Playwright）
- `/admin/links` — リンク管理画面正常表示、ReDoS 修正影響なし ✓
- `/dashboard/platforms` — 動画管理ページ正常、Twitch/YouTube サービス変更影響なし ✓
- `/@test123` — 公開プロフィール正常表示、queries 変更後もデータ取得 OK ✓
- `/@test123/faqs` — 実データの FAQ 正常表示、React.cache + isActive 追加の影響なし ✓
- `/demo/faqs` — デモ FAQ 正常表示 ✓

## スキップ項目（別セッションで実施推奨）

| 項目 | 理由 |
|------|------|
| `lib/layout-config.ts` 分解 (H-6) | 437行→5ファイル分解、7コンシューマの import 変更が必要。大規模構造変更 |
| `lib/lucide-icons.ts` tree-shaking (H-4) | 45アイコンの Record マップ廃止、10+コンシューマ変更が必要 |
| M-2 validations optional パターン統一 | レビューで deferred 指定 |
| M-4 characterName max 不一致 | 意図的な可能性あり（セットアップ30字/編集50字） |
| LOW 全件 (27件) | コスト対効果が低い |

## Tier 1 未対応からの完了

- ~~`YOUTUBE_WEBHOOK_SECRET` 環境変数の追加とサブスクリプション登録時の `hub.secret` 送信~~ → Tier 2 Phase 2 で対応完了

---

# Tier 3 コンポーネント層リファクタリングサマリー

実施日: 2026-03-19
対象: `components/`（共通コンポーネント層）— 3バッチ × 3フェーズ
ソース: 5レビュードキュメント（Sessions 10-14）— CRITICAL 10件 / HIGH 44件 / MEDIUM 66件 / LOW 15件

---

## Batch A: user-profile エコシステム (Sessions 10-12)

### Phase 1: Structure（RSC変換 / dynamic import）

#### `'use client'` 除去（8セクション）
- `CircularStatSection`, `ProfileCardSection`, `CharacterProfileSection`, `BarGraphSection`, `HeaderSection`, `ImageGrid2Section`, `ImageGrid3Section`, `LongTextSection`
- いずれも hooks 未使用。registry の `React.lazy()` 経由で読み込まれるためクライアント境界内だが、不要なディレクティブを除去

#### LongTextSection — react-markdown 最適化
- `react-markdown` を `next/dynamic` で遅延読み込み（~100KB+ のチャンク分離）
- `components` オブジェクトをモジュールレベル定数に巻き上げ（再レンダリング時の再生成防止）
- `img: () => null` 追加（ユーザー入力マークダウン経由の画像レンダリング防止）
- インライン Badge → `<Badge>` コンポーネント統一

#### NotificationEditModal — dynamic import
- `NotificationSettings`, `ContactSettings`, `GiftSettings` を `next/dynamic` で遅延読み込み（~1050行の未使用コード削減）
- `console.error` 除去

#### HeaderEditModal — タブ遅延読み込み
- `CharacterNameEditTab`, `NamecardEditTab` を `next/dynamic` で遅延読み込み（デフォルト `AvatarEditTab` は即時読み込み）

#### NewsSection — useSWR 化
- `useEffect` + `useState` → `useSWR` に変更（core-rules 準拠）
- 動的 Tailwind クラス（`min-[993px]:${...}`）をリテラル化（Tailwind ビルド時検出対応）

#### バレルファイル削除
- `components/user-profile/sections/index.ts` — 消費者ゼロ、即時削除
- `components/user-profile/index.ts` — 3消費者（EditableFAQClient, EditableVideosClient, EditableNewsClient）を直接 import に変更後に削除

#### その他
- `[...].sort()` → `.toSorted()` 統一（ImageGrid2, ImageGrid3）
- Badge margin `mb-3` → `mb-4` 統一（CircularStat, BarGraph）
- ProfileCardSection のインライン Badge → `<Badge>` コンポーネント

### Phase 2: Data Layer（認証 / バリデーション / hook抽出）

#### 新規ファイル作成（4ファイル）

| ファイル | 目的 |
|---------|------|
| `app/actions/content/icon-actions.ts` | `getPublicCustomIcons()` — admin 不要のカスタムアイコン取得 |
| `hooks/use-custom-icons.ts` | `useCustomIcons()` SWR hook + `resolveIconSelection()` + `getSelectedIconValue()` |
| `components/.../editors/hooks/useEditableList.ts` | 7エディタ共通のリスト管理ロジック（~700行の重複解消） |
| `lib/validations/shared.ts` に `isSafeUrl()` 追加 | URL プロトコル検証（XSS 対策） |

#### useEditableList hook 適用（7エディタ）
- FAQEditModal, LinksEditModal, LinkListEditModal, IconLinksEditModal, BarGraphEditModal, TimelineEditModal, CircularStatEditModal
- 各エディタから ~100行の共通ハンドラコード（add/delete/move/toggle/escape/fieldChange）を削除
- `nanoid` import も hook 内に移動

#### useCustomIcons hook 適用（4ファイル）
- `icon-selector.tsx`, `LinksEditModal`, `LinkListEditModal`, `IconLinksEditModal`
- 重複していた `fetchCustomIcons` ラッパー関数 + `getCustomIcons`（admin 必須）import を解消
- `handleIconChange` → `resolveIconSelection()` 共通関数
- `selectedIcon` 計算 → `getSelectedIconValue()` 共通関数

#### URL プロトコル検証（XSS 対策、6ファイル）
- `IconLinksSection`, `LinksSection`, `LinkListSection`, `CharacterProfileSection` — `href` に `isSafeUrl()` 適用
- `ImageGridCard` — `linkUrl` に `isSafeUrl()` 適用
- `LUCIDE_ICON_MAP` 直接参照 → `getLucideIcon()` 統一（3リンクセクション）

#### サーバーアクション セキュリティ（3ファイル）
- `updateThemeSettings` — namecard に Zod discriminatedUnion バリデーション追加（`/^#[0-9a-fA-F]{6}$/` でCSS injection 防止）
- `updateSection` — `data.data` に基本構造バリデーション追加（`typeof object` + non-null + non-array）
- `fetchPublicYoutubeRss` — `requireAuth()` 追加（SSRF/帯域消費対策）

#### defense-in-depth
- `YouTubeFacade` — `YOUTUBE_VIDEO_ID_PATTERN` でvideoId検証（不正な iframe src 防止）

### Phase 3: Quality（重複解消 / パターン統一 / クリーンアップ）

#### navItems 共通化
- `components/user-profile/nav-items.ts` 新規作成 — `getNavItems()` 関数
- `ProfileHeader`, `MobileBottomNav` の重複 navItems ロジックを統合

#### memo / useMemo / useCallback 除去（React Compiler 対応）
- `ProfileHeader` — `memo` + `useMemo`×2 + `useCallback`×4 除去、click handler をインライン化
- `MobileBottomNav` — `memo` + `useMemo` 除去
- `FloatingElements` — `memo` + `useCallback`×3 除去、click handler をインライン化

#### 未使用コード削除
- `EditOverlay.tsx` 削除（実コードから参照ゼロ）
- `UserProfileLayout` — 未使用 props 3つ除去（`characterImageUrl`, `bannerImageKey`, `characterBackgroundKey`）+ 全消費者（8ファイル）更新
- `CharacterImageModal` — 未使用 prop `currentCharacterImageId` 除去

#### エディタ品質修正
- `ProfileCardEditModal`, `CharacterProfileEditModal`, `YoutubeSectionModal` — `router.refresh()` + `try/catch` 追加
- `VideoGallerySectionModal` — lazy init useState
- `VideoRecommendedEditModal` — `React.ReactNode` → `ReactNode` import 修正
- `ImageHeroEditModal` — `useMemo`×3 + `useCallback`×4 除去
- `LongTextEditModal` — `console.error` 除去 + `maxLength` 追加
- `WeeklyScheduleEditModal`, `YouTubeLatestEditModal` — 定数配列をモジュールレベルに巻き上げ

#### セクション品質修正
- `YoutubeSection` — 定数値の `useMemo` 除去
- `ImageHeroSection` — `[...].sort()` → `.toSorted()` + デフォルトデータ定数化
- `VideoGallerySection` — `useMemo`/`useCallback` 除去
- `BannerImageModal` — `console.error` 2箇所除去
- `EditableSectionRenderer` — `console.warn` 除去

---

## Batch B: layout / sortable / sidebar / theme (Session 13)

### Phase 1: Structure

#### NestedSortableList.tsx (CRITICAL — 無限ループ修正)
- `useEffect` の依存配列から `childStates` を除去（effect 内で `setChildStates` を呼ぶため無限ループ）
- `initializedParentsRef` (Set) で初期化済み parent を追跡する ref ベースの方式に変更
- `React.memo` 除去（React Compiler 対応）
- `console.error` 4箇所除去
- `[...].sort()` → `.toSorted()`

#### SortableChildList.tsx (HIGH — 無限ループ修正)
- `useEffect` の依存配列から `childState.accordionOpen` を除去
- `accordionOpenRef` で現在の accordion 状態を ref 追跡
- `React.memo` 除去
- `console.error` 4箇所除去
- `[...].sort()` → `.toSorted()`

#### AdminSidebarContent.tsx — RSC 化
- `"use client"` 除去（hooks 未使用）

#### BackgroundSelector.tsx
- `ImageUploader` を `next/dynamic` で遅延読み込み
- `window.location.reload()` 2箇所 → `router.refresh()` に変更

### Phase 2: Data Layer

#### UserThemeProvider — 重複 export 解消
- `useUserTheme` hook の re-export を削除（`useUserTheme.ts` に一本化）
- 4消費者（Divider, Badge, CornerDecor, IconContainer）の import パスを更新

#### getBrandIcon 共通化
- `lib/layout-config.ts` に `getBrandIcon()` 関数を新規追加
- `Sidebar.tsx`, `MobileFooter.tsx` の重複インライン定義を解消

### Phase 3: Quality

#### SortableList.tsx — `console.error` 4箇所除去

#### Header.tsx — タイトル重複 JSX 抽出

#### Sidebar.tsx — `<a>` → `<Link>` 変更（2箇所）

#### サイドバーコンポーネント error handling
- `FontSelector`, `ThemePresetSelector`, `VisibilityToggles` — `console.error` → `toast.error` に変更
- `ThemePresetSelector` — `useMemo` 除去

#### MobileSidebarSheet.tsx — デッドコード（空の三項演算子）除去

#### catch (error) → catch {} 統一
- `NestedSortableList`, `SortableChildList`, `SortableList` — 未使用 `error` 変数を lint クリーンに

---

## Batch C: 残りの components (Session 14)

### Phase 1: Structure

#### markdown-preview.tsx (CRITICAL + HIGH — バンドルサイズ削減)
- `Prism` → `PrismLight` + 選択言語のみ登録（tsx, typescript, javascript, css, json, bash, markdown, python）
- 推定バンドル削減: ~8.9MB → 数百KB
- `<Suspense>` でラップ（ローディングフォールバック追加）

#### image-insert-modal.tsx — useSWR 化
- `useEffect` + `useState` → `useSWR` に変更
- `console.error` 除去

### Phase 2: Data Layer

#### ContentModal 共通化
- `components/notification/ContentModal.tsx` 新規作成
- `NotificationModal`, `ContactModal` を thin wrapper に変更
- `<Image>` から `unoptimized` prop 除去

#### ナビゲーション logoutAction
- `nav-user.tsx`, `nav-user-header.tsx` — `logoutAction` に `try/catch` 追加

### Phase 3: Quality

#### 削除
- `TwitchEmbed.tsx` — 実コードから参照ゼロ、削除

#### memo / useCallback 除去（React Compiler 対応）
- `item-image.tsx` — `memo` + カスタム `arePropsEqual` 除去 + `console.error` 除去
- `inline-edit.tsx` — `useCallback` 4箇所除去 + アクセシビリティ追加（`role="button"`, `tabIndex={0}`, `onKeyDown`）
- `drop-zone.tsx` — `useCallback` 4箇所除去

#### YouTubeFacade.tsx
- `priority` を prop 化（default: `false`）
- `sizes` 属性追加

#### NotificationIcon.tsx
- `useEffect` 内の冗長な `typeof window !== 'undefined'` チェック除去

---

## スキップ項目

| 項目 | 理由 |
|------|------|
| `confirm()` → AlertDialog（7 editors） | 低優先 UX、大規模変更 |
| NamecardEditTab コンポーネント分割 | MEDIUM、高リスク |
| YouTube preconnect | root layout 変更要、影響範囲広い |
| usePathname Suspense (UserProfileLayout) | dashboard 側は非動的ルートで問題なし |
| getBackgroundImages/getNamecardImages 認証 | 公開アセット（意図的） |
| useEffect reset パターン（3 files） | React 18+ 自動バッチングで許容 |
| UserProfileLayout RSC props 最小化 | データ量少、許容範囲 |
| @deprecated アノテーション | 別途マイグレーション議論が必要 |
| dnd-kit dynamic import (H-3) | 呼び出し元調査が必要、別セッションで |
| AdminSidebarContent ハードコード値 | API/データ層の追加作業が必要 |
| SerwistRegister children パターン | 動作に問題なし |
| markdown-preview XSS（admin 限定） | リスク低 |
| ImageSection/ImageSectionModal 削除 | 使用状況に矛盾あり、別途確認 |
| エディタリネーム（YoutubeSectionModal 等） | editor-registry.ts の lazy import パス変更が必要 |
| VideosProfileSection Badge import | decorations Badge が `variant="secondary"` 未対応 |

---

## 検証結果

### ビルド検証（各 Phase 完了時 + 最終）
- `npx tsc --noEmit` — エラーゼロ ✓
- `npm run lint` — エラー・警告ゼロ ✓
- `npm run build` — ビルド成功 ✓

### ブラウザ検証（MCP Playwright）

| ページ | 結果 | 確認内容 |
|--------|------|----------|
| `/@test123` | 正常 | 全セクション表示、ナビゲーション、リンク、コンソールエラーゼロ |
| `/dashboard/profile-editor` | 正常 | 全16セクション表示、編集ボタン、サイドバー |
| Gift モーダル | 正常 | `next/dynamic` で `GiftSettings` ロード成功 |
| `/dashboard` | 正常 | サイドバーナビゲーション、レイアウト |
| `/admin` | 正常 | AdminSidebarContent（RSC化後）正常表示 |
| `/admin/articles` | 正常 | 記事一覧、記事エディタ |
| 記事エディタ プレビュー | 正常 | `PrismLight` + `Suspense` 正常動作 |
| `/demo/sections` | 正常 | セクションレジストリ全22件表示 |

### 新規作成ファイル一覧

| ファイル | 目的 |
|---------|------|
| `app/actions/content/icon-actions.ts` | 認証済みユーザー用カスタムアイコン取得 |
| `hooks/use-custom-icons.ts` | SWR hook + アイコン解決ユーティリティ |
| `components/.../editors/hooks/useEditableList.ts` | 7エディタ共通リスト管理 |
| `components/user-profile/nav-items.ts` | ナビゲーションアイテム生成 |
| `components/notification/ContentModal.tsx` | 通知/連絡モーダル共通コンポーネント |
| `lib/layout-config.ts` に `getBrandIcon()` 追加 | ブランドアイコン取得の共通化 |

### 削除ファイル一覧

| ファイル | 理由 |
|---------|------|
| `components/user-profile/index.ts` | バレルファイル、tree-shaking 阻害 |
| `components/user-profile/sections/index.ts` | バレルファイル、消費者ゼロ |
| `components/user-profile/EditOverlay.tsx` | 実コード参照ゼロ |
| `components/TwitchEmbed.tsx` | 実コード参照ゼロ |

---

# Tier 4 ページレベル リファクタリングサマリー

実施日: 2026-03-20
対象: `app/dashboard/`, `app/admin/`（ページレベル）— 3バッチ × 3フェーズ
ソース: 8レビュードキュメント（Sessions 15-22）— CRITICAL 23件 / HIGH 84件 / MEDIUM 103件

---

## Batch A: Dashboard (Sessions 15-17)

### Phase 1: Structure（21ファイル変更）

#### バンドルサイズ削減 (CRITICAL ×2)
- `AddVideoSectionModal.tsx`, `AddSectionModal.tsx` — `import * as LucideIcons` → アイコンマップ方式に変更（~200KB 削減見込み）

#### コード重複解消 (CRITICAL)
- `notification-settings.tsx` + `contact-settings.tsx` — ~800行の重複 → `NotificationFormBase` 共通コンポーネント抽出
- 各設定コンポーネントが 406行 → 42行 に大幅削減

#### ハイドレーション修正 (CRITICAL)
- `setup-form.tsx` — `window.location.origin` → `process.env.NEXT_PUBLIC_DOMAIN`

#### Dynamic Import (CRITICAL+HIGH ×5)
- `EditableProfileClient.tsx` — 4モーダル（BannerImage, CharacterImage, HeaderEdit, NotificationEdit）を `next/dynamic` 化
- `FaqCategoryCard.tsx` — `SectionStylePanel`（461行）を `next/dynamic` 化
- `BasicInfoForm.tsx` — `ImageUploader` を `next/dynamic` 化
- `YouTubeTabContent.tsx`, `NewsManagementSection.tsx` — DnD コンポーネントを `next/dynamic` 化

#### RSC 変換 (MEDIUM)
- `EditableFAQClient.tsx`, `EditableNewsClient.tsx` — `'use client'` 除去（hooks 未使用）

#### ウォーターフォール解消 (HIGH)
- `TwitchTabContent.tsx` — `useEffect` Server Action 呼出し → SC で初期データ取得 + props 渡し
- `dashboard/layout.tsx` — metadata テンプレート追加

#### Date シリアライゼーション (HIGH)
- `profile-editor/page.tsx`, `videos/page.tsx` — `.toISOString()` 変換 + 未使用 include 削除

#### その他
- `ExistingItemSelector.tsx` — `useDebounce` hook 新規作成 + 適用
- `hooks/use-debounce.ts` — 汎用 debounce hook 新規作成

### Phase 2: Data Layer（13ファイル変更）

#### IDOR 脆弱性修正 (CRITICAL)
- `notification-actions.ts` — `getUserNotification(userId?)` / `markNotificationAsRead(userId)` の `userId` パラメータ削除、常に `session.user.id` 使用
- `contact-actions.ts` — `getUserContact(userId?)` の `userId` パラメータ削除
- `gift-actions.ts` — `getUserGift(userId?)` の `userId` パラメータ削除

#### 未認証アクセス修正 (CRITICAL)
- `setup/actions.ts` — `checkHandleAvailability` に `requireAuth()` 追加 + `completeUserSetup` 再実行防止ガード

#### Server Action 読み取り移行 (HIGH)
- `faqs/page.tsx` — `getFaqCategories()` Server Action → `lib/queries/faq-queries.ts` 直接クエリ
- `news/page.tsx` — `getUserNews()` → `lib/queries/news-queries.ts` 直接クエリ + upsert パターン

#### バリデーション追加 (HIGH)
- `faq-actions.ts`, `user-news-actions.ts` — `sectionSettingsSchema.safeParse` 追加

#### 認証ガード (HIGH)
- `notifications/page.tsx` — `!user.profile` チェック + リダイレクト

#### React.cache (MEDIUM)
- `lib/queries/character-queries.ts` 新規作成 — `getDashboardCharacterInfo()` を `React.cache()` ラップ

### Phase 3: Quality（18ファイル変更、1ファイル削除）

#### デッドコード削除 (HIGH)
- `UserItemCard.tsx` — 未使用ファイル削除（DragDropItemList で代替済み）
- `DeleteUserItemButton.tsx`, `EditUserItemModal.tsx` — 未使用 `userId` prop 削除

#### UI 修正 (HIGH)
- `DragDropItemList.tsx` — `confirm()` → `AlertDialog` + `window.open` に `noopener,noreferrer`
- `YouTubeTabContent.tsx` — showVideos Switch サーバー永続化 + `loading="lazy"` 追加

#### コンポーネント抽出 (HIGH)
- `PlatformNavigation.tsx` — `NiconicoIcon` 名前付きコンポーネント抽出
- FAQ コンポーネント群 — `types/faq.ts` の既存型に統一

#### loading.tsx 追加 (HIGH+MEDIUM)
- `dashboard/loading.tsx`, `items/loading.tsx`, `character/loading.tsx` — スケルトン UI 新規作成

#### メタデータ追加 (MEDIUM)
- `character/layout.tsx`, `platforms/youtube/page.tsx`, `platforms/twitch/page.tsx`, `platforms/niconico/page.tsx`

#### console.error 削除 (MEDIUM)
- `gift-settings.tsx`, `error.tsx` — `console.error` + 不要な `useEffect` 削除

---

## Batch B: Admin Core — users/articles/media (Sessions 18-19)

### Phase 1: Structure（18ファイル変更）

#### RSC 変換 (CRITICAL)
- `media/cleanup/page.tsx` — 420行 `'use client'` モノリス → SC + CC 分割
- `CleanupClient.tsx`, `StorageStatsCard.tsx`, `OrphanFilesCard.tsx`, `SoftDeletedFilesCard.tsx` 新規作成
- metadata 追加（Phase 3 から統合）

#### Date シリアライゼーション (CRITICAL+HIGH)
- `MediaTableRow.tsx` — `createdAt: Date` → `string` + `loading="lazy"` + `uploadTypeLabels` 共有化
- `MediaTableClient.tsx`, `MediaTable.tsx` — SC 境界で ISO string 変換
- `articles/components/types.ts` — Date → string 型変更
- `ArticleListServer.tsx`, `articles/[id]/page.tsx` — SC 境界で Date 変換
- `users/[id]/page.tsx` — ハイドレーション修正 + 例外ハンドリング改善
- `UserNewsAdmin.tsx` — Date 型統一

#### バンドル最適化 (HIGH)
- `MediaUploadForm.tsx` — ImageUploader `next/dynamic` 化 + `console.error` 削除（Phase 3 から統合）

#### 冗長クエリ削除 (CRITICAL)
- `media/page.tsx` — `getMediaFiles({limit:1})` → `getMediaCount()` に置換
- `media-actions.ts` — `getMediaCount()` 関数追加

#### 定数共有化
- `upload-type-labels.ts` 新規作成（共有定数ファイル）

### Phase 2: Data Layer（7ファイル変更）

#### 認証・バリデーション (HIGH)
- `user-management.ts` — 単一 ID 引数に `cuidSchema.parse()` 追加 + `console.log` 2箇所削除
- `article-actions.ts` — `categoryIds`/`tagIds` に `cuidArraySchema` 追加 + `limit` 上限クランプ（1-100）
- `user-news-admin-actions.ts` — バグ修正: `{ id: newsId }` → `{ id: validatedNewsId }`
- `cleanup-actions.ts` — `orphanKeys` に S3 キーパターン検証追加
- `media-actions.ts` — `bulkDeleteMediaFiles` に max 100 制限

#### Page 層認証 (MEDIUM)
- `admin/users/page.tsx`, `admin/articles/page.tsx` — `requireAdmin()` 追加

### Phase 3: Quality（22ファイル変更）

#### error.tsx セキュリティ統一 (HIGH)
- `components/admin/AdminErrorFallback.tsx` 新規作成 — 共通エラーフォールバック（`error.message` 非露出 + `error.digest` のみ表示）
- `users/error.tsx`, `users/[id]/error.tsx`, `articles/error.tsx`, `media/error.tsx` — `AdminErrorFallback` 適用

#### console.error/log 削除 (HIGH)
- `MediaTable.tsx` — `console.error` 削除
- `useImageProcessing.ts` — `console.warn` 削除
- `BulkActionsBar.tsx`, `HandleEditor.tsx`, `CsvExportButton.tsx` — `console.error` 削除

#### ページネーション改善 (CRITICAL+HIGH)
- `MediaPagination.tsx` — 全ページボタン → 省略記号ページャー（1 2 3 ... 48 49 50）
- `ArticleList.tsx` — 同パターン適用

#### useTransition 統一 (HIGH)
- `BulkActionsBar.tsx`, `HandleEditor.tsx`, `ArticleForm.tsx` — `useState` + manual loading → `useTransition`

#### ユーティリティ共通化 (MEDIUM)
- `lib/format-utils.ts` 新規作成 — `formatFileSize`（3箇所の重複解消）
- `types/media.ts` 新規作成 — `MediaFile`, `MediaPaginationData` 型統一

#### その他 (MEDIUM)
- `MediaFilters.tsx` — `onKeyPress` → `onKeyDown`
- `users/[id]/page.tsx` — `toLocaleDateString` に `timeZone: 'Asia/Tokyo'`
- `media/upload/page.tsx` — metadata 追加

---

## Batch C: Admin Extended — items/categories/links/attributes/managed-profiles/backgrounds/blacklist (Sessions 20-22)

### Phase 1: Structure（20ファイル変更）

#### DnD 遅延読み込み + AlertDialog (CRITICAL+HIGH)
- `PresetListClient.tsx` — `@dnd-kit` を `PresetDndTable.tsx`（新規作成）に分離 + `next/dynamic` 化 + `window.confirm()` → `AlertDialog`（Phase 3 から統合）
- `LinkTypeTable.tsx` — `@dnd-kit` を `LinkTypeDndTable.tsx`（新規作成）に分離 + `next/dynamic` 化 + `getIconUrl()` 二重呼出し修正
- `link-type-actions.ts` — `reorderLinkTypes` バッチアクション追加（N 個の UPDATE → 1 トランザクション）

#### RSC 変換 (CRITICAL+MEDIUM)
- `AttributeDashboard.tsx` — `'use client'` 除去
- `PresetPreview.tsx` — `'use client'` 除去

#### Date シリアライゼーション (HIGH ×8ファイル)
- `BlacklistTableClient.tsx` — `createdAt: Date` → `string` + `console.error` 削除 + `useTransition` 追加（Phase 3 統合）
- `BlacklistTable.tsx` — SC で ISO string 変換追加
- `section-backgrounds/page.tsx` — Date 変換 + Suspense + Server Action → 直接 Prisma クエリ移行（Phase 2 統合）
- `section-backgrounds/[id]/page.tsx` — Date 変換 + `Promise.all` 並列 await + 直接クエリ移行（Phase 2 統合）
- `attributes/categories/components/types.ts`, `tags/components/types.ts` — Date → string 型変更
- `categories/page.tsx`, `tags/page.tsx`, `categories/[id]/page.tsx`, `tags/[id]/page.tsx` — SC シリアライズ追加
- `ItemListClient.tsx`, `ItemList.tsx` — Date シリアライズ追加

#### ハイドレーション修正 (HIGH)
- `BasicInfoTab.tsx` — `new Date().toISOString()` → 固定文字列 + ImageUploader `next/dynamic` 化

### Phase 2: Data Layer（17ファイル変更）

#### 認証ガード (CRITICAL)
- `item-categories/actions.ts` — `getCategoriesAction()`, `getCategoryByIdAction()` に `requireAdmin()` 追加

#### Page 層認証追加 (CRITICAL+HIGH ×10ページ)
- `items/page.tsx`, `items/new/page.tsx`, `items/[id]/page.tsx`, `items/import/page.tsx`
- `item-categories/page.tsx`, `item-categories/new/page.tsx`, `item-categories/[id]/page.tsx`
- `managed-profiles/page.tsx`, `managed-profiles/new/page.tsx`, `managed-profiles/[id]/page.tsx`

#### バリデーション強化 (HIGH)
- `blacklist.ts` — `email.includes("@")` → `z.string().email().max(254)` Zod バリデーション
- `services/auth/auth.ts` — `isEmailBlacklisted` に `.toLowerCase().trim()` 正規化追加
- `section-background-actions.ts` — `updatePresetSortOrderAction` に `cuidSchema` 検証追加

#### Auth 強化 (HIGH)
- `attributes/layout.tsx` — `isActive` チェック追加
- `blacklist/page.tsx` — `requireAdmin()` + metadata 追加（Phase 3 統合）

#### console.log 削除 (HIGH)
- `EditLinkTypeModal.tsx` — `console.log("Icons updated:", icons)` 削除

### Phase 3: Quality（26ファイル変更）

#### error.tsx セキュリティ統一 (HIGH ×6)
- `items/error.tsx`, `item-categories/error.tsx`, `links/error.tsx`, `section-backgrounds/error.tsx`, `blacklist/error.tsx`, `attributes/error.tsx` — `AdminErrorFallback` 適用（Batch B で作成済み）
- `managed-profiles/error.tsx` 新規作成

#### console.error 削除 (HIGH)
- `AddBlacklistForm.tsx`, `ManagedProfileList.tsx`, `categories/[id]/page.tsx`, `tags/[id]/page.tsx`, `categories/page.tsx`, `tags/page.tsx`

#### useTransition 統一 (HIGH)
- `AddBlacklistForm.tsx` — `useState(isLoading)` → `useTransition`

#### コード重複解消 (HIGH)
- `AttributeForm.tsx` 新規作成 — `CategoryForm` + `TagForm`（~90%重複）の共通化
- `AttributePagination.tsx` 新規作成 — ページネーション共通化
- `CategoryForm.tsx`, `TagForm.tsx` — `AttributeForm` 使用に書き換え
- `CategoryList.tsx`, `TagList.tsx` — `AttributePagination` 使用

#### メタデータ追加 (MEDIUM)
- `admin/layout.tsx` — `metadata` テンプレート `{ template: '%s | Admin', default: '管理画面' }`
- `attributes/page.tsx` — metadata 追加

#### 型・デッドコード整理 (HIGH+MEDIUM)
- `attributes/components/types.ts` — 未使用型定義削除（ファイル削除）
- `PresetForm.tsx` — `form.watch()` → 必要フィールドのみ watch + 不要関数削除

#### その他 (MEDIUM)
- `AttributeNavigation.tsx` — 未実装アイコン import 削除（YAGNI）
- `managed-profiles/components/constants.ts` 新規作成 — `PAGE_SIZE = 20`
- `ManagedProfileList.tsx`, `ManagedProfilePagination.tsx` — `PAGE_SIZE` 定数使用

---

## スキップ項目（12件 — 計画時にスキップ決定）

| 指摘事項 | スキップ理由 |
|---------|------------|
| `isRedirectError` internal import | Next.js 内部 API、代替 (`unstable_rethrow`) も不安定 |
| `useMediaFilters` nuqs 移行 | 大規模リファクタ、別タスクとして検討 |
| `useMediaSelection` memo 削除 | React Compiler 自動最適化 |
| `generateMonthOptions` render 最適化 | React Compiler 自動最適化 |
| items/actions.ts image URL whitelist 拡張 | プロダクト判断が必要 |
| `checkIsDescendant` N+1 | admin 管理画面でカテゴリ数少量 |
| CSV import `$transaction` | 現行動作に問題なし |
| slug before validation 順序 | UI 改善レベル |
| Badge semantic 修正 | cosmetic |
| delete over-fetch | admin 画面でレコード少量 |
| PresetForm `as never` casting | 型定義見直し影響大 |
| section-backgrounds 冗長 auth | 方針決定が必要 |

---

## 新規作成ファイル一覧

| ファイル | 目的 |
|---------|------|
| `hooks/use-debounce.ts` | 汎用 debounce hook |
| `app/dashboard/notifications/notification-form-base.tsx` | 通知設定共通フォーム（~800行重複解消） |
| `app/dashboard/loading.tsx` | ダッシュボードスケルトン UI |
| `app/dashboard/items/loading.tsx` | アイテムページスケルトン UI |
| `app/dashboard/character/loading.tsx` | キャラクターページスケルトン UI |
| `lib/queries/character-queries.ts` | React.cache ラップ済みキャラクタークエリ |
| `lib/queries/news-queries.ts` に関数追加 | `getDashboardNews`, `getDashboardNewsSection` |
| `lib/queries/faq-queries.ts` に関数追加 | `getDashboardFaqCategories` |
| `app/admin/media/cleanup/components/CleanupClient.tsx` | クリーンアップ操作 UI（CC） |
| `app/admin/media/cleanup/components/StorageStatsCard.tsx` | ストレージ統計カード |
| `app/admin/media/cleanup/components/OrphanFilesCard.tsx` | 孤立ファイル管理カード |
| `app/admin/media/cleanup/components/SoftDeletedFilesCard.tsx` | 論理削除ファイル管理カード |
| `app/admin/media/components/shared/upload-type-labels.ts` | アップロードタイプラベル共有定数 |
| `components/admin/AdminErrorFallback.tsx` | Admin 共通エラーフォールバック |
| `lib/format-utils.ts` | `formatFileSize` ユーティリティ |
| `types/media.ts` | `MediaFile`, `MediaPaginationData` 統一型 |
| `app/admin/links/components/LinkTypeDndTable.tsx` | リンク DnD テーブル（分離） |
| `app/admin/section-backgrounds/components/PresetDndTable.tsx` | プリセット DnD テーブル（分離） |
| `app/admin/attributes/components/AttributeForm.tsx` | カテゴリ/タグ共通フォーム |
| `app/admin/attributes/components/AttributePagination.tsx` | 属性ページネーション共通 |
| `app/admin/managed-profiles/components/constants.ts` | `PAGE_SIZE` 定数 |
| `app/admin/managed-profiles/error.tsx` | エラーバウンダリ |
| `app/admin/attributes/error.tsx` | エラーバウンダリ |
| error.tsx ×5 | items, item-categories, links, section-backgrounds, blacklist |

## 削除ファイル一覧

| ファイル | 理由 |
|---------|------|
| `app/dashboard/items/components/UserItemCard.tsx` | DragDropItemList で代替済み |
| `app/admin/attributes/components/types.ts` | 未使用型定義 |

---

## 検証結果

### ビルド検証（各 Phase 完了時 — 計9回）
- `npx tsc --noEmit` — エラーゼロ ✓
- `npm run lint` — 新規エラーゼロ ✓
- `npm run build` — ビルド成功 ✓

### ブラウザ検証（MCP Playwright）

| ページ | 結果 | 確認内容 |
|--------|------|----------|
| `/dashboard` | PASS | レイアウト、ナビゲーション正常 |
| `/dashboard/faqs` | PASS | FAQ 管理、カテゴリ操作正常 |
| `/dashboard/notifications` | PASS | NotificationFormBase リファクタ後正常 |
| `/admin/media` | PASS | テーブル、ページネーション、日付表示正常 |
| `/admin/attributes` | PASS | AttributeDashboard RSC 化後正常 |
| `/admin/section-backgrounds` | PASS | 直接クエリ移行後正常 |
| `/admin/blacklist` | PASS | Zod バリデーション強化後正常 |
| `/admin/links` | PASS | DnD 遅延読込み後正常 |

コンソールエラー: 全ページ 0件

### コミット一覧

| コミット | 内容 |
|---------|------|
| `15719fa` | refactor(dashboard): Phase 1 - structure refactor |
| `52fc833` | refactor(dashboard): Phase 2 - data layer refactor |
| `b257fc5` | refactor(dashboard): Phase 3 - quality fixes |
| `31b3520` | refactor(admin-core): Phase 1 - structure refactor |
| `cb72c1f` | refactor(admin-core): Phase 2 - data layer refactor |
| `81feb6b` | refactor(admin-core): Phase 3 - quality fixes |
| `2220953` | refactor(admin-ext): Phase 1 - structure refactor |
| `6fc70f0` | refactor(admin-ext): Phase 2 - data layer refactor |
| `1d4a1d3` | refactor(admin-ext): Phase 3 - quality fixes |

---

# Tier 5 キャップストーン リファクタリングサマリー

実施日: 2026-03-20
対象: `types/`, `hooks/`, `constants/`, `prisma/schema.prisma`（型定義・フック・定数・スキーマ）
ソース: 1レビュードキュメント（Session 23）— CRITICAL 4件 / HIGH 12件 / MEDIUM 17件

---

## Phase 1: Structure Refactor（6ファイル変更、3ファイル新規作成）

### `'use client'` ディレクティブ追加 (CRITICAL ×3)
- `hooks/use-mobile.ts`, `hooks/use-debounce.ts`, `hooks/use-custom-icons.ts` — いずれもクライアント専用フック（useState/useEffect/useSWR 使用）にディレクティブ欠落

### use-mobile.ts — Layout thrashing 修正 (HIGH)
- `window.innerWidth` → `MediaQueryListEvent.matches` に変更
- 初期値も `mql.matches` 使用に統一

### constants/pc-build — JSX → コンポーネント参照マップ (HIGH)
- `partTypeIcons: Record<PcPartType, React.ReactNode>`（JSX 定数）→ `partTypeIconComponents: Record<PcPartType, LucideIcon>`
- `.tsx` → `.ts` にリネーム、`'use client'` 不要に
- call site 3箇所（`PcPartsList`, `PcBuildManagementSection`, `PartsListCard`）更新

### types/faq.ts — レイヤー逆転解消 + 型統一 (HIGH ×3)
- `@/components/sortable-list/types` → `types/sortable.ts` に型移動（逆依存解消）
- `createdAt`/`updatedAt` を `Date` → `Date | string` に統一
- デッドタイプ削除: `FaqCategory`, `FaqQuestion`, `FaqValidationFunction`

### types/profile-sections.ts — 型統一 + 重複解消 (HIGH + MEDIUM ×2)
- `UserSection.createdAt/updatedAt` を `Date | string` に統一
- `YouTubeRecommendedData` + `NiconicoRecommendedData` → `VideoRecommendedData` に統合
- `DEFAULT_THEME_SETTINGS` のコメント/実値不一致を修正

### CustomIcon 型分離 (MEDIUM)
- `types/icon.ts` 新規作成 — admin actions への不適切な型依存を解消

---

## Phase 2: Data Layer Refactor（2ファイル変更）

### useGuestPcBuild — Zod バリデーション + kebab-case (HIGH ×3)
- `JSON.parse(stored) as GuestPcBuild` → `guestPcBuildSchema.safeParse()` でバリデーション（localStorage 改ざん対策）
- `useGuestPcBuild.ts` → `use-guest-pc-build.ts` にリネーム（命名規則統一）
- ※遅延初期化はハイドレーション問題により元の useEffect パターンを維持

### faq-queries.ts — React.cache() 追加 (MEDIUM)
- `getDashboardFaqCategories` を `cache()` でラップ（他の公開クエリと統一）

---

## Phase 3: Quality Fixes（9ファイル変更）

### faq-actions.ts — revalidatePath 修正 (CRITICAL)
- `"/dashboard/faq"` → `"/dashboard/faqs"` に修正（6箇所）
- `reorderFaqCategories`, `reorderFaqQuestions` に `revalidatePath` 追加（2箇所）

### prisma/schema.prisma — onDelete + FK + インデックス (HIGH ×3 + MEDIUM ×2)
- `Article.author`: `authorId` nullable 化 + `onDelete: SetNull`
- `Article.thumbnail`: `onDelete: SetNull`
- `MediaFile.uploader`: `uploaderId` nullable 化 + `onDelete: SetNull`
- `TwitchEventSubSubscription`: `user User @relation(onDelete: Cascade)` 追加
- FAQ 複合インデックス: `@@index([userId, sortOrder])`, `@@index([categoryId, sortOrder])`
- UserNews インデックス: `@@index([userId, published, sortOrder])`

### 共有型 AttachedImage 作成 + デッドタイプ削除 (MEDIUM)
- `types/media.ts` に `AttachedImage` 追加 — contacts, gift, notifications の画像インライン型を統合
- `MediaFile` → `AdminMediaFileView` リネーム（Prisma 名前衝突回避）
- contacts.ts: `ContactApiResponse`, `ContactDisplay`, `ContactStatus` 削除
- gift.ts: `GiftApiResponse`, `GiftDisplay` 削除
- notifications.ts: `NotificationApiResponse`, `NotificationDisplay`, `NotificationStatus` 削除
- platform.ts: `VideoCardData`, `LiveStreamData`, `LivePriority` 削除

### use-video-list-editor.ts — stale closure 修正 (MEDIUM)
- `setItems([...items, newItem])` → `setItems((prev) => [...prev, newItem])`

### useCatalogSearch.ts → use-catalog-search.ts (HIGH)
- kebab-case リネーム + import パス更新

---

## スキップ項目（4件）

| 指摘事項 | スキップ理由 |
|---------|------------|
| `types/next-auth.d.ts` JWT isActive | セッション無効化は認証アーキテクチャの大規模変更が必要 |
| `types/media.ts` email 露出 | 型変更では対応不可、運用レベルの確認が必要 |
| `types/link-type.ts` ReDoS リスク | 正規表現複雑度チェックは型ファイルの範囲外 |
| `types/profile-sections.ts` CSS injection | サーバーサイドのホワイトリスト検証が必要 |

---

## 新規作成ファイル一覧

| ファイル | 目的 |
|---------|------|
| `types/icon.ts` | `CustomIcon` 型（admin 依存解消） |
| `types/sortable.ts` | `SortableParentItem` / `SortableChildItem`（レイヤー逆転解消） |
| `constants/pc-build.ts` | コンポーネント参照マップ（`.tsx` → `.ts`） |

## 削除ファイル一覧

| ファイル | 理由 |
|---------|------|
| `constants/pc-build.tsx` | `.ts` に置換（JSX 不要に） |

---

## 検証結果

### ビルド検証（各 Phase 完了時 — 計3回 + 修正1回）
- `npx tsc --noEmit` — エラーゼロ ✓
- `npm run build` — ビルド成功 ✓
- `npx prisma validate` — スキーマ有効 ✓

### ブラウザ検証（MCP Playwright）

| ページ | 結果 | 確認内容 |
|--------|------|----------|
| `/tools/pc-builder` | PASS | ハイドレーションエラー検出→修正→再検証 OK |
| `/dashboard/faqs` | PASS | FAQ 管理、コンソールエラーゼロ |
| `/admin/media` | PASS（既存） | テーブル正常表示、日付 TZ エラーは既存 |
| `/dashboard/items` | PASS | アイテム管理、PC Specs タブ正常 |

### コミット一覧

| コミット | 内容 |
|---------|------|
| `c66d55d` | refactor(types-hooks-constants): Phase 1 - structure refactor |
| `dfd4cbd` | refactor(types-hooks-constants): Phase 2 - data layer refactor |
| `177e67a` | refactor(types-hooks-constants): Phase 3 - quality fixes |
| `5af09cd` | fix(types-hooks-constants): browser verification fix |

## 未対応（要別対応）

- Prisma マイグレーション実行（onDelete + FK + インデックス変更分）: `DATABASE_URL="..." npm run db:migrate -- --name add_ondelte_fk_indexes`

---

# スキップ項目精査 & 残修正

実施日: 2026-03-20
対象: Tier 1〜5 全23セッションでスキップされた36件を精査し、対応要の6件を修正

---

## 精査結果

| 判定 | 件数 |
|------|------|
| **FIX（対応済み）** | 6件 |
| **DEFER（将来対応）** | 7件 |
| **SKIP（対応不要）** | 15件 |
| **NON-ISSUE（問題なし）** | 8件 |

---

## Phase 1: バグ修正 & セキュリティ

### 1-1. characterName max 不一致修正
- `lib/validations/character.ts` — `characterName` の `max(50)` を `max(30)` に変更
- 他3箇所（setup, profile-actions, managed-profiles）で `max(30)` だったものと統一

### 1-2. Prisma マイグレーション
- Tier 1（インデックス追加）+ Tier 5（onDelete, FK, インデックス追加）のスキーマ変更は `schema.prisma` に反映済み
- マイグレーション生成は DB 接続が必要なため手動実行: `docker compose -f compose.dev.yaml up -d && DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:migrate -- --name add_indexes_and_ondelete_policies`

---

## Phase 2: UX 改善

### 2-1. confirm() → AlertDialog（useEditableList + 7エディタ）
- `useEditableList.ts` — `confirm()` を削除し、コールバックパターンに変更:
  - `deleteTargetId` state 追加
  - `requestDelete(id)` — AlertDialog を開く
  - `confirmDelete()` — 実際の削除を実行
  - `cancelDelete()` — AlertDialog を閉じる
- 7エディタに AlertDialog JSX を追加:
  - `FAQEditModal.tsx`
  - `LinkListEditModal.tsx`
  - `LinksEditModal.tsx`
  - `CircularStatEditModal.tsx`
  - `IconLinksEditModal.tsx`
  - `TimelineEditModal.tsx`
  - `BarGraphEditModal.tsx`
- 既存パターン（`DragDropItemList.tsx` の AlertDialog）を踏襲

---

## Phase 3: コード品質 & パフォーマンス

### 3-1. layout-config.ts 分解（445行 → 3ファイル）
- `lib/config/layout-types.ts` — 型定義 + iconMap + IconName + getBrandIcon（117行）
- `lib/config/layout-defaults.ts` — デフォルト設定値 + mergeLayoutConfig（56行）
- `lib/config/layout-variants.ts` — ナビゲーション定義 + layoutConfigs + getLayoutConfig（262行）
- `lib/layout-config.ts` — 後方互換 re-export（7コンシューマの import パス変更不要）

### 3-2. validations .optional().nullable() → .nullish()
- 4ファイル × 計40箇所を一括置換:
  - `lib/validations/character.ts` — 21箇所
  - `lib/validations/pc-build.ts` — 6箇所
  - `lib/validations/item.ts` — 10箇所
  - `lib/validations/pc-part-specs.ts` — 3箇所
- `.nullish()` は `.optional().nullable()` とセマンティクス同一（`undefined | null` を許容）

### 3-3. YouTube preconnect 追加
- `app/layout.tsx` — `<head>` に `<link rel="preconnect">` 追加:
  - `https://www.youtube.com`（YouTube 埋め込み iframe）
  - `https://i.ytimg.com`（YouTube サムネイル画像）

---

## 新規作成ファイル一覧

| ファイル | 目的 |
|---------|------|
| `lib/config/layout-types.ts` | レイアウト型定義 + アイコンマッピング |
| `lib/config/layout-defaults.ts` | デフォルト設定値 + マージ関数 |
| `lib/config/layout-variants.ts` | レイアウトバリアント定義 + 取得関数 |

---

## DEFER（将来対応）7件

| 項目 | 理由 |
|------|------|
| `lib/lucide-icons.ts` tree-shaking | 112行・48アイコン・10コンシューマ。ROI 低 |
| dnd-kit dynamic import（残り18ファイル） | 高価値の2件は Tier 4 で完了。残りは共有コンポーネントで影響大 |
| NamecardEditTab 分割（411行） | 自己完結したタブ。新機能追加時に検討 |
| ImageSection/ImageSectionModal 削除 | 参照ゼロだが将来用か不明 |
| PresetForm `as never` casting | スキーマ再設計が必要 |
| @deprecated アノテーション追加 | 非推奨コンポーネント判明時に個別対応 |
| `useMediaFilters` nuqs 移行 | 検索 UX 改善時に検討 |

---

## 検証結果

- `npx tsc --noEmit` — エラーゼロ ✓
- `npm run build` — ビルド成功 ✓

## 未対応（要別対応）

- Prisma マイグレーション実行: `DATABASE_URL="..." npm run db:migrate -- --name add_indexes_and_ondelete_policies`
