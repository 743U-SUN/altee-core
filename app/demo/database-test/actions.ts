'use server'

import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

// データベース接続テスト
export async function testConnection() {
  try {
    console.log('🔍 データベース接続テスト開始...')
    
    // シンプルなクエリで接続テスト
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ データベース接続成功:', result)
    
    // テーブル存在確認
    const userCount = await prisma.user.count()
    console.log('✅ Userテーブルアクセス成功. 現在のユーザー数:', userCount)
    
    console.log('🎉 接続テスト完了')
  } catch (error) {
    console.error('❌ 接続テスト失敗:', error)
    throw error
  } finally {
    redirect('/demo/database-test')
  }
}

// テストユーザー作成
export async function createTestUser() {
  try {
    console.log('👤 テストユーザー作成開始...')
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')
    const randomId = Math.random().toString(36).substring(2, 8)
    
    const user = await prisma.user.create({
      data: {
        email: `test-${timestamp}-${randomId}@example.com`,
        name: `テストユーザー ${randomId}`,
      },
    })
    
    console.log('✅ ユーザー作成成功:', user)
    
    // 関連Articleも作成してリレーションをテスト
    const article = await prisma.article.create({
      data: {
        title: `テスト記事 by ${user.name}`,
        slug: `test-article-${Date.now()}`,
        content: `これは ${user.name} のテスト記事です。`,
        published: true,
        authorId: user.id,
      },
    })
    
    console.log('✅ 関連Article作成成功:', article)
    console.log('🎉 テストユーザー作成完了')
  } catch (error) {
    console.error('❌ ユーザー作成失敗:', error)
    throw error
  } finally {
    redirect('/demo/database-test')
  }
}

// 全ユーザー取得
export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        articles: true, // 関連Articleも含める
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return users
  } catch (error) {
    console.error('❌ ユーザー取得失敗:', error)
    return []
  }
}

// テストアイテム作成
export async function createTestItem() {
  try {
    console.log('🛍️ テストアイテム作成開始...')
    
    const randomId = Math.random().toString(36).substring(2, 8)

    // デモ用カテゴリを取得または作成
    let demoCategory = await prisma.itemCategory.findFirst({
      where: { slug: 'demo-category' }
    })

    if (!demoCategory) {
      demoCategory = await prisma.itemCategory.create({
        data: {
          name: 'デモカテゴリ',
          slug: 'demo-category',
          itemType: 'GENERAL',
          requiresCompatibilityCheck: false,
          sortOrder: 999,
        }
      })
    }

    const product = await prisma.item.create({
      data: {
        name: `テストアイテム ${randomId}`,
        description: `これはテスト用のアイテムです。ID: ${randomId}`,
        categoryId: demoCategory.id,
      },
    })
    
    console.log('✅ アイテム作成成功:', item)
    console.log('🎉 テストアイテム作成完了')
  } catch (error) {
    console.error('❌ アイテム作成失敗:', error)
    throw error
  } finally {
    redirect('/demo/database-test')
  }
}

// 全アイテム取得
export async function getAllItems() {
  try {
    const products = await prisma.item.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return products
  } catch (error) {
    console.error('❌ アイテム取得失敗:', error)
    return []
  }
}

// テストデータ全削除
export async function deleteAllTestUsers() {
  try {
    console.log('🗑️ テストデータ削除開始...')
    
    // test-で始まるメールアドレスのユーザーのみ削除
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          startsWith: 'test-',
        },
      },
    })
    
    console.log(`🔍 削除対象ユーザー数: ${testUsers.length}`)
    
    if (testUsers.length > 0) {
      // 関連するPostsは onDelete: Cascade で自動削除される
      const deleteResult = await prisma.user.deleteMany({
        where: {
          email: {
            startsWith: 'test-',
          },
        },
      })
      
      console.log('✅ テストユーザー削除完了:', deleteResult)
    }
    
    console.log('🎉 削除処理完了')
  } catch (error) {
    console.error('❌ 削除処理失敗:', error)
    throw error
  } finally {
    redirect('/demo/database-test')
  }
}

// テストアイテム全削除
export async function deleteAllTestItems() {
  try {
    console.log('🗑️ テストアイテム削除開始...')
    
    const testItems = await prisma.item.findMany({
      where: {
        name: {
          startsWith: 'テストアイテム',
        },
      },
    })
    
    console.log(`🔍 削除対象アイテム数: ${testItems.length}`)
    
    if (testItems.length > 0) {
      const deleteResult = await prisma.item.deleteMany({
        where: {
          name: {
            startsWith: 'テストアイテム',
          },
        },
      })
      
      console.log('✅ テストアイテム削除完了:', deleteResult)
    }
    
    console.log('🎉 アイテム削除処理完了')
  } catch (error) {
    console.error('❌ アイテム削除処理失敗:', error)
    throw error
  } finally {
    redirect('/demo/database-test')
  }
}