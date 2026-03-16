-- データマイグレーション: ユーザー名・アイコンを CharacterInfo に統一
-- 実行前に必ずバックアップを取得すること
-- 実行タイミング: Step 1-6 のコード変更デプロイ後、Step 8（フィールド削除）の前

-- 1. CharacterInfo が存在しないユーザーに新規作成（User.characterName からコピー）
INSERT INTO character_info (id, user_id, character_name, created_at, updated_at)
SELECT gen_random_uuid(), u.id, u."characterName", NOW(), NOW()
FROM users u
LEFT JOIN character_info ci ON ci.user_id = u.id
WHERE ci.id IS NULL AND u."characterName" IS NOT NULL;

-- 2. 既存 CharacterInfo の characterName が NULL のものを User.characterName からコピー
UPDATE character_info ci
SET character_name = u."characterName"
FROM users u
WHERE ci.user_id = u.id
  AND ci.character_name IS NULL
  AND u."characterName" IS NOT NULL;

-- 3. UserProfile.avatarImageId の MediaFile.storageKey → CharacterInfo.iconImageKey にコピー
UPDATE character_info ci
SET icon_image_key = mf.storage_key
FROM user_profiles up
JOIN media_files mf ON mf.id = up.avatar_image_id
WHERE ci.user_id = up.user_id
  AND ci.icon_image_key IS NULL
  AND up.avatar_image_id IS NOT NULL;

-- 確認クエリ（実行後に検証用）
-- SELECT count(*) as total_users FROM users;
-- SELECT count(*) as users_with_ci FROM character_info;
-- SELECT count(*) as ci_with_name FROM character_info WHERE character_name IS NOT NULL;
-- SELECT count(*) as ci_with_icon FROM character_info WHERE icon_image_key IS NOT NULL;
