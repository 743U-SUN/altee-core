'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import {
  itemSchema,
  itemCSVRowSchema,
  type ItemInput,
  type ItemCSVRow,
  type CSVImportResult,
} from '@/lib/validations/item'
import { validateSpecs } from '@/lib/validations/pc-part-specs'
import type { PcPartSpecFormData } from '@/types/pc-part-spec'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ===== カテゴリ一覧取得（アイテムフォーム用） =====

export async function getCategoriesAction() {
  await requireAdmin()
  try {
    const categories = await prisma.itemCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    return { success: true, data: categories }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return {
      success: false,
      error: 'カテゴリの取得に失敗しました',
    }
  }
}

// ===== アイテム一覧取得 =====

interface GetItemsFilters {
  categoryId?: string
  brandId?: string
  search?: string
  page?: number
  perPage?: number
}

export async function getItemsAction(filters: GetItemsFilters = {}) {
  await requireAdmin()
  try {
    const { categoryId, brandId, search, page = 1, perPage: rawPerPage = 20 } = filters
    const perPage = Math.min(rawPerPage, 100)

    const where = {
      AND: [
        categoryId ? { categoryId } : {},
        brandId ? { brandId } : {},
        search
          ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              {
                description: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
          : {},
      ],
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          category: true,
          brand: true,
          _count: {
            select: {
              userItems: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.item.count({ where }),
    ])

    return {
      success: true,
      data: {
        items,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    }
  } catch (error) {
    console.error('Failed to fetch items:', error)
    return {
      success: false,
      error: 'アイテムの取得に失敗しました',
    }
  }
}

// ===== アイテム詳細取得 =====

export async function getItemByIdAction(id: string) {
  await requireAdmin()
  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        pcPartSpec: true,
        _count: {
          select: {
            userItems: true,
          },
        },
      },
    })

    if (!item) {
      return {
        success: false,
        error: 'アイテムが見つかりませんでした',
      }
    }

    return { success: true, data: item }
  } catch (error) {
    console.error('Failed to fetch item:', error)
    return {
      success: false,
      error: 'アイテムの取得に失敗しました',
    }
  }
}

// ===== アイテム作成 =====

export async function createItemAction(input: ItemInput, pcPartSpec?: PcPartSpecFormData | null) {
  await requireAdmin()
  try {
    // "null" 文字列を null に変換
    const normalizedInput = {
      ...input,
      brandId: input.brandId === 'null' ? null : input.brandId,
    }

    // バリデーション
    const validated = itemSchema.parse(normalizedInput)

    // カテゴリ・ブランド・ASIN重複チェックを並列実行
    const [category, brand, duplicateByAsin] = await Promise.all([
      prisma.itemCategory.findUnique({ where: { id: validated.categoryId } }),
      validated.brandId ? prisma.brand.findUnique({ where: { id: validated.brandId } }) : null,
      validated.asin ? prisma.item.findUnique({ where: { asin: validated.asin } }) : null,
    ])

    if (!category) {
      return {
        success: false,
        error: '指定されたカテゴリが見つかりませんでした',
      }
    }

    if (validated.brandId && !brand) {
      return {
        success: false,
        error: '指定されたブランドが見つかりませんでした',
      }
    }

    if (duplicateByAsin) {
      return {
        success: false,
        error: 'このASINは既に登録されています',
      }
    }

    // 画像URLがある場合はR2にダウンロード・アップロード
    // カスタムURL優先、なければAmazon画像URL
    let imageStorageKey: string | undefined = validated.imageStorageKey || undefined
    const imageUrl = validated.customImageUrl || validated.amazonImageUrl
    if (imageUrl && validated.asin) {
      const uploadResult = await downloadAndUploadItemImage(imageUrl, validated.asin)
      if (uploadResult.success) {
        imageStorageKey = uploadResult.storageKey
      } else {
        console.error('画像アップロード失敗:', uploadResult.error)
        // 画像アップロード失敗してもアイテム作成は続行
      }
    }

    // アイテム作成
    const item = await prisma.item.create({
      data: {
        name: validated.name,
        description: validated.description || null,
        categoryId: validated.categoryId,
        brandId: validated.brandId || null,
        amazonUrl: validated.amazonUrl || null,
        amazonImageUrl: validated.amazonImageUrl || null,
        customImageUrl: validated.customImageUrl || null,
        imageStorageKey,
        ogTitle: validated.ogTitle || null,
        ogDescription: validated.ogDescription || null,
        asin: validated.asin || null,
      },
    })

    // PcPartSpec の作成（指定されている場合）
    if (pcPartSpec) {
      const specResult = validateSpecs(pcPartSpec.partType, pcPartSpec.specs)
      if (!specResult.success) {
        return {
          success: false,
          error: `スペック情報のバリデーションに失敗しました: ${specResult.error.issues.map((i) => i.message).join(', ')}`,
        }
      }
      await prisma.pcPartSpec.create({
        data: {
          itemId: item.id,
          partType: pcPartSpec.partType,
          chipMakerId: pcPartSpec.chipMakerId || null,
          tdp: pcPartSpec.tdp,
          releaseDate: pcPartSpec.releaseDate ? new Date(pcPartSpec.releaseDate) : null,
          specs: specResult.data,
        },
      })
    }

    revalidatePath('/admin/items')
    return { success: true, data: item }
  } catch (error) {
    console.error('Failed to create item:', error)
    return {
      success: false,
      error: 'アイテムの作成に失敗しました',
    }
  }
}

// ===== アイテム更新 =====

export async function updateItemAction(id: string, input: ItemInput, pcPartSpec?: PcPartSpecFormData | null) {
  await requireAdmin()
  try {
    // "null" 文字列を null に変換
    const normalizedInput = {
      ...input,
      brandId: input.brandId === 'null' ? null : input.brandId,
    }

    // バリデーション
    const validated = itemSchema.parse(normalizedInput)

    // アイテム存在確認・カテゴリ・ブランド・ASIN重複チェックを並列実行
    const [existingItem, category, brand, duplicateByAsin] = await Promise.all([
      prisma.item.findUnique({ where: { id } }),
      prisma.itemCategory.findUnique({ where: { id: validated.categoryId } }),
      validated.brandId ? prisma.brand.findUnique({ where: { id: validated.brandId } }) : null,
      validated.asin ? prisma.item.findUnique({ where: { asin: validated.asin } }) : null,
    ])

    if (!existingItem) {
      return {
        success: false,
        error: 'アイテムが見つかりませんでした',
      }
    }

    if (!category) {
      return {
        success: false,
        error: '指定されたカテゴリが見つかりませんでした',
      }
    }

    if (validated.brandId && !brand) {
      return {
        success: false,
        error: '指定されたブランドが見つかりませんでした',
      }
    }

    // ASINの重複チェック（変更されている場合のみ）
    if (duplicateByAsin && validated.asin !== existingItem.asin) {
      return {
        success: false,
        error: 'このASINは既に登録されています',
      }
    }

    // 画像URLが変更された場合の処理
    let imageStorageKey: string | null | undefined = existingItem.imageStorageKey
    const newImageUrl = validated.customImageUrl || validated.amazonImageUrl
    const oldImageUrl = existingItem.customImageUrl || existingItem.amazonImageUrl

    // 画像URLが変更された場合
    if (newImageUrl && newImageUrl !== oldImageUrl && validated.asin) {
      // 古い画像を削除
      if (existingItem.imageStorageKey) {
        await deleteItemImageFromR2(existingItem.imageStorageKey)
      }

      // 新しい画像をダウンロード・アップロード
      const uploadResult = await downloadAndUploadItemImage(newImageUrl, validated.asin)
      if (uploadResult.success) {
        imageStorageKey = uploadResult.storageKey || null
      } else {
        console.error('画像アップロード失敗:', uploadResult.error)
        imageStorageKey = null
      }
    }

    // アイテム更新
    const item = await prisma.item.update({
      where: { id },
      data: {
        name: validated.name,
        description: validated.description || null,
        categoryId: validated.categoryId,
        brandId: validated.brandId || null,
        amazonUrl: validated.amazonUrl || null,
        amazonImageUrl: validated.amazonImageUrl || null,
        customImageUrl: validated.customImageUrl || null,
        imageStorageKey: imageStorageKey !== undefined ? imageStorageKey : existingItem.imageStorageKey,
        ogTitle: validated.ogTitle || null,
        ogDescription: validated.ogDescription || null,
        asin: validated.asin || null,
      },
    })

    // PcPartSpec の upsert/削除
    if (pcPartSpec) {
      const specResult = validateSpecs(pcPartSpec.partType, pcPartSpec.specs)
      if (!specResult.success) {
        return {
          success: false,
          error: `スペック情報のバリデーションに失敗しました: ${specResult.error.issues.map((i) => i.message).join(', ')}`,
        }
      }
      await prisma.pcPartSpec.upsert({
        where: { itemId: id },
        create: {
          itemId: id,
          partType: pcPartSpec.partType,
          chipMakerId: pcPartSpec.chipMakerId || null,
          tdp: pcPartSpec.tdp,
          releaseDate: pcPartSpec.releaseDate ? new Date(pcPartSpec.releaseDate) : null,
          specs: specResult.data,
        },
        update: {
          partType: pcPartSpec.partType,
          chipMakerId: pcPartSpec.chipMakerId || null,
          tdp: pcPartSpec.tdp,
          releaseDate: pcPartSpec.releaseDate ? new Date(pcPartSpec.releaseDate) : null,
          specs: specResult.data,
        },
      })
    } else {
      // pcPartSpec が null → 既存のスペックを削除
      await prisma.pcPartSpec.deleteMany({ where: { itemId: id } })
    }

    revalidatePath('/admin/items')
    return { success: true, data: item }
  } catch (error) {
    console.error('Failed to update item:', error)
    return {
      success: false,
      error: 'アイテムの更新に失敗しました',
    }
  }
}

// ===== アイテム削除 =====

export async function deleteItemAction(id: string) {
  await requireAdmin()
  try {
    // アイテムの存在確認
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userItems: true,
          },
        },
      },
    })

    if (!item) {
      return {
        success: false,
        error: 'アイテムが見つかりませんでした',
      }
    }

    // ユーザーアイテムの関連をチェック
    if (item._count.userItems > 0) {
      return {
        success: false,
        error: `このアイテムは${item._count.userItems}人のユーザーが登録しています。削除する前にユーザーアイテムを削除してください。`,
      }
    }

    // R2に保存された画像を削除
    if (item.imageStorageKey) {
      await deleteItemImageFromR2(item.imageStorageKey)
    }

    // アイテム削除
    await prisma.item.delete({
      where: { id },
    })

    revalidatePath('/admin/items')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete item:', error)
    return {
      success: false,
      error: 'アイテムの削除に失敗しました',
    }
  }
}

// ===== CSV一括登録 =====

export async function importItemsFromCSVAction(
  rows: ItemCSVRow[]
): Promise<CSVImportResult> {
  await requireAdmin()

  // ランタイムバリデーション + サイズ制限
  const validatedRows = z.array(itemCSVRowSchema).max(500, 'CSVの行数は500行以内にしてください').parse(rows)

  const result: CSVImportResult = {
    success: 0,
    failed: 0,
    errors: [],
  }

  // N+1回避: カテゴリとブランドをプリロード
  const [allCategories, allBrands] = await Promise.all([
    prisma.itemCategory.findMany({ select: { id: true, slug: true } }),
    prisma.brand.findMany({ select: { id: true, name: true } }),
  ])
  const categoryMap = new Map(allCategories.map((c) => [c.slug, c.id]))
  const brandMap = new Map(allBrands.map((b) => [b.name, b.id]))

  for (let i = 0; i < validatedRows.length; i++) {
    const row = validatedRows[i]
    const rowNumber = i + 2 // CSVの行番号（ヘッダー分+1）

    try {
      // カテゴリをslugから検索（プリロード済みMapから取得）
      const categoryId = categoryMap.get(row.categorySlug)

      if (!categoryId) {
        result.failed++
        result.errors.push({
          row: rowNumber,
          error: `カテゴリ「${row.categorySlug}」が見つかりません`,
          data: row,
        })
        continue
      }

      // ブランドを名前から検索または作成
      let brandId: string | null = null
      if (row.brandName) {
        brandId = brandMap.get(row.brandName) ?? null

        if (!brandId) {
          // ブランドが存在しない場合は作成し、Mapにも追加
          const brand = await prisma.brand.create({
            data: {
              name: row.brandName,
              slug: row.brandName.toLowerCase().replace(/\s+/g, '-'),
            },
          })
          brandId = brand.id
          brandMap.set(row.brandName, brand.id)
        }
      }

      // アイテム作成
      await prisma.item.create({
        data: {
          name: row.name,
          description: row.description || null,
          categoryId,
          brandId,
          amazonUrl: row.amazonUrl || null,
          asin: row.asin || null,
        },
      })

      result.success++
    } catch (error) {
      result.failed++
      result.errors.push({
        row: rowNumber,
        error:
          error instanceof Error ? error.message : '不明なエラー',
        data: row,
      })
    }
  }

  revalidatePath('/admin/items')
  return result
}

// ===== R2画像管理関数 =====

/**
 * アイテム画像をR2から削除（ヘルパー関数）
 */
async function deleteItemImageFromR2(imageStorageKey: string): Promise<void> {
  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    const { storageClient } = await import('@/lib/storage')

    // R2から削除
    await storageClient.send(new DeleteObjectCommand({
      Bucket: 'altee-images',
      Key: imageStorageKey
    }))

    // MediaFileからも削除
    await prisma.mediaFile.deleteMany({
      where: { storageKey: `altee-images/${imageStorageKey}` }
    })
  } catch (error) {
    console.error('アイテム画像削除エラー:', error)
    // 削除失敗しても続行（エラーを投げない）
  }
}

/**
 * Amazon画像またはカスタムURLから画像をダウンロードしてR2にアップロード
 */
async function downloadAndUploadItemImage(imageUrl: string, asin: string): Promise<{
  success: boolean
  storageKey?: string
  error?: string
}> {
  try {
    // 管理者権限チェック（常に実行）
    const session = await requireAdmin()
    const uploaderId = session.user.id

    // URL ホワイトリスト
    const ALLOWED_IMAGE_HOSTS = [
      'images-na.ssl-images-amazon.com',
      'images-fe.ssl-images-amazon.com',
      'images-eu.ssl-images-amazon.com',
      'm.media-amazon.com',
      'images-amazon.com',
    ]
    try {
      const parsedUrl = new URL(imageUrl)
      if (parsedUrl.protocol !== 'https:' || !ALLOWED_IMAGE_HOSTS.some((h) => parsedUrl.hostname.endsWith(h))) {
        return { success: false, error: '許可されていない画像URLです' }
      }
    } catch {
      return { success: false, error: '不正なURLです' }
    }

    // 画像をダウンロード
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return { success: false, error: '画像のダウンロードに失敗しました' }
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Content-Typeから拡張子を決定
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    let extension = 'jpg'
    if (contentType.includes('png')) extension = 'png'
    else if (contentType.includes('gif')) extension = 'gif'
    else if (contentType.includes('webp')) extension = 'webp'

    // ファイル名: item-images/{asin}.{ext}
    const fileName = `${asin}.${extension}`
    const folder = 'item-images'
    const storageKey = `${folder}/${fileName}`
    const fullStorageKey = `altee-images/${storageKey}`

    // R2にアップロード
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const { storageClient } = await import('@/lib/storage')

    await storageClient.send(new PutObjectCommand({
      Bucket: 'altee-images',
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
    }))

    // MediaFileに記録（既存の場合は更新）
    await prisma.mediaFile.upsert({
      where: { storageKey: fullStorageKey },
      create: {
        storageKey: fullStorageKey,
        fileName,
        originalName: fileName,
        fileSize: buffer.length,
        mimeType: contentType,
        uploadType: 'SYSTEM',
        containerName: folder,
        uploaderId: uploaderId,
      },
      update: {
        fileName,
        originalName: fileName,
        fileSize: buffer.length,
        mimeType: contentType,
        uploaderId: uploaderId,
      }
    })

    return { success: true, storageKey }
  } catch (error) {
    console.error('アイテム画像ダウンロード・アップロードエラー:', error)
    return { success: false, error: '画像の保存に失敗しました' }
  }
}

/**
 * アイテム画像を更新（Amazonから再取得してR2に保存）
 */
export async function refreshItemImage(itemId: string): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  await requireAdmin()
  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      return { success: false, error: 'アイテムが見つかりません' }
    }

    // カスタムURLまたはAmazon URL
    const imageUrl = item.customImageUrl || item.amazonImageUrl
    if (!imageUrl) {
      return { success: false, error: '画像URLが登録されていません' }
    }

    // ASINが必要
    if (!item.asin) {
      return { success: false, error: 'ASINが登録されていません' }
    }

    // 古い画像を削除（存在する場合）
    if (item.imageStorageKey) {
      await deleteItemImageFromR2(item.imageStorageKey)
    }

    // 新しい画像をダウンロード・アップロード
    const uploadResult = await downloadAndUploadItemImage(imageUrl, item.asin)

    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error }
    }

    // アイテム情報を更新
    await prisma.item.update({
      where: { id: itemId },
      data: { imageStorageKey: uploadResult.storageKey }
    })

    revalidatePath('/admin/items')
    revalidatePath(`/admin/items/${itemId}`)

    return { success: true, message: '画像を更新しました' }
  } catch (error) {
    console.error('アイテム画像更新エラー:', error)
    return { success: false, error: '画像の更新に失敗しました' }
  }
}
