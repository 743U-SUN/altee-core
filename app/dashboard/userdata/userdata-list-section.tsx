"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import type { UserData } from "@/types/userdata"

// モーダルコンポーネントの遅延読み込み
const AddUserDataModal = dynamic(() => import("./add-userdata-modal").then(mod => ({ default: mod.AddUserDataModal })), {
  loading: () => <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />,
  ssr: false
})

// DnD機能の遅延読み込み（大幅なbundle size削減）
const DragDropUserDataList = dynamic(() => import("./components/DragDropUserDataList").then(mod => ({ default: mod.DragDropUserDataList })), {
  loading: () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-muted animate-pulse rounded" />
            <div className="w-6 h-6 bg-muted animate-pulse rounded" />
            <div className="flex-1 space-y-1">
              <div className="w-20 h-4 bg-muted animate-pulse rounded" />
              <div className="w-32 h-3 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex gap-1">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="w-8 h-8 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
  ssr: false
})

interface UserDataListSectionProps {
  initialUserData: UserData[]
}

export function UserDataListSection({ initialUserData }: UserDataListSectionProps) {
  // データ管理（シンプル化）
  const [userData, setUserData] = useState(initialUserData)

  const mutateUserData = (newData: UserData[]) => {
    setUserData(newData)
  }

  const handleDataChange = (newData: UserData[]) => {
    mutateUserData(newData)
  }

  const handleDataAdded = (newData: UserData) => {
    const updatedData = [...userData, newData].sort((a, b) => a.sortOrder - b.sortOrder)
    mutateUserData(updatedData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">データ設定</h2>
          <p className="text-sm text-muted-foreground">
            身長、体重、趣味など、あなたの情報を自由に設定できます（最大30個）
          </p>
        </div>
        <AddUserDataModal
          onDataAdded={handleDataAdded}
        />
      </div>

      {userData.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>まだデータが設定されていません</p>
          <p className="text-sm">「データを追加」から設定を始めましょう</p>
        </div>
      ) : (
        <DragDropUserDataList
          userData={userData}
          onDataChange={handleDataChange}
          onEditData={() => {}}
        />
      )}
    </div>
  )
}