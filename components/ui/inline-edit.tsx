"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface InlineEditProps {
  value: string
  onSave: (value: string) => Promise<void>
  placeholder?: string
  multiline?: boolean
  className?: string
  displayClassName?: string
  editClassName?: string
  maxLength?: number
  rows?: number
}

export function InlineEdit({
  value,
  onSave,
  placeholder = "クリックして編集",
  multiline = false,
  className,
  displayClassName,
  editClassName,
  maxLength,
  rows = 4,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // valueが変更されたら編集値も更新
  useEffect(() => {
    setEditValue(value)
  }, [value])

  // 編集モードに入ったときにフォーカス
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = useCallback(async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue.trim())
      setIsEditing(false)
    } catch (error) {
      console.error("保存エラー:", error)
      // エラー時は編集値を元に戻す
      setEditValue(value)
    } finally {
      setIsSaving(false)
    }
  }, [editValue, value, onSave])

  const handleCancel = useCallback(() => {
    setEditValue(value)
    setIsEditing(false)
  }, [value])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (multiline) {
      // 自己紹介（textarea）の場合
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault()
        handleSave()
      } else if (e.key === "Escape") {
        e.preventDefault()
        handleCancel()
      }
    } else {
      // 表示名（input）の場合
      if (e.key === "Enter") {
        e.preventDefault()
        handleSave()
      } else if (e.key === "Escape") {
        e.preventDefault()
        handleCancel()
      }
    }
  }, [multiline, handleSave, handleCancel])

  const handleBlur = useCallback(() => {
    // 保存中でなければフォーカスアウト時に保存
    if (!isSaving) {
      handleSave()
    }
  }, [handleSave, isSaving])

  const displayValue = value || placeholder
  const isEmpty = !value

  if (isEditing) {
    const commonProps = {
      value: editValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        setEditValue(e.target.value),
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
      maxLength,
      disabled: isSaving,
      className: cn(
        "border-primary ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        editClassName
      ),
    }

    return (
      <div className={cn("relative", className)}>
        {multiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            {...commonProps}
            rows={rows}
            placeholder={placeholder}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            {...commonProps}
            placeholder={placeholder}
          />
        )}
        {isSaving && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {multiline && (
          <p className="text-xs text-muted-foreground mt-1">
            Ctrl+Enterで保存、Escでキャンセル
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer rounded-md px-3 py-2 transition-all duration-200",
        "border border-border",
        "hover:bg-accent hover:border-accent-foreground hover:shadow-sm",
        isEmpty && "text-muted-foreground",
        displayClassName,
        className
      )}
    >
      {multiline ? (
        <div className="whitespace-pre-wrap">{displayValue}</div>
      ) : (
        <span>{displayValue}</span>
      )}
    </div>
  )
}