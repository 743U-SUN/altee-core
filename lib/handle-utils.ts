import { prisma } from '@/lib/prisma';
import { handleSchema } from '@/lib/validation/user-setup';
import { isReservedHandle } from '@/lib/reserved-handles';

/**
 * Handle重複チェック結果の型
 */
export type HandleAvailabilityResult = {
  available: boolean;
  error?: string;
  suggestion?: string;
};

/**
 * Handleの可用性をチェック
 * @param handle チェックするhandle
 * @returns 可用性チェック結果
 */
export async function checkHandleAvailability(handle: string): Promise<HandleAvailabilityResult> {
  try {
    // 基本的なバリデーション
    const validation = handleSchema.safeParse(handle);
    
    if (!validation.success) {
      return {
        available: false,
        error: validation.error.errors[0]?.message || 'ハンドルの形式が正しくありません',
      };
    }

    const normalizedHandle = validation.data;

    // 予約語チェック（念のため再チェック）
    if (isReservedHandle(normalizedHandle)) {
      return {
        available: false,
        error: 'このハンドルは予約語のため使用できません',
        suggestion: await generateHandleSuggestion(normalizedHandle),
      };
    }

    // データベースでの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { handle: normalizedHandle },
      select: { id: true },
    });

    if (existingUser) {
      return {
        available: false,
        error: 'このハンドルは既に使用されています',
        suggestion: await generateHandleSuggestion(normalizedHandle),
      };
    }

    return { available: true };
  } catch (error) {
    console.error('Handle availability check error:', error);
    return {
      available: false,
      error: 'ハンドルの確認中にエラーが発生しました',
    };
  }
}

/**
 * 使用可能なHandleの提案を生成
 * @param baseHandle ベースとなるhandle
 * @returns 提案されるhandle
 */
async function generateHandleSuggestion(baseHandle: string): Promise<string> {
  const suggestions = [
    `${baseHandle}1`,
    `${baseHandle}2`,
    `${baseHandle}3`,
    `${baseHandle}_user`,
    `${baseHandle}_alt`,
  ];

  for (const suggestion of suggestions) {
    const result = await checkHandleAvailability(suggestion);
    if (result.available) {
      return suggestion;
    }
  }

  // すべての提案が使用済みの場合、ランダムな数字を付加
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `${baseHandle}${randomNum}`;
}

/**
 * Handleからユーザー情報を取得
 * @param handle 検索するhandle
 * @returns ユーザー情報（存在しない場合はnull）
 */
export async function getUserByHandle(handle: string) {
  try {
    const normalizedHandle = handle.toLowerCase();
    
    const user = await prisma.user.findUnique({
      where: { handle: normalizedHandle },
      include: {
        profile: {
          include: {
            profileImage: true,
          },
        },
        userLinks: {
          include: {
            linkType: true,
            customIcon: true,
            selectedLinkTypeIcon: true,
          },
          orderBy: { sortOrder: 'asc' },
          where: { isVisible: true },
        },
        faqCategories: {
          include: {
            questions: {
              where: { isVisible: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return user;
  } catch (error) {
    console.error('Get user by handle error:', error);
    return null;
  }
}

/**
 * Handleが存在するかチェック（簡易版）
 * @param handle チェックするhandle
 * @returns 存在する場合true
 */
export async function handleExists(handle: string): Promise<boolean> {
  try {
    const normalizedHandle = handle.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { handle: normalizedHandle },
      select: { id: true },
    });
    
    return !!user;
  } catch (error) {
    console.error('Handle exists check error:', error);
    return false;
  }
}