# FAQ UI 改善計画

## Context

現在の `dashboard/faqs` は独立した管理ページで、カテゴリーと質問を `NestedSortableList`（@dnd-kit）で管理している。ユーザーの要望は以下の通り：

1. **管理UI**: 各カテゴリーを `profile-editor` のセクションカードのように独立した形で表示・管理できるようにする
2. **並べ替え**: カテゴリー・質問ともに DnD から上下アイコンボタンに統一（`profile-editor` のセクション並べ替えと同じ UX）
3. **スタイル設定**: 各カテゴリーに背景画像・padding を設定できるようにする（`SectionStylePanel` を再利用）
4. **公開ページ**: [handle]/faqs の各カテゴリーの幅を `profile-editor` のセクション幅（`max-w-[1200px]`）と揃える。スタイル設定も反映する。

`dashboard/faqs` は独立ページとして維持し、`profile-editor` への統合は行わない。
`components/sortable-list/` は他の管理画面での再利用候補として**削除しない**。

---

## 変更スコープ

### 影響ファイル
| ファイル | 変更種別 |
|---------|---------|
| `prisma/schema.prisma` | FaqCategory に `settings Json?` 追加 |
| `prisma/migrations/` | 新規マイグレーション |
| `types/faq.ts` | FaqCategoryBase/FaqCategory に `settings` フィールド追加 |
| `app/actions/content/faq-actions.ts` | `updateFaqCategorySettings()` 追加、`getPublicFaqByHandle()` に settings 含める |
| `app/dashboard/faqs/page.tsx` | `getActivePresets()` の取得を追加 |
| `app/dashboard/faqs/EditableFAQClient.tsx` | presets props を FaqManagementSection に渡す |
| `app/dashboard/faqs/components/FaqManagementSection.tsx` | **全面改修**（後述） |
| `app/dashboard/faqs/components/FaqCategoryCard.tsx` | **新規** — カテゴリーカード本体（質問↑↓込み） |
| `components/user-profile/SectionStylePanel.tsx` | optional `onSave` prop を追加（既存動作は維持） |
| `app/[handle]/faqs/page.tsx` | `getActivePresets()` を並行フェッチに追加 |
| `app/[handle]/faqs/components/FAQPublicContent.tsx` | 幅変更・スタイル適用 |

### 再利用するユーティリティ（変更なし）
- `lib/sections/padding-utils.ts` — `buildPaddingCssVars()`
- `lib/sections/background-utils.ts` — `resolveBackgroundStyle()`, `resolvePreset()`
- `types/profile-sections.ts` — `SectionSettings`, `SectionBandBackground`, `ResponsivePadding`
- `components/user-profile/sections/SectionBand.tsx` — 背景・padding を CSS 変数として適用する帯コンポーネント（公開ページで再利用）

---

## 実装ステップ

### Step 1: DBスキーマ変更
**`prisma/schema.prisma`**
```prisma
model FaqCategory {
  ...
  settings    Json?        // 追加: SectionSettings (背景・padding)
  ...
}
```
マイグレーション実行：
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:migrate
```

---

### Step 2: 型定義の更新
**`types/faq.ts`**
- `FaqCategoryBase` に `settings: SectionSettings | null` を追加
- `SectionSettings` を `types/profile-sections.ts` からインポートして再利用

---

### Step 3: Server Actions の拡張
**`app/actions/content/faq-actions.ts`**

追加するアクション：
```typescript
export async function updateFaqCategorySettings(
  categoryId: string,
  settings: SectionSettings | null
): Promise<FaqActionResult<FaqCategory>>
```
- 所有者確認（userId 一致チェック）
- Prisma update で `settings` カラムを更新
- `revalidatePath("/dashboard/faqs")` 実行

既存の `getPublicFaqByHandle()` を更新して `settings` フィールドも返すようにする。

---

### Step 4: SectionStylePanel に `onSave` prop 追加
**`components/user-profile/SectionStylePanel.tsx`**

FAQ カテゴリー専用の保存アクションを注入できるよう、optional prop を追加：
```typescript
interface SectionStylePanelProps {
  // ...既存...
  onSave?: (settings: SectionSettings) => Promise<void>
}
```
省略時は既存の `updateSectionSettings(sectionId, ...)` を使用するため、既存の利用箇所は変更不要。

---

### Step 5: dashboard/faqs ページの更新
**`app/dashboard/faqs/page.tsx`**
- `getActivePresets()` を `Promise.all` に追加
- `EditableFAQClient` に `presets` props を渡す

**`app/dashboard/faqs/EditableFAQClient.tsx`**
- `presets: SectionBackgroundPreset[]` を props に追加
- `FaqManagementSection` に `presets` を渡す

---

### Step 6: FaqCategoryCard の新規実装
**`app/dashboard/faqs/components/FaqCategoryCard.tsx`**

新規コンポーネント。内部状態として `isStyleOpen`（Sheet 開閉）と `localSettings`（リアルタイムプレビュー用）を `useState` で持つ。

```
<Card className="max-w-[768px]">
  <CardHeader>
    [↑][↓] カテゴリー名(InlineEdit) [表示/非表示Switch] [削除]
    説明(InlineEdit, multiline)
  </CardHeader>
  <CardContent>
    質問リスト（↑↓ボタン + InlineEdit + 削除）× N
    [+ Q&Aを追加] ボタン
  </CardContent>
  <CardFooter>
    [スタイル設定] ボタン
  </CardFooter>
</Card>
<SectionStylePanel
  isOpen={isStyleOpen}
  onClose={...}
  currentSettings={category.settings}
  presets={presets}
  onSettingsChange={setLocalSettings}   ← リアルタイムプレビュー
  onSave={(s) => onStyleSave(category.id, s)}
/>
```

props:
```typescript
interface FaqCategoryCardProps {
  category: FaqCategory
  index: number
  totalCount: number
  presets: SectionBackgroundPreset[]
  onMoveUp: (categoryId: string) => Promise<void>
  onMoveDown: (categoryId: string) => Promise<void>
  onEdit: (categoryId: string, updates: Partial<FaqCategory>) => Promise<void>
  onDelete: (categoryId: string) => Promise<void>
  onQuestionMoveUp: (categoryId: string, questionId: string) => Promise<void>
  onQuestionMoveDown: (categoryId: string, questionId: string) => Promise<void>
  onQuestionAdd: (categoryId: string) => Promise<void>
  onQuestionEdit: (categoryId: string, questionId: string, updates: Partial<FaqQuestion>) => Promise<void>
  onQuestionDelete: (categoryId: string, questionId: string) => Promise<void>
  onStyleSave: (categoryId: string, settings: SectionSettings | null) => Promise<void>
}
```

---

### Step 7: FaqManagementSection の全面改修
**`app/dashboard/faqs/components/FaqManagementSection.tsx`**

`NestedSortableList` を廃止し、`FaqCategoryCard × N` の構成に変更。
props に `presets: SectionBackgroundPreset[]` を追加。

**カテゴリー並べ替え（↑↓ボタン）:**
`handleCategoryMoveUp` / `handleCategoryMoveDown` を追加。
`arrayMove`（@dnd-kit/sortable）で順序を組み替えて既存の `handleCategoryReorder` を呼ぶ（楽観的更新込み）：
```typescript
const handleCategoryMoveUp = useCallback(async (categoryId: string) => {
  const index = faqCategories.findIndex(c => c.id === categoryId)
  if (index <= 0) return
  await handleCategoryReorder(arrayMove(faqCategories, index, index - 1))
}, [faqCategories, handleCategoryReorder])
```

**質問並べ替え（↑↓ボタン）:**
`handleQuestionMoveUp` / `handleQuestionMoveDown` を追加。
同様に既存の `handleQuestionReorder` を再利用：
```typescript
const handleQuestionMoveUp = useCallback(async (categoryId: string, questionId: string) => {
  const questions = faqCategories.find(c => c.id === categoryId)?.questions ?? []
  const index = questions.findIndex(q => q.id === questionId)
  if (index <= 0) return
  await handleQuestionReorder(categoryId, arrayMove(questions, index, index - 1))
}, [faqCategories, handleQuestionReorder])
```

**スタイル保存:**
`handleStyleSave` を追加（`updateFaqCategorySettings` を呼び出し、`mutate` で楽観的更新）。

---

### Step 8: 公開ページの更新
**`app/[handle]/faqs/page.tsx`**
- `getActivePresets()` を `Promise.all` に追加、`FAQPublicContent` に渡す

**`app/[handle]/faqs/components/FAQPublicContent.tsx`**
- 各カテゴリーを `SectionBand`（`fullBleed`）でラップ、内側で `max-w-[1200px]` を制御
- `resolvePreset()` でプリセットを解決して `SectionBand` に渡す
- アコーディオン形式は現状維持

```tsx
{categories.map((category) => (
  <SectionBand key={category.id} settings={category.settings} preset={resolvePreset(category.settings?.background, presets)} fullBleed>
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
      {/* 既存のアコーディオン */}
    </div>
  </SectionBand>
))}
```

---

## 検証方法

1. **DBマイグレーション + 型チェック**: `npm run db:migrate` → `npx tsc --noEmit` でエラーゼロ
2. **カテゴリー管理**:
   - カテゴリーの追加・編集・削除が動作する
   - `[↑][↓]` ボタンでカテゴリーの順序が変わる（楽観的更新）
   - 先頭/末尾のボタンが適切に無効化される
3. **質問管理**:
   - 質問の追加・編集・削除が動作する
   - `[↑][↓]` ボタンで質問の順序が変わる（楽観的更新）
   - 先頭/末尾のボタンが適切に無効化される
4. **スタイル設定**:
   - `[スタイル設定]` ボタンで Sheet が開く
   - 背景プリセットの選択・padding の変更がリアルタイムでプレビューされる
   - 保存で `updateFaqCategorySettings` が呼ばれ、DB に反映される
5. **公開ページ**:
   - `[handle]/faqs` で各カテゴリーに背景・padding が反映される
   - カテゴリーの幅が `max-w-[1200px]` になっている
   - アコーディオンが正常に動作する
6. **Lint**: `npm run lint && npx tsc --noEmit` でエラーゼロ


実装完了
変更内容
Step 1: DBスキーマ変更

prisma/schema.prisma: FaqCategory に settings Json? フィールドを追加
マイグレーション 20260303144736_add_faq_category_settings を実行
Step 2: 型定義更新

types/faq.ts: FaqCategoryBase と FaqCategory に settings: SectionSettings | null を追加
Step 3: Server Actions 拡張

app/actions/content/faq-actions.ts:
updateFaqCategorySettings() 追加（所有者確認込み）
getPublicFaqByHandle() に settings フィールドを含むよう更新
Step 4: SectionStylePanel 更新

components/user-profile/SectionStylePanel.tsx: onSave?: (settings: SectionSettings) => Promise<void> を optional prop として追加。省略時は既存の updateSectionSettings を使用
Step 5: ダッシュボードページ更新

app/dashboard/faqs/page.tsx: getActivePresets() を Promise.all に追加
app/dashboard/faqs/EditableFAQClient.tsx: presets props を受け取り FaqManagementSection へ渡す
Step 6: FaqCategoryCard 新規実装

app/dashboard/faqs/components/FaqCategoryCard.tsx: カード形式のカテゴリーUI（↑↓ボタン、インライン編集、質問管理、スタイル設定）を新規実装
Step 7: FaqManagementSection 全面改修

app/dashboard/faqs/components/FaqManagementSection.tsx: NestedSortableList を廃止し、FaqCategoryCard × N 構成に変更。↑↓ボタンによる並べ替えを arrayMove で実装
Step 8: 公開ページ更新

app/[handle]/faqs/page.tsx: getActivePresets() を並行フェッチに追加
app/[handle]/faqs/components/FAQPublicContent.tsx: SectionBand でラップし max-w-[1200px] とスタイル設定を反映