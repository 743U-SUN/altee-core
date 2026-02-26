'use server'

import { prisma } from '@/lib/prisma'
import {
  itemSchema,
  type ItemInput,
  type ItemCSVRow,
  type CSVImportResult,
} from '@/lib/validations/item'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

// ===== カテゴリ一覧取得（アイテムフォーム用） =====

export async function getCategoriesAction() {
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
  try {
    const { categoryId, brandId, search, page = 1, perPage = 20 } = filters

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
  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
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

export async function createItemAction(input: ItemInput) {
  try {
    // "null" 文字列を null に変換
    const normalizedInput = {
      ...input,
      brandId: input.brandId === 'null' ? null : input.brandId,
    }

    // バリデーション
    const validated = itemSchema.parse(normalizedInput)

    // カテゴリの存在確認
    const category = await prisma.itemCategory.findUnique({
      where: { id: validated.categoryId },
    })

    if (!category) {
      return {
        success: false,
        error: '指定されたカテゴリが見つかりませんでした',
      }
    }

    // ブランドの存在確認（指定されている場合）
    if (validated.brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: validated.brandId },
      })

      if (!brand) {
        return {
          success: false,
          error: '指定されたブランドが見つかりませんでした',
        }
      }
    }

    // ASINの重複チェック（指定されている場合）
    if (validated.asin) {
      const existingItem = await prisma.item.findUnique({
        where: { asin: validated.asin },
      })

      if (existingItem) {
        return {
          success: false,
          error: 'このASINは既に登録されています',
        }
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

    revalidatePath('/admin/items')
    return { success: true, data: item }
  } catch (error) {
    console.error('Failed to create item:', error)
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: 'アイテムの作成に失敗しました',
    }
  }
}

// ===== アイテム更新 =====

export async function updateItemAction(id: string, input: ItemInput) {
  try {
    // "null" 文字列を null に変換
    const normalizedInput = {
      ...input,
      brandId: input.brandId === 'null' ? null : input.brandId,
    }

    // バリデーション
    const validated = itemSchema.parse(normalizedInput)

    // アイテムの存在確認
    const existingItem = await prisma.item.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return {
        success: false,
        error: 'アイテムが見つかりませんでした',
      }
    }

    // カテゴリの存在確認
    const category = await prisma.itemCategory.findUnique({
      where: { id: validated.categoryId },
    })

    if (!category) {
      return {
        success: false,
        error: '指定されたカテゴリが見つかりませんでした',
      }
    }

    // ブランドの存在確認（指定されている場合）
    if (validated.brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: validated.brandId },
      })

      if (!brand) {
        return {
          success: false,
          error: '指定されたブランドが見つかりませんでした',
        }
      }
    }

    // ASINの重複チェック（変更されている場合）
    if (validated.asin && validated.asin !== existingItem.asin) {
      const duplicateItem = await prisma.item.findUnique({
        where: { asin: validated.asin },
      })

      if (duplicateItem) {
        return {
          success: false,
          error: 'このASINは既に登録されています',
        }
      }
    }

    // 画像URLが変更された場合の処理
    let imageStorageKey: string | null | undefined = existingItem.imageStorageKey
    const newImageUrl = validated.customImageUrl || validated.amazonImageUrl
    const oldImageUrl = existingItem.customImageUrl || existingItem.amazonImageUrl

    // 画像URLが変更された場合
    if (newImageUrl && newImageUrl !== oldImageUrl && validated.asin) {
      console.log('画像URLが変更されました。アップロード開始...')
      // 古い画像を削除
      if (existingItem.imageStorageKey) {
        await deleteItemImageFromR2(existingItem.imageStorageKey)
      }

      // 新しい画像をダウンロード・アップロード
      const uploadResult = await downloadAndUploadItemImage(newImageUrl, validated.asin)
      if (uploadResult.success) {
        imageStorageKey = uploadResult.storageKey || null
        console.log('画像アップロード成功:', imageStorageKey)
      } else {
        console.error('画像アップロード失敗:', uploadResult.error)
        imageStorageKey = null
      }
    } else {
      console.log('画像URLは変更されていません。アップロードをスキップ')
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

    revalidatePath('/admin/items')
    return { success: true, data: item }
  } catch (error) {
    console.error('Failed to update item:', error)
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: 'アイテムの更新に失敗しました',
    }
  }
}

// ===== アイテム削除 =====

export async function deleteItemAction(id: string) {
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
  const result: CSVImportResult = {
    success: 0,
    failed: 0,
    errors: [],
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2 // CSVの行番号（ヘッダー分+1）

    try {
      // カテゴリをslugから検索
      const category = await prisma.itemCategory.findUnique({
        where: { slug: row.categorySlug },
      })

      if (!category) {
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
        let brand = await prisma.brand.findFirst({
          where: { name: row.brandName },
        })

        if (!brand) {
          // ブランドが存在しない場合は作成
          brand = await prisma.brand.create({
            data: {
              name: row.brandName,
              slug: row.brandName.toLowerCase().replace(/\s+/g, '-'),
            },
          })
        }

        brandId = brand.id
      }

      // アイテム作成
      await prisma.item.create({
        data: {
          name: row.name,
          description: row.description || null,
          categoryId: category.id,
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
export async function downloadAndUploadItemImage(imageUrl: string, asin: string, uploaderId?: string): Promise<{
  success: boolean
  storageKey?: string
  error?: string
}> {
  try {
    // アップロード者IDを取得（引数で渡されない場合はセッションから取得）
    let finalUploaderId = uploaderId
    if (!finalUploaderId) {
      const session = await auth()
      if (!session?.user?.id) {
        return { success: false, error: '認証が必要です' }
      }
      finalUploaderId = session.user.id
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
        uploaderId: finalUploaderId,
      },
      update: {
        fileName,
        originalName: fileName,
        fileSize: buffer.length,
        mimeType: contentType,
        uploaderId: finalUploaderId,
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
