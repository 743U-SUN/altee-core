# Phase 4: セクションコンポーネント - 詳細計画

> **親計画**: [2026-platform-overhaul.md](./2026-platform-overhaul.md)
> **作成日**: 2026-02-25
> **見積もり**: 6.5日
> **依存関係**: Phase 3（1カラムレイアウト）完了後に開始

---

## 概要

Phase 4はセクションコンポーネントの拡張・統一フェーズです。CharacterProfileSection（キャラクター画像+プロフィール情報）を新規作成し、既存セクションをThemedCardベースに統一します。

**主な成果物**:
- CharacterProfileSection.tsx（新規）
- 既存セクションのThemedCard統一
- テーマ装飾（Badge/CornerDecor）の統一適用
- エディタモーダルの追加・更新

---

## 現状分析

### ThemedCard使用状況

| セクション | ThemedCard | 現状 |
|------------|------------|------|
| ProfileCardSection | ✅ YES | 基本パターン実装済み |
| FAQSection | ✅ YES | タイトルバッジ付き |
| BarGraphSection | ✅ YES | タイトルバッジ付き |
| CircularStatSection | ✅ YES | グリッドレイアウト |
| TimelineSection | ✅ YES | 複雑なレイアウト |
| LongTextSection | ✅ YES | Markdown対応 |
| WeeklyScheduleSection | ✅ YES | 背景画像対応 |
| **LinksSection** | ❌ NO | CSS変数直接使用 |
| **LinkListSection** | ❌ NO | 独自スタイル |
| **IconLinksSection** | ❌ NO | 独自スタイル |
| **ImageHeroSection** | ❌ NO | 画像特化 |
| **ImageGrid2/3Section** | ❌ NO | ImageGridCard使用 |
| **HeaderSection** | ❌ NO | 見出しのみ |
| **YoutubeSection** | ❌ NO | 動画埋め込み |
| **VideoGallerySection** | ❌ NO | 動画ギャラリー |

### 既存基盤（Phase 2完了）

- `components/sections/_shared/ThemedCard.tsx` - size/hover/cornerDecor対応
- `components/profile/SectionWrapper.tsx` - large(1200px)/medium(720px)
- `components/profile/SectionRenderer.tsx` - Suspense + ErrorBoundary統合
- `components/decorations/` - Badge, CornerDecor, IconContainer, Divider
- `lib/sections/registry.ts` - 17セクション登録済み

---

## タスク詳細

### 4.1 CharacterProfileSection新規作成 (HIGH) - 2日

Phase 3で廃止したCharacterColumn（キャラクター画像）を、セクションとして復活させる。

#### 4.1.1 型定義の追加 (0.5h)

**ファイル**: `types/profile-sections.ts`

```typescript
export interface CharacterProfileData {
  characterImageKey?: string        // キャラクター画像（9:16縦長）
  characterBackgroundKey?: string   // 背景画像（オプション）
  name: string                      // キャラクター名
  tagline?: string                  // キャッチコピー
  bio?: string                      // 自己紹介文
  badgeLeft?: string                // 左バッジ
  badgeRight?: string               // 右バッジ
  characterPosition: 'left' | 'right'  // キャラ画像位置
  showSocialLinks: boolean          // SNSリンク表示
}
```

#### 4.1.2 レジストリ登録 (0.5h)

**ファイル**: `lib/sections/registry.ts`

```typescript
'character-profile': {
  type: 'character-profile',
  label: 'キャラクタープロフィール',
  icon: 'UserCircle',
  description: 'キャラクター画像付きプロフィール',
  category: 'main',
  width: 'large',  // 1200px
  priority: 'high',
  maxInstances: 1,
  component: lazy(() => import('@/components/user-profile/sections/CharacterProfileSection').then(m => ({ default: m.CharacterProfileSection }))),
  defaultData: {
    name: 'Character Name',
    tagline: 'Tagline / Catch Copy',
    bio: '',
    badgeLeft: '',
    badgeRight: '',
    characterPosition: 'left',
    showSocialLinks: false,
  },
}
```

#### 4.1.3 コンポーネント実装 (6h)

**ファイル**: `components/user-profile/sections/CharacterProfileSection.tsx`

**レイアウト設計**:

```
PC Layout (characterPosition: 'left'):
┌─────────────────────────────────────────────┐
│ ┌─────────┐  ┌────────────────────────────┐ │
│ │         │  │ [Badge Left] — [Badge Right]│ │
│ │ Char    │  │ Character Name              │ │
│ │ Image   │  │ Tagline                     │ │
│ │ (9:16)  │  │ Bio...                      │ │
│ │         │  │                             │ │
│ │         │  │ [Social Links]              │ │
│ └─────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────┘

Mobile Layout:
┌─────────────────────┐
│ ┌─────────────────┐ │
│ │   Char Image    │ │
│ │     (9:16)      │ │
│ └─────────────────┘ │
│ [Badge] — [Badge]   │
│ Character Name      │
│ Tagline             │
│ Bio...              │
│ [Social Links]      │
└─────────────────────┘
```

**実装ポイント**:
- ThemedCard使用（showCornerDecor対応）
- レスポンシブ: lg:flex-row / flex-col
- キャラクター画像: aspect-[9/16], object-cover
- 背景画像: absolute + blur処理
- Badgeコンポーネント使用

#### 4.1.4 型ガード追加 (0.5h)

**ファイル**: `lib/sections/type-guards.ts`

```typescript
export function isCharacterProfileData(data: unknown): data is CharacterProfileData {
  return isRecord(data) && hasStringProp(data, 'name')
}
```

#### 4.1.5 エディタモーダル実装 (4h)

**ファイル**: `components/user-profile/sections/editors/CharacterProfileEditModal.tsx`

**機能**:
- 画像アップローダー（キャラ画像 + 背景画像）
- テキスト入力（名前、タグライン、bio）
- バッジ設定
- 位置切り替え（left/right）
- SNSリンク表示トグル

---

### 4.2 既存セクションThemedCard統一 (HIGH) - 1.5日

#### 4.2.1 LinksSection更新 (2h)

**ファイル**: `components/user-profile/sections/LinksSection.tsx`

**現状**: CSS変数を直接使用
```typescript
<a className="bg-[var(--theme-card-bg)] rounded-[var(--theme-card-radius)] ..."
   style={{ boxShadow: 'var(--theme-card-shadow)' }}>
```

**変更方針**:
- 全体ラッパーをThemedCard化
- 各リンクアイテムはThemedCardの内部要素として維持
- hover効果をテーマから取得

```typescript
<ThemedCard size="md" className="w-full mb-6">
  {section.title && <Badge variant="accent">{section.title}</Badge>}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {data.items.map((link) => (
      <a key={link.id} className="flex items-center gap-4 p-4 rounded-lg hover:bg-theme-bar-bg/50 transition-colors">
        {/* 内容 */}
      </a>
    ))}
  </div>
</ThemedCard>
```

#### 4.2.2 LinkListSection更新 (2h)

**ファイル**: `components/user-profile/sections/LinkListSection.tsx`

LinksSection同様にThemedCard化。カード形式のリンク一覧。

#### 4.2.3 IconLinksSection更新 (1h)

**ファイル**: `components/user-profile/sections/IconLinksSection.tsx`

全体ラッパーのみThemedCard化。アイコン個別スタイルは現状維持。

#### 4.2.4 HeaderSection更新 (1h)

**ファイル**: `components/user-profile/sections/HeaderSection.tsx`

**変更方針**:
- h2: ThemedCard + showCornerDecor
- h3/h4: 軽量スタイル維持（ThemedCard不使用）

#### 4.2.5 YoutubeSection更新 (1.5h)

**ファイル**: `components/user-profile/sections/YoutubeSection.tsx`

ThemedCard化 + タイトル表示時のBadge統一。

#### 4.2.6 VideoGallerySection更新 (1.5h)

**ファイル**: `components/user-profile/sections/VideoGallerySection.tsx`

メイン動画エリアをThemedCard化。

---

### 4.3 ImageHeroSection更新 (MEDIUM) - 0.5日

#### 4.3.1 幅Large対応確認 (1h)

- registryでwidth: 'large'設定済み ✅
- SectionWrapper経由で1200px適用確認

#### 4.3.2 hover効果テーマ連動 (2h)

**変更方針**:
- 画像本体はThemedCard不使用（視覚的に不自然）
- hover効果をテーマから取得して適用

```typescript
const { getDecoration } = useUserTheme()
const hoverEffect = getDecoration('cardHover')

// HOVER_CLASSESマップを使用
const hoverClass = HOVER_CLASSES[hoverEffect] ?? ''
```

---

### 4.4 FAQSection更新 (MEDIUM) - 0.5日

#### 4.4.1 CornerDecor対応 (1h)

**現状**: ThemedCard使用済み（showCornerDecor未使用）
**変更**: `showCornerDecor={true}` 追加

```typescript
<ThemedCard showCornerDecor className="w-full mb-6">
```

#### 4.4.2 Badgeコンポーネント統一 (1h)

**現状**: 手動スタイリング
```typescript
<span className="inline-block px-3 py-1 rounded-full mb-4 text-xs font-bold bg-[var(--theme-accent-bg)] text-[var(--theme-text-accent)]">
```

**変更**: Badgeコンポーネント使用
```typescript
import { Badge } from '@/components/decorations'
<Badge variant="accent">{section.title}</Badge>
```

#### 4.4.3 Divider対応 (1h)

Q&A項目間の区切り線をDividerコンポーネントで統一。

---

### 4.5 残りセクション更新 (LOW) - 1日

#### 4.5.1 ImageGrid2Section / ImageGrid3Section (2h)

- ImageGridCard共通コンポーネントの確認
- hover効果のテーマ連動

#### 4.5.2 ImageSection (1h)

- 背景設定時のみThemedCardオプション検討

#### 4.5.3 BarGraphSection / CircularStatSection (1.5h)

- Badgeコンポーネント統一
- CornerDecor対応検討

#### 4.5.4 TimelineSection (1h)

- Badgeコンポーネント統一
- 既存実装が複雑なため最小変更

#### 4.5.5 WeeklyScheduleSection (1h)

- Badgeコンポーネント統一
- CornerDecor対応

---

### 4.6 テスト・検証 (1日)

#### 4.6.1 デモページ作成 (3h)

**ファイル**: `app/demo/sections/page.tsx`（新規）

- 全セクションの表示確認
- ThemedCard統一後の見た目確認
- CharacterProfileSectionデモ

#### 4.6.2 テーマ切り替えテスト (2h)

- claymorphic系テーマでの表示確認
- CornerDecor/Badge/hoverエフェクト確認
- 各テーマでのスタイル崩れチェック

#### 4.6.3 レスポンシブテスト (2h)

| デバイス | 幅 | 確認項目 |
|----------|-----|----------|
| Desktop Large | ≥1400px | Large幅セクションの中央揃え |
| Desktop | 1200-1399px | max-w-[1200px]適用 |
| Tablet | 768-991px | CharacterProfile縦積み |
| Mobile | <768px | 全セクション縦積み、MobileBottomNav |

#### 4.6.4 エラーハンドリング確認 (1h)

- 画像未設定時の表示
- データ不正時のフォールバック
- SectionErrorFallback動作確認

---

## 依存関係マップ

```
Phase 3完了
    │
    └──► 4.1 CharacterProfileSection
            │
            ├──► 4.1.1 型定義
            │       │
            │       ├──► 4.1.2 レジストリ
            │       │       │
            │       │       └──► 4.1.3 コンポーネント
            │       │               │
            │       │               └──► 4.1.5 エディタ
            │       │
            │       └──► 4.1.4 型ガード
            │
            └──────────────────────────────────┐
                                               │
    4.2.1~4.2.6 (並列可能) ────────────────────┤
                                               │
    4.3.1~4.3.2 (並列可能) ────────────────────┤
                                               │
    4.4.1~4.4.3 (並列可能) ────────────────────┤
                                               │
    4.5.1~4.5.5 (並列可能) ────────────────────┤
                                               │
                                               ▼
                                    4.6 テスト・検証
```

### クリティカルパス

```
4.1.1 → 4.1.2 → 4.1.3 → 4.1.5 → 4.6
```

---

## 潜在リスク

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| **ThemedCard統一による既存スタイル崩れ** | 中 | 中 | デモページで逐次確認、段階的適用 |
| **CharacterProfileのレスポンシブ複雑化** | 中 | 中 | Tailwind breakpointで明示的に制御 |
| **hover効果のテーマ間不整合** | 低 | 低 | HOVER_CLASSESの統一、テーマ別テスト |
| **画像アスペクト比の端末差異** | 低 | 低 | object-cover + aspect-ratio固定 |
| **エディタモーダルの複雑化** | 中 | 中 | 既存パターン（ImageSectionEditModal）参考 |
| **Badgeコンポーネント未実装機能** | 低 | 中 | 必要に応じてBadge拡張 |

---

## 見積もりサマリー

| Day | タスク | 工数 |
|-----|--------|------|
| Day 1 | 4.1.1-4.1.3 CharacterProfileSection型定義・レジストリ・コンポーネント | 7h |
| Day 2 | 4.1.4-4.1.5 型ガード・エディタ | 4.5h |
| Day 3 | 4.2.1-4.2.3 Links系セクション統一 | 5h |
| Day 4 | 4.2.4-4.2.6 + 4.3 ImageHero + 4.4 FAQ | 6h |
| Day 5 | 4.5 残りセクション | 6.5h |
| Day 6-7 | 4.6 テスト・検証 + バグ修正 | 8h |
| **合計** | | **37h（約6.5日）** |

親計画の見積もり（6-8日）の範囲内。

---

## 重要ファイル一覧

### 新規作成

| ファイル | タスク | 説明 |
|----------|--------|------|
| `components/user-profile/sections/CharacterProfileSection.tsx` | 4.1.3 | キャラクタープロフィールセクション |
| `components/user-profile/sections/editors/CharacterProfileEditModal.tsx` | 4.1.5 | エディタモーダル |
| `app/demo/sections/page.tsx` | 4.6.1 | デモページ |

### 更新

| ファイル | タスク | 変更内容 |
|----------|--------|----------|
| `types/profile-sections.ts` | 4.1.1 | CharacterProfileData型追加 |
| `lib/sections/registry.ts` | 4.1.2 | character-profile登録 |
| `lib/sections/type-guards.ts` | 4.1.4 | isCharacterProfileData追加 |
| `lib/sections/editor-registry.ts` | 4.1.5 | エディタ登録 |
| `components/user-profile/sections/LinksSection.tsx` | 4.2.1 | ThemedCard化 |
| `components/user-profile/sections/LinkListSection.tsx` | 4.2.2 | ThemedCard化 |
| `components/user-profile/sections/IconLinksSection.tsx` | 4.2.3 | ThemedCard化 |
| `components/user-profile/sections/HeaderSection.tsx` | 4.2.4 | 条件付きThemedCard |
| `components/user-profile/sections/YoutubeSection.tsx` | 4.2.5 | ThemedCard化 |
| `components/user-profile/sections/VideoGallerySection.tsx` | 4.2.6 | ThemedCard化 |
| `components/user-profile/sections/ImageHeroSection.tsx` | 4.3.2 | hover連動 |
| `components/user-profile/sections/FAQSection.tsx` | 4.4.1-4.4.3 | CornerDecor + Badge統一 |

### 参照（変更なし）

| ファイル | 用途 |
|----------|------|
| `components/sections/_shared/ThemedCard.tsx` | 全セクション統一の基盤 |
| `components/decorations/Badge.tsx` | タイトルバッジ統一 |
| `components/decorations/CornerDecor.tsx` | 角装飾 |
| `components/decorations/Divider.tsx` | 区切り線 |
| `components/profile/SectionWrapper.tsx` | 幅制御 |
| `components/profile/SectionRenderer.tsx` | レンダリング基盤 |

---

## 検証チェックリスト

### Phase 4完了時

**ファイル確認**:
- [ ] `CharacterProfileSection.tsx` が作成されている
- [ ] `CharacterProfileEditModal.tsx` が作成されている
- [ ] `types/profile-sections.ts` に `CharacterProfileData` が追加されている
- [ ] `lib/sections/registry.ts` に `character-profile` が登録されている
- [ ] 全Links系セクションがThemedCard使用

**動作確認**:
- [ ] CharacterProfileSectionが正しく表示される
- [ ] PC: 左右レイアウト切り替えが動作
- [ ] Mobile: 縦積みレイアウト
- [ ] 全セクションでテーマ切り替えが正常動作
- [ ] CornerDecorが表示される（対応セクション）
- [ ] Badgeスタイルが統一されている
- [ ] hover効果がテーマに連動

**ビルド確認**:
- [ ] `npm run lint` パス
- [ ] `npx tsc --noEmit` パス
- [ ] `npm run build` パス

---

## 次のPhaseへの引き継ぎ

Phase 4が完了したら、以下の状態になっている必要があります：

1. **CharacterProfileSection**: キャラクター画像+プロフィール情報を1セクションで表示
2. **ThemedCard統一**: 全セクションがThemedCardベース
3. **装飾統一**: Badge/CornerDecor/Dividerがテーマ連動
4. **デモページ**: 全セクションの動作確認可能

これにより、**Phase 5「ダッシュボード」**で：
- テーマセレクター実装
- セクションエディター更新
- リアルタイムプレビュー機能

が可能になります。

---

## Phase 4完了報告

🎯 達成項目
✅ ThemedCard統一: 全セクションがThemedCardベースまたは適切にテーマ連動

✅ Badge統一: タイトル表示にBadgeコンポーネント使用

✅ CornerDecor対応: 主要セクションでshowCornerDecor実装

✅ Divider統一: 区切り線にDividerコンポーネント使用

✅ hover効果テーマ連動: ImageHero、ImageGridでHOVER_CLASSESマップ使用

✅ CharacterProfileSection: 新規セクション完全実装

📝 次のフェーズへの引き継ぎ
Phase 4完了により、以下が実現されました：

セクションコンポーネントの完全統一: 18セクション全てがテーマシステムに統合
装飾の一貫性: Badge/CornerDecor/Dividerが統一的に適用
CharacterProfileSection: キャラクター画像+プロフィール情報の新規セクション
拡張性の向上: 新規セクション追加時の実装パターン確立
これにより Phase 5「ダッシュボード」 で以下が可能になります：

テーマセレクター実装
セクションエディター更新
リアルタイムプレビュー機能


**最終更新**: 2026-02-25
