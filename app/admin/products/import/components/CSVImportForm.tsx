'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { importProductsFromCSVAction } from '../../actions'
import type { ProductCSVRow, CSVImportResult } from '@/lib/validation/product'
import { useRouter } from 'next/navigation'

export function CSVImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<CSVImportResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('CSVファイルを選択してください')
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }

  const parseCSV = async (file: File): Promise<ProductCSVRow[]> => {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      throw new Error('CSVファイルが空です')
    }

    const headers = lines[0].split(',').map(h => h.trim())
    const rows: ProductCSVRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: Partial<ProductCSVRow> = {}

      headers.forEach((header, index) => {
        const value = values[index] || ''
        if (header === 'name') row.name = value
        if (header === 'description') row.description = value
        if (header === 'categorySlug') row.categorySlug = value
        if (header === 'brandName') row.brandName = value
        if (header === 'amazonUrl') row.amazonUrl = value
        if (header === 'asin') row.asin = value
      })

      if (row.name && row.categorySlug) {
        rows.push(row as ProductCSVRow)
      }
    }

    return rows
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error('CSVファイルを選択してください')
      return
    }

    startTransition(async () => {
      try {
        const rows = await parseCSV(file)

        if (rows.length === 0) {
          toast.error('インポート可能なデータがありません')
          return
        }

        const importResult = await importProductsFromCSVAction(rows)
        setResult(importResult)

        if (importResult.success > 0) {
          toast.success(`${importResult.success}件の商品を登録しました`)

          if (importResult.failed === 0) {
            // 全て成功したら商品一覧へ
            router.push('/admin/products')
            router.refresh()
          }
        }

        if (importResult.failed > 0) {
          toast.error(`${importResult.failed}件の登録に失敗しました`)
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'CSVの解析に失敗しました'
        )
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CSVファイルをアップロード</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isPending}
              />
              <Button type="submit" disabled={!file || isPending}>
                <Upload className="mr-2 h-4 w-4" />
                {isPending ? 'インポート中...' : 'インポート'}
              </Button>
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>インポート結果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-lg font-semibold">{result.success}件成功</span>
              </div>
              {result.failed > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span className="text-lg font-semibold">{result.failed}件失敗</span>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-destructive">エラー詳細：</h4>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-4">
                  {result.errors.map((error, index) => (
                    <div key={index} className="border-b pb-2 last:border-0">
                      <p className="font-mono text-sm text-destructive">
                        行 {error.row}: {error.error}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        データ: {JSON.stringify(error.data)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
