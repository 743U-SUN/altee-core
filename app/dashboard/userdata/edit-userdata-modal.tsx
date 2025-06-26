"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Edit } from "lucide-react"
import { toast } from "sonner"
import { updateUserData } from "@/app/actions/userdata-actions"
import type { UserData } from "@/types/userdata"
import { IconSelector } from "./components/IconSelector"

interface EditUserDataModalProps {
  data: UserData
  onDataUpdated: () => void
}

// フォームスキーマ
const userDataFormSchema = z.object({
  icon: z.string().min(1, "アイコンを選択してください"),
  field: z.string()
    .min(1, "項目名を入力してください")
    .max(50, "項目名は50文字以内で入力してください"),
  value: z.string()
    .min(1, "値を入力してください")
    .max(200, "値は200文字以内で入力してください"),
})

type UserDataFormData = z.infer<typeof userDataFormSchema>

export function EditUserDataModal({ data, onDataUpdated }: EditUserDataModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<UserDataFormData>({
    resolver: zodResolver(userDataFormSchema),
    defaultValues: {
      icon: data.icon,
      field: data.field,
      value: data.value,
    },
  })

  // データが変更された時にフォームを更新
  useEffect(() => {
    form.reset({
      icon: data.icon,
      field: data.field,
      value: data.value,
    })
  }, [data, form])

  const onSubmit = async (formData: UserDataFormData) => {
    setIsSubmitting(true)
    try {
      const result = await updateUserData(data.id, {
        icon: formData.icon,
        field: formData.field,
        value: formData.value,
      })

      if (result.success) {
        onDataUpdated()
        toast.success("データを更新しました")
        setIsOpen(false)
      } else {
        toast.error(result.error || "データの更新に失敗しました")
      }
    } catch {
      toast.error("データの更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // モーダルが閉じられた時に元の値にリセット
      form.reset({
        icon: data.icon,
        field: data.field,
        value: data.value,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>データを編集</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>アイコン</FormLabel>
                  <FormControl>
                    <IconSelector
                      selectedIcon={field.value}
                      onIconSelect={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="field"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>項目名 <span className="text-sm text-muted-foreground">（最大50文字）</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="例: 身長、体重、好きなもの" 
                      maxLength={50}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>値 <span className="text-sm text-muted-foreground">（最大200文字）</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="例: 175cm、65kg、読書" 
                      maxLength={200}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                キャンセル
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "更新中..." : "更新"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}