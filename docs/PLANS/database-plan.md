# altee-core データベース設計案

**作成日**: 2026-01-02  
**ステータス**: 参考資料（実装時に詳細を詰める）

---

> [!NOTE]
> このドキュメントは **参考資料** です。実際のスキーマ設計は、各機能のモックアップを作成し、必要なデータを洗い出してから確定します。

---

## 📋 新規モデル一覧

| モデル | 用途 | 優先度 |
|-------|------|-------|
| Group | グループ | 高 |
| GroupMember | グループメンバー | 高 |
| UserPost | ユーザーお知らせ | 高 |
| GroupPost | グループお知らせ | 高 |
| PcBuild | PCビルダー構成 | 中 |
| FavoriteItem | お気に入りアイテム | 中 |
| LibLink | リンク集 | 低 |
| LibFont | フォント | 低 |
| LibAudition | オーディション | 低 |
| LoginHistory | ログイン履歴（IP記録） | 中 |

---

## 💡 実装メモ

### ビジター → ユーザー登録時のお気に入りマージ

ビジターがLocalStorageに保存したお気に入りを、ユーザー登録/ログイン時にDBに移行する：

```typescript
// ログイン後に呼び出し
async function mergeFavorites(userId: string) {
  const localFavorites = localStorage.getItem('favorites');
  if (localFavorites) {
    const items = JSON.parse(localFavorites);
    await Promise.all(items.map(itemId => 
      prisma.favoriteItem.upsert({
        where: { userId_itemId: { userId, itemId } },
        create: { userId, itemId },
        update: {},
      })
    ));
    localStorage.removeItem('favorites'); // マージ後は削除
  }
}
```

---

## 🗄️ スキーマ案

### グループ関連

```prisma
// グループ
model Group {
  id          String        @id @default(cuid())
  handle      String        @unique
  name        String
  description String?
  imageUrl    String?
  ownerId     String
  owner       User          @relation("GroupOwner", fields: [ownerId], references: [id])
  members     GroupMember[]
  posts       GroupPost[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  @@index([ownerId])
  @@index([handle])
  @@map("groups")
}

// グループメンバー
model GroupMember {
  id        String   @id @default(cuid())
  groupId   String
  userId    String
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  joinedAt  DateTime @default(now())

  @@unique([groupId, userId])
  @@index([groupId])
  @@index([userId])
  @@map("group_members")
}
```

### お知らせ関連

```prisma
// ユーザーお知らせ（最大3件制限はアプリケーション側で実装）
model UserPost {
  id        String   @id @default(cuid())
  userId    String
  title     String
  content   String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([published])
  @@index([createdAt])
  @@map("user_posts")
}

// グループお知らせ
model GroupPost {
  id        String   @id @default(cuid())
  groupId   String
  title     String
  content   String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  @@index([groupId])
  @@index([published])
  @@index([createdAt])
  @@map("group_posts")
}
```

### PCビルダー

```prisma
// PCビルダー構成（一時保存、2-3ヶ月で期限切れ）
model PcBuild {
  id          String   @id @default(cuid())
  shareId     String   @unique  // 共有URL用ID（nanoid等で生成）
  name        String?
  components  Json     // PC構成データ
  createdAt   DateTime @default(now())
  expiresAt   DateTime // 有効期限
  
  @@index([shareId])
  @@index([expiresAt])
  @@map("pc_builds")
}
```

### お気に入り

```prisma
// お気に入りアイテム（ログインユーザー用）
model FavoriteItem {
  id        String   @id @default(cuid())
  userId    String
  itemId    String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  item      Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@unique([userId, itemId])
  @@index([userId])
  @@map("favorite_items")
}
```

### ライブラリ（リソース集）

```prisma
// リンク集
model LibLink {
  id          String   @id @default(cuid())
  title       String
  url         String
  description String?
  category    String?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([category])
  @@index([sortOrder])
  @@map("lib_links")
}

// フォント
model LibFont {
  id          String   @id @default(cuid())
  name        String
  url         String
  description String?
  license     String?  // ライセンス情報
  category    String?  // ゴシック、明朝、手書きなど
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([category])
  @@index([sortOrder])
  @@map("lib_fonts")
}

// オーディション
model LibAudition {
  id          String    @id @default(cuid())
  title       String
  company     String?   // 企業/事務所名
  url         String
  description String?
  deadline    DateTime? // 締切日
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([isActive])
  @@index([deadline])
  @@index([sortOrder])
  @@map("lib_auditions")
}
```

### セキュリティ・監査

```prisma
// ログイン履歴（IP記録用）
model LoginHistory {
  id        String   @id @default(cuid())
  userId    String
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([createdAt])
  @@map("login_history")
}
```

---

## 📝 Userモデルへの追加

既存の `User` モデルに以下のリレーションを追加：

```prisma
model User {
  // 既存フィールド...
  
  // 追加リレーション
  ownedGroups    Group[]       @relation("GroupOwner")
  groupMembers   GroupMember[]
  userPosts      UserPost[]
  favoriteItems  FavoriteItem[]
  loginHistory   LoginHistory[]
}
```

---

## 🔍 検討事項

### 1. Post の統一モデル化
現在 `UserPost` と `GroupPost` を別モデルにしているが、統一する選択肢もある：

```prisma
model Post {
  id        String   @id
  authorType PostAuthorType // USER, GROUP, ADMIN
  userId    String?
  groupId   String?
  // ...
}

enum PostAuthorType {
  USER
  GROUP
}
```

**現在の方針**: 別モデルで進める（シンプルさ優先）

### 2. ビジターのお気に入り
LocalStorageで保存するため、DBモデルは不要。

---

## 📚 参考

- [route-plan.md](./route-plan.md) - ルート設計
