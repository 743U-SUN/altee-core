import 'server-only'
import { S3Client } from '@aws-sdk/client-s3'

// Cloudflare R2 接続設定（S3互換API）
// Docker ビルド時は env が無いためダミー値で初期化される。
// 本番ランタイムでは env から正しい値が読まれる。
const config = {
  endpoint: process.env.STORAGE_ENDPOINT || 'http://localhost:9000',
  region: process.env.STORAGE_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY || 'dummy',
    secretAccessKey: process.env.STORAGE_SECRET_KEY || 'dummy',
  },
  forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
}

export const storageClient = new S3Client(config)

export const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'altee-images'
export const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT || ''
