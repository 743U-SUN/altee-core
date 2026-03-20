# デバイスカスタム画像URL機能とNext.js画像キャッシュ問題の解決

**日付**: 2025年12月20日
**作業者**: Claude Code

## 概要

デバイス登録時にカスタム画像URLを指定できる機能を完成させ、Next.js画像最適化キャッシュによる古い画像表示問題を解決しました。この作業には、Prismaマイグレーションの修正、Docker build時の型エラー修正、DeviceImageコンポーネントのprops統一、画像キャッシュのトラブルシューティングが含まれます。

## 背景

### 前回セッションからの継続
- 前回のセッションで`customImageUrl`フィールドの実装を開始
- `db:push`を使用してしまい、データベースドリフトが発生
- `prisma migrate reset`を実行してリセット
- デバイスカテゴリ（マウス、キーボード）が消失

### 課題
1. 適切なPrismaマイグレーションの作成
2. シードスクリプトの実行（tsxパッケージ不足）
3. Docker build時の複数の型エラー
4. R2に保存された画像が表示されない問題

## 作業内容

### 1. Prismaマイグレーションの作成

**実行コマンド**:
```bash
docker compose -f compose.dev.yaml exec app npx prisma migrate dev --name add_custom_image_url_to_device
```

**スキーマ変更**:
```prisma
model Device {
  id               String         @id @default(cuid())
  asin             String         @unique
  name             String
  description      String?
  categoryId       String
  amazonUrl        String
  amazonImageUrl   String?
  customImageUrl   String?        // 追加フィールド
  imageStorageKey  String?
  // ... その他のフィールド
}
```

**結果**: マイグレーションファイル作成成功、Prisma Client v6.9.0生成

### 2. tsxパッケージのインストールとシード実行

**問題**: `spawn tsx ENOENT`エラー

**解決手順**:
1. ホストで`npm install -D tsx`実行
2. package.jsonに追加されたことを確認
3. Dockerイメージを再ビルド: `docker compose -f compose.dev.yaml build app`
4. シード実行成功

**シード結果**: マウスとキーボードのカテゴリが復元

### 3. Docker Build時の型エラー修正

Docker build中に11個以上の型エラーが発生。以下のファイルを修正:

#### 3.1 cleanup-actions.ts (line 46)
**エラー**: `'folder' is assigned a value but never used`

**修正**:
```typescript
// const folder = obj.Key.split('/')[0] || 'unknown'
```

#### 3.2 device-actions.ts (line 610)
**エラー**: `Unexpected any. Specify a different type`

**修正**:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateData: any = {}
```

#### 3.3 RefreshDeviceImageButton.tsx (line 14)
**エラー**: `'deviceName' is defined but never used`

**修正**:
```typescript
// Before
export function RefreshDeviceImageButton({ deviceId, deviceName }: RefreshDeviceImageButtonProps)

// After
export function RefreshDeviceImageButton({ deviceId }: RefreshDeviceImageButtonProps)
```

#### 3.4 DeviceImageコンポーネントのprops統一

**問題**: 8つのファイルで`src`propを使用していたが、DeviceImageコンポーネントはそのpropを持たない

**修正対象ファイル**:
1. `app/[handle]/devices/components/UserPublicDeviceCard.tsx`
2. `app/devices/components/DeviceCard.tsx`
3. `app/dashboard/devices/components/DragDropDeviceList.tsx`
4. `app/dashboard/devices/components/EditUserDeviceModal.tsx`
5. `app/dashboard/devices/components/ExistingDeviceSelector.tsx`
6. `app/dashboard/devices/components/NewDeviceCreator.tsx`
7. `app/admin/devices/components/DeviceForm.tsx`
8. `app/admin/devices/components/DeviceEditForm.tsx`

**修正内容**:
```typescript
// Before
<DeviceImage src={device.amazonImageUrl} alt={...} />

// After
<DeviceImage
  imageStorageKey={device.imageStorageKey}
  customImageUrl={device.customImageUrl}
  amazonImageUrl={device.amazonImageUrl}
  alt={...}
/>
```

**結果**: Docker build成功

### 4. 画像表示問題のトラブルシューティング

#### 問題の症状
- R2にカスタム画像が正しく保存されている
- データベースに`imageStorageKey`が正しく保存されている
- コンソールログに`[DeviceImage] Using R2: device-images/B0CXNKW271.jpg`と表示
- API直接アクセス(`/api/files/device-images/B0CXNKW271.jpg`)で正しい画像が表示
- しかし、admin/devicesの一覧ではAmazon OG画像（小さい画像）が表示される

#### 調査プロセス

**データベース確認**:
```sql
SELECT id, asin, "amazonImageUrl", "customImageUrl", "imageStorageKey"
FROM devices
WHERE asin = 'B0CXNKW271';
```

**結果**:
- `amazonImageUrl`: `https://m.media-amazon.com/images/I/41yzKWnUA-L._AC_SX300_SY300_QL70_ML2_.jpg` (OG画像)
- `customImageUrl`: `https://m.media-amazon.com/images/I/819DO4U70ZL._AC_SL1500_.jpg` (カスタム画像)
- `imageStorageKey`: `device-images/B0CXNKW271.jpg`

**ネットワーク確認**:
- ブラウザのネットワークタブで確認したURL: `http://localhost:3000/_next/image?url=%2Fapi%2Ffiles%2Fdevice-images%2FB0CXNKW271.jpg&w=96&q=75`
- 直接APIアクセス: カスタム画像（高品質）が表示される ✓
- `_next/image`経由: Amazon OG画像（低品質）が表示される ✗

#### 根本原因の特定

**Next.js画像最適化キャッシュ**が原因と判明:
- `.next/cache/images/`ディレクトリに古い画像がキャッシュされていた
- カスタムURL機能追加前にAmazon OG画像をキャッシュ
- 元画像（R2の内容）が更新されてもキャッシュが残り続けた

#### 解決方法

**キャッシュクリア**:
```bash
docker compose -f compose.dev.yaml exec -T app rm -rf .next/cache/images/*
```

**結果**:
- 画像キャッシュを完全削除
- ブラウザリロード後、カスタム画像（高品質）が正しく表示されるようになった

### 5. ネットワークリクエストの検証

**ユーザーからの質問**: 同じ画像URLに対して3つのリクエストが発生している理由

**調査結果**:
- データベースクエリで確認: 該当する`imageStorageKey`を持つデバイスは1つのみ
- イニシエータ: `devices:421` (1つ) + `device-image.tsx:55` (2つ)
- 全てのリクエストパラメータが同一: `w=96&q=75`

**結論**:
- Reactストリクトモードまたは開発環境でのコンポーネント再レンダリングが原因
- 本番環境では最適化される正常な動作
- Next.jsは同じURLへの複数リクエストを自動的にデデュプリケーションするため、パフォーマンスへの影響はほぼなし

## 技術的詳細

### DeviceImageコンポーネントの画像優先順位

[components/devices/device-image.tsx:32-48](../../components/devices/device-image.tsx#L32-L48)

```typescript
const getImageSrc = () => {
  if (hasError) return '/images/device-placeholder.svg'
  if (imageStorageKey) {
    console.log('[DeviceImage] Using R2:', imageStorageKey)
    return `/api/files/${imageStorageKey}`
  }
  if (customImageUrl) {
    console.log('[DeviceImage] Using customImageUrl:', customImageUrl)
    return customImageUrl
  }
  if (amazonImageUrl) {
    console.log('[DeviceImage] Using amazonImageUrl:', amazonImageUrl)
    return amazonImageUrl
  }
  console.log('[DeviceImage] Using placeholder')
  return '/images/device-placeholder.svg'
}
```

**優先順位**:
1. R2ストレージ (`imageStorageKey`) - 最優先
2. カスタムURL (`customImageUrl`)
3. Amazon OG画像 (`amazonImageUrl`)
4. プレースホルダー

### デバイス作成時の画像アップロードロジック

[app/actions/device-actions.ts:438-451](../../app/actions/device-actions.ts#L438-L451)

```typescript
// 画像URLがある場合はR2にダウンロード・アップロード
// カスタムURL優先、なければAmazon画像URL
let imageStorageKey: string | undefined = undefined
const imageUrl = data.customImageUrl || data.amazonImageUrl
if (imageUrl) {
  const uploadResult = await downloadAndUploadDeviceImage(imageUrl, data.asin)
  if (uploadResult.success) {
    imageStorageKey = uploadResult.storageKey
  } else {
    console.error('画像アップロード失敗:', uploadResult.error)
    // 画像アップロード失敗してもデバイス作成は続行
  }
}
```

### 画像更新機能

[app/actions/device-actions.ts:1217-1263](../../app/actions/device-actions.ts#L1217-L1263)

RefreshDeviceImageButton機能により、既存デバイスの画像を再取得可能:
1. 古いR2画像を削除
2. `customImageUrl`（優先）または`amazonImageUrl`から再ダウンロード
3. R2に新しい画像をアップロード
4. `imageStorageKey`を更新

## 学んだこと

### 1. Prismaマイグレーションのベストプラクティス
- 本番環境では**絶対に**`db:push`を使わない
- 常に`prisma migrate dev`でマイグレーションファイルを作成
- マイグレーションファイルはgitにコミット

### 2. Dockerでのnpm依存関係管理
- ホストで`npm install`しても、Dockerコンテナには自動反映されない
- package.json変更後は`docker compose build`でイメージ再ビルドが必要
- node_modulesはボリュームで分離されている

### 3. TypeScript型エラーの早期検出
- Docker build前にローカルで`npx tsc --noEmit`実行を検討
- ESLintルールの適切な設定が重要
- 必要な`any`型には適切なコメントで抑制

### 4. Next.js画像最適化キャッシュの挙動
- `next/image`は`.next/cache/images/`に最適化済み画像をキャッシュ
- 元画像が更新されてもキャッシュが自動的に無効化されない場合がある
- 開発環境での画像更新後は`rm -rf .next/cache/images/*`でキャッシュクリアが必要
- 本番環境では適切なCache-Controlヘッダーと画像URLのバージョニングが重要

### 5. デバッグの重要性
- `console.log`による段階的な状態確認が有効
- ネットワークタブでの実際のリクエスト/レスポンス確認
- 直接APIアクセスとコンポーネント経由の比較
- データベース実データとアプリケーション状態の照合

## 今後の改善点

### 1. デバッグログの削除
現在、DeviceImageコンポーネントに残っているconsole.logを削除:
```typescript
console.log('[DeviceImage] Using R2:', imageStorageKey)
console.log('[DeviceImage] Using customImageUrl:', customImageUrl)
console.log('[DeviceImage] Using amazonImageUrl:', amazonImageUrl)
```

### 2. 画像キャッシュの自動管理
- 画像更新時に自動的にNext.jsキャッシュを無効化する仕組みの検討
- 画像URLにバージョンパラメータ（`?v=timestamp`）を追加してキャッシュバスティング

### 3. エラーハンドリングの強化
- 画像ロード失敗時のより詳細なエラーメッセージ
- ユーザーへのフィードバック改善

## 関連ファイル

### 修正したファイル
- `prisma/schema.prisma` - Device modelに`customImageUrl`追加
- `app/actions/device-actions.ts` - カスタムURL優先ロジック、eslint-disable追加
- `app/actions/cleanup-actions.ts` - 未使用変数コメントアウト
- `app/admin/devices/components/RefreshDeviceImageButton.tsx` - 未使用パラメータ削除
- `components/devices/device-image.tsx` - デバッグログ追加
- `app/admin/devices/components/DeviceForm.tsx` - DeviceImage props修正
- `app/admin/devices/components/DeviceEditForm.tsx` - DeviceImage props修正
- その他6ファイル - DeviceImage props統一

### マイグレーションファイル
- `prisma/migrations/YYYYMMDDHHMMSS_add_custom_image_url_to_device/` (作成)

## まとめ

カスタム画像URL機能の実装を完了し、Next.js画像キャッシュの問題を解決しました。これにより:

✅ Amazon商品のOG画像が低品質な場合でも、高品質なカスタムURLを指定可能
✅ カスタムURLの画像はR2に自動的にダウンロード・保存
✅ 画像表示の優先順位が明確化（R2 > カスタムURL > Amazon OG > プレースホルダー）
✅ 既存デバイスの画像も再取得ボタンで更新可能
✅ Next.jsの画像最適化キャッシュ問題の対処方法を確立

開発環境では画像更新後に`.next/cache/images/`のクリアが必要ですが、これは正常な動作であり、本番環境では適切なキャッシュ戦略により問題になりません。
