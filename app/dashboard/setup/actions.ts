'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { userSetupSchema, handleAvailabilityCheckSchema, type UserSetupSchema } from '@/lib/validation/user-setup';
import { checkHandleAvailability as checkHandle } from '@/lib/handle-utils';
import { revalidatePath } from 'next/cache';

/**
 * Server Action結果の型
 */
type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * ユーザーセットアップ完了処理
 */
export async function completeUserSetup(data: UserSetupSchema): Promise<ActionResult> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' };
    }

    // バリデーション
    const validation = userSetupSchema.safeParse(data);
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.errors[0]?.message || 'データが正しくありません' 
      };
    }

    const validatedData = validation.data;

    // USER ロールの場合はハンドル重複チェック
    if (validatedData.role === 'USER' && validatedData.handle) {
      const handleAvailability = await checkHandle(validatedData.handle);
      if (!handleAvailability.available) {
        return { 
          success: false, 
          error: handleAvailability.error || 'ハンドルが利用できません' 
        };
      }
    }

    // 現在のユーザー情報を取得してADMINロールを保持
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // トランザクションでユーザー情報を更新
    await prisma.$transaction(async (tx) => {
      // Userテーブルを更新（ADMINの場合はロールを保持）
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          role: currentUser?.role === 'ADMIN' ? 'ADMIN' : validatedData.role,
          characterName: validatedData.characterName,
          handle: validatedData.role === 'USER' ? validatedData.handle : null,
        },
      });

      // UserProfileが存在しない場合は作成
      await tx.userProfile.upsert({
        where: { userId: session.user.id },
        update: {}, // 既存の場合は何もしない
        create: {
          userId: session.user.id,
          bio: null,
        },
      });
    });

    // キャッシュを再検証
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/setup');

    return { success: true };
  } catch (error) {
    console.error('User setup error:', error);
    return { 
      success: false, 
      error: 'セットアップ中にエラーが発生しました' 
    };
  }
}

/**
 * Handle可用性チェック（クライアント用）
 */
export async function checkHandleAvailability(handle: string): Promise<ActionResult<{ available: boolean; error?: string; suggestion?: string }>> {
  try {
    // バリデーション
    const validation = handleAvailabilityCheckSchema.safeParse({ handle });
    if (!validation.success) {
      return {
        success: true,
        data: {
          available: false,
          error: validation.error.errors[0]?.message || 'ハンドルの形式が正しくありません',
        },
      };
    }

    // Handle重複チェック
    const result = await checkHandle(validation.data.handle);
    
    return {
      success: true,
      data: {
        available: result.available,
        error: result.error,
        suggestion: result.suggestion,
      },
    };
  } catch (error) {
    console.error('Handle availability check error:', error);
    return {
      success: false,
      error: 'ハンドルの確認中にエラーが発生しました',
    };
  }
}