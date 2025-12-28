import { useState } from 'react'
import { toast } from 'sonner'

export function useCustomImageValidation() {
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null)
  const [isLoadingCustomImage, setIsLoadingCustomImage] = useState(false)

  const validateCustomImage = async (url: string | undefined) => {
    const trimmedUrl = url?.trim()
    if (!trimmedUrl) {
      setCustomImagePreview(null)
      return
    }

    setIsLoadingCustomImage(true)

    try {
      // 画像URLの検証（実際に画像を読み込んで確認）
      const img = new Image()
      img.onload = () => {
        setCustomImagePreview(trimmedUrl)
        toast.success('画像を確認しました')
        setIsLoadingCustomImage(false)
      }
      img.onerror = () => {
        toast.error('画像の読み込みに失敗しました。URLを確認してください')
        setCustomImagePreview(null)
        setIsLoadingCustomImage(false)
      }
      img.src = trimmedUrl
    } catch {
      toast.error('画像URL確認中にエラーが発生しました')
      setCustomImagePreview(null)
      setIsLoadingCustomImage(false)
    }
  }

  return {
    customImagePreview,
    isLoadingCustomImage,
    validateCustomImage,
    setCustomImagePreview
  }
}
