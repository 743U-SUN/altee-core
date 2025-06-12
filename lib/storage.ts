import { S3Client } from '@aws-sdk/client-s3'

// 環境変数から設定を取得（ビルド時はデフォルト値使用）
const config = {
  endpoint: process.env.STORAGE_ENDPOINT || 'http://localhost:9000',
  region: process.env.STORAGE_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.STORAGE_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
}

// S3互換クライアントを作成（MinIO/ConoHa両対応）
export const storageClient = new S3Client(config)

// 設定値をexport（他のファイルで使用）
export const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'dev-storage'
export const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT || 'http://localhost:9000'