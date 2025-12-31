'use server'

import { prisma } from '@/lib/prisma'
import {
  productSchema,
  type ProductInput,
  type ProductCSVRow,
  type CSVImportResult,
} from '@/lib/validation/product'
import { revalidatePath } from 'next/cache'

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
        imageStorageKey: validated.imageStorageKey || null,
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
        imageStorageKey: validated.imageStorageKey || null,
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
