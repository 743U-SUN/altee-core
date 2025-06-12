# 画像アップローダーガイド

## 概要
汎用的な画像アップロードコンポーネント。ドラッグ&ドロップ、自動リサイズ、SVGサニタイズ、プレビュー機能を提供。

## ディレクトリ構造

```
components/image-uploader/
├── image-uploader.tsx      # メインコンポーネント
├── drop-zone.tsx          # ドラッグ&ドロップエリア
└── image-preview.tsx      # プレビュー表示

lib/image-uploader/
├── image-validator.ts     # ファイル検証
├── image-processor.ts     # リサイズ・WebP変換
└── svg-sanitizer.ts       # SVGサニタイズ

app/actions/
└── image-upload-actions.ts # Server Actions

types/
└── image-upload.ts        # 型定義
```

## 機能仕様

### 対応ファイル形式
- **画像形式**: gif, jpg, jpeg, png, webp, svg
- **処理**: SVG(サニタイズのみ)、その他(リサイズ+WebP変換)

### ドロップゾーン
- **サイズ連動**: プレビューサイズに合わせてドロップゾーンサイズも調整
- **単一ファイル**: maxFiles=1の場合、アップロード後にドロップゾーンが非表示
- **レスポンシブ**: small/medium/largeに応じたUI最適化

### アップロードモード
| モード | 動作 |
|--------|------|
| immediate | ファイル選択時に即座アップロード（画像最適化実行） |
| batch | プレビューのみ表示、実際のアップロードは別途実装が必要 |

### プレビューサイズ
| サイズ | 寸法 | 用途 |
|--------|------|------|
| small | 64x64px | プロフィール画像 |
| medium | 160x160px | 一般的な画像 |
| large | 320x240px | 大きな画像・記事用 |
| custom | 任意 | カスタムサイズ |

### 削除ボタン配置
| 位置 | 説明 |
|------|------|
| overlay | 画像上にオーバーレイ表示 |
| external | 画像の横に配置 |
| auto | サイズに応じて自動選択 |

## 基本的な使用方法

### 即座アップロード
```tsx
import { ImageUploader } from '@/components/image-uploader/image-uploader'

<ImageUploader
  mode="immediate"
  previewSize="medium"
  maxFiles={5}
  onUpload={(files) => console.log('Uploaded:', files)}
  onDelete={(fileId) => console.log('Deleted:', fileId)}
/>
```

### プロフィール画像
```tsx
<ImageUploader
  mode="immediate"
  previewSize="small"
  deleteButtonPosition="external"
  maxFiles={1}
  rounded={true}
  value={profileImage}
  onUpload={setProfileImage}
/>
```

### バッチアップロード（プレビューのみ）
```tsx
<ImageUploader
  mode="batch"
  previewSize="large"
  maxFiles={10}
  value={batchFiles}
  onUpload={setBatchFiles}  // プレビューファイル配列を受け取る
/>

// 実際のアップロード処理は別途実装
const handleBatchUpload = async () => {
  const filesToUpload = batchFiles.filter(f => f.key === '') // プレビューファイルのみ
  const formData = new FormData()
  filesToUpload.forEach(f => {
    // File オブジェクトの再構築が必要
  })
  // uploadImagesAction() を呼び出し
}
```

### フォルダ指定アップロード
```tsx
// ユーザーアイコン用
<ImageUploader
  mode="immediate"
  previewSize="small"
  folder="user-icons"
  maxFiles={1}
  rounded={true}
  onUpload={setUserIcon}
/>

// 記事画像用
<ImageUploader
  mode="batch"
  previewSize="medium"
  folder="articles"
  maxFiles={5}
  onUpload={setArticleImages}
/>
```

## Props

### ImageUploaderProps
```typescript
interface ImageUploaderProps {
  mode: 'immediate' | 'batch'                    // アップロードモード
  previewSize: PreviewSize | CustomSize          // プレビューサイズ
  deleteButtonPosition?: 'overlay' | 'external' | 'auto'
  maxFiles?: number                              // 最大ファイル数
  maxSize?: number                               // 最大ファイルサイズ(bytes)
  rounded?: boolean                              // 円形表示
  className?: string
  disabled?: boolean
  folder?: string                                // 保存先フォルダ（デフォルト: 'images'）
  value?: UploadedFile[]                         // 制御コンポーネント用
  onUpload?: (files: UploadedFile[]) => void
  onDelete?: (fileId: string) => void
  onError?: (error: string) => void
}
```

## セキュリティ機能

### SVGサニタイズ
- DOMPurify + JSDOM を使用（動的import対応）
- JavaScriptコード、イベントハンドラーを検出・除去
- 安全なSVGタグ・属性のみ許可
- ブラウザ・Node.js両環境で動作

### ファイル検証
- MIMEタイプとファイル拡張子の二重チェック
- ファイルサイズ制限
- サポート外形式の拒否

## 画像処理

### 自動最適化
- **リサイズ**: 最大1920x1080px(アスペクト比維持)
- **フォーマット**: WebP変換(品質80%)
- **SVG**: サニタイズのみ実行（処理せずそのまま保存）
- **処理方式**: ブラウザCanvas API使用（サーバーサイドSharpは不使用）

### 処理オプション
```typescript
{
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'webp'
}
```

## Server Actions

### uploadImageAction
```typescript
// 単体アップロード
const result = await uploadImageAction(formData, 'images')

// 戻り値
{
  success: boolean
  file?: UploadedFile
  error?: string
}
```

### deleteImageAction
```typescript
// ファイル削除(物理削除)
const result = await deleteImageAction(fileKey)
```

## ファイル保存先

### デフォルト構造
```
ConoHaオブジェクトストレージ/
└── images/              # デフォルトコンテナ
    ├── {timestamp}_{random}.webp
    ├── {timestamp}_{random}.svg
    └── ...
```

### フォルダ指定時の構造
```
ConoHaオブジェクトストレージ/
├── images/              # 通常の画像
├── user-icons/          # ユーザーアイコン
├── articles/            # 記事画像
├── profiles/            # プロフィール画像
└── temp/                # 一時ファイル
```

### フォルダ名の推奨事項
- **user-icons**: ユーザーアバター・アイコン
- **articles**: ブログ記事・コンテンツ画像
- **profiles**: プロフィール画像・カバー画像
- **products**: 商品画像
- **temp**: 一時的なアップロード

## デモページ

`/demo/article` で以下のパターンをテスト可能:

1. **即座アップロードモード(Large)** - 自動アップロード
2. **バッチモード(Medium)** - プレビュー表示のみ
3. **プロフィール画像(Small・円形)** - 1ファイル限定
4. **カスタムサイズ** - 200x150pxでテスト

## 注意事項

- SVGファイルは悪意のあるコードを含む可能性があるため必ずサニタイズ
- 大容量ファイルはブラウザでの処理に時間がかかる場合あり
- WebP非対応ブラウザでは元形式のまま保存
- プレビュー画像のURLはConoHa直接アクセス形式
- **GIFアニメーション**: Canvas API制限により静止画に変換される
- **プレビュー表示**: ファイル名・サイズ情報は表示されない（画像のみ）
- **背景透過PNG**: 透過WebPに正しく変換される



## 重要事項
- ConoHaオブジェクトストレージは従量課金なしの定額制（転送量・リクエスト数無制限）
- S3Proxy経由でS3互換APIを使用し、既存コードをそのまま活用
- 開発・本番環境でConoHa統一により、環境差異によるトラブルを削減
- 直接アクセス可能なため、プロキシ配信不要でシンプルな構成

## アーキテクチャ設計
### ファイルアクセスパターン
#### ファイル操作（アップロード・削除）
- **Server Actions**を使用してストレージ操作を統一
- **開発・本番共通**: ブラウザ → Next.js Server Actions → S3Proxy → ConoHaオブジェクトストレージ

#### ファイル配信（画像表示・ダウンロード）
- **直接アクセス**によるシンプルな配信
- **開発・本番共通**: ブラウザ → ConoHaオブジェクトストレージ → 画像返却（直接）
- 転送量・リクエスト数無制限のため、プロキシ配信不要
- CDN機能活用によるパフォーマンス向上


### 画像最適化戦略
#### 二段階最適化アプローチ
1. **アップロード時最適化**（Server Actions内）
   - リサイズ、WebP変換、品質調整
   - オブジェクトストレージの容量圧迫を防止
   - 最適化済み画像をオブジェクトストレージに保存

2. **表示時最適化**（Next.js Image）
   - `unoptimized={true}`で二重最適化を回避
   - 遅延読み込み（lazy loading）機能を活用
   - レスポンシブ対応（sizes、srcSet）を活用
   - priority設定でLCP最適化
   - placeholder機能でUX向上

#### 使用例
```jsx
<Image 
  src="https://object-storage.tyo2.conoha.io/v1/AUTH_tenant_id/images/sample.webp"
  alt="sample"
  width={800}
  height={600}
  unoptimized={true}
  placeholder="blur"
  priority={false} // 必要に応じてtrue
/>
```

## 作成ファイル一覧

### デモファイル
| ファイル | 場所 | 説明 |
|---------|------|------|
| page.tsx | app/demo/article/ | ConoHaファイル操作のテスト用UI画面 |
| actions.ts | app/demo/article/ | Server Actions（アップロード、一覧取得、削除） |

### 設定ファイル
| ファイル | 場所 | 説明 |
|---------|------|------|
| compose.dev.yaml | / | S3Proxyサービス追加済み（ポート8081） |
| .env.local | / | ConoHa接続設定追加済み |
| storage.ts | lib/ | S3Proxy経由ストレージクライアント |

#### app/demo/article/page.tsx
- ConoHaへのファイルアップロードテスト用UI
- ファイル一覧取得テスト用UI
- 画像表示テスト用UI
- 基本的なフォームとボタンを配置

#### app/demo/article/actions.ts
- uploadFile: ファイルアップロード用Server Action
- listFiles: ファイル一覧取得用Server Action
- deleteFile: ファイル削除用Server Action
- S3Proxy経由でConoHaにアクセス

#### lib/storage.ts
- S3Proxy経由のストレージクライアント（ConoHa対応）
- 環境変数から設定を自動読み込み
- STORAGE_BUCKET、STORAGE_ENDPOINTをexport
- 設定値の検証機能付き

## 導入完了項目
✅ @aws-sdk/client-s3パッケージ追加
✅ S3Proxy経由ストレージクライアント作成(lib/storage.ts)
✅ 画像アップローダーコンポーネント実装
✅ Server Actions実装
✅ ConoHaオブジェクトストレージ統合完了
✅ 画像アップロード・WebP変換動作確認済み
✅ MinIO/さくらストレージ参照削除完了

## ConoHa移行の利点
- **コスト予測可能**: 従量課金なしの定額制
- **開発・本番統一**: 環境差異によるトラブル削減
- **シンプルアーキテクチャ**: プロキシ配信不要
- **パフォーマンス向上**: 直接アクセスによる高速化
- **運用コスト削減**: MinIOメンテナンス不要