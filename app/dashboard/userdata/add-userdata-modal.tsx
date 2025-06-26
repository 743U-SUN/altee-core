"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createUserData } from "@/app/actions/userdata-actions"
import type { UserData } from "@/types/userdata"
import { IconSelector } from "./components/IconSelector"

interface AddUserDataModalProps {
  onDataAdded: (data: UserData) => void
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

export function AddUserDataModal({ onDataAdded }: AddUserDataModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<UserDataFormData>({
    resolver: zodResolver(userDataFormSchema),
    defaultValues: {
      icon: "",
      field: "",
      value: "",
    },
  })

  const onSubmit = async (data: UserDataFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createUserData({
        icon: data.icon,
        field: data.field,
        value: data.value,
        isVisible: true,
      })

      if (result.success && result.data) {
        onDataAdded(result.data)
        toast.success("データを追加しました")
        form.reset()
        setIsOpen(false)
      } else {
        toast.error(result.error || "データの追加に失敗しました")
      }
    } catch {
      toast.error("データの追加に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      form.reset()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          データを追加
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新しいデータを追加</DialogTitle>
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
                {isSubmitting ? "追加中..." : "追加"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}