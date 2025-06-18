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
    
    // パスの最初の部分をコンテナ名、残りをキーとして解析
    const [containerName, ...keyParts] = resolvedParams.path
    
    // 専用コンテナかどうかを判定
    let bucket: string
    let key: string
    
    if (containerName === 'article-thumbnails' || containerName === 'article-images' || containerName === 'system') {
      // 専用コンテナの場合
      bucket = containerName
      key = keyParts.join('/')
    } else {
      // 従来のimagesコンテナの場合
      bucket = STORAGE_BUCKET
      key = resolvedParams.path.join('/')
    }
    
    console.log(`Fetching file from ${bucket}: ${key}`)
    
    // ConoHaからファイルを取得
    const response = await storageClient.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }))
    
    if (!response.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    // ストリームをバッファに変換
    const buffer = await response.Body.transformToByteArray()
    
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