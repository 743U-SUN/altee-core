'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import ogs from 'open-graph-scraper'
import { UserDeviceForPublicPage } from '@/types/device'

// Amazon URL解析結果の型
export interface AmazonUrlResult {
  success: boolean
  asin?: string
  error?: string
}

// OG情報取得結果の型
export interface OgDataResult {
  success: boolean
  data?: {
    title?: string
    description?: string
    image?: string
  }
  error?: string
}

// Amazon URLからASINを抽出
export async function extractAsinFromUrl(url: string): Promise<AmazonUrlResult> {
  try {
    // 基本的なURL形式チェック
    let targetUrl = url.trim()
    
    // HTTPSでない場合は追加
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    // Amazon短縮URLの場合は展開
    if (targetUrl.includes('amzn.to/')) {
      try {
        const response = await fetch(targetUrl, { 
          method: 'HEAD',
          redirect: 'follow' 
        })
        targetUrl = response.url
      } catch {
        return {
          success: false,
          error: 'Amazon短縮URLの展開に失敗しました'
        }
      }
    }

    // 日本版Amazon URLかチェック
    if (!targetUrl.includes('amazon.co.jp')) {
      return {
        success: false,
        error: '日本版Amazon（amazon.co.jp）のURLのみ対応しています'
      }
    }

    // ASIN抽出のための正規表現パターン
    const asinPatterns = [
      /\/dp\/([A-Z0-9]{10})/i,           // /dp/ASIN形式
      /\/gp\/product\/([A-Z0-9]{10})/i,  // /gp/product/ASIN形式
      /\/product\/([A-Z0-9]{10})/i,      // /product/ASIN形式
    ]

    let asin: string | null = null

    // 各パターンでASIN抽出を試行
    for (const pattern of asinPatterns) {
      const match = targetUrl.match(pattern)
      if (match && match[1]) {
        asin = match[1].toUpperCase()
        break
      }
    }

    if (!asin) {
      return {
        success: false,
        error: 'Amazon商品URLからASINを抽出できませんでした'
      }
    }

    // ASINの形式チェック（10文字の英数字）
    if (!/^[A-Z0-9]{10}$/i.test(asin)) {
      return {
        success: false,
        error: '無効なASIN形式です'
      }
    }

    return {
      success: true,
      asin: asin
    }

  } catch (error) {
    console.error('Amazon URL解析エラー:', error)
    return {
      success: false,
      error: 'URL解析中にエラーが発生しました'
    }
  }
}

// ASINの重複チェック
export async function checkAsinExists(asin: string): Promise<boolean> {
  try {
    const existing = await prisma.device.findUnique({
      where: { asin }
    })
    return existing !== null
  } catch (error) {
    console.error('ASIN重複チェックエラー:', error)
    return false
  }
}

// Amazon商品画像選択ロジック（品質重視版）
function selectBestAmazonImage(imageUrls: string[]): string {
  if (imageUrls.length === 0) return ''
  
  // デバッグ用ログ
  if (process.env.NODE_ENV === 'development') {
    console.log('取得された画像URL一覧:', imageUrls)
  }
  
  // 画像品質評価
  const scoreImage = (url: string): number => {
    let score = 0
    
    // Amazon商品画像の特徴（高品質）
    if (url.includes('/images/I/')) {
      score += 1000 // 商品画像パス
      
      // サイズ指定なし = 最大サイズ（高品質）
      if (!url.match(/\._SL\d+_/)) {
        score += 500
      } else {
        // サイズ指定ありの場合、大きいほど高スコア
        const sizeMatch = url.match(/\._SL(\d+)_/)
        if (sizeMatch) {
          const size = parseInt(sizeMatch[1])
          score += Math.min(size, 500) // 500px以上は同等扱い
        }
      }
      
      // ASIN様のファイル名（10文字の英数字）
      const filename = url.split('/').pop()?.split('.')[0] || ''
      if (/^[A-Z0-9]{10}$/i.test(filename)) {
        score += 200
      }
    }
    
    // 除外すべきパターン
    if (url.includes('sprites/') || 
        url.includes('nav-') || 
        url.includes('gno/') || 
        url.includes('toolbar') ||
        url.includes('logo') ||
        url.includes('icon')) {
      score = -1000
    }
    
    // 小さいサイズは減点
    if (url.includes('_SL75_') || url.includes('_SL160_')) {
      score -= 100
    }
    
    return score
  }
  
  // 全画像をスコア化してソート
  const scoredImages = imageUrls.map(url => ({
    url,
    score: scoreImage(url)
  })).sort((a, b) => b.score - a.score)
  
  if (process.env.NODE_ENV === 'development') {
    console.log('画像スコア結果:', scoredImages.slice(0, 5))
  }
  
  // 最高スコアかつスコア0以上の画像を選択
  const bestImage = scoredImages.find(img => img.score > 0)
  const selectedUrl = bestImage?.url || imageUrls[0] || ''
  
  if (process.env.NODE_ENV === 'development') {
    console.log('最終選択画像:', selectedUrl, 'スコア:', bestImage?.score || 0)
  }
  
  return selectedUrl
}

// ソーシャルメディアBot User-Agentでの優先取得
async function fetchOgDataWithBotUA(url: string): Promise<OgDataResult> {
  const botUserAgents = [
    // Discord Bot (最優先)
    'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
    // Twitter Bot  
    'Twitterbot/1.0',
    // Facebook Bot
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    // 一般ブラウザ（フォールバック）
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ]

  for (const userAgent of botUserAgents) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Amazon OGP取得試行: ${userAgent.split('/')[0]}`)
      }
      
      const options = {
        url: url,
        timeout: 8000,
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }

      const { error, result } = await ogs(options)
      
      if (!error && result.ogTitle && result.ogImage) {
        const imageUrls = extractImageUrls(result.ogImage)
        const bestImage = selectBestAmazonImage(imageUrls)
        
        // 商品画像らしいものが取得できたら即座に返す
        if (bestImage && bestImage.includes('/images/I/')) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ ${userAgent.split('/')[0]}で商品画像取得成功: ${bestImage}`)
          }
          return {
            success: true,
            data: {
              title: result.ogTitle || '',
              description: result.ogDescription || '',
              image: bestImage
            }
          }
        }
      }
      
      // 短い間隔を空ける（レート制限対策）
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`❌ ${userAgent.split('/')[0]}でエラー:`, error)
      }
      continue
    }
  }
  
  return {
    success: false,
    error: '全てのUser-Agentで画像取得に失敗しました'
  }
}

// OG画像URLの抽出（共通化）
function extractImageUrls(ogImage: unknown): string[] {
  const imageUrls: string[] = []
  
  try {
    if (Array.isArray(ogImage)) {
      for (const img of ogImage) {
        if (img && typeof img === 'object' && img !== null && 'url' in img) {
          const url = (img as unknown as Record<string, unknown>).url
          if (typeof url === 'string' && url.trim()) {
            imageUrls.push(url.trim())
          }
        }
      }
    } else if (typeof ogImage === 'object' && ogImage !== null && 'url' in ogImage) {
      const url = (ogImage as unknown as Record<string, unknown>).url
      if (typeof url === 'string' && url.trim()) {
        imageUrls.push(url.trim())
      }
    }
  } catch {
    // エラーは無視
  }
  
  return imageUrls
}

// Amazon専用画像抽出（直接HTML解析）
async function extractAmazonImageFromHTML(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
    })
    
    if (!response.ok) return null
    
    const html = await response.text()
    
    // Amazon画像パターン（優先度順）
    const amazonImagePatterns = [
      // メイン商品画像（最優先）
      /data-src="(https:\/\/[\w\-\.]+\.(?:media-)?amazon\.com\/images\/[^"]+)"[^>]*id="landingImage"/i,
      /src="(https:\/\/[\w\-\.]+\.(?:media-)?amazon\.com\/images\/[^"]+)"[^>]*id="landingImage"/i,
      // 高解像度商品画像
      /src="(https:\/\/[\w\-\.]+\.(?:media-)?amazon\.com\/images\/I\/[^"]+\._[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/i,
      // Amazon CDN画像
      /data-src="(https:\/\/[\w\-\.]+\.ssl-images-amazon\.com\/images\/[^"]+)"/i,
      /src="(https:\/\/[\w\-\.]+\.ssl-images-amazon\.com\/images\/[^"]+)"/i,
    ]
    
    for (const pattern of amazonImagePatterns) {
      const match = html.match(pattern)
      if (match) {
        const imageUrl = match[1]
        // サイズ最大化（_SL*_を除去）
        const optimizedUrl = imageUrl.replace(/\._SL\d+_/, '')
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎯 Amazon直接抽出成功: ${optimizedUrl}`)
        }
        return optimizedUrl
      }
    }
    
    return null
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Amazon直接抽出エラー:', error)
    }
    return null
  }
}

// Amazon URLからOG情報を取得
export async function fetchOgData(url: string): Promise<OgDataResult> {
  try {
    // 最優先: Amazon固有の画像直接抽出
    const directImage = await extractAmazonImageFromHTML(url)
    if (directImage) {
      // タイトルと説明は従来方式で取得
      const ogResult = await fetchOgDataWithBotUA(url)
      return {
        success: true,
        data: {
          title: ogResult.data?.title || '',
          description: ogResult.data?.description || '',
          image: directImage // 直接抽出画像を使用
        }
      }
    }

    // フォールバック: Bot User-Agentで試行
    const botResult = await fetchOgDataWithBotUA(url)
    if (botResult.success) {
      return botResult
    }

    // フォールバック: 従来の方法
    const options = {
      url: url,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
      }
    }

    const { error, result } = await ogs(options)

    if (error) {
      return {
        success: false,
        error: 'OG情報の取得に失敗しました'
      }
    }

    if (!result.ogTitle && !result.ogDescription && !result.ogImage) {
      return {
        success: false,
        error: '商品情報が見つかりませんでした'
      }
    }

    // フォールバック方式で画像抽出
    const imageUrls = extractImageUrls(result.ogImage)
    const imageUrl = selectBestAmazonImage(imageUrls)

    return {
      success: true,
      data: {
        title: result.ogTitle || '',
        description: result.ogDescription || '',
        image: imageUrl
      }
    }

  } catch (error) {
    console.error('OG情報取得エラー:', error)
    return {
      success: false,
      error: 'OG情報の取得中にエラーが発生しました'
    }
  }
}

// デバイス作成用の型
export interface CreateDeviceData {
  asin: string
  name: string
  description?: string
  categoryId: string
  brandId?: string
  amazonUrl: string
  amazonImageUrl?: string
  ogTitle?: string
  ogDescription?: string
  attributes?: { [attributeId: string]: string }
}

// デバイス作成
export async function createDevice(data: CreateDeviceData) {
  try {
    const device = await prisma.device.create({
      data: {
        asin: data.asin,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        brandId: data.brandId,
        amazonUrl: data.amazonUrl,
        amazonImageUrl: data.amazonImageUrl,
        ogTitle: data.ogTitle,
        ogDescription: data.ogDescription,
      },
      include: {
        category: true,
        brand: true,
        attributes: {
          include: {
            categoryAttribute: true
          }
        }
      }
    })

    // 属性データの保存
    if (data.attributes) {
      for (const [attributeId, value] of Object.entries(data.attributes)) {
        if (value.trim()) {
          await prisma.deviceAttribute.create({
            data: {
              deviceId: device.id,
              categoryAttributeId: attributeId,
              value: value.trim(),
            }
          })
        }
      }
    }

    revalidatePath('/admin/devices')
    return { success: true, device }
  } catch (error) {
    console.error('デバイス作成エラー:', error)
    return { success: false, error: 'デバイスの作成に失敗しました' }
  }
}

// デバイス一覧取得
export async function getDevices(categoryId?: string) {
  try {
    return await prisma.device.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: {
        category: true,
        userDevices: {
          include: {
            user: {
              select: { name: true, handle: true }
            }
          }
        },
        attributes: {
          include: {
            categoryAttribute: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('デバイス一覧取得エラー:', error)
    return []
  }
}

// デバイス詳細取得
export async function getDevice(id: string) {
  try {
    return await prisma.device.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            attributes: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        },
        userDevices: {
          include: {
            user: {
              select: { name: true, handle: true }
            }
          }
        },
        attributes: {
          include: {
            categoryAttribute: true
          }
        }
      }
    })
  } catch (error) {
    console.error('デバイス詳細取得エラー:', error)
    return null
  }
}

// デバイス更新
export async function updateDevice(id: string, data: Partial<CreateDeviceData>) {
  try {
    const device = await prisma.device.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        brandId: data.brandId,
        amazonUrl: data.amazonUrl,
        amazonImageUrl: data.amazonImageUrl,
        ogTitle: data.ogTitle,
        ogDescription: data.ogDescription,
      },
    })

    // 属性データの更新
    if (data.attributes) {
      // 既存の属性を削除
      await prisma.deviceAttribute.deleteMany({
        where: { deviceId: id }
      })

      // 新しい属性を作成
      for (const [attributeId, value] of Object.entries(data.attributes)) {
        if (value.trim()) {
          await prisma.deviceAttribute.create({
            data: {
              deviceId: id,
              categoryAttributeId: attributeId,
              value: value.trim(),
            }
          })
        }
      }
    }

    revalidatePath('/admin/devices')
    revalidatePath(`/admin/devices/${id}`)
    return { success: true, device }
  } catch (error) {
    console.error('デバイス更新エラー:', error)
    return { success: false, error: 'デバイスの更新に失敗しました' }
  }
}

// デバイス削除
export async function deleteDevice(id: string) {
  try {
    // ユーザーデバイスが存在する場合は削除不可
    const userDeviceCount = await prisma.userDevice.count({
      where: { deviceId: id }
    })

    if (userDeviceCount > 0) {
      return { success: false, error: 'ユーザーが使用中のデバイスは削除できません' }
    }

    await prisma.device.delete({
      where: { id }
    })

    revalidatePath('/admin/devices')
    return { success: true }
  } catch (error) {
    console.error('デバイス削除エラー:', error)
    return { success: false, error: 'デバイスの削除に失敗しました' }
  }
}

// デバイスカテゴリ一覧取得
export async function getDeviceCategories() {
  try {
    return await prisma.deviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        attributes: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })
  } catch (error) {
    console.error('カテゴリ取得エラー:', error)
    return []
  }
}

// ユーザーデバイス作成用の型
export interface CreateUserDeviceData {
  deviceId: string
  isPublic?: boolean
  review?: string
}

// ユーザーデバイス作成
export async function createUserDevice(userId: string, data: CreateUserDeviceData) {
  try {
    const userDevice = await prisma.userDevice.create({
      data: {
        userId,
        deviceId: data.deviceId,
        isPublic: data.isPublic ?? true,
        review: data.review,
      },
      include: {
        device: {
          include: {
            category: true,
            attributes: {
              include: {
                categoryAttribute: true
              }
            }
          }
        }
      }
    })

    revalidatePath('/dashboard/devices')
    return { success: true, userDevice }
  } catch (error) {
    console.error('ユーザーデバイス作成エラー:', error)
    return { success: false, error: 'デバイスの登録に失敗しました' }
  }
}

// ユーザーデバイス一覧取得
export async function getUserDevices(userId: string) {
  try {
    return await prisma.userDevice.findMany({
      where: { userId },
      include: {
        device: {
          include: {
            category: true,
            attributes: {
              include: {
                categoryAttribute: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('ユーザーデバイス一覧取得エラー:', error)
    return []
  }
}

// ユーザーデバイス詳細取得
export async function getUserDevice(userId: string, userDeviceId: string) {
  try {
    return await prisma.userDevice.findFirst({
      where: { 
        id: userDeviceId,
        userId 
      },
      include: {
        device: {
          include: {
            category: {
              include: {
                attributes: {
                  orderBy: { sortOrder: 'asc' }
                }
              }
            },
            attributes: {
              include: {
                categoryAttribute: true
              }
            }
          }
        }
      }
    })
  } catch (error) {
    console.error('ユーザーデバイス詳細取得エラー:', error)
    return null
  }
}

// ユーザーデバイス更新
export async function updateUserDevice(userId: string, userDeviceId: string, data: Partial<CreateUserDeviceData>) {
  try {
    const userDevice = await prisma.userDevice.updateMany({
      where: { 
        id: userDeviceId,
        userId 
      },
      data: {
        isPublic: data.isPublic,
        review: data.review,
      }
    })

    revalidatePath('/dashboard/devices')
    revalidatePath(`/dashboard/devices/${userDeviceId}`)
    return { success: true, userDevice }
  } catch (error) {
    console.error('ユーザーデバイス更新エラー:', error)
    return { success: false, error: 'デバイス情報の更新に失敗しました' }
  }
}

// ユーザーデバイス削除
export async function deleteUserDevice(userId: string, userDeviceId: string) {
  try {
    await prisma.userDevice.deleteMany({
      where: { 
        id: userDeviceId,
        userId 
      }
    })

    revalidatePath('/dashboard/devices')
    return { success: true }
  } catch (error) {
    console.error('ユーザーデバイス削除エラー:', error)
    return { success: false, error: 'デバイスの削除に失敗しました' }
  }
}

// ブランド一覧取得
export async function getBrands() {
  try {
    return await prisma.brand.findMany({
      orderBy: { sortOrder: 'asc' }
    })
  } catch (error) {
    console.error('ブランド取得エラー:', error)
    return []
  }
}

// カテゴリ別デバイス一覧取得（ブランドフィルタ対応）
export async function getDevicesByCategory(categoryId?: string, brandId?: string) {
  try {
    const where = {
      AND: [
        categoryId ? { categoryId } : {},
        brandId ? { brandId } : {}
      ].filter(condition => Object.keys(condition).length > 0)
    }

    return await prisma.device.findMany({
      where,
      include: {
        category: true,
        brand: true,
        attributes: {
          include: {
            categoryAttribute: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('カテゴリ別デバイス取得エラー:', error)
    return []
  }
}

// 公開デバイス一覧取得（管理者が登録したデバイス商品）
export async function getPublicDevices(categoryId?: string, brandId?: string, searchQuery?: string) {
  try {
    const where = {
      AND: [
        searchQuery ? {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' as const } },
            { asin: { contains: searchQuery, mode: 'insensitive' as const } }
          ]
        } : {},
        categoryId ? { categoryId } : {},
        brandId ? { brandId } : {}
      ].filter(condition => Object.keys(condition).length > 0)
    }

    return await prisma.device.findMany({
      where,
      include: {
        category: true,
        brand: true,
        attributes: {
          include: {
            categoryAttribute: true
          }
        },
        userDevices: {
          where: { isPublic: true },
          include: {
            user: {
              select: {
                name: true,
                handle: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // パフォーマンス考慮
    })
  } catch (error) {
    console.error('公開デバイス取得エラー:', error)
    return []
  }
}

// デバイス検索（既存デバイスから選択用）
export async function searchDevices(query: string, categoryId?: string, brandId?: string) {
  try {
    const where = {
      AND: [
        query ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { ogTitle: { contains: query, mode: 'insensitive' as const } },
            { asin: { contains: query, mode: 'insensitive' as const } }
          ]
        } : {},
        categoryId ? { categoryId } : {},
        brandId ? { brandId } : {}
      ].filter(condition => Object.keys(condition).length > 0)
    }

    return await prisma.device.findMany({
      where,
      include: {
        category: true,
        brand: true,
        attributes: {
          include: {
            categoryAttribute: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // 最大50件
    })
  } catch (error) {
    console.error('デバイス検索エラー:', error)
    return []
  }
}

// ユーザー公開デバイス取得結果の型
export interface UserPublicDevicesResult {
  success: boolean
  user?: { id: string; name: string | null; handle: string }
  userDevices?: UserDeviceForPublicPage[]
  error?: string
}

// 特定ユーザーの公開デバイス取得（ハンドル指定）
export async function getUserPublicDevicesByHandle(handle: string): Promise<UserPublicDevicesResult> {
  try {
    // まずハンドルからユーザーを検索
    const user = await prisma.user.findUnique({
      where: { handle },
      select: { id: true, name: true, handle: true }
    })

    if (!user || !user.handle) {
      return { success: false, error: 'ユーザーが見つかりません' }
    }

    // 該当ユーザーの公開デバイスを取得
    const userDevices = await prisma.userDevice.findMany({
      where: { 
        userId: user.id,
        isPublic: true 
      },
      include: {
        device: {
          include: {
            category: true,
            brand: true,
            attributes: {
              include: {
                categoryAttribute: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { 
      success: true, 
      user: user as { id: string; name: string | null; handle: string },
      userDevices: userDevices 
    }
  } catch (error) {
    console.error('ユーザー公開デバイス取得エラー:', error)
    return { 
      success: false, 
      error: 'デバイス情報の取得に失敗しました' 
    }
  }
}

// 特定ユーザーの公開デバイス取得（ユーザーID指定）
export async function getUserPublicDevices(userId: string) {
  try {
    return await prisma.userDevice.findMany({
      where: { 
        userId,
        isPublic: true 
      },
      include: {
        device: {
          include: {
            category: true,
            brand: true,
            attributes: {
              include: {
                categoryAttribute: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('ユーザー公開デバイス取得エラー:', error)
    return []
  }
}