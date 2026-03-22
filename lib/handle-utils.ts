import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { handleSchema } from '@/lib/validations/user-setup'
import { isReservedHandle } from '@/lib/reserved-handles'
import { normalizeHandle, queryHandleSchema } from '@/lib/validations/shared'

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
  } catch {
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
  const candidates = [
    `${baseHandle}1`,
    `${baseHandle}2`,
    `${baseHandle}3`,
    `${baseHandle}_user`,
    `${baseHandle}_alt`,
  ].filter(c => !isReservedHandle(c));

  const taken = await prisma.user.findMany({
    where: { handle: { in: candidates } },
    select: { handle: true },
  });
  const takenSet = new Set(taken.map(u => u.handle));
  const available = candidates.find(c => !takenSet.has(c));

  return available ?? `${baseHandle}${Math.floor(Math.random() * 9000) + 1000}`;
}

/**
 * Handleからユーザー情報を取得
 * 'use cache' でクロスリクエストキャッシュ（公開プロフィール用）
 */
export async function getUserByHandle(handle: string) {
  'use cache'
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)
  cacheLife('minutes')
  cacheTag(`profile-${normalized}`)

  try {
    if (isReservedHandle(normalized)) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { handle: normalized, isActive: true },
      include: {
        profile: {
          include: {
            characterImage: true,
          },
        },
        characterInfo: {
          select: { characterName: true, iconImageKey: true },
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
        userSections: {
          where: { isVisible: true, page: 'profile' },
          orderBy: { sortOrder: 'asc' },
        },
        userNews: {
          where: { published: true, adminHidden: false },
          orderBy: { sortOrder: 'asc' },
          include: { thumbnail: { select: { storageKey: true } } },
          take: 3,
        },
      },
    })

    return user
  } catch {
    return null
  }
}

/**
 * Handleが存在するかチェック（簡易版）
 * @param handle チェックするhandle
 * @returns 存在する場合true
 */
export async function handleExists(handle: string): Promise<boolean> {
  try {
    const normalized = normalizeHandle(handle);
    const user = await prisma.user.findUnique({
      where: { handle: normalized },
      select: { id: true },
    });

    return !!user;
  } catch {
    return false;
  }
}