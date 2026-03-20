"use client"

import { updateUserNotification, deleteUserNotification } from "@/app/actions/user/notification-actions"
import { NotificationFormBase } from "./notification-form-base"
import type { UserNotification } from "@/types/notifications"

interface NotificationSettingsProps {
  initialData: UserNotification | null
  showLink?: boolean
  showButton?: boolean
  compact?: boolean
}

export function NotificationSettings({
  initialData,
  showLink = true,
  showButton = true,
  compact = false,
}: NotificationSettingsProps) {
  return (
    <NotificationFormBase
      initialData={initialData}
      enabledLabel="お知らせを表示する"
      enabledDescription="プロフィールページにお知らせアイコンを表示します"
      titlePlaceholder="お知らせのタイトルを入力"
      contentPlaceholder="お知らせの内容を入力"
      linkUrlPlaceholder="https://example.com"
      buttonTextPlaceholder="詳細を見る"
      enabledToastMessage={["お知らせを表示に設定しました", "お知らせを非表示に設定しました"]}
      deleteConfirmMessage="お知らせ設定を削除しますか？この操作は取り消せません。"
      deleteSuccessMessage="お知らせ設定を削除しました"
      imageFolder="user-notifications"
      showLink={showLink}
      showButton={showButton}
      showImage={true}
      compact={compact}
      onUpdate={updateUserNotification}
      onDelete={deleteUserNotification}
    />
  )
}
