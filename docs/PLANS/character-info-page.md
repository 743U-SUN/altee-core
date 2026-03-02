# VTuber キャラクター情報ページ (`dashboard/character/`)

## Context

VTuber/配信者が自分のキャラクター基本情報を入力・管理するダッシュボードページを新設する。
将来的にユーザー一覧ページのフィルター機能として活用することを見据え、データは検索可能な形でDB保存する。

**既存データとの関係:**
- `User.youtubeChannelId` / `User.twitchUsername` はAPI連携用（RSS取得、ライブ検知）として残す
- `CharacterInfo` + `CharacterPlatformAccount` は表示・フィルタリング用（役割が異なるので共存）

**関連する将来タスク（別計画）:**
- `dashboard/platforms/` → `dashboard/videos/` への移行（WYSIWYG風UI化）
- ファン向け設定ページ（ファンアートポリシー、切り抜き許可、メンバーシップ有無）

---

## ページ構成

```
dashboard/character/          → 基本情報（デフォルトページ）
dashboard/character/activity  → 活動情報（プラットフォーム + 配信スタイル等）
dashboard/character/game      → ゲーム
dashboard/character/collab    → コラボ
```

**ナビゲーション**: サイドバーの第2サイドバー（カスタムコンテンツエリア）にサブナビを配置。
`profile-editor` / `faqs` がサイドバーを使っているのと同じパターン。

---

## データベース設計

### 新規モデル: `CharacterInfo`

User と 1:1 リレーション。フィルタリング用途を考慮し、検索可能なカラム設計にする。

```prisma
model CharacterInfo {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // === 基本情報 ===
  iconImageKey      String?   // アイコン画像（R2 storageKey）
  characterName     String?   // キャラクターネーム
  nameReading       String?   // 読み方（ひらがな/カタカナ）
  gender            String?   // 男性 / 女性 / 不明 / その他
  birthdayMonth     Int?      // 誕生日（月）
  birthdayDay       Int?      // 誕生日（日）
  species           String?   // 種族（人間、悪魔、エルフ等）
  element           String?   // 属性（火、水、闇等）
  debutDate         DateTime? // デビュー日
  fanName           String?   // ファンネーム
  fanMark           String?   // 推しマーク（絵文字）
  illustrator       String?   // ママ（イラストレーター）
  modeler           String?   // パパ（モデラー）
  affiliation       String?   // 所属名（事務所名 or 個人）
  affiliationType   String?   // "individual" | "agency"

  // === 活動情報 ===
  streamingStyles      String[]  // 配信スタイル: ["ゲーム実況", "歌枠", "雑談", "ASMR", ...]
  streamingTimezones   String[]  // 活動時間帯: ["朝", "昼", "夕方", "夜", "深夜"]
  streamingFrequency   String?   // 配信頻度: "毎日" | "週4-6回" | "週2-3回" | "週1回" | "不定期"
  languages            String[]  // 使用言語: ["日本語", "英語", ...]
  activityStatus       String?   // 活動状態: "active" | "hiatus" | "retired"

  // === ゲーム ===
  gamePlatforms     String[]  // ["PC", "PS5", "Switch", "XBOX", "スマホ", "その他"]
  gameGenres        String[]  // ["RPG", "FPS", "TPS", "アクション", ...]
  nowPlaying        String?   // 今プレイ中のゲーム

  // === コラボ ===
  collabStatus      String?   // "open" | "same_gender" | "closed"
  collabComment     String?   // コラボ条件や一言（自由テキスト）

  // === リレーション ===
  platformAccounts  CharacterPlatformAccount[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // フィルタリング用インデックス
  @@index([gender])
  @@index([species])
  @@index([element])
  @@index([collabStatus])
  @@index([affiliationType])
  @@index([activityStatus])
  @@map("character_info")
}
```

### 新規モデル: `CharacterPlatformAccount`

各プラットフォームのURL/チャンネル情報を正規化して保持する子モデル。

```prisma
model CharacterPlatformAccount {
  id            String        @id @default(cuid())
  characterId   String
  character     CharacterInfo @relation(fields: [characterId], references: [id], onDelete: Cascade)
  platform      String        // "youtube", "twitch", "niconico", "twicas", ...
  url           String?       // チャンネル/ユーザーページURL
  isActive      Boolean       @default(true)
  sortOrder     Int           @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@unique([characterId, platform])
  @@index([platform])
  @@map("character_platform_accounts")
}
```

**User モデルへのリレーション追加:**
```prisma
model User {
  // ...existing fields...
  characterInfo      CharacterInfo?
}
```

**フィルタリング例:**
```typescript
// 「YouTubeで活動中のVTuber」を検索
prisma.characterInfo.findMany({
  where: {
    platformAccounts: {
      some: { platform: "youtube", isActive: true }
    }
  }
})

// String[] フィールドの検索（配信スタイルでフィルタ）
prisma.characterInfo.findMany({
  where: {
    streamingStyles: { hasSome: ["歌枠", "ASMR"] }
  }
})
```

---

## ファイル構成

```
app/dashboard/character/
├── layout.tsx                          # 共通レイアウト（タイトル + サブナビ）
├── page.tsx                            # 基本情報ページ（Server Component）
├── activity/
│   └── page.tsx                        # 活動情報ページ（Server Component）
├── game/
│   └── page.tsx                        # ゲーム設定ページ（Server Component）
├── collab/
│   └── page.tsx                        # コラボ設定ページ（Server Component）
└── components/
    ├── CharacterNavigation.tsx          # サブページナビゲーション（Client）
    ├── BasicInfoForm.tsx               # 基本情報フォーム（Client）
    ├── ActivityForm.tsx                # 活動情報フォーム（Client）
    ├── GameSettingsForm.tsx             # ゲーム設定フォーム（Client）
    └── CollabSettingsForm.tsx           # コラボ設定フォーム（Client）

app/actions/user/
└── character-actions.ts                # Server Actions

components/sidebar-content/
└── CharacterSidebarContent.tsx         # サイドバーナビコンテンツ（Server）
```

---

## 各ページの詳細

### 1. 基本情報 (`dashboard/character/`)

| フィールド | UI | バリデーション |
|-----------|-----|-------------|
| アイコン | ImageUploader (1:1, 小サイズ) | 画像ファイルのみ |
| キャラクターネーム | Input | 必須、最大50文字 |
| 読み方 | Input | 最大50文字 |
| 性別 | Select (男性/女性/不明/その他) | enum値 |
| 誕生日 | 月Select + 日Select | 月1-12、日1-31 |
| 種族 | Combobox（入力+候補） | 最大30文字 |
| 属性 | Combobox（入力+候補） | 最大30文字 |
| デビュー日 | DatePicker | Date |
| ファンネーム | Input | 最大30文字 |
| 推しマーク | Input (emoji) | 最大10文字 |
| ママ | Input | 最大50文字 |
| パパ | Input | 最大50文字 |
| 所属タイプ | Select (個人/事務所) | enum値 |
| 所属名 | Input (事務所選択時のみ表示) | 最大50文字 |

**種族・属性の候補リスト** (constants/ に定義):
- 種族: 人間、悪魔、天使、エルフ、獣人、吸血鬼、竜人、妖精、幽霊、AI、その他
- 属性: 火、水、氷、雷、風、地、光、闇、無、その他

### 2. 活動情報 (`dashboard/character/activity`)

#### プラットフォームセクション

各プラットフォームに ON/OFF スイッチ + URL入力欄。ON にすると URL 入力欄が展開される。
保存時に `CharacterPlatformAccount` を upsert。

| プラットフォーム | URL例 |
|----------------|-------|
| YouTube | `https://youtube.com/@handle` or `https://youtube.com/channel/UC...` |
| Twitch | `https://twitch.tv/username` |
| ニコニコ | `https://nicovideo.jp/user/...` or `https://com.nicovideo.jp/community/co...` |
| TwiCas | `https://twitcasting.tv/username` |
| SHOWROOM | `https://showroom-live.com/room/...` |
| IRIAM | アプリ内リンク |
| REALITY | アプリ内リンク |
| 17LIVE | `https://17.live/...` |
| ミルダム | `https://mildom.com/...` |
| Kick | `https://kick.com/username` |
| その他 | 自由入力 |

#### 配信設定セクション

| フィールド | UI | 備考 |
|-----------|-----|------|
| 配信スタイル | Checkbox群 | ゲーム実況, 歌枠, 雑談, ASMR, お絵描き, 料理, 企画, 朗読, ホラー, 凸待ち, その他 |
| 活動時間帯 | Checkbox群 | 朝(6-12時), 昼(12-17時), 夕方(17-21時), 夜(21-25時), 深夜(25-6時) |
| 配信頻度 | RadioGroup | 毎日 / 週4-6回 / 週2-3回 / 週1回 / 不定期 |
| 使用言語 | Checkbox群 | 日本語, 英語, 中国語, 韓国語, スペイン語, その他 |
| 活動状態 | RadioGroup | 活動中 / 休止中 / 引退 |

### 3. ゲーム (`dashboard/character/game`)

| フィールド | UI | 備考 |
|-----------|-----|------|
| 所有ゲームハード | Checkbox群 | PC, PS5, Switch, XBOX, スマホ, その他 |
| 好きなジャンル | Checkbox群 | RPG, FPS, TPS, アクション, MMORPG, シミュレーション, パズル, 音ゲー, ホラー, その他 |
| Now Playing | Input | 自由テキスト |

### 4. コラボ (`dashboard/character/collab`)

| フィールド | UI | 備考 |
|-----------|-----|------|
| コラボ可否 | RadioGroup | コラボ可 / 同性とコラボ可 / 今はNG |
| コラボコメント | Textarea | 条件や一言（最大500文字） |

---

## UI/UX 設計

### レイアウト
- `platforms/` と同じパターン: `layout.tsx` にタイトル + `CharacterNavigation`（タブナビ）
- 各ページは `Card` + `CardHeader` + `CardContent` で囲む
- `DashboardLayoutClient` に `/dashboard/character` を追加して第2サイドバーを有効化

### サイドバー
- `CharacterSidebarContent.tsx`: 基本情報/活動情報/ゲーム/コラボへのリンクリスト
- `DashboardLayoutClient.tsx` の `PREVIEW_PATHS` に `'/dashboard/character'` を追加

### 保存
- **明示的な保存ボタン** (各ページ下部)
- 保存成功時に `toast.success("設定を保存しました")`
- 保存中は `isSubmitting` でボタン無効化 + "保存中..." テキスト

### ナビゲーション追加
- `lib/layout-config.ts` の `dashboardNavItems` に「キャラクター」を追加
- アイコン: lucide-react の `User` or `Sparkles`

---

## Server Actions 設計

`app/actions/user/character-actions.ts`:

```typescript
// 取得 (platformAccounts を include)
getCharacterInfo(): Promise<CharacterInfoWithPlatforms | null>

// 基本情報の更新
updateBasicInfo(data: BasicInfoInput): Promise<ActionResult>

// 活動情報の更新 (platformAccounts の upsert + 配信設定の更新)
updateActivitySettings(data: ActivitySettingsInput): Promise<ActionResult>

// ゲーム設定の更新
updateGameSettings(data: GameSettingsInput): Promise<ActionResult>

// コラボ設定の更新
updateCollabSettings(data: CollabSettingsInput): Promise<ActionResult>
```

各アクションは `upsert` を使用（CharacterInfo が未作成でも対応）。
Zod バリデーション付き。認証チェック（`cachedAuth()`）必須。

`updateActivitySettings` は `prisma.$transaction` 内で:
1. CharacterInfo の配信設定フィールドを更新
2. CharacterPlatformAccount を一括 upsert（有効/無効の切り替え + URL更新）

---

## 実装ステップ

### Phase 1: DB + 基盤
1. Prisma スキーマに `CharacterInfo` + `CharacterPlatformAccount` モデルを追加
2. マイグレーション実行
3. 定数ファイル作成 (`constants/character.ts` - 種族/属性/ゲームハード/ジャンル/プラットフォーム/配信スタイル/時間帯/頻度/言語/活動状態)
4. Zod バリデーションスキーマ作成 (`lib/validations/character.ts`)

### Phase 2: Server Actions
5. `app/actions/user/character-actions.ts` に全5アクション実装

### Phase 3: レイアウト + ナビゲーション
6. `CharacterNavigation.tsx` コンポーネント作成（タブナビ: 基本情報/活動情報/ゲーム/コラボ）
7. `CharacterSidebarContent.tsx` コンポーネント作成
8. `dashboard/character/layout.tsx` 作成
9. `DashboardLayoutClient.tsx` の `PREVIEW_PATHS` に追加
10. `lib/layout-config.ts` の `dashboardNavItems` に項目追加

### Phase 4: 各ページ実装
11. 基本情報ページ (`page.tsx` + `BasicInfoForm.tsx`)
12. 活動情報ページ (`activity/page.tsx` + `ActivityForm.tsx`)
13. ゲームページ (`game/page.tsx` + `GameSettingsForm.tsx`)
14. コラボページ (`collab/page.tsx` + `CollabSettingsForm.tsx`)

### Phase 5: 検証
15. 各ページの入力・保存・リロード後の値復元を確認
16. lint + 型チェック: `npm run lint && npx tsc --noEmit`

---

## 主要な既存ファイル（変更が必要）

| ファイル | 変更内容 |
|---------|---------|
| `prisma/schema.prisma` | CharacterInfo + CharacterPlatformAccount モデル追加、User リレーション追加 |
| `lib/layout-config.ts` | dashboardNavItems にキャラクター項目追加 |
| `components/layout/DashboardLayoutClient.tsx` | PREVIEW_PATHS に `/dashboard/character` 追加 |

## 既存パターンの再利用

| パターン | 参照元 |
|---------|--------|
| タブナビゲーション | `app/dashboard/platforms/components/PlatformNavigation.tsx` |
| サイドバーコンテンツ | `components/sidebar-content/DashboardSidebarContent.tsx` |
| 画像アップロード | `components/image-uploader/image-uploader.tsx` |
| Server Action パターン | `app/actions/user/notification-actions.ts` |
| フォーム保存 UI | `app/dashboard/notifications/notification-settings.tsx` |

---

## 検証方法

1. `http://localhost:3000/dashboard/character` にアクセスし各ページが表示されること
2. サイドバーにサブナビが表示されること
3. 各フォームで入力 → 保存 → リロードして値が保持されていること
4. プラットフォーム ON → URL入力 → 保存 → リロードで値が復元されること
5. 未入力状態でも保存・ページ遷移がエラーにならないこと
6. `npm run lint && npx tsc --noEmit` がエラーゼロであること
7. 各ページのCRUD操作が正しく反映されることをMCP Playwrightを用いて検証すること
