"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { ContactModal } from "./ContactModal"
import type { UserContact } from "@/types/contacts"

interface ContactIconProps {
  contact: UserContact
}

export function ContactIcon({ contact }: ContactIconProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 連絡方法が無効化されているか、すべての項目が空の場合は表示しない
  const hasContent = contact.title || contact.content || contact.linkUrl || contact.imageId
  if (!contact.isEnabled || !hasContent) {
    return null
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-md hover:bg-accent"
        onClick={() => setIsModalOpen(true)}
        title="連絡方法"
      >
        <Mail className="h-4 w-4" />
      </Button>

      <ContactModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contact={contact}
      />
    </>
  )
}