import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { FontSelector } from './components/FontSelector'
import { ThemePresetSelector } from './components/ThemePresetSelector'
import { VisibilityToggles } from './components/VisibilityToggles'
import { BackgroundSelector } from './components/BackgroundSelector'
import { ColorPresetSelector } from './components/ColorPresetSelector'
import { getUserThemeSettings } from '@/app/actions/user/theme-actions'
import { DEFAULT_THEME_SETTINGS } from '@/types/profile-sections'
import { Type, Palette, Eye, Edit, ImageIcon, Pipette, HelpCircle } from 'lucide-react'

interface DashboardSidebarContentProps {
  userId: string
}

export async function DashboardSidebarContent({
  userId,
}: DashboardSidebarContentProps) {
  const themeSettings =
    (await getUserThemeSettings(userId)) ?? DEFAULT_THEME_SETTINGS

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* プロフィールエディターへのリンク */}
        <Button asChild className="w-full" variant="default">
          <Link href="/dashboard/profile-editor">
            <Edit className="w-4 h-4 mr-2" />
            プロフィールエディター
          </Link>
        </Button>

        {/* FAQsへのリンク */}
        <Button asChild className="w-full" variant="outline">
          <Link href="/dashboard/faqs">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQ管理
          </Link>
        </Button>

        <Separator />

        {/* フォント選択 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Type className="size-4" />
              フォント
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FontSelector currentFont={themeSettings.fontFamily} />
          </CardContent>
        </Card>

        {/* テーマプリセット */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Palette className="size-4" />
              テーマ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ThemePresetSelector currentPreset={themeSettings.themePreset} />
          </CardContent>
        </Card>

        {/* 色設定 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Pipette className="size-4" />
              カラー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ColorPresetSelector
              currentHeaderColor={themeSettings.headerColor}
              currentHeaderTextColor={themeSettings.headerTextColor}
              currentAccentColor={themeSettings.accentColor}
            />
          </CardContent>
        </Card>

        {/* 背景設定 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="size-4" />
              背景
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BackgroundSelector currentBackground={themeSettings.background} />
          </CardContent>
        </Card>

        <Separator />

        {/* 表示/非表示設定 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="size-4" />
              表示設定
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VisibilityToggles visibility={themeSettings.visibility} />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
