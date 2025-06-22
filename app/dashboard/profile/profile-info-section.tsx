"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { InlineEdit } from "@/components/ui/inline-edit"
import { updateUserProfile, getUserProfile } from "@/app/actions/profile-actions"
import { toast } from "sonner"

interface ProfileInfoSectionProps {
  initialDisplayName: string
  initialBio: string
}

export function ProfileInfoSection({ 
  initialDisplayName, 
  initialBio
}: ProfileInfoSectionProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [bio, setBio] = useState(initialBio)

  const getCurrentProfileImageId = async () => {
    const result = await getUserProfile()
    return result.success ? result.data?.profileImageId || undefined : undefined
  }

  const handleDisplayNameSave = async (newDisplayName: string) => {
    try {
      const currentProfileImageId = await getCurrentProfileImageId()
      
      const result = await updateUserProfile({
        displayName: newDisplayName,
        bio,
        profileImageId: currentProfileImageId,
      })

      if (result.success) {
        setDisplayName(newDisplayName)
        toast.success("表示名を更新しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("表示名保存エラー:", error)
      toast.error("表示名の保存に失敗しました")
      throw error
    }
  }

  const handleBioSave = async (newBio: string) => {
    try {
      const currentProfileImageId = await getCurrentProfileImageId()
      
      const result = await updateUserProfile({
        displayName,
        bio: newBio,
        profileImageId: currentProfileImageId,
      })

      if (result.success) {
        setBio(newBio)
        toast.success("自己紹介を更新しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("自己紹介保存エラー:", error)
      toast.error("自己紹介の保存に失敗しました")
      throw error
    }
  }

  return (
    <>
      <InlineEdit
        value={displayName}
        onSave={handleDisplayNameSave}
        placeholder="表示名を入力してください"
        maxLength={50}
      />
      <div className="space-y-2">
        <Label>自己紹介</Label>
        <InlineEdit
          value={bio}
          onSave={handleBioSave}
          placeholder="自己紹介を入力してください"
          multiline={true}
          maxLength={500}
          rows={4}
        />
      </div>
    </>
  )
}