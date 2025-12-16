import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { storageClient, STORAGE_BUCKET } from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // paramsを解決
    const resolvedParams = await params

    // Cloudflare R2対応: 単一バケット内のパス構造
    const bucket = STORAGE_BUCKET  // 常に "altee-images"

    // URLパスからバケット名を除外してキーを生成
    // URL例: /api/files/altee-images/user-icons/2025/12/xxx.webp
    // → path: ["altee-images", "user-icons", "2025", "12", "xxx.webp"]
    // → key: "user-icons/2025/12/xxx.webp" (最初のaltee-imagesを除外)
    const pathParts = resolvedParams.path
    const key = pathParts[0] === bucket ? pathParts.slice(1).join('/') : pathParts.join('/')

    console.log(`Fetching file from ${bucket}: ${key}`)

    // Cloudflare R2からファイルを取得
    const response = await storageClient.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }))
    
    if (!response.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // ストリームをバッファに変換
    const bytes = await response.Body.transformToByteArray()
    const buffer = Buffer.from(bytes)
    
    // レスポンスヘッダーを設定
    const headers = new Headers()
    if (response.ContentType) {
      headers.set('Content-Type', response.ContentType)
    }
    if (response.ContentLength) {
      headers.set('Content-Length', response.ContentLength.toString())
    }
    
    // キャッシュヘッダーを追加（1時間）
    headers.set('Cache-Control', 'public, max-age=3600')
    
    return new NextResponse(buffer, {
      headers,
    })
    
  } catch (error) {
    console.error('File fetch failed:', error)
    
    // S3エラーの詳細を確認
    if (error && typeof error === 'object' && 'name' in error) {
      if (error.name === 'NoSuchKey') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}