"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ExternalLink, Upload } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { createUserLink } from "@/app/actions/link-actions"

// アイコンアップロードモーダルの遅延読み込み
const CustomIconUploadModal = dynamic(() => import("./components/CustomIconUploadModal").then(mod => ({ default: mod.CustomIconUploadModal })), {
  loading: () => <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />,
  ssr: false
})

// 型定義
interface LinkType {
  id: string
  name: string
  displayName: string
  defaultIcon?: string | null
  isCustom: boolean
  urlPattern?: string | null
}

interface UserLink {
  id: string
  url: string
  customLabel?: string | null
  isVisible: boolean
  sortOrder: number
  linkType: {
    id: string
    name: string
    displayName: string
    defaultIcon?: string | null
    isCustom: boolean
  }
  customIcon?: {
    id: string
    storageKey: string
    fileName: string
  } | null
}

interface AddLinkModalProps {
  linkTypes: LinkType[]
  onLinkAdded: (link: UserLink) => void
  onCancel: () => void
}

// フォームスキーマ
const linkFormSchema = z.object({
  linkTypeId: z.string().min(1, "リンクタイプを選択してください"),
  url: z.string()
    .url("有効なURLを入力してください")
    .refine((url) => url.startsWith("https://"), {
      message: "HTTPSのURLを入力してください"
    }),
  customLabel: z.string()
    .max(10, "カスタムラベルは10文字以内で入力してください")
    .optional(),
  customIconId: z.string().optional(),
})

type LinkFormData = z.infer<typeof linkFormSchema>

export function AddLinkModal({ linkTypes, onLinkAdded, onCancel }: AddLinkModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTab, setSelectedTab] = useState("preset")
  const [isIconUploadOpen, setIsIconUploadOpen] = useState(false)

  const form = useForm<LinkFormData>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      linkTypeId: "",
      url: "",
      customLabel: "",
      customIconId: "",
    },
  })

  // const selectedLinkTypeId = form.watch("linkTypeId")

  // プリセットとカスタムのリンクタイプを分離
  const presetLinkTypes = linkTypes.filter(type => !type.isCustom)
  const customLinkType = linkTypes.find(type => type.isCustom)

  const onSubmit = async (data: LinkFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createUserLink({
        linkTypeId: data.linkTypeId,
        url: data.url,
        customLabel: data.customLabel || undefined,
        customIconId: data.customIconId || undefined,
        isVisible: true,
      })

      if (result.success && result.data) {
        onLinkAdded(result.data)
        toast.success("リンクを追加しました")
      } else {
        toast.error(result.error || "リンクの追加に失敗しました")
      }
    } catch {
      toast.error("リンクの追加に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTabChange = (value: string) => {
    setSelectedTab(value)
    if (value === "custom" && customLinkType) {
      form.setValue("linkTypeId", customLinkType.id)
    } else if (value === "preset") {
      form.setValue("linkTypeId", "")
      form.setValue("customLabel", "")
    }
  }

  const getIconUrl = (linkType: LinkType) => {
    if (linkType.defaultIcon) {
      return `https://object-storage.c3j1.conoha.io/v1/AUTH_0bf5238d06034983a552682e781f9e25/${linkType.defaultIcon}`
    }
    return null
  }

  const handleIconSelected = (iconId: string) => {
    form.setValue("customIconId", iconId)
    toast.success("カスタムアイコンを設定しました")
  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs value={selectedTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset">プリセット</TabsTrigger>
            <TabsTrigger value="custom">カスタム</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-4">
            <FormField
              control={form.control}
              name="linkTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>サービスを選択</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="サービスを選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {presetLinkTypes.map((linkType) => (
                        <SelectItem key={linkType.id} value={linkType.id}>
                          <div className="flex items-center gap-2">
                            {getIconUrl(linkType) ? (
                              <Image
                                src={getIconUrl(linkType)!} 
                                alt={linkType.displayName}
                                width={16}
                                height={16}
                                className="object-contain"
                                unoptimized
                              />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                            {linkType.displayName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <FormField
              control={form.control}
              name="customLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ラベル名 <span className="text-sm text-muted-foreground">（最大10文字）</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="例: 個人サイト" 
                      maxLength={10}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* カスタムアイコンアップロード機能 */}
            <div className="space-y-2">
              <Label>アイコン <span className="text-sm text-muted-foreground">（オプション）</span></Label>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => setIsIconUploadOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                アイコンをアップロード
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL <span className="text-sm text-muted-foreground">（HTTPS必須）</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com" 
                  type="url"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "追加中..." : "追加"}
          </Button>
        </div>
      </form>
    </Form>

    {/* カスタムアイコンアップロードモーダル */}
    <CustomIconUploadModal
      isOpen={isIconUploadOpen}
      onOpenChange={setIsIconUploadOpen}
      onIconSelected={handleIconSelected}
    />
    </>
  )
}