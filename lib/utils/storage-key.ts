import { STORAGE_BUCKET } from '@/lib/storage'

/**
 * storageKey の形式を判定し、S3 API 用の Bucket と Key に分解する
 *
 * storageKey の2形式:
 * - 新形式: "altee-images/folder/YYYY/MM/filename.ext"
 *   → Bucket: "altee-images", Key: "folder/YYYY/MM/filename.ext"
 * - 旧形式（ConoHa時代）: "folder/YYYY/MM/filename.ext"
 *   → Bucket: STORAGE_BUCKET (現在のバケット), Key: "folder/YYYY/MM/filename.ext"（全体）
 */
export function parseStorageKey(storageKey: string): { bucket: string; objectKey: string } {
  if (storageKey.startsWith('altee-images/')) {
    const [bucketPart, ...keyParts] = storageKey.split('/')
    return {
      bucket: bucketPart,
      objectKey: keyParts.join('/'),
    }
  }

  return {
    bucket: STORAGE_BUCKET,
    objectKey: storageKey,
  }
}
