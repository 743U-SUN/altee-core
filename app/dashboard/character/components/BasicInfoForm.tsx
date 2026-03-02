"use client"

import { useState } from "react"
import { useForm, FormProvider, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ImageUploader } from "@/components/image-uploader/image-uploader"
import { getPublicUrl } from "@/lib/image-uploader/get-public-url"
import { updateBasicInfo } from "@/app/actions/user/character-actions"
import {
  basicInfoSchema,
  toBasicInfoDefaults,
  GENDER_OPTIONS,
  AFFILIATION_TYPE_OPTIONS,
  SPECIES_OPTIONS,
  ELEMENT_OPTIONS,
  type BasicInfoInput,
} from "@/lib/validations/character"
import type { CharacterInfo } from "@prisma/client"
import type { UploadedFile } from "@/types/image-upload"

interface BasicInfoFormProps {
  initialData: CharacterInfo | null
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export function BasicInfoForm({ initialData }: BasicInfoFormProps) {
  const form = useForm<BasicInfoInput>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: toBasicInfoDefaults(initialData),
  })

  const affiliationType = form.watch("affiliationType")

  // ImageUploader は useState で独立管理、iconImageKey は form.setValue で連携
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    initialData?.iconImageKey
      ? [{
          id: "existing",
          name: "icon",
          originalName: "icon",
          key: initialData.iconImageKey,
          url: getPublicUrl(initialData.iconImageKey),
          size: 0,
          type: "image/png",
          uploadedAt: new Date().toISOString(),
        }]
      : []
  )

  const handleImageUpload = (files: UploadedFile[]) => {
    setUploadedFiles(files)
    form.setValue("iconImageKey", files.length > 0 ? files[0].key : null)
  }

  const onSubmit = async (values: BasicInfoInput) => {
    try {
      const result = await updateBasicInfo({
        ...values,
        affiliationType: values.affiliationType || null,
        affiliation: values.affiliationType === "agency" ? (values.affiliation || null) : null,
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
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* アイコン */}
            <div className="space-y-2">
              <FormLabel>アイコン</FormLabel>
              <ImageUploader
                mode="immediate"
                previewSize="small"
                maxFiles={1}
                folder="user-character-icons"
                value={uploadedFiles}
                onUpload={handleImageUpload}
                showPreview={true}
                rounded={true}
              />
            </div>

            {/* キャラクターネーム */}
            <FormField
              control={form.control}
              name="characterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>キャラクターネーム</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="キャラクターネーム"
                      maxLength={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 読み方 */}
            <FormField
              control={form.control}
              name="nameReading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>読み方</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="ひらがな/カタカナ"
                      maxLength={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 性別 */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>性別</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GENDER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 誕生日 */}
            <div className="space-y-2">
              <FormLabel>誕生日</FormLabel>
              <div className="flex gap-2 items-center">
                <Controller
                  control={form.control}
                  name="birthdayMonth"
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() ?? ""}
                      onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="月" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m} value={m.toString()}>
                            {m}月
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Controller
                  control={form.control}
                  name="birthdayDay"
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() ?? ""}
                      onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="日" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d) => (
                          <SelectItem key={d} value={d.toString()}>
                            {d}日
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* 種族 */}
            <FormField
              control={form.control}
              name="species"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>種族</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="種族を入力"
                      maxLength={30}
                      list="species-list"
                    />
                  </FormControl>
                  <datalist id="species-list">
                    {SPECIES_OPTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 属性 */}
            <FormField
              control={form.control}
              name="element"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>属性</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="属性を入力"
                      maxLength={30}
                      list="element-list"
                    />
                  </FormControl>
                  <datalist id="element-list">
                    {ELEMENT_OPTIONS.map((e) => (
                      <option key={e} value={e} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* デビュー日 */}
            <FormField
              control={form.control}
              name="debutDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>デビュー日</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ファンネーム */}
            <FormField
              control={form.control}
              name="fanName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ファンネーム</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="ファンネーム"
                      maxLength={30}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 推しマーク */}
            <FormField
              control={form.control}
              name="fanMark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>推しマーク</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="絵文字"
                      maxLength={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ママ（イラストレーター） */}
            <FormField
              control={form.control}
              name="illustrator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ママ（イラストレーター）</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="イラストレーター名"
                      maxLength={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* パパ（モデラー） */}
            <FormField
              control={form.control}
              name="modeler"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>パパ（モデラー）</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="モデラー名"
                      maxLength={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 所属タイプ */}
            <FormField
              control={form.control}
              name="affiliationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>所属タイプ</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AFFILIATION_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 所属名（事務所選択時のみ） */}
            {affiliationType === "agency" && (
              <FormField
                control={form.control}
                name="affiliation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所属名</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="事務所名"
                        maxLength={50}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
