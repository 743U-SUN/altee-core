"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { addBlacklistedEmail } from "@/app/actions/blacklist"
import { toast } from "sonner"
import { Mail } from "lucide-react"

const blacklistSchema = z.object({
  email: z.string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください")
    .toLowerCase(),
  reason: z.string().optional()
})

type BlacklistFormData = z.infer<typeof blacklistSchema>

export function AddBlacklistForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<BlacklistFormData>({
    resolver: zodResolver(blacklistSchema),
    defaultValues: {
      email: "",
      reason: ""
    }
  })

  const onSubmit = async (data: BlacklistFormData) => {
    setIsLoading(true)
    try {
      await addBlacklistedEmail(data.email, data.reason || undefined)
      toast.success("ブラックリストに追加しました")
      form.reset()
      router.refresh()
    } catch (error) {
      console.error("ブラックリスト追加エラー:", error)
      toast.error("追加に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="user@example.com"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>理由（任意）</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="ブラックリスト登録の理由を入力..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "追加中..." : "ブラックリストに追加"}
        </Button>
      </form>
    </Form>
  )
}