"use client"

import { updateUserContact, deleteUserContact } from "@/app/actions/user/contact-actions"
import { NotificationFormBase } from "./notification-form-base"
import type { UserContact } from "@/types/contacts"

interface ContactSettingsProps {
  initialData: UserContact | null
  showLink?: boolean
  showButton?: boolean
  showImage?: boolean
  compact?: boolean
}

export function ContactSettings({
  initialData,
  showLink = true,
  showButton = true,
  showImage = true,
  compact = false,
}: ContactSettingsProps) {
  return (
    <NotificationFormBase
      initialData={initialData}
      enabledLabel="連絡方法を表示する"
      enabledDescription="プロフィールページに連絡方法アイコンを表示します"
      titlePlaceholder="連絡方法のタイトルを入力"
      contentPlaceholder="連絡方法の説明を入力"
      linkUrlPlaceholder="https://example.com/contact"
      buttonTextPlaceholder="お問い合わせ"
      enabledToastMessage={["連絡方法を表示に設定しました", "連絡方法を非表示に設定しました"]}
      deleteConfirmMessage="連絡方法設定を削除しますか？この操作は取り消せません。"
      deleteSuccessMessage="連絡方法設定を削除しました"
      imageFolder="user-contacts"
      showLink={showLink}
      showButton={showButton}
      showImage={showImage}
      compact={compact}
      onUpdate={updateUserContact}
      onDelete={deleteUserContact}
    />
  )
}
