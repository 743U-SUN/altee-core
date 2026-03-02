import { z } from 'zod'
import { USER_NEWS_LIMITS } from '@/types/user-news'

export const userNewsFormSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(USER_NEWS_LIMITS.TITLE, `タイトルは${USER_NEWS_LIMITS.TITLE}文字以内で入力してください`),
  slug: z
    .string()
    .min(1, 'スラッグは必須です')
    .max(USER_NEWS_LIMITS.SLUG, `スラッグは${USER_NEWS_LIMITS.SLUG}文字以内で入力してください`),
  content: z
    .string()
    .max(USER_NEWS_LIMITS.CONTENT, `本文は${USER_NEWS_LIMITS.CONTENT}文字以内で入力してください`),
  published: z.boolean(),
})

export type UserNewsFormValues = z.infer<typeof userNewsFormSchema>
