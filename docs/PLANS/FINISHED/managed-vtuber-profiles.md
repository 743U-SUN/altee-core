# 管理者によるVTuberプロフィール管理機能

## 概要

管理者（Admin）が VTuber のプロフィールページを作成・編集できる機能。
通常ユーザーは OAuth 経由でアカウント作成するが、**MANAGED ユーザー**は Admin が直接作成し、VTuber 本人のログインなしでプロフィールを公開できる。

**目的**: VTuber 本人が未登録でも、公式プロフィールページ（`/@handle`）を運営側で用意してサービスのコンテンツを充実させる。

---

## 決定事項（ユーザーとの合意）

- **初期スコープ**: MVP（作成 + キャラクター基本情報編集のみ）
- **編集UI**: Admin 専用ページ（`/admin/managed-profiles/`）
- **表示差分**: 公式バッジ表示（通常ユーザーと区別）
- セクション・FAQ・ニュース・テーマ編集・Claim 機能は**将来の拡張**

---

## Step 1: スキーマ変更

### 変更ファイル

- `prisma/schema.prisma`

### 内容

User モデルに `accountType` フィールドを追加し、通常ユーザーと管理者作成ユーザーを区別する。

```prisma
enum AccountType {
  SELF      // 通常ユーザー（OAuth登録）
  MANAGED   // 管理者が作成・管理
}

model User {
  // ===== 追加フィールド =====
  accountType AccountType @default(SELF)
  managedBy   String?     // 作成した管理者の userId
  claimedAt   DateTime?   // 将来の Claim 機能用

  // ===== 追加インデックス =====
  @@index([accountType])
}
```

### メールアドレス戦略

MANAGED ユーザーには合成メールアドレス `managed+{handle}@altee.internal` を設定する。

**この方式を選択した理由:**

| 選択肢 | 問題点 |
|--------|--------|
| email を nullable にする | NextAuth PrismaAdapter の `getUserByEmail` が null 前提で動作しないため、Adapter 全体への影響大 |
| ダミーメールを設定 | `@unique` 制約を考慮する必要あり |
| **合成ドメイン** (**採用**) | signIn コールバックでドメインブロック容易、Claim 時に実メールへ差し替え可能、`@unique` もハンドル名で一意性担保 |

### マイグレーション手順

```bash
# ローカル
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npx prisma migrate dev --name add-account-type

# 本番（docs/GUIDES の deployment 手順に従う）
DATABASE_URL="..." npx prisma migrate deploy
```

### 注意点

- 既存ユーザーは全て `accountType: SELF` がデフォルト値で適用される（データマイグレーション不要）
- `claimedAt` は将来の Claim 機能用で、MVP では使用しない
- `managedBy` は管理者の userId を格納し、誰が作成したかの監査証跡となる

---

## Step 2: 認証ガード

### 変更ファイル

- `auth.ts`

### 内容

signIn コールバックに MANAGED ユーザーの OAuth ログインブロックを追加する。

```typescript
// auth.ts - signIn コールバック内、ブラックリストチェックの後に追加
async signIn({ user, account, profile }) {
  // ブラックリストチェック（既存）
  if (user.email && await isEmailBlacklisted(user.email)) {
    return false
  }

  // ===== 追加: MANAGED ユーザーのログインブロック =====
  if (user.email?.endsWith('@altee.internal')) {
    return false
  }
  // =====

  // アクティブ状態チェック（既存）
  // ...
}
```

**ブロックの仕組み:**
- MANAGED ユーザーには `managed+{handle}@altee.internal` メールが設定されている
- OAuth プロバイダー（Google/Discord）からこのドメインのメールでログインが試みられることはないが、万が一に備えた防御的チェック
- 将来 Claim 機能で実メールに差し替えた後はこのチェックを通過する

### 変更不要なファイル

- `lib/handle-utils.ts` の `getUserByHandle` — `accountType` によるフィルタリングはしない（MANAGED ユーザーも公開ページで表示する）

---

## Step 3: Server Actions（作成・一覧・削除）

### 新規ファイル

- `app/actions/admin/managed-profile-actions.ts`

### 参考パターン

- `app/actions/admin/user-management.ts` — admin アクションの構造（`requireAdmin()` + try/catch）
- `lib/validations/user-setup.ts` — `handleSchema` のインポート元
- `lib/auth.ts` — `requireAdmin` のインポート元

### アクション定義

#### `createManagedProfile(data: { handle: string; characterName: string })`

```typescript
"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { handleSchema } from "@/lib/validations/user-setup"
import { z } from "zod"

const createManagedProfileSchema = z.object({
  handle: handleSchema,
  characterName: z.string().min(1).max(30),
})

export async function createManagedProfile(data: z.infer<typeof createManagedProfileSchema>) {
  const session = await requireAdmin()

  // 1. バリデーション
  const validated = createManagedProfileSchema.parse(data)

  // 2. ハンドル重複チェック
  const existing = await prisma.user.findUnique({
    where: { handle: validated.handle },
    select: { id: true },
  })
  if (existing) {
    throw new Error("このハンドルは既に使用されています")
  }

  // 3. トランザクションで User + UserProfile + CharacterInfo を一括作成
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: `managed+${validated.handle}@altee.internal`,
        handle: validated.handle,
        accountType: "MANAGED",
        managedBy: session.user.id,
        role: "USER",
        profile: {
          create: {}, // デフォルト設定で UserProfile 作成
        },
        characterInfo: {
          create: {
            characterName: validated.characterName,
          },
        },
      },
      select: { id: true, handle: true },
    })
    return newUser
  })

  return user
}
```

**ポイント:**
- `prisma.$transaction` で User / UserProfile / CharacterInfo を原子的に作成
- UserProfile がないと `/@handle` で notFound になるため、必ず同時作成
- email は `managed+{handle}@altee.internal` フォーマット（`@unique` 制約を満たす）

#### `getManagedProfiles(filters?, pagination?)`

```typescript
export interface ManagedProfileFilters {
  search?: string // characterName or handle で検索
}

export interface ManagedProfilePagination {
  page: number
  limit: number
}

export async function getManagedProfiles(
  filters: ManagedProfileFilters = {},
  pagination: ManagedProfilePagination = { page: 1, limit: 20 }
) {
  await requireAdmin()

  const where = {
    accountType: "MANAGED" as const,
    ...(filters.search && {
      OR: [
        { handle: { contains: filters.search, mode: "insensitive" as const } },
        { characterInfo: { characterName: { contains: filters.search, mode: "insensitive" as const } } },
      ],
    }),
  }

  const [profiles, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        handle: true,
        createdAt: true,
        managedBy: true,
        characterInfo: {
          select: { characterName: true, iconImageKey: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
    prisma.user.count({ where }),
  ])

  return {
    profiles,
    totalCount,
    totalPages: Math.ceil(totalCount / pagination.limit),
    currentPage: pagination.page,
  }
}
```

#### `getManagedProfileDetail(userId: string)`

```typescript
export async function getManagedProfileDetail(userId: string) {
  await requireAdmin()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      handle: true,
      accountType: true,
      managedBy: true,
      createdAt: true,
      characterInfo: true, // 全フィールド取得（編集フォーム用）
    },
  })

  if (!user || user.accountType !== "MANAGED") {
    throw new Error("管理対象ユーザーが見つかりません")
  }

  return user
}
```

#### `deleteManagedProfile(userId: string)`

```typescript
export async function deleteManagedProfile(userId: string) {
  await requireAdmin()

  // MANAGED ユーザーであることを確認してから削除
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountType: true, handle: true },
  })

  if (!user || user.accountType !== "MANAGED") {
    throw new Error("管理対象ユーザーが見つかりません")
  }

  // Cascade で関連データ（UserProfile, CharacterInfo 等）も自動削除
  await prisma.user.delete({ where: { id: userId } })

  return { success: true, deletedHandle: user.handle }
}
```

---

## Step 4: Server Actions（キャラクター情報編集）

### 変更ファイル

- `app/actions/admin/managed-profile-actions.ts`（Step 3 と同ファイルに追加）

### 参考ファイル

- `app/actions/user/character-actions.ts` — `updateBasicInfo` のロジック（L38-78）
- `lib/validations/character.ts` — `basicInfoSchema`、`toBasicInfoDefaults`

### 共通ヘルパー

```typescript
/**
 * MANAGED ユーザーであることを検証するヘルパー
 * Server Action 内で userId を受け取って使う
 */
async function requireManagedUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountType: true, handle: true },
  })
  if (!user || user.accountType !== "MANAGED") {
    throw new Error("管理対象ユーザーが見つかりません")
  }
  return user
}
```

### アクション定義

#### `adminUpdateCharacterInfo(userId: string, data: BasicInfoInput)`

```typescript
import { basicInfoSchema } from "@/lib/validations/character"

export async function adminUpdateCharacterInfo(
  userId: string,
  data: z.infer<typeof basicInfoSchema>
) {
  await requireAdmin()
  await requireManagedUser(userId)

  const validated = basicInfoSchema.parse(data)

  // character-actions.ts の updateBasicInfo と同じ Prisma ロジック
  const updateData = {
    iconImageKey: validated.iconImageKey ?? null,
    characterName: validated.characterName ?? null,
    nameReading: validated.nameReading ?? null,
    gender: validated.gender ?? null,
    birthdayMonth: validated.birthdayMonth ?? null,
    birthdayDay: validated.birthdayDay ?? null,
    species: validated.species ?? null,
    element: validated.element ?? null,
    debutDate: validated.debutDate ? new Date(validated.debutDate) : null,
    fanName: validated.fanName ?? null,
    fanMark: validated.fanMark ?? null,
    illustrator: validated.illustrator ?? null,
    modeler: validated.modeler ?? null,
    affiliationType: validated.affiliationType ?? null,
    affiliation: validated.affiliation ?? null,
  }

  await prisma.characterInfo.upsert({
    where: { userId },
    update: updateData,
    create: { userId, ...updateData },
  })

  revalidatePath(`/admin/managed-profiles/${userId}`)
  return { success: true }
}
```

**注意:** `updateBasicInfo`（`character-actions.ts`）は `requireAuth()` で自分のデータのみ編集可能。admin 版は `requireAdmin()` + `requireManagedUser()` で他人のデータを編集する。ロジックの重複を避けるため共通化はしない（認証チェックが異なるため）。

#### `adminGetCharacterInfo(userId: string)`

```typescript
export async function adminGetCharacterInfo(userId: string) {
  await requireAdmin()
  await requireManagedUser(userId)

  const characterInfo = await prisma.characterInfo.findUnique({
    where: { userId },
  })

  return { success: true, data: characterInfo }
}
```

---

## Step 5: 管理画面UI

### ファイル構成

```
app/admin/managed-profiles/
  page.tsx                           # 一覧ページ（Server Component）
  new/page.tsx                       # 新規作成ページ（Server Component）
  [id]/page.tsx                      # 編集ページ（Server Component）
  [id]/components/
    BasicInfoTab.tsx                 # キャラクター基本情報フォーム（Client Component）
  components/
    ManagedProfileList.tsx           # 一覧テーブル（Client Component）
    CreateManagedProfileForm.tsx     # 作成フォーム（Client Component）
```

### 5-1. admin ダッシュボードにリンク追加

**変更ファイル:** `app/admin/page.tsx`

既存のグリッドに「公式プロフィール管理」カードを追加:

```tsx
<Link href="/admin/managed-profiles" className="bg-card text-card-foreground p-6 rounded-lg border hover:bg-accent transition-colors">
  <h3 className="font-semibold mb-2">公式プロフィール管理</h3>
  <p className="text-sm text-muted-foreground">VTuber公式プロフィールの作成と管理</p>
</Link>
```

### 5-2. 一覧ページ (`/admin/managed-profiles`)

**参考:** `app/admin/users/page.tsx` のパターン（searchParams → Server Component → Client Component）

```tsx
// app/admin/managed-profiles/page.tsx
import { Suspense } from "react"
import type { Metadata } from "next"
import { ManagedProfileList } from "./components/ManagedProfileList"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export const metadata: Metadata = {
  title: '公式プロフィール管理',
  robots: { index: false, follow: false },
}

export default async function ManagedProfilesPage({ searchParams }) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const search = typeof params.search === "string" ? params.search : ""

  return (
    <div className="container mx-auto p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">公式プロフィール管理</h1>
        <Button asChild>
          <Link href="/admin/managed-profiles/new">
            <Plus className="w-4 h-4 mr-2" />
            新規作成
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>公式プロフィール一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">読み込み中...</div>}>
            <ManagedProfileList currentPage={currentPage} search={search} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
```

**ManagedProfileList コンポーネント:**
- テーブル表示: アイコン画像、キャラクター名、ハンドル（`@handle`）、作成日
- 各行のアクション: 編集ボタン（`/admin/managed-profiles/[id]`）、公開ページリンク（`/@handle`）
- 検索フィルタ（キャラクター名/ハンドル）
- ページネーション
- `getManagedProfiles` Server Action を使用

### 5-3. 新規作成ページ (`/admin/managed-profiles/new`)

```tsx
// app/admin/managed-profiles/new/page.tsx
import type { Metadata } from "next"
import { CreateManagedProfileForm } from "../components/CreateManagedProfileForm"

export const metadata: Metadata = {
  title: '公式プロフィール作成',
  robots: { index: false, follow: false },
}

export default function NewManagedProfilePage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">公式プロフィール作成</h1>
      <CreateManagedProfileForm />
    </div>
  )
}
```

**CreateManagedProfileForm コンポーネント:**
- フォームフィールド:
  - ハンドル名（必須、リアルタイム重複チェック、`handleSchema` 使用）
  - キャラクター名（必須、30文字以内）
- react-hook-form + zodResolver
- 作成成功後 → `router.push(`/admin/managed-profiles/${userId}`)` でリダイレクト
- `createManagedProfile` Server Action を使用

### 5-4. 編集ページ (`/admin/managed-profiles/[id]`)

**参考:** `app/dashboard/character/components/BasicInfoForm.tsx` のフォーム構成

```tsx
// app/admin/managed-profiles/[id]/page.tsx
import type { Metadata } from "next"
import { getManagedProfileDetail, adminGetCharacterInfo } from "@/app/actions/admin/managed-profile-actions"
import { BasicInfoTab } from "./components/BasicInfoTab"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: '公式プロフィール編集',
  robots: { index: false, follow: false },
}

export default async function ManagedProfileEditPage({ params }) {
  const { id } = await params

  const [profile, characterInfoResult] = await Promise.all([
    getManagedProfileDetail(id).catch(() => null),
    adminGetCharacterInfo(id).catch(() => ({ data: null })),
  ])

  if (!profile) notFound()

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {characterInfoResult.data?.characterName || profile.handle} の編集
        </h1>
        <Button variant="outline" asChild>
          <Link href={`/@${profile.handle}`} target="_blank">
            <ExternalLink className="w-4 h-4 mr-2" />
            公開ページ
          </Link>
        </Button>
      </div>

      {/* MVP: 基本情報タブのみ */}
      <BasicInfoTab userId={id} initialData={characterInfoResult.data} />
    </div>
  )
}
```

**BasicInfoTab コンポーネント:**
- `BasicInfoForm.tsx`（ダッシュボード版）と同じフォーム構成
- 主な違い:
  - `updateBasicInfo` → `adminUpdateCharacterInfo(userId, data)` を呼ぶ
  - session 依存なし（userId を props で受け取る）
  - revalidatePath は admin ページ側
- フォームフィールド（`basicInfoSchema` 準拠）:
  - iconImageKey（ImageUploader + PRESET_ICON）
  - characterName, nameReading
  - gender（Select: male/female/unknown/other）
  - birthdayMonth, birthdayDay
  - species, element
  - debutDate（date input）
  - fanName, fanMark
  - illustrator, modeler
  - affiliationType（individual/agency）, affiliation

---

## Step 6: 公式バッジ表示

### 変更ファイル

1. **`lib/handle-utils.ts`** — `getUserByHandle` の select に `accountType` を追加
2. **`app/[handle]/layout.tsx`** — `accountType` を ProfileHeader に伝達
3. **`components/user-profile/ProfileHeader.tsx`** — バッジ表示

### 6-1. getUserByHandle の変更

```typescript
// lib/handle-utils.ts - getUserByHandle 内
const user = await prisma.user.findUnique({
  where: { handle: normalizedHandle },
  // 既存の include に加えて、トップレベルの select は不要
  // include の結果に accountType は含まれる（findUnique のデフォルト動作）
})
```

`prisma.user.findUnique` は `include` を使っているため、User モデルのスカラーフィールドは全て返される。`accountType` は自動的に含まれるので **コード変更は不要**。ただし TypeScript の型が狭められている場合は select の調整が必要。

### 6-2. layout.tsx の変更

```tsx
// app/[handle]/layout.tsx
// ProfileHeader に accountType を渡す
<ProfileHeader
  handle={handle}
  avatarImageUrl={avatarImageUrl}
  characterName={targetUser.characterInfo?.characterName ?? targetUser.name}
  visibility={themeSettings.visibility}
  namecard={themeSettings.namecard}
  isEditable={false}
  inDashboard={false}
  isManaged={targetUser.accountType === "MANAGED"}  // 追加
/>
```

### 6-3. ProfileHeader の変更

```tsx
// components/user-profile/ProfileHeader.tsx

import { Badge } from "@/components/ui/badge"
import { ShieldCheck } from "lucide-react"

interface ProfileHeaderProps {
  // ...既存 props
  isManaged?: boolean  // 追加
}

// ネームカード内のキャラクター名の横にバッジを表示
<span className="font-bold text-[var(--theme-text-primary)] text-sm tracking-wide truncate">
  {characterName || 'User'}
</span>
{isManaged && (
  <Badge variant="secondary" className="ml-2 text-xs gap-1 shrink-0">
    <ShieldCheck className="w-3 h-3" />
    公式
  </Badge>
)}
```

**バッジの仕様:**
- shadcn/ui の `Badge` コンポーネント（`variant="secondary"`）
- lucide-react の `ShieldCheck` アイコン + 「公式」テキスト
- ネームカード内のキャラクター名の右側に表示
- モバイル版（MobileBottomNav）にもバッジを表示する場合は同様の変更を追加

---

## Step 7: 既存ユーザー管理の拡張

### 変更ファイル

- `app/actions/admin/user-management.ts`
- `app/admin/users/` 関連コンポーネント

### 内容

#### 7-1. ユーザー一覧に accountType 表示

`getUserList` の select に `accountType` を追加:

```typescript
// app/actions/admin/user-management.ts - getUserList 内
select: {
  // ...既存フィールド
  accountType: true,  // 追加
}
```

`buildUserWhereClause` に accountType フィルター追加:

```typescript
function buildUserWhereClause(filters: UserListFilters) {
  return {
    // ...既存
    ...(filters.accountType && { accountType: filters.accountType }),
  }
}
```

#### 7-2. UserList コンポーネントの変更

- MANAGED ユーザーの行に `Badge`（「管理対象」）を表示
- MANAGED ユーザーの行から `/admin/managed-profiles/[id]` へのリンクボタン追加
- accountType フィルタードロップダウン追加（SELF / MANAGED / ALL）

#### 7-3. UserFilters の変更

- accountType 選択肢を追加

---

## 検証方法

### ビルド・型チェック

```bash
npm run build
npx tsc --noEmit
npm run lint
```

### 機能テスト（手順）

1. **マイグレーション**: `npx prisma migrate dev` が成功すること
2. **プロフィール作成**: `/admin/managed-profiles/new` からハンドル + キャラクター名を入力して作成
3. **一覧表示**: `/admin/managed-profiles` に作成したプロフィールが表示される
4. **公開ページ**: `/@{handle}` でプロフィールページが表示される
5. **公式バッジ**: MANAGED ユーザーのプロフィールページに「公式」バッジが表示される
6. **基本情報編集**: `/admin/managed-profiles/[id]` からキャラクター情報を編集 → 公開ページに反映
7. **OAuth ブロック**: MANAGED ユーザーの合成メールで OAuth ログインがブロックされる（signIn コールバック）
8. **通常ユーザー影響なし**: 既存ユーザーのプロフィール表示・編集が正常に動作する
9. **削除**: MANAGED プロフィールを削除 → 関連データが Cascade 削除される
10. **ユーザー管理**: `/admin/users` で accountType フィルターが動作する

---

## 将来の拡張（今回スコープ外）

### Phase 2: コンテンツ管理

- **セクション管理タブ**: `/admin/managed-profiles/[id]/sections`
  - `EditableProfileClient` を admin 用に再利用
  - UserSection の CRUD を admin アクション経由で実行
- **FAQ 管理タブ**: `/admin/managed-profiles/[id]/faqs`
  - FaqCategory / FaqQuestion の admin 用 CRUD
- **ニュース管理タブ**: `/admin/managed-profiles/[id]/news`
  - UserNews の admin 用 CRUD

### Phase 3: 見た目カスタマイズ

- **テーマ・背景編集タブ**: `/admin/managed-profiles/[id]/theme`
  - themePreset, themeSettings, backgroundImageKey の編集
  - 既存のテーマ設定 UI を admin 用に再利用
- **バナー画像タブ**: バナー / キャラクター画像のアップロード

### Phase 4: 活動情報・プラットフォーム

- **活動情報タブ**: streaming styles, timezones, frequency, languages
- **プラットフォーム連携**: YouTube Channel ID, Twitch username の設定（admin 直接入力）
- **おすすめ動画管理**: YouTubeRecommendedVideo の admin 用 CRUD

### Phase 5: Claim 機能（本人引き取り）

VTuber 本人が自身のアカウントを引き取る機能:

1. **Claim リクエスト**: VTuber が OAuth ログイン後、`/@handle` の「このアカウントを引き取る」ボタンからリクエスト
2. **Admin 承認**: `/admin/managed-profiles/[id]` の Claim リクエスト管理画面で承認/拒否
3. **アカウント移行**:
   - `accountType`: `MANAGED` → `SELF` に変更
   - `email`: 合成メール → OAuth の実メールに差し替え
   - `claimedAt`: 現在時刻を設定
   - OAuth Account レコードをリンク
4. **承認後**: 通常ユーザーとして自分でプロフィールを編集可能になる

**Claim 時の考慮事項:**
- Claim 前にデータの引き継ぎ確認画面を表示
- Admin が事前に入力した情報を本人が確認・修正できるステップ
- Claim 後の admin 編集権限の扱い（完全に移譲 or 共同編集）

### Phase 6: 一括操作

- **CSV インポート**: 複数 MANAGED プロフィールの一括作成
- **一括編集**: 所属事務所の一括変更など
- **データエクスポート**: MANAGED プロフィール一覧の CSV/JSON エクスポート
