"use client"

import { ContentModal } from "./ContentModal"
import type { UserContact } from "@/types/contacts"

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  contact: UserContact
}

export function ContactModal({ isOpen, onClose, contact }: ContactModalProps) {
  return (
    <ContentModal
      isOpen={isOpen}
      onClose={onClose}
      dialogTitle="連絡方法"
      imageStorageKey={contact.image?.storageKey}
      title={contact.title}
      content={contact.content}
      linkUrl={contact.linkUrl}
      buttonText={contact.buttonText}
      imageAlt="連絡方法画像"
    />
  )
}
