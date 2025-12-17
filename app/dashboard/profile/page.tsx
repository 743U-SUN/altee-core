import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getUserProfile } from "@/app/actions/profile-actions"
import { ProfileImageSection } from "./profile-image-section"
import { ProfileInfoSection } from "./profile-info-section"
import { BackgroundImageSection } from "./background-image-section"

export default async function ProfilePage() {
  // Server Componentでデータフェッチ
  const profileResult = await getUserProfile()
  
  if (!profileResult.success) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="w-full max-w-5xl mx-auto">
          <p className="text-destructive">プロフィール情報の読み込みに失敗しました</p>
        </div>
      </div>
    )
  }

  const profile = profileResult.data

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">プロフィール設定</h1>
        <p className="text-muted-foreground">公開プロフィールの情報を編集します</p>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <div className="grid gap-6">
          {/* プロフィール画像 */}
          <Card>
            <CardHeader>
              <CardTitle>プロフィール画像</CardTitle>
              <CardDescription>他のユーザーに表示される画像です</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileImageSection
                initialImage={profile?.profileImage ? {
                  id: profile.profileImage.id,
                  name: profile.profileImage.fileName,
                  originalName: profile.profileImage.originalName,
                  url: `/api/files/${profile.profileImage.storageKey}`,
                  key: profile.profileImage.storageKey,
                  size: profile.profileImage.fileSize,
                  type: profile.profileImage.mimeType,
                  uploadedAt: profile.profileImage.createdAt.toString(),
                } : null}
                currentDisplayName={profile?.user?.characterName || ""}
                currentBio={profile?.bio || ""}
              />
            </CardContent>
          </Card>

          {/* 背景画像 */}
          <BackgroundImageSection currentBackgroundKey={profile?.backgroundImageKey} />

          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>プロフィールの基本的な情報を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>キャラクター名</Label>
                <ProfileInfoSection 
                  initialCharacterName={profile?.user?.characterName || ""}
                  initialBio={profile?.bio || ""}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}