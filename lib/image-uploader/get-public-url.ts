const BUCKET_PREFIX = 'altee-images'

/**
 * storageKey から CDN 公開 URL を生成する。
 * storageKey の形式: "altee-images/folder/YYYY/MM/file.webp"
 * 出力例: "https://pub-xxx.r2.dev/folder/YYYY/MM/file.webp"
 *
 * ※ lib/storage.ts（S3Client）とは独立したファイルにすることで、
 *   クライアントバンドルへの S3Client 混入を防止している。
 */
export function getPublicUrl(storageKey: string): string {
  const key = storageKey.startsWith(`${BUCKET_PREFIX}/`)
    ? storageKey.slice(BUCKET_PREFIX.length + 1)
    : storageKey
  return `${process.env.NEXT_PUBLIC_STORAGE_URL}/${key}`
}
