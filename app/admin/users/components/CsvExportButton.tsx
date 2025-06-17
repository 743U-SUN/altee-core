"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { getUsersForCsvExport } from "@/app/actions/user-management"
import { UserRole } from "@prisma/client"
import { toast } from "sonner"

interface CsvExportButtonProps {
  search?: string
  role?: UserRole
  isActive?: boolean
  createdFrom?: Date
  createdTo?: Date
}

export function CsvExportButton({
  search,
  role,
  isActive,
  createdFrom,
  createdTo
}: CsvExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filters = {
        ...(search && { search }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(createdFrom && { createdFrom }),
        ...(createdTo && { createdTo }),
      }

      const { csvContent, userCount, filename } = await getUsersForCsvExport(filters)

      // BOMを追加してUTF-8として正しく認識されるようにする
      const bom = "\uFEFF"
      const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" })
      
      // ダウンロード処理
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`${userCount}件のユーザーデータをエクスポートしました`)
    } catch (error) {
      console.error("CSV export error:", error)
      toast.error("CSVエクスポートに失敗しました")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isExporting ? "エクスポート中..." : "CSVエクスポート"}
    </Button>
  )
}