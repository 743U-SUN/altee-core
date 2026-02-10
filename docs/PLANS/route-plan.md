# altee-core ルート設計

**作成日**: 2026-01-02  
**最終更新**: 2026-01-02  
**ステータス**: 承認済み

---

## 📋 設計方針

### 命名規則
- **ユーザー個別ページ**: `/@[handle]`（SNS風、短いURL）
- **グループ**: `/g/[groupHandle]`
- **ダッシュボード**: `/dashboard/*`（ログインユーザー専用）
- **管理者**: `/admin/*`
- **公開コンテンツ**: 直感的な短いパス

### アクセス権限
| プレフィックス | 対象 |
|--------------|------|
| `/admin/*` | 管理者のみ |
| `/dashboard/*` | ログインユーザー |
| `/g/[handle]/manage/*` | グループオーナーのみ |
| その他 | 全員（ビジター含む） |

---

## 🗺️ ルート構造

### 公開ページ（ビジター・全員アクセス可）

```
/                           # ホーム
│
├── /u                      # VTuber一覧（登録VTuberのみ表示）
│   └── フィルタ: プラットフォーム(YouTube/Twitch)、ゲームハード(PC/PS5/Nintendo)
│
├── /@[handle]              # ユーザー（VTuber）個別ページ
│   ├── /@[handle]/items    # 使用アイテム紹介
│   │   └── /@[handle]/items/pc  # PC環境紹介
│   ├── /@[handle]/videos   # 動画一覧（既存）
│   └── /@[handle]/posts    # お知らせ（最大3件）
│
├── /g                      # グループ一覧
│   └── /g/[groupHandle]    # グループ個別ページ
│       ├── /g/[groupHandle]/members  # メンバー一覧
│       └── /g/[groupHandle]/posts    # グループお知らせ（最大3件）
│
├── /posts                  # お知らせ統合ページ
│   ├── サイトからのお知らせ: Articles（noticeカテゴリ）を表示
│   └── VTuber・グループのお知らせ: UserPost / GroupPost を表示
│   └── フィルタ/タブ: 種別切り替え可能
│
├── /articles               # 管理者記事一覧
│   ├── /articles/[slug]        # 記事個別ページ
│   └── /articles/category/[category]  # カテゴリ別一覧
│
├── /items                  # アイテムカタログ
│   ├── /items/pc-parts     # PCパーツ
│   │   ├── /items/pc-parts/cpu
│   │   ├── /items/pc-parts/gpu
│   │   └── /items/pc-parts/...
│   ├── /items/devices      # デバイス（周辺機器）
│   │   ├── /items/devices/mouse
│   │   ├── /items/devices/keyboard
│   │   ├── /items/devices/microphone
│   │   ├── /items/devices/headset
│   │   └── /items/devices/...
│   ├── /items/food         # 食品・スナック
│   └── /items/favorites    # お気に入り一覧（ログイン/ローカル）
│
├── /pc-builder             # PCビルダー（ツール）
│   └── /pc-builder/share/[id]  # 共有URL（一時的、2-3ヶ月で期限切れ）
│
└── /lib                    # ライブラリ（リソース集）
    ├── /lib/links          # 便利リンク集
    ├── /lib/fonts          # フリーフォントまとめ
    └── /lib/auditions      # VTuberオーディション情報
```

### ダッシュボード（ログインユーザー専用）

```
/dashboard                  # ダッシュボードトップ
├── /dashboard/profile      # プロフィール設定（タブでOGP設定も含む）
├── /dashboard/userdata     # ユーザーデータ（身長・体重など）
├── /dashboard/links        # SNSリンク設定
├── /dashboard/platforms    # YouTube/Twitch連携
│   ├── /dashboard/platforms/youtube
│   ├── /dashboard/platforms/twitch
│   └── /dashboard/platforms/niconico
├── /dashboard/faq          # FAQ設定
├── /dashboard/items        # 使用アイテム設定
│   ├── /dashboard/items/pc     # PC環境設定
│   └── /dashboard/items/devices  # デバイス設定
├── /dashboard/posts        # お知らせ管理（最大3件）
├── /dashboard/notifications  # 通知・連絡方法設定
├── /dashboard/account      # アカウント設定（メール変更、退会など）
└── /dashboard/setup        # 初期設定
```

> [!TIP]
> **OGP設定**: `/dashboard/profile` 内でタブ切り替えにより設定可能。専用ページは作らない。

### グループ管理（グループオーナー専用）

```
/g/[groupHandle]/manage             # グループ管理トップ
├── /g/[groupHandle]/manage/profile     # グループプロフィール編集
├── /g/[groupHandle]/manage/members     # メンバー管理（招待・削除）
├── /g/[groupHandle]/manage/posts       # お知らせ管理（最大3件）
├── /g/[groupHandle]/manage/settings    # グループ設定
└── /g/[groupHandle]/manage/transfer    # オーナー権限移譲
```

### 管理者（Admin専用）

```
/admin                      # 管理者トップ
├── /admin/users            # ユーザー管理
├── /admin/articles         # 記事管理
├── /admin/items            # アイテム管理
├── /admin/item-categories  # アイテムカテゴリ管理
├── /admin/media            # メディア管理
├── /admin/links            # リンクタイプ管理
├── /admin/attributes       # 属性管理（カテゴリ・タグ）
├── /admin/lib              # ライブラリ管理（リンク集、フォント、オーディション）
└── /admin/blacklist        # ブラックリスト管理
```

### 認証

```
/auth
├── /auth/signin            # ログイン
├── /auth/error             # エラー
└── /auth/suspended         # アカウント停止
```

---

## 📝 機能別詳細

### お知らせ（Posts）システム

| 種別 | 作成者 | 制限 | 管理場所 |
|-----|-------|------|---------|
| サイトお知らせ | 管理者 | なし（Articlesのnoticeカテゴリ） | `/admin/articles` |
| ユーザーお知らせ | VTuber | 3件まで | `/dashboard/posts` |
| グループお知らせ | グループオーナー | 3件まで | `/g/[handle]/manage/posts` |

**`/posts`ページでの表示:**
- セクション1: サイトからのお知らせ（Articles の notice カテゴリ）
- セクション2: VTuber・グループのお知らせ（混合 or タブ切り替え）

### Items お気に入り機能

| ユーザー種別 | 保存先 | 期限 |
|------------|-------|------|
| ログインユーザー | データベース | 無期限 |
| ビジター | LocalStorage | 180日 |

### PCビルダー

- **ログイン不要**で構成作成可能
- **共有URL**発行: `/pc-builder/share/[id]`
- **有効期限**: 2-3ヶ月

---

## 🔄 既存ルートからの変更点

### 変更なし
- `/@[handle]` - ユーザー個別ページ
- `/dashboard/*` - ダッシュボード全般
- `/admin/*` - 管理者ページ
- `/auth/*` - 認証

### 新規追加
| ルート | 説明 |
|-------|------|
| `/u` | VTuber一覧 |
| `/g/*` | グループ関連 |
| `/posts` | お知らせ統合ページ |
| `/articles` | 管理者記事（`/article` から変更） |
| `/items/*` | アイテムカタログ |
| `/pc-builder` | PCビルダーツール |
| `/lib/*` | ライブラリ（リンク集、フォント、オーディション） |

---

## 📚 関連ドキュメント

- [database-plan.md](./database-plan.md) - データベース設計案
- [sidebar-mobile-menu-renovation.md](./sidebar-mobile-menu-renovation.md) - サイドバー改修計画
- [development-phases.md](./development-phases.md) - 開発フェーズ計画

---

## 💡 altee について

**altee** = 「alt（もう一人の自分）」＋「ee（存在）」  
→ バーチャルな自分を表現する場所

**ドメイン**: altee.me