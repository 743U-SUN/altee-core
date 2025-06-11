# 画像アップローダーガイド

## 概要
汎用的な画像アップロードコンポーネント。ドラッグ&ドロップ、自動リサイズ、SVGサニタイズ、プレビュー機能を提供。

## ディレクトリ構造

```
components/image-uploader/
├── image-uploader.tsx      # メインコンポーネント
├── drop-zone.tsx          # ドラッグ&ドロップエリア
├── image-preview.tsx      # プレビュー表示
└── upload-progress.tsx    # アップロード進捗表示

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
| batch | プレビューのみ、送信時一括アップロード（画像最適化実行） |

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

### バッチアップロード
```tsx
<ImageUploader
  mode="batch"
  previewSize="large"
  maxFiles={10}
  value={batchFiles}
  onUpload={setBatchFiles}
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
  value?: UploadedFile[]                         // 制御コンポーネント用
  onUpload?: (files: UploadedFile[]) => void
  onDelete?: (fileId: string) => void
  onError?: (error: string) => void
}
```

## セキュリティ機能

### SVGサニタイズ
- DOMPurify + JSDOM を使用（サーバーサイド対応）
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

```
dev-storage/
└── images/
    ├── {timestamp}_{random}.webp
    ├── {timestamp}_{random}.svg
    └── ...
```

## デモページ

`/demo/article` で以下のパターンをテスト可能:

1. **即座アップロードモード(Large)** - 自動アップロード
2. **バッチモード(Medium)** - プレビュー→一括送信
3. **プロフィール画像(Small・円形)** - 1ファイル限定
4. **カスタムサイズ** - 200x150pxでテスト

## 注意事項

- SVGファイルは悪意のあるコードを含む可能性があるため必ずサニタイズ
- 大容量ファイルはブラウザでの処理に時間がかかる場合あり
- WebP非対応ブラウザでは元形式のまま保存
- プレビュー画像のURLは`/api/files/{key}`形式
- **GIFアニメーション**: Canvas API制限により静止画に変換される
- **プレビュー表示**: ファイル名・サイズ情報は表示されない（画像のみ）
- **背景透過PNG**: 透過WebPに正しく変換される