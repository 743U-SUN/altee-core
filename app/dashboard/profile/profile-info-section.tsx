"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { InlineEdit } from "@/components/ui/inline-edit"
import { updateUserProfile, getUserProfile } from "@/app/actions/profile-actions"
import { toast } from "sonner"

interface ProfileInfoSectionProps {
  initialCharacterName: string
  initialBio: string
}

export function ProfileInfoSection({ 
  initialCharacterName, 
  initialBio
}: ProfileInfoSectionProps) {
  const [characterName, setCharacterName] = useState(initialCharacterName)
  const [bio, setBio] = useState(initialBio)

  const getCurrentProfileImageId = async () => {
    const result = await getUserProfile()
    return result.success ? result.data?.profileImageId || undefined : undefined
  }

  const handleCharacterNameSave = async (newCharacterName: string) => {
    try {
      const currentProfileImageId = await getCurrentProfileImageId()
      
      const result = await updateUserProfile({
        characterName: newCharacterName,
        bio,
        profileImageId: currentProfileImageId,
      })

      if (result.success) {
        setCharacterName(newCharacterName)
        toast.success("キャラクター名を更新しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("キャラクター名保存エラー:", error)
      toast.error("キャラクター名の保存に失敗しました")
      throw error
    }
  }

  const handleBioSave = async (newBio: string) => {
    try {
      const currentProfileImageId = await getCurrentProfileImageId()
      
      const result = await updateUserProfile({
        characterName,
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
        value={characterName}
        onSave={handleCharacterNameSave}
        placeholder="キャラクター名を入力してください"
        maxLength={30}
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