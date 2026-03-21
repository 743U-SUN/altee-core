'use server';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { userSetupSchema, handleAvailabilityCheckSchema, type UserSetupSchema } from '@/lib/validations/user-setup';
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
  const session = await requireAuth();

  try {
    // バリデーション
    const validation = userSetupSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'データが正しくありません'
      };
    }

    const validatedData = validation.data;

    // 現在のユーザー情報を取得（ADMINロール保持 + セットアップ済みチェック）
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, handle: true },
    });

    // セットアップ済みチェック（再実行防止）
    // GUEST = 未セットアップ、USER/ADMIN = セットアップ済み
    if (currentUser?.role === 'USER') {
      return { success: false, error: 'セットアップはすでに完了しています' };
    }

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

    // トランザクションでユーザー情報を更新
    await prisma.$transaction(async (tx) => {
      // Userテーブルを更新（ADMINの場合はロールを保持）
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          role: currentUser?.role === 'ADMIN' ? 'ADMIN' : validatedData.role,
          handle: validatedData.role === 'USER' ? validatedData.handle : null,
        },
      });

      // UserProfileが存在しない場合は作成
      await tx.userProfile.upsert({
        where: { userId: session.user.id },
        update: {},
        create: {
          userId: session.user.id,
          bio: null,
        },
      });

      // CharacterInfoを作成/更新（表示名を保存）
      await tx.characterInfo.upsert({
        where: { userId: session.user.id },
        update: { characterName: validatedData.characterName },
        create: {
          userId: session.user.id,
          characterName: validatedData.characterName,
        },
      });
    });

    // キャッシュを再検証
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/setup');

    return { success: true };
  } catch {
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
    await requireAuth();

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
  } catch {
    return {
      success: false,
      error: 'ハンドルの確認中にエラーが発生しました',
    };
  }
}