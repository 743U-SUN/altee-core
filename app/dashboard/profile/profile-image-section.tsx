"use client"

import { useState, useCallback } from "react"
import { ImageUploader } from "@/components/image-uploader/image-uploader"
import { updateUserProfile } from "@/app/actions/profile-actions"
import { toast } from "sonner"
import type { UploadedFile } from "@/types/image-upload"

interface ProfileImageSectionProps {
  initialImage: UploadedFile | null
  currentDisplayName: string
  currentBio: string
}

export function ProfileImageSection({ 
  initialImage, 
  currentDisplayName, 
  currentBio 
}: ProfileImageSectionProps) {
  const [profileImage, setProfileImage] = useState<UploadedFile[]>(
    initialImage ? [initialImage] : []
  )

  const handleImageUpload = useCallback(async (files: UploadedFile[]) => {
    setProfileImage(files)
    
    // 新しい画像がアップロードされた場合、プロフィールを更新
    if (files.length > 0) {
      try {
        const result = await updateUserProfile({
          characterName: currentDisplayName,
          bio: currentBio,
          profileImageId: files[0].id,
        })

        if (result.success) {
          toast.success("プロフィール画像を更新しました")
        } else {
          toast.error(result.error || "プロフィール画像の更新に失敗しました")
        }
      } catch (error) {
        console.error("プロフィール画像更新エラー:", error)
        toast.error("プロフィール画像の更新に失敗しました")
      }
    }
  }, [currentDisplayName, currentBio])

  return (
    <ImageUploader
      mode="immediate"
      previewSize="small"
      maxFiles={1}
      rounded={true}
      value={profileImage}
      onUpload={handleImageUpload}
      folder="user-icons"
    />
  )
}