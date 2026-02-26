# セクションエディター リファクタリング計画: インライン編集への移行

**作成日**: 2026-02-20
**ステータス**: 計画中
**優先度**: 🔴 CRITICAL
**影響範囲**: 全セクションエディター（10+ ファイル）

---

## 📋 概要

### 目的
プロファイルセクションエディターの多重保存問題を解決し、モダンなインライン編集 UX に移行する。

### 主な問題点
1. **多重保存**: アイテム編集時に即座に DB 保存 + 完了ボタンでも保存（重複）
2. **UI の誤解**: 「保存」ボタンが DB 保存と誤認される
3. **State 管理の複雑さ**: 編集中のアイテムを別 state で二重管理
4. **エラー時の不整合**: 保存失敗時にローカル state がロールバックされない

### 解決策
**パターンB: インライン編集**を採用
- クリックで即編集モード
- フィールド変更は即座にローカル state に反映
- 完了ボタンで1回のみ DB 保存

---

## 🎯 実装フェーズ

### Phase 1: パイロット実装（CircularStatEditModal）

**目的**: 1つのエディターで新パターンを実装・検証

**対象ファイル**:
- `components/user-profile/sections/editors/CircularStatEditModal.tsx`

**工数**: 2-3時間

**成功基準**:
- ✅ アイテムの追加・編集・削除・移動が正常に動作
- ✅ バリデーションが適切に動作（フォーカスアウト時 + 完了時）
- ✅ DB 保存が完了ボタンでのみ実行される
- ✅ エラー時にモーダルが開いたまま（編集継続可能）
- ✅ キーボード操作（Enter、Tab、Escape）が快適
- ✅ モバイルでの操作性が良好

---

### Phase 2: 同一パターンのエディターに展開

**依存関係**: Phase 1 の成功確認後

**対象ファイル** (優先順):

#### 2.1 配列アイテム編集型（CircularStatEditModal と同じパターン）
1. `components/user-profile/sections/editors/BarGraphEditModal.tsx`
   - 項目: label, value, maxValue
   - 同じパターン: items 配列、sortOrder、nanoid

2. `components/user-profile/sections/editors/FAQEditModal.tsx`
   - 項目: question, answer, iconName
   - 同じパターン: items 配列、sortOrder、nanoid

3. `components/user-profile/sections/editors/TimelineEditModal.tsx`
   - 項目: label, title, description, iconName
   - 同じパターン: items 配列、sortOrder、nanoid

4. `components/user-profile/sections/editors/VideoGallerySectionModal.tsx`
   - 項目: videoId, url, title, thumbnail
   - 同じパターン: items 配列、sortOrder、nanoid

5. `components/user-profile/sections/editors/LinksEditModal.tsx`
   - 項目: url, title, description, iconType, iconKey
   - 同じパターン: items 配列、sortOrder、nanoid

**工数**: 各 1-2時間 × 5ファイル = 5-10時間

---

#### 2.2 単一フォーム型（インライン編集不要）

以下のエディターは**変更不要**（単一フォームなのでインライン編集の概念がない）:

- `components/user-profile/sections/editors/ProfileCardEditModal.tsx`
  - 理由: 1つのフォームでキャラクター情報を編集

- `components/user-profile/sections/editors/HeaderEditModal.tsx`
  - 理由: 見出しテキストと level のみ

- `components/user-profile/sections/editors/LongTextEditModal.tsx`
  - 理由: マークダウンエディター単体

- `components/user-profile/sections/editors/YoutubeSectionModal.tsx`
  - 理由: YouTube URL 入力のみ

- `components/user-profile/sections/editors/WeeklyScheduleEditModal.tsx`
  - 理由: 7日分のテキストエリア（固定配列）

**これらのファイルに対する変更**:
- ✅ 多重保存パターンの削除（`saveToDatabase` 関数削除）
- ✅ 完了ボタンでのみ保存
- ❌ インライン編集への移行（不要）

**工数**: 各 30分 × 5ファイル = 2.5時間

---

### Phase 3: 表示コンポーネントの最適化

**依存関係**: Phase 2 完了後

**対象ファイル**:
- `components/user-profile/sections/CircularStatSection.tsx`
- `components/user-profile/sections/BarGraphSection.tsx`
- `components/user-profile/sections/FAQSection.tsx`
- `components/user-profile/sections/TimelineSection.tsx`
- `components/user-profile/sections/VideoGallerySection.tsx`
- `components/user-profile/sections/LinksSection.tsx`
- 他の全表示コンポーネント

**変更内容**:
- `'use client'` を削除（Server Component 化）
- `isEditable` prop を削除

**工数**: 各 15分 × 10ファイル = 2.5時間

---

### Phase 4: 型安全性の向上（オプション）

**依存関係**: Phase 3 完了後

**新規ファイル**:
- `lib/validations/profile-sections.ts`

**変更ファイル**:
- `components/user-profile/EditableSectionRenderer.tsx`
- `types/profile-sections.ts`

**内容**:
- Zod schema の定義
- Runtime validation の追加
- 型キャストの削除

**工数**: 3-4時間

---

## 📐 実装の詳細

### 1. State 管理の変更

#### Before (現在)
```typescript
// ❌ 編集中のアイテムを別の state で管理
const [items, setItems] = useState<CircularStatItem[]>(currentData.items)
const [editing, setEditing] = useState<EditingState | null>(null)

type EditingState = {
  id: string
  value: number
  centerChar: string
  iconName?: string
  label: string
  subLabel: string
  color: string
  showIconPicker: boolean  // UI state が混在
} | null
```

#### After (改善後)
```typescript
// ✓ editing は ID のみを保持
const [items, setItems] = useState<CircularStatItem[]>(currentData.items)
const [editingItemId, setEditingItemId] = useState<string | null>(null)
const [showIconPickerFor, setShowIconPickerFor] = useState<string | null>(null)

// 編集中のアイテムは items から直接取得
const editingItem = items.find(item => item.id === editingItemId)
```

**メリット**:
- State の重複がない
- データの一元管理
- 同期の問題が発生しない

---

### 2. 保存パターンの変更

#### Before (現在)
```typescript
// ❌ アイテム編集のたびに DB 保存
const handleEditSave = () => {
  const updatedItems = items.map(...)
  setItems(updatedItems)
  setEditing(null)
  saveToDatabase(updatedItems)  // ← ❌ 即座に DB 保存
}

const handleDeleteItem = (itemId: string) => {
  const updatedItems = items.filter(...)
  setItems(updatedItems)
  saveToDatabase(updatedItems)  // ← ❌ 即座に DB 保存
}

const handleMoveOrder = (itemId: string, direction: 'up' | 'down') => {
  const updatedItems = newItems.map(...)
  setItems(updatedItems)
  saveToDatabase(updatedItems, false)  // ← ❌ 即座に DB 保存
}

// ❌ 完了ボタンでも再度保存（冗長）
const handleSave = () => {
  startTransition(async () => {
    await updateSection(sectionId, { data: { items } })
  })
}

// ❌ saveToDatabase ヘルパー関数
const saveToDatabase = (updatedItems, showToast = true) => {
  startTransition(async () => {
    const result = await updateSection(...)
    router.refresh()
  })
}
```

#### After (改善後)
```typescript
// ✓ フィールド変更時はローカル state のみ更新
const handleFieldChange = (itemId: string, field: keyof CircularStatItem, value: any) => {
  setItems(prev => prev.map(item =>
    item.id === itemId ? { ...item, [field]: value } : item
  ))
}

// ✓ アイテム削除もローカルのみ
const handleDeleteItem = (itemId: string) => {
  if (!confirm('このアイテムを削除しますか？')) return
  const updatedItems = items.filter(i => i.id !== itemId)
  setItems(updatedItems)
  // DB 保存はしない
}

// ✓ 移動もローカルのみ
const handleMoveOrder = (itemId: string, direction: 'up' | 'down') => {
  // ... 順序入れ替え ...
  setItems(updatedItems)
  // DB 保存はしない
}

// ✓ 完了ボタンで1回だけ保存
const handleSave = () => {
  // バリデーション
  const invalidItems = items.filter(item => !item.label.trim())
  if (invalidItems.length > 0) {
    toast.error('ラベルが未入力のアイテムがあります')
    return
  }

  startTransition(async () => {
    const result = await updateSection(sectionId, {
      title: title.trim() || null,
      data: { items }
    })

    if (result.success) {
      toast.success('保存しました')
      onClose()
      router.refresh()
    } else {
      toast.error(result.error || '保存に失敗しました')
      // モーダルは開いたまま（編集継続可能）
    }
  })
}

// ❌ saveToDatabase 関数は削除
```

---

### 3. UI の実装

#### 編集モードと表示モードの切り替え

```typescript
{items.map((item, index) => {
  const isEditing = editingItemId === item.id
  const Icon = item.iconName ? getLucideIcon(item.iconName) : null

  return (
    <div
      key={item.id}
      className={cn(
        "border rounded-lg p-3 transition-colors cursor-pointer",
        isEditing && "bg-accent/50 border-primary cursor-default"
      )}
      onClick={() => !isEditing && setEditingItemId(item.id)}
    >
      {isEditing ? (
        /* 編集モード: インラインフォーム */
        <EditingForm
          item={item}
          onFieldChange={(field, value) => handleFieldChange(item.id, field, value)}
          onFinish={() => handleFinishEdit(item.id)}
          onDelete={() => handleDeleteItem(item.id)}
          onMove={(direction) => handleMoveOrder(item.id, direction)}
          canMoveUp={index > 0}
          canMoveDown={index < items.length - 1}
        />
      ) : (
        /* 表示モード: プレビュー */
        <ItemPreview
          item={item}
          onDelete={() => handleDeleteItem(item.id)}
          onMove={(direction) => handleMoveOrder(item.id, direction)}
          canMoveUp={index > 0}
          canMoveDown={index < items.length - 1}
        />
      )}
    </div>
  )
})}
```

#### フォーカスアウト時の自動確定

```typescript
const handleFinishEdit = (itemId: string) => {
  const item = items.find(i => i.id === itemId)

  // バリデーション
  if (!item?.label.trim()) {
    toast.error('ラベルは必須です')
    return  // 編集モードを維持
  }

  if (item.label.length > 10) {
    toast.error('ラベルは10文字以内です')
    return
  }

  // バリデーション OK → 編集モード終了
  setEditingItemId(null)
}
```

#### Enter キーでの確定

```typescript
<Input
  value={item.label}
  onChange={(e) => handleFieldChange(item.id, 'label', e.target.value)}
  onBlur={() => handleFinishEdit(item.id)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleFinishEdit(item.id)
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      // Escape で編集キャンセル（元に戻す）
      setItems(currentData.items.map(i => ({ ...i })))
      setEditingItemId(null)
    }
  }}
  autoFocus
  maxLength={10}
/>
```

---

### 4. アイテム追加時の自動編集モード

```typescript
const handleAddItem = () => {
  const newItem: CircularStatItem = {
    id: nanoid(),
    value: 50,
    centerChar: 'A',
    label: '',  // 空のまま
    color: PRESET_COLORS[items.length % PRESET_COLORS.length],
    sortOrder: items.length,
  }
  setItems([...items, newItem])
  setEditingItemId(newItem.id)  // ← 自動で編集モード
}
```

---

## 🧪 テスト計画

### Phase 1 テスト（CircularStatEditModal）

#### 機能テスト
- [ ] アイテムの追加が正常に動作
- [ ] アイテムのクリックで編集モードに移行
- [ ] フィールド変更が即座にローカル state に反映
- [ ] Enter キーで編集モード終了
- [ ] Escape キーで編集キャンセル（元に戻る）
- [ ] フォーカスアウトで編集モード終了
- [ ] バリデーションエラー時に編集モードが維持される
- [ ] アイテムの削除が正常に動作
- [ ] アイテムの順序移動が正常に動作
- [ ] 完了ボタンで DB 保存（1回のみ）
- [ ] 保存失敗時にモーダルが開いたまま
- [ ] 保存成功時にモーダルが閉じる

#### パフォーマンステスト
- [ ] DB 呼び出し回数が1回のみ（Network tab で確認）
- [ ] toast 通知が1回のみ表示
- [ ] router.refresh が1回のみ実行
- [ ] re-render 回数の削減（React DevTools Profiler）

#### UX テスト
- [ ] デスクトップでの操作性
- [ ] モバイルでの操作性
- [ ] タブレットでの操作性
- [ ] キーボードのみでの操作
- [ ] スクリーンリーダーでの動作

#### バリデーションテスト
- [ ] ラベル未入力時のエラー
- [ ] ラベル10文字超過時のエラー
- [ ] 中央文字2文字入力時のエラー
- [ ] サブラベル10文字超過時のエラー
- [ ] 不正なカラーコード入力時のエラー

---

### Phase 2 テスト（各エディター）

Phase 1 と同じテスト項目を各エディターで実施。

**エディター固有のテスト項目**:

#### BarGraphEditModal
- [ ] maxValue の設定が正常に動作
- [ ] value が maxValue を超えないように制限

#### FAQEditModal
- [ ] question と answer の入力が正常に動作
- [ ] アイコン選択が正常に動作

#### TimelineEditModal
- [ ] label、title、description の入力が正常に動作
- [ ] アイコン選択が正常に動作

#### VideoGallerySectionModal
- [ ] YouTube URL の入力が正常に動作
- [ ] サムネイル取得が正常に動作

#### LinksEditModal
- [ ] URL の入力が正常に動作
- [ ] iconType の切り替えが正常に動作
- [ ] プリセットアイコン選択が正常に動作

---

### Phase 3 テスト（表示コンポーネント）

- [ ] Server Component 化後も正常に表示
- [ ] getLucideIcon が Server Component で動作
- [ ] バンドルサイズの削減確認（Next.js build 後）
- [ ] Lighthouse スコアの改善確認

---

### Phase 4 テスト（型検証）

- [ ] Zod schema による validation が動作
- [ ] 不正なデータでのエラー処理
- [ ] TypeScript エラーがないこと

---

## 📊 依存関係グラフ

```
Phase 1: CircularStatEditModal 実装
    ↓ (成功確認後)
    ├─→ Phase 2.1: BarGraphEditModal
    ├─→ Phase 2.1: FAQEditModal
    ├─→ Phase 2.1: TimelineEditModal
    ├─→ Phase 2.1: VideoGallerySectionModal
    ├─→ Phase 2.1: LinksEditModal
    │       ↓ (全て完了後)
    │   Phase 2.2: 単一フォーム型エディター（多重保存削除のみ）
    │       ↓
    │   Phase 3: 表示コンポーネント最適化
    │       ↓ (オプション)
    │   Phase 4: 型安全性向上
    └─────────────────────────┘
```

---

## 🔧 技術的な注意点

### 1. Escape キーでの編集キャンセル

**要件**: Escape キーで編集をキャンセルし、元のデータに戻す

**実装**:
```typescript
const [originalItems] = useState(currentData.items.map(i => ({ ...i })))

const handleEscapeEdit = () => {
  setItems(originalItems.map(i => ({ ...i })))
  setEditingItemId(null)
}

// 各 Input に onKeyDown を追加
onKeyDown={(e) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    handleEscapeEdit()
  }
}}
```

---

### 2. 他のアイテムクリック時の自動確定

**要件**: 編集中に他のアイテムをクリックしたら、現在の編集を確定してから新しいアイテムを開く

**実装**:
```typescript
const handleStartEdit = (itemId: string) => {
  // 既に編集中のアイテムがある場合は確定してから開く
  if (editingItemId && editingItemId !== itemId) {
    handleFinishEdit(editingItemId)
  }
  setEditingItemId(itemId)
}
```

---

### 3. スライダーの実装（値の入力）

**要件**: 数値入力を視覚的に分かりやすくする

**実装**:
```typescript
import { Slider } from '@/components/ui/slider'

<div className="flex items-center gap-2">
  <Label className="w-20 text-xs">値</Label>
  <div className="flex-1 space-y-2">
    <Slider
      value={[item.value]}
      onValueChange={([value]) => handleFieldChange(item.id, 'value', value)}
      max={100}
      step={1}
      className="flex-1"
    />
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>0%</span>
      <span className="font-medium">{item.value}%</span>
      <span>100%</span>
    </div>
  </div>
</div>
```

---

### 4. カラーピッカーの実装

**要件**: プリセットカラー + カスタムカラー

**実装**:
```typescript
const PRESET_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // amber
  '#4ade80', // green
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#f472b6', // pink
  '#94a3b8', // gray
]

<div className="flex items-center gap-2">
  <Label className="w-20 text-xs">カラー</Label>
  <div className="flex gap-1 items-center flex-wrap">
    {PRESET_COLORS.map((color) => (
      <button
        key={color}
        type="button"
        className={cn(
          "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
          item.color === color
            ? "border-foreground scale-110 ring-2 ring-offset-2 ring-foreground"
            : "border-transparent"
        )}
        style={{ backgroundColor: color }}
        onClick={() => handleFieldChange(item.id, 'color', color)}
      />
    ))}
    <Input
      type="color"
      value={item.color}
      onChange={(e) => handleFieldChange(item.id, 'color', e.target.value)}
      className="w-10 h-6 p-0 cursor-pointer border-2"
    />
  </div>
</div>
```

---

### 5. アイコン選択のモーダル化

**要件**: IconSelector を編集フォーム内に展開すると UI が複雑になるため、モーダル化

**実装**:
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

{/* アイコンピッカーモーダル */}
{showIconPickerFor && (
  <Dialog open={!!showIconPickerFor} onOpenChange={() => setShowIconPickerFor(null)}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>アイコンを選択</DialogTitle>
      </DialogHeader>
      <IconSelector
        selectedIcon={items.find(i => i.id === showIconPickerFor)?.iconName ?? ''}
        onIconSelect={(iconName) => {
          handleFieldChange(showIconPickerFor, 'iconName', iconName)
          setShowIconPickerFor(null)
        }}
      />
    </DialogContent>
  </Dialog>
)}
```

---

## 📦 影響範囲のまとめ

### 変更が必要なファイル

#### Phase 1 (CRITICAL - 最優先)
- [ ] `components/user-profile/sections/editors/CircularStatEditModal.tsx`

#### Phase 2.1 (HIGH - CircularStat 成功後)
- [ ] `components/user-profile/sections/editors/BarGraphEditModal.tsx`
- [ ] `components/user-profile/sections/editors/FAQEditModal.tsx`
- [ ] `components/user-profile/sections/editors/TimelineEditModal.tsx`
- [ ] `components/user-profile/sections/editors/VideoGallerySectionModal.tsx`
- [ ] `components/user-profile/sections/editors/LinksEditModal.tsx`

#### Phase 2.2 (MEDIUM - 多重保存削除のみ)
- [ ] `components/user-profile/sections/editors/ProfileCardEditModal.tsx`
- [ ] `components/user-profile/sections/editors/HeaderEditModal.tsx`
- [ ] `components/user-profile/sections/editors/LongTextEditModal.tsx`
- [ ] `components/user-profile/sections/editors/YoutubeSectionModal.tsx`
- [ ] `components/user-profile/sections/editors/WeeklyScheduleEditModal.tsx`

#### Phase 3 (MEDIUM - Server Component 化)
- [ ] `components/user-profile/sections/CircularStatSection.tsx`
- [ ] `components/user-profile/sections/BarGraphSection.tsx`
- [ ] `components/user-profile/sections/FAQSection.tsx`
- [ ] `components/user-profile/sections/TimelineSection.tsx`
- [ ] `components/user-profile/sections/VideoGallerySection.tsx`
- [ ] `components/user-profile/sections/LinksSection.tsx`
- [ ] `components/user-profile/sections/ProfileCardSection.tsx`
- [ ] `components/user-profile/sections/HeaderSection.tsx`
- [ ] `components/user-profile/sections/LongTextSection.tsx`
- [ ] `components/user-profile/sections/YoutubeSection.tsx`
- [ ] `components/user-profile/sections/WeeklyScheduleSection.tsx`

#### Phase 4 (LOW - 型安全性)
- [ ] `lib/validations/profile-sections.ts` (新規作成)
- [ ] `components/user-profile/EditableSectionRenderer.tsx`
- [ ] `types/profile-sections.ts`

---

## 📈 期待される効果

### パフォーマンス改善
- DB 呼び出し回数: **4回 → 1回** (75% 削減)
- ネットワークリクエスト: **4回 → 1回** (75% 削減)
- toast 通知: **複数回 → 1回**
- router.refresh: **4回 → 1回** (75% 削減)

### バンドルサイズ削減 (Phase 3 完了後)
- 表示コンポーネントの Server Component 化
- 推定削減: **5-10KB** (gzip 後)

### UX 改善
- クリック回数: **3回 → 2回** (33% 削減)
- 編集の直感性: **大幅向上**
- モバイルでの操作性: **向上**

### コード品質
- State 管理の簡素化
- 型安全性の向上 (Phase 4)
- メンテナンス性の向上

---

## 🚀 次のステップ

### 即座に開始
1. **Phase 1: CircularStatEditModal の実装**
   - インライン編集パターンの実装
   - テスト実施
   - UX 評価

### CircularStatEditModal 成功後
2. **Phase 2.1: 配列アイテム編集型への展開**
   - BarGraphEditModal から順次実装
   - 各エディターでテスト実施

3. **Phase 2.2: 単一フォーム型の多重保存削除**
   - saveToDatabase 関数の削除
   - 完了ボタンでのみ保存

### 全エディター完了後
4. **Phase 3: 表示コンポーネント最適化**
   - Server Component 化
   - バンドルサイズ削減

5. **Phase 4: 型安全性向上（オプション）**
   - Zod schema の定義
   - Runtime validation

---

## 📝 備考

### CircularStatEditModal で成功した場合の横展開方針

**成功の定義**:
- ✅ 全機能テストが通過
- ✅ パフォーマンステストで改善確認
- ✅ UX テストで肯定的なフィードバック
- ✅ バグ・リグレッションなし

**横展開の優先順位**:
1. 最も類似度の高いエディターから開始（BarGraphEditModal）
2. 各エディターで1日以内に実装・テスト完了
3. 問題が発生したら即座に Phase 1 に戻って検証

**継続的改善**:
- 各エディターで得られた知見を Phase 1 にフィードバック
- 共通コンポーネント化の検討（EditingForm, ItemPreview など）
- より良い UX パターンがあれば随時更新

---

**最終更新**: 2026-02-20
**次回レビュー**: Phase 1 完了後
