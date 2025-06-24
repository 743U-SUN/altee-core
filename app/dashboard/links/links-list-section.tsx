"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import type { UserLink, LinkType } from "@/types/link-type"

// モーダルコンポーネントの遅延読み込み
const AddLinkModal = dynamic(() => import("./add-link-modal").then(mod => ({ default: mod.AddLinkModal })), {
  loading: () => <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />,
  ssr: false
})

// DnD機能の遅延読み込み（大幅なbundle size削減）
const DragDropLinkList = dynamic(() => import("./components/DragDropLinkList").then(mod => ({ default: mod.DragDropLinkList })), {
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

interface LinksListSectionProps {
  initialUserLinks: UserLink[]
  initialLinkTypes: LinkType[]
}

export function LinksListSection({ initialUserLinks, initialLinkTypes }: LinksListSectionProps) {
  // データ管理（シンプル化）
  const [userLinks, setUserLinks] = useState(initialUserLinks)
  const [linkTypes] = useState(initialLinkTypes)

  const mutateUserLinks = (newLinks: UserLink[]) => {
    setUserLinks(newLinks)
  }

  const handleLinksChange = (newLinks: UserLink[]) => {
    mutateUserLinks(newLinks)
  }

  const handleLinkAdded = (newLink: UserLink) => {
    const updatedLinks = [...userLinks, newLink].sort((a, b) => a.sortOrder - b.sortOrder)
    mutateUserLinks(updatedLinks)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">SNS・リンク設定</h2>
          <p className="text-sm text-muted-foreground">
            SNSアカウントやWebサイトのリンクを設定できます（最大20個）
          </p>
        </div>
        <AddLinkModal
          linkTypes={linkTypes}
          onLinkAdded={handleLinkAdded}
        />
      </div>

      {userLinks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>まだリンクが設定されていません</p>
          <p className="text-sm">「リンクを追加」から設定を始めましょう</p>
        </div>
      ) : (
        <DragDropLinkList
          userLinks={userLinks}
          linkTypes={linkTypes}
          onLinksChange={handleLinksChange}
          onEditLink={() => {}}
        />
      )}


    </div>
  )
}