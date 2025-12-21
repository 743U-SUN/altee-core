"use client"

import { Button } from "@/components/ui/button"
import { Image, Upload } from "lucide-react"

interface IconModeToggleProps {
  mode: "upload" | "preset"
  onModeChange: (mode: "upload" | "preset") => void
  uploadLabel?: string
  presetLabel?: string
}

/**
 * アイコンモード切り替えボタンコンポーネント
 * プリセットアイコンとカスタムアイコンアップロードを切り替える
 */
export function IconModeToggle({
  mode,
  onModeChange,
  uploadLabel = "アップロード",
  presetLabel = "プリセットから選択"
}: IconModeToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant={mode === "preset" ? "default" : "outline"}
        size="sm"
        onClick={() => onModeChange("preset")}
      >
        <Image className="h-4 w-4 mr-2" />
        {presetLabel}
      </Button>
      <Button
        type="button"
        variant={mode === "upload" ? "default" : "outline"}
        size="sm"
        onClick={() => onModeChange("upload")}
      >
        <Upload className="h-4 w-4 mr-2" />
        {uploadLabel}
      </Button>
    </div>
  )
}
