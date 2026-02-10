# Product R2画像保存機能 実装ログ

## 概要

ProductシステムにDeviceシステムと同じR2画像自動保存機能を追加しました。
Amazon画像URLやカスタム画像URLから画像を自動的にダウンロードし、CloudFlare R2に保存する仕組みです。

## 実装日

2025-12-31

## 実装範囲

### 追加した機能

1. **画像ダウンロード・R2アップロード関数**
2. **商品作成時のR2保存処理**
3. **商品更新時のR2保存処理**
4. **商品削除時のR2削除処理**
5. **画像再取得機能**

---

## 1. 実装内容

### 1.1 ファイル: app/admin/products/actions.ts

**変更内容**: R2画像管理機能を追加（DeviceシステムからのPort）

#### 追加したインポート

```typescript
import { auth } from '@/auth'
```

#### 追加した関数（3つ）

##### 1. deleteProductImageFromR2（ヘルパー関数）

```typescript
async function deleteProductImageFromR2(imageStorageKey: string): Promise<void>
```

**機能**:
- R2から画像を削除
- MediaFileテーブルから記録を削除
- エラーが発生しても続行（ログ出力のみ）

**実装箇所**: 行455-474

##### 2. downloadAndUploadProductImage（export関数）

```typescript
export async function downloadAndUploadProductImage(imageUrl: string, asin: string, uploaderId?: string): Promise<{
  success: boolean
  storageKey?: string
  error?: string
}>
```

**機能**:
1. Amazon画像URLまたはカスタムURLから画像をダウンロード
2. Content-Typeから適切な拡張子を決定（jpg/png/gif/webp）
3. R2に`product-images/{asin}.{ext}`として保存
4. MediaFileテーブルに記録（uploadType: 'SYSTEM'）
5. アップロード者IDをセッションまたは引数から取得

**実装箇所**: 行479-555

**保存パス**:
- ストレージキー: `product-images/{asin}.{拡張子}`
- フルキー: `altee-images/product-images/{asin}.{拡張子}`

**MediaFile記録内容**:
- uploadType: `'SYSTEM'`
- containerName: `'product-images'`
- ファイルサイズ、MIMEタイプ、アップロード者ID

##### 3. refreshProductImage（export関数）

```typescript
export async function refreshProductImage(productId: string): Promise<{
  success: boolean
  message?: string
  error?: string
}>
```

**機能**:
1. 既存の商品画像をR2から削除
2. Amazon/カスタムURLから画像を再ダウンロード
3. R2に再アップロード
4. imageStorageKeyを更新

**実装箇所**: 行560-611

---

## 2. 既存関数への統合

### 2.1 createProductAction の変更

**変更箇所**: 行190-202

**追加処理**:

```typescript
// 画像URLがある場合はR2にダウンロード・アップロード
// カスタムURL優先、なければAmazon画像URL
let imageStorageKey: string | undefined = validated.imageStorageKey || undefined
const imageUrl = validated.customImageUrl || validated.amazonImageUrl
if (imageUrl && validated.asin) {
  const uploadResult = await downloadAndUploadProductImage(imageUrl, validated.asin)
  if (uploadResult.success) {
    imageStorageKey = uploadResult.storageKey
  } else {
    console.error('画像アップロード失敗:', uploadResult.error)
    // 画像アップロード失敗しても商品作成は続行
  }
}
```

**動作**:
1. カスタムURL優先、なければAmazon画像URL
2. ASINが存在する場合のみアップロード
3. 失敗しても商品作成は続行

---

### 2.2 updateProductAction の変更

**変更箇所**: 行303-327

**追加処理**:

```typescript
// 画像URLが変更された場合の処理
let imageStorageKey: string | null | undefined = existingProduct.imageStorageKey
const newImageUrl = validated.customImageUrl || validated.amazonImageUrl
const oldImageUrl = existingProduct.customImageUrl || existingProduct.amazonImageUrl

// 画像URLが変更された場合
if (newImageUrl && newImageUrl !== oldImageUrl && validated.asin) {
  console.log('画像URLが変更されました。アップロード開始...')
  // 古い画像を削除
  if (existingProduct.imageStorageKey) {
    await deleteProductImageFromR2(existingProduct.imageStorageKey)
  }

  // 新しい画像をダウンロード・アップロード
  const uploadResult = await downloadAndUploadProductImage(newImageUrl, validated.asin)
  if (uploadResult.success) {
    imageStorageKey = uploadResult.storageKey || null
    console.log('画像アップロード成功:', imageStorageKey)
  } else {
    console.error('画像アップロード失敗:', uploadResult.error)
    imageStorageKey = null
  }
} else {
  console.log('画像URLは変更されていません。アップロードをスキップ')
}
```

**動作**:
1. 画像URLが変更された場合のみ処理
2. 古い画像をR2から削除
3. 新しい画像をダウンロード・R2アップロード
4. imageStorageKeyを更新

---

### 2.3 deleteProductAction の変更

**変更箇所**: 行395-398

**追加処理**:

```typescript
// R2に保存された画像を削除
if (product.imageStorageKey) {
  await deleteProductImageFromR2(product.imageStorageKey)
}
```

**動作**:
- 商品削除時にR2の画像も削除
- MediaFileテーブルの記録も削除

---

## 3. DeviceシステムとProductシステムの対応表

| 機能 | Device | Product |
|------|--------|---------|
| 画像フォルダ | `device-images/` | `product-images/` |
| ダウンロード関数 | `downloadAndUploadDeviceImage` | `downloadAndUploadProductImage` |
| R2削除関数 | `deleteDeviceImageFromR2` | `deleteProductImageFromR2` |
| 画像更新関数 | `refreshDeviceImage` | `refreshProductImage` |
| 作成時アップロード | ✅ | ✅ |
| 更新時アップロード | ✅ | ✅ |
| 削除時R2削除 | ✅ | ✅ |

---

## 4. 画像保存フロー

### 4.1 商品作成時

```
ユーザーがAmazon URLまたはカスタムURL入力
↓
createProductAction呼び出し
↓
ASIN存在チェック
↓
画像URL存在 & ASIN存在?
├─ YES → downloadAndUploadProductImage実行
│         ↓
│         fetch(imageUrl)
│         ↓
│         R2にアップロード (product-images/{asin}.{ext})
│         ↓
│         MediaFileに記録
│         ↓
│         storageKeyを取得
│
└─ NO → imageStorageKey = undefined
↓
商品をDBに保存（imageStorageKey含む）
```

### 4.2 商品更新時

```
ユーザーが画像URLを変更
↓
updateProductAction呼び出し
↓
画像URL変更検出
↓
古いimageStorageKey存在?
├─ YES → deleteProductImageFromR2実行
│         ↓
│         R2から削除
│         ↓
│         MediaFileから削除
│
└─ NO → スキップ
↓
downloadAndUploadProductImage実行
↓
新しいstorageKeyで商品更新
```

### 4.3 商品削除時

```
ユーザーが商品削除
↓
deleteProductAction呼び出し
↓
imageStorageKey存在?
├─ YES → deleteProductImageFromR2実行
│         ↓
│         R2から削除
│         ↓
│         MediaFileから削除
│
└─ NO → スキップ
↓
商品をDBから削除
```

---

## 5. 品質保証

### 5.1 TypeScriptチェック

```bash
npx tsc --noEmit
```

**結果**: ✅ 0 errors

### 5.2 ESLintチェック

```bash
npx eslint app/admin/products/actions.ts --max-warnings=0
```

**結果**: ✅ 0 errors, 0 warnings

---

## 6. 設計判断

### 6.1 DeviceシステムのコードをベースにPort

**判断**: DeviceシステムのR2画像保存機能を完全にコピー&適応

**理由**:
- 実績のあるコード（Deviceシステムで動作確認済み）
- 一貫したアーキテクチャ
- 保守性の向上（同じパターン）

### 6.2 画像フォルダの分離

**判断**:
- Device: `device-images/`
- Product: `product-images/`

**理由**:
- 明確な分離による管理のしやすさ
- 将来的な削除・移行の柔軟性
- ストレージ使用量の把握が容易

### 6.3 ASINをファイル名に使用

**判断**: `{asin}.{拡張子}` をファイル名に採用

**理由**:
- ASINは一意の識別子
- 同じ商品の画像は上書き（重複排除）
- ファイル名からASINが特定可能

### 6.4 画像アップロード失敗時の挙動

**判断**: 画像アップロード失敗しても商品作成・更新は続行

**理由**:
- 商品情報自体は有効
- 後からrefreshProductImageで再取得可能
- ユーザー体験の向上（エラーで完全に失敗しない）

---

## 7. 今後の拡張可能性

### 7.1 一括画像更新機能

Deviceシステムには`refreshAllDeviceImages`があります。
同様に`refreshAllProductImages`を実装可能:

```typescript
export async function refreshAllProductImages(): Promise<{
  success: boolean
  updated: number
  failed: number
  message?: string
}>
```

### 7.2 画像最適化

現在は元の画像をそのまま保存していますが、将来的に:
- WebP変換（サイズ削減）
- リサイズ（統一サイズ）
- 圧縮（品質調整）

を追加可能。

### 7.3 複数画像サポート

現在は1商品1画像ですが、将来的に:
- メイン画像 + サブ画像（複数）
- 画像順序管理

を追加可能。

---

## 8. ファイル変更一覧

### 変更ファイル

1. **app/admin/products/actions.ts**
   - 追加行数: 約170行
   - 追加関数: 3つ
   - 変更関数: 3つ（create/update/delete）

---

## 9. 完了条件チェック

- ✅ downloadAndUploadProductImage 関数作成
- ✅ deleteProductImageFromR2 関数作成
- ✅ refreshProductImage 関数作成
- ✅ createProductAction にR2アップロード処理追加
- ✅ updateProductAction にR2アップロード処理追加
- ✅ deleteProductAction にR2削除処理追加
- ✅ TypeScript errors: 0
- ✅ ESLint errors: 0
- ✅ DeviceシステムとProductシステムの機能パリティ達成
- ✅ 実装ログ作成（本ドキュメント）

---

## 10. 次のステップ

実装が完全に完了し、品質チェックも通過しました。

**残りのタスク**:
- Git コミット作成

---

**作成日**: 2025-12-31
**作成者**: Claude Code (Claude Sonnet 4.5)
**ステータス**: ✅ R2画像保存機能実装完了
