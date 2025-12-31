'use server'

import { prisma } from '@/lib/prisma'
import {
  productSchema,
  type ProductInput,
  type ProductCSVRow,
  type CSVImportResult,
} from '@/lib/validation/product'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

// ===== カテゴリ一覧取得（商品フォーム用） =====

export async function getCategoriesAction() {
  try {
    const categories = await prisma.productCategory.findMany({
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

// ===== 商品一覧取得 =====

interface GetProductsFilters {
  categoryId?: string
  brandId?: string
  search?: string
  page?: number
  perPage?: number
}

export async function getProductsAction(filters: GetProductsFilters = {}) {
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

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          _count: {
            select: {
              userProducts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where }),
    ])

    return {
      success: true,
      data: {
        products,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    }
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return {
      success: false,
      error: '商品の取得に失敗しました',
    }
  }
}

// ===== 商品詳細取得 =====

export async function getProductByIdAction(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        _count: {
          select: {
            userProducts: true,
          },
        },
      },
    })

    if (!product) {
      return {
        success: false,
        error: '商品が見つかりませんでした',
      }
    }

    return { success: true, data: product }
  } catch (error) {
    console.error('Failed to fetch product:', error)
    return {
      success: false,
      error: '商品の取得に失敗しました',
    }
  }
}

// ===== 商品作成 =====

export async function createProductAction(input: ProductInput) {
  try {
    // "null" 文字列を null に変換
    const normalizedInput = {
      ...input,
      brandId: input.brandId === 'null' ? null : input.brandId,
    }

    // バリデーション
    const validated = productSchema.parse(normalizedInput)

    // カテゴリの存在確認
    const category = await prisma.productCategory.findUnique({
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
      const existingProduct = await prisma.product.findUnique({
        where: { asin: validated.asin },
      })

      if (existingProduct) {
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
      const uploadResult = await downloadAndUploadProductImage(imageUrl, validated.asin)
      if (uploadResult.success) {
        imageStorageKey = uploadResult.storageKey
      } else {
        console.error('画像アップロード失敗:', uploadResult.error)
        // 画像アップロード失敗しても商品作成は続行
      }
    }

    // 商品作成
    const product = await prisma.product.create({
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

    revalidatePath('/admin/products')
    return { success: true, data: product }
  } catch (error) {
    console.error('Failed to create product:', error)
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: '商品の作成に失敗しました',
    }
  }
}

// ===== 商品更新 =====

export async function updateProductAction(id: string, input: ProductInput) {
  try {
    // "null" 文字列を null に変換
    const normalizedInput = {
      ...input,
      brandId: input.brandId === 'null' ? null : input.brandId,
    }

    // バリデーション
    const validated = productSchema.parse(normalizedInput)

    // 商品の存在確認
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return {
        success: false,
        error: '商品が見つかりませんでした',
      }
    }

    // カテゴリの存在確認
    const category = await prisma.productCategory.findUnique({
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
    if (validated.asin && validated.asin !== existingProduct.asin) {
      const duplicateProduct = await prisma.product.findUnique({
        where: { asin: validated.asin },
      })

      if (duplicateProduct) {
        return {
          success: false,
          error: 'このASINは既に登録されています',
        }
      }
    }

    // 画像URLが変更された場合の処理
    let imageStorageKey: string | null | undefined = existingProduct.imageStorageKey
    const newImageUrl = validated.customImageUrl || validated.amazonImageUrl
    const oldImageUrl = existingProduct.customImageUrl || existingProduct.amazonImageUrl

    // 画像URLが変更された場合
    if (newImageUrl && newImageUrl !== oldImageUrl && validated.asin) {
      console.log('画像URLが変更されました。アップロード開始...')
      // 古い画像を削除
      if (existingProduct.imageStorageKey) {
        await deleteProductImageFromR2(existingProduct.imageStorageKey)
      }

      // 新しい画像をダウンロード・アップロード
      const uploadResult = await downloadAndUploadProductImage(newImageUrl, validated.asin)
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

    // 商品更新
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: validated.name,
        description: validated.description || null,
        categoryId: validated.categoryId,
        brandId: validated.brandId || null,
        amazonUrl: validated.amazonUrl || null,
        amazonImageUrl: validated.amazonImageUrl || null,
        customImageUrl: validated.customImageUrl || null,
        imageStorageKey: imageStorageKey !== undefined ? imageStorageKey : existingProduct.imageStorageKey,
        ogTitle: validated.ogTitle || null,
        ogDescription: validated.ogDescription || null,
        asin: validated.asin || null,
      },
    })

    revalidatePath('/admin/products')
    return { success: true, data: product }
  } catch (error) {
    console.error('Failed to update product:', error)
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: '商品の更新に失敗しました',
    }
  }
}

// ===== 商品削除 =====

export async function deleteProductAction(id: string) {
  try {
    // 商品の存在確認
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userProducts: true,
          },
        },
      },
    })

    if (!product) {
      return {
        success: false,
        error: '商品が見つかりませんでした',
      }
    }

    // ユーザー商品の関連をチェック
    if (product._count.userProducts > 0) {
      return {
        success: false,
        error: `この商品は${product._count.userProducts}人のユーザーが登録しています。削除する前にユーザー商品を削除してください。`,
      }
    }

    // R2に保存された画像を削除
    if (product.imageStorageKey) {
      await deleteProductImageFromR2(product.imageStorageKey)
    }

    // 商品削除
    await prisma.product.delete({
      where: { id },
    })

    revalidatePath('/admin/products')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete product:', error)
    return {
      success: false,
      error: '商品の削除に失敗しました',
    }
  }
}

// ===== CSV一括登録 =====

export async function importProductsFromCSVAction(
  rows: ProductCSVRow[]
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
      const category = await prisma.productCategory.findUnique({
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

      // 商品作成
      await prisma.product.create({
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

  revalidatePath('/admin/products')
  return result
}

// ===== R2画像管理関数 =====

/**
 * 商品画像をR2から削除（ヘルパー関数）
 */
async function deleteProductImageFromR2(imageStorageKey: string): Promise<void> {
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
    console.error('商品画像削除エラー:', error)
    // 削除失敗しても続行（エラーを投げない）
  }
}

/**
 * Amazon画像またはカスタムURLから画像をダウンロードしてR2にアップロード
 */
export async function downloadAndUploadProductImage(imageUrl: string, asin: string, uploaderId?: string): Promise<{
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

    // ファイル名: product-images/{asin}.{ext}
    const fileName = `${asin}.${extension}`
    const folder = 'product-images'
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
    console.error('商品画像ダウンロード・アップロードエラー:', error)
    return { success: false, error: '画像の保存に失敗しました' }
  }
}

/**
 * 商品画像を更新（Amazonから再取得してR2に保存）
 */
export async function refreshProductImage(productId: string): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return { success: false, error: '商品が見つかりません' }
    }

    // カスタムURLまたはAmazon URL
    const imageUrl = product.customImageUrl || product.amazonImageUrl
    if (!imageUrl) {
      return { success: false, error: '画像URLが登録されていません' }
    }

    // ASINが必要
    if (!product.asin) {
      return { success: false, error: 'ASINが登録されていません' }
    }

    // 古い画像を削除（存在する場合）
    if (product.imageStorageKey) {
      await deleteProductImageFromR2(product.imageStorageKey)
    }

    // 新しい画像をダウンロード・アップロード
    const uploadResult = await downloadAndUploadProductImage(imageUrl, product.asin)

    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error }
    }

    // 商品情報を更新
    await prisma.product.update({
      where: { id: productId },
      data: { imageStorageKey: uploadResult.storageKey }
    })

    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${productId}`)

    return { success: true, message: '画像を更新しました' }
  } catch (error) {
    console.error('商品画像更新エラー:', error)
    return { success: false, error: '画像の更新に失敗しました' }
  }
}
