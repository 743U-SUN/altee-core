"use client"

import { useForm, FormProvider, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { updateActivitySettings } from "@/app/actions/user/character-actions"
import {
  activitySettingsSchema,
  PLATFORM_OPTIONS,
  STREAMING_STYLE_OPTIONS,
  STREAMING_TIMEZONE_OPTIONS,
  STREAMING_FREQUENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  ACTIVITY_STATUS_OPTIONS,
  type ActivitySettingsInput,
} from "@/lib/validations/character"
import type { CharacterInfo, CharacterPlatformAccount } from "@prisma/client"

interface ActivityFormProps {
  initialData: (CharacterInfo & { platformAccounts: CharacterPlatformAccount[] }) | null
}

export function ActivityForm({ initialData }: ActivityFormProps) {
  const form = useForm<ActivitySettingsInput>({
    resolver: zodResolver(activitySettingsSchema),
    defaultValues: {
      platformAccounts: PLATFORM_OPTIONS.map((opt) => {
        const existing = initialData?.platformAccounts.find(a => a.platform === opt.value)
        return {
          platform: opt.value,
          isActive: existing?.isActive ?? false,
          url: existing?.url ?? "",
        }
      }),
      streamingStyles: initialData?.streamingStyles ?? [],
      streamingTimezones: initialData?.streamingTimezones ?? [],
      streamingFrequency: initialData?.streamingFrequency ?? "",
      languages: initialData?.languages ?? [],
      activityStatus: initialData?.activityStatus ?? "",
    },
  })

  const platformAccounts = form.watch("platformAccounts")

  const onSubmit = async (values: ActivitySettingsInput) => {
    try {
      const result = await updateActivitySettings({
        platformAccounts: values.platformAccounts.map(p => ({
          platform: p.platform,
          url: p.url || null,
          isActive: p.isActive,
        })),
        streamingStyles: values.streamingStyles,
        streamingTimezones: values.streamingTimezones,
        streamingFrequency: values.streamingFrequency || null,
        languages: values.languages,
        activityStatus: values.activityStatus || null,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* プラットフォーム */}
        <Card>
          <CardHeader>
            <CardTitle>プラットフォーム</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {PLATFORM_OPTIONS.map((opt, index) => (
              <div key={opt.value} className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="text-sm font-medium">{opt.label}</FormLabel>
                  <Controller
                    control={form.control}
                    name={`platformAccounts.${index}.isActive`}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
                {platformAccounts[index]?.isActive && (
                  <Controller
                    control={form.control}
                    name={`platformAccounts.${index}.url`}
                    render={({ field }) => (
                      <Input
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder={`${opt.label}のURL`}
                        className="ml-4"
                      />
                    )}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 配信設定 */}
        <Card>
          <CardHeader>
            <CardTitle>配信設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 配信スタイル */}
            <FormField
              control={form.control}
              name="streamingStyles"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>配信スタイル</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STREAMING_STYLE_OPTIONS.map((style) => (
                      <div key={style} className="flex items-center gap-2">
                        <Checkbox
                          id={`style-${style}`}
                          checked={field.value.includes(style)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, style]
                                : field.value.filter((v) => v !== style)
                            )
                          }}
                        />
                        <FormLabel
                          htmlFor={`style-${style}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {style}
                        </FormLabel>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 活動時間帯 */}
            <FormField
              control={form.control}
              name="streamingTimezones"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>活動時間帯</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STREAMING_TIMEZONE_OPTIONS.map((tz) => (
                      <div key={tz.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`tz-${tz.value}`}
                          checked={field.value.includes(tz.value)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, tz.value]
                                : field.value.filter((v) => v !== tz.value)
                            )
                          }}
                        />
                        <FormLabel
                          htmlFor={`tz-${tz.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {tz.label}
                        </FormLabel>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 配信頻度 */}
            <FormField
              control={form.control}
              name="streamingFrequency"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>配信頻度</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                    >
                      {STREAMING_FREQUENCY_OPTIONS.map((opt) => (
                        <div key={opt.value} className="flex items-center gap-2">
                          <RadioGroupItem value={opt.value} id={`freq-${opt.value}`} />
                          <FormLabel
                            htmlFor={`freq-${opt.value}`}
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

            {/* 使用言語 */}
            <FormField
              control={form.control}
              name="languages"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>使用言語</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <div key={lang} className="flex items-center gap-2">
                        <Checkbox
                          id={`lang-${lang}`}
                          checked={field.value.includes(lang)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, lang]
                                : field.value.filter((v) => v !== lang)
                            )
                          }}
                        />
                        <FormLabel
                          htmlFor={`lang-${lang}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {lang}
                        </FormLabel>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 活動状態 */}
            <FormField
              control={form.control}
              name="activityStatus"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>活動状態</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                    >
                      {ACTIVITY_STATUS_OPTIONS.map((opt) => (
                        <div key={opt.value} className="flex items-center gap-2">
                          <RadioGroupItem value={opt.value} id={`status-${opt.value}`} />
                          <FormLabel
                            htmlFor={`status-${opt.value}`}
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
          </CardContent>
        </Card>

        {/* 保存ボタン */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "保存中..." : "設定を保存"}
        </Button>
      </form>
    </FormProvider>
  )
}
