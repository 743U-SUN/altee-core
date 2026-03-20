"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { createManagedProfile } from "@/app/actions/admin/managed-profile-actions"

const createProfileSchema = z.object({
  handle: z
    .string()
    .min(3, "ハンドルは3文字以上で入力してください")
    .max(20, "ハンドルは20文字以下で入力してください")
    .regex(/^[a-zA-Z0-9_-]+$/, "英数字、アンダースコア、ハイフンのみ使用可")
    .transform((v) => v.toLowerCase()),
  characterName: z
    .string()
    .min(1, "キャラクター名を入力してください")
    .max(30, "キャラクター名は30文字以下で入力してください"),
})

type CreateProfileInput = z.infer<typeof createProfileSchema>

export function CreateManagedProfileForm() {
  const router = useRouter()
  const form = useForm<CreateProfileInput>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      handle: "",
      characterName: "",
    },
  })

  const onSubmit = async (values: CreateProfileInput) => {
    try {
      const result = await createManagedProfile(values)

      if (result.success) {
        toast.success("プロフィールを作成しました")
        router.push("/admin/managed-profiles")
      } else {
        toast.error(result.error || "作成に失敗しました")
      }
    } catch {
      toast.error("プロフィールの作成に失敗しました")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>新規プロフィール情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ハンドル</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="example-vtuber"
                      maxLength={20}
                    />
                  </FormControl>
                  <FormDescription>
                    公開URL: /@{field.value || "handle"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="characterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>キャラクター名</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="キャラクター名"
                      maxLength={30}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "作成中..." : "作成する"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
