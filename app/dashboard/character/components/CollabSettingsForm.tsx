"use client"

import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { updateCollabSettings } from "@/app/actions/user/character-actions"
import {
  collabSettingsSchema,
  COLLAB_STATUS_OPTIONS,
  type CollabSettingsInput,
} from "@/lib/validations/character"
import type { CharacterInfo } from "@prisma/client"

interface CollabSettingsFormProps {
  initialData: CharacterInfo | null
}

export function CollabSettingsForm({ initialData }: CollabSettingsFormProps) {
  const form = useForm<CollabSettingsInput>({
    resolver: zodResolver(collabSettingsSchema),
    defaultValues: {
      collabStatus: initialData?.collabStatus ?? "",
      collabComment: initialData?.collabComment ?? "",
    },
  })

  const onSubmit = async (values: CollabSettingsInput) => {
    try {
      const result = await updateCollabSettings({
        collabStatus: values.collabStatus || null,
        collabComment: values.collabComment || null,
      })

      if (result.success) {
        toast.success("設定を保存しました")
      } else {
        toast.error(result.error || "保存に失敗しました")
      }
    } catch {
      toast.error("設定の保存に失敗しました")
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>コラボ設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* コラボ可否 */}
            <FormField
              control={form.control}
              name="collabStatus"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>コラボ可否</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      {COLLAB_STATUS_OPTIONS.map((opt) => (
                        <div key={opt.value} className="flex items-center gap-2">
                          <RadioGroupItem value={opt.value} id={`collab-${opt.value}`} />
                          <FormLabel
                            htmlFor={`collab-${opt.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {opt.label}
                          </FormLabel>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* コラボコメント */}
            <FormField
              control={form.control}
              name="collabComment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>コラボコメント</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="コラボの条件や一言を入力してください"
                      maxLength={500}
                      rows={4}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">最大500文字</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 保存ボタン */}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "保存中..." : "設定を保存"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  )
}
