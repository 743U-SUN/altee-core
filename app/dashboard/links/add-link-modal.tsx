"use client"

import { useState } from "react"
import React from "react"
import dynamic from "next/dynamic"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ExternalLink, Plus, Upload, Image } from "lucide-react"
import { toast } from "sonner"
import { createUserLink } from "@/app/actions/link-actions"
import { ImageUploader } from "@/components/image-uploader/image-uploader"
import type { UploadedFile } from "@/types/image-upload"
import type { UserLink, LinkType } from "@/types/link-type"

// プリセットアイコン選択の遅延読み込み
const PresetIconSelector = dynamic(() => import("./components/PresetIconSelector").then(mod => ({ default: mod.PresetIconSelector })), {
  loading: () => <div className="h-24 bg-muted animate-pulse rounded-md" />,
  ssr: false
})

interface AddLinkModalProps {
  linkTypes: LinkType[]
  onLinkAdded: (link: UserLink) => void
}

// 動的フォームスキーマを生成する関数
const createLinkFormSchema = (linkTypes: LinkType[]) => {
  return z.object({
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
  }).refine((data) => {
    // URLパターンのバリデーション
    const selectedLinkType = linkTypes.find(lt => lt.id === data.linkTypeId)
    
    if (selectedLinkType?.urlPattern) {
      try {
        const regex = new RegExp(selectedLinkType.urlPattern)
        if (!regex.test(data.url)) {
          return false
        }
      } catch {
        // 正規表現が無効な場合はパターンチェックをスキップ
        return true
      }
    }
    return true
  }, {
    message: "このサービスの有効なURLを入力してください",
    path: ["url"] // エラーをurlフィールドに表示
  })
}

export function AddLinkModal({ linkTypes, onLinkAdded }: AddLinkModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTab, setSelectedTab] = useState("preset")
  const [selectedPresetIconId, setSelectedPresetIconId] = useState<string | null>(null)
  const [uploadedCustomIcon, setUploadedCustomIcon] = useState<UploadedFile | null>(null)
  const [customIconMode, setCustomIconMode] = useState<"upload" | "preset">("upload")
  const [presetIconMode, setPresetIconMode] = useState<"preset" | "upload">("preset") // プリセットタブ用のアイコンモード
  
  // プリセットとカスタムのリンクタイプを分離
  const presetLinkTypes = linkTypes.filter(type => !type.isCustom)
  const customLinkType = linkTypes.find(type => type.isCustom)

  const linkFormSchema = createLinkFormSchema(linkTypes)
  type LinkFormData = z.infer<typeof linkFormSchema>

  const form = useForm<LinkFormData>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      linkTypeId: "",
      url: "",
      customLabel: "",
      customIconId: "",
    },
  })

  const selectedLinkTypeId = form.watch("linkTypeId")
  
  
  // カスタムタブが選択されている場合、初期化時にlinkTypeIdを設定
  React.useEffect(() => {
    if (selectedTab === "custom" && customLinkType && !form.getValues("linkTypeId")) {
      form.setValue("linkTypeId", customLinkType.id)
    }
  }, [selectedTab, customLinkType, form])

  const onSubmit = async (data: LinkFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createUserLink({
        linkTypeId: data.linkTypeId,
        url: data.url,
        customLabel: data.customLabel || undefined,
        customIconId: data.customIconId || undefined,
        selectedLinkTypeIconId: selectedPresetIconId || undefined,
        isVisible: true,
      })

      if (result.success && result.data) {
        // Server Actionの戻り値は既にincludeでリレーションデータを含んでいる
        onLinkAdded(result.data)
        toast.success("リンクを追加しました")
        form.reset()
        setIsOpen(false)
        setSelectedPresetIconId(null)
        setUploadedCustomIcon(null)
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
    if (value === "custom") {
      if (customLinkType) {
        form.setValue("linkTypeId", customLinkType.id)
        setSelectedPresetIconId(null) // プリセットアイコン選択をリセット
      }
      setPresetIconMode("preset") // プリセットタブ用のモードをリセット
    } else if (value === "preset") {
      form.setValue("linkTypeId", "")
      form.setValue("customLabel", "")
      form.setValue("customIconId", "") // カスタムアイコンをリセット
      setSelectedPresetIconId(null)
      setUploadedCustomIcon(null)
      setCustomIconMode("upload")
      setPresetIconMode("preset") // プリセットタブのデフォルトに戻す
    }
  }

  // 古いdefaultIconシステムは削除済み

  const handleCustomIconUpload = (files: UploadedFile[]) => {
    if (files.length > 0) {
      const file = files[0]
      setUploadedCustomIcon(file)
      form.setValue("customIconId", file.id)
      toast.success("カスタムアイコンをアップロードしました")
    }
  }

  const handleCustomIconDelete = () => {
    setUploadedCustomIcon(null)
    form.setValue("customIconId", "")
  }

  const handlePresetIconSelected = (iconId: string) => {
    setSelectedPresetIconId(iconId)
    // プリセットアイコンの場合はcustomIconIdは使わない
    // サーバー側で対応する必要がある
    // toastは保存時のみ表示するため削除
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      form.reset()
      setSelectedPresetIconId(null)
      setUploadedCustomIcon(null)
      setCustomIconMode("upload")
      setPresetIconMode("preset") // プリセットタブ用のモードもリセット
    }
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          リンクを追加
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新しいリンクを追加</DialogTitle>
        </DialogHeader>
        
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
                            <ExternalLink className="h-4 w-4" />
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
          </TabsContent>
        </Tabs>

        {/* プリセットアイコン選択（プリセットタブでリンクタイプが選択されている場合のみ） */}
        {selectedTab === "preset" && selectedLinkTypeId && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>アイコン</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={presetIconMode === "preset" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPresetIconMode("preset")
                    setUploadedCustomIcon(null)
                    form.setValue("customIconId", "")
                  }}
                >
                  <Image className="h-4 w-4 mr-2" />
                  プリセットから選択
                </Button>
                <Button
                  type="button"
                  variant={presetIconMode === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPresetIconMode("upload")
                    setSelectedPresetIconId(null)
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  カスタムアイコンをアップロード
                </Button>
              </div>
            </div>
            
            {presetIconMode === "preset" && (
              <PresetIconSelector
                linkTypeId={selectedLinkTypeId}
                selectedIconId={selectedPresetIconId}
                onIconSelected={handlePresetIconSelected}
              />
            )}
            
            {presetIconMode === "upload" && (
              <>
                <div className="border rounded-lg p-4">
                  <ImageUploader
                    mode="immediate"
                    previewSize="small"
                    maxFiles={1}
                    maxSize={1024 * 1024} // 1MB
                    folder="user-links"
                    value={uploadedCustomIcon ? [uploadedCustomIcon] : []}
                    onUpload={handleCustomIconUpload}
                    onDelete={handleCustomIconDelete}
                    showPreview={true}
                    className="min-h-[120px]"
                  />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• 推奨サイズ: 24x24px 以上</p>
                  <p>• 対応形式: PNG, JPG, GIF, SVG</p>
                  <p>• 最大ファイルサイズ: 1MB</p>
                  <p>• SVGファイルは自動的にサニタイズされます</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* カスタムアイコン選択（カスタムタブの場合のみ） */}
        {selectedTab === "custom" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>アイコン <span className="text-sm text-muted-foreground">（オプション）</span></Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={customIconMode === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCustomIconMode("upload")
                    setSelectedPresetIconId(null)
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  アップロード
                </Button>
                <Button
                  type="button"
                  variant={customIconMode === "preset" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCustomIconMode("preset")
                    setUploadedCustomIcon(null)
                    form.setValue("customIconId", "")
                  }}
                >
                  <Image className="h-4 w-4 mr-2" />
                  プリセットから選択
                </Button>
              </div>
            </div>
            
            {customIconMode === "upload" && (
              <>
                <div className="border rounded-lg p-4">
                  <ImageUploader
                    mode="immediate"
                    previewSize="small"
                    maxFiles={1}
                    maxSize={1024 * 1024} // 1MB
                    folder="user-links"
                    value={uploadedCustomIcon ? [uploadedCustomIcon] : []}
                    onUpload={handleCustomIconUpload}
                    onDelete={handleCustomIconDelete}
                    showPreview={true}
                    className="min-h-[120px]"
                  />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• 推奨サイズ: 24x24px 以上</p>
                  <p>• 対応形式: PNG, JPG, GIF, SVG</p>
                  <p>• 最大ファイルサイズ: 1MB</p>
                  <p>• SVGファイルは自動的にサニタイズされます</p>
                </div>
              </>
            )}
            
            {customIconMode === "preset" && customLinkType && (
              <div className="space-y-2">
                <PresetIconSelector
                  linkTypeId={customLinkType.id}
                  selectedIconId={selectedPresetIconId}
                  onIconSelected={handlePresetIconSelected}
                />
                <p className="text-xs text-muted-foreground">
                  管理者が用意したアイコンから選択できます
                </p>
              </div>
            )}
          </div>
        )}


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
    </>
  )
}