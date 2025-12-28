export async function processImageFile(file: File): Promise<File> {
  // 画像ファイル以外、またはSVG/GIFは処理をスキップ
  if (!file.type.startsWith('image/') ||
      file.type === 'image/svg+xml' ||
      file.type === 'image/gif') {
    return file
  }

  try {
    const { processImage } = await import('@/lib/image-uploader/image-processor')
    const processResult = await processImage(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      format: 'webp'
    })

    if (processResult.success && processResult.processedFile) {
      // WebPファイルとして新しいFileオブジェクトを作成
      const webpFileName = file.name.replace(/\.[^.]+$/, '.webp')
      return new File([processResult.processedFile], webpFileName, {
        type: 'image/webp'
      })
    }
  } catch (error) {
    console.warn('Image processing failed, using original file:', error)
  }

  // 処理に失敗した場合は元のファイルを返す
  return file
}
