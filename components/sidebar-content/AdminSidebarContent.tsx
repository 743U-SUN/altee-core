"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Server, 
  Users, 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  BarChart3
} from "lucide-react"

export function AdminSidebarContent() {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* システム状態 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="size-4" />
              システム状態
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">サーバー</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="size-3 mr-1" />
                正常
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">データベース</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="size-3 mr-1" />
                正常
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <AlertTriangle className="size-3 mr-1" />
                注意
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* ユーザー統計 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="size-4" />
              ユーザー統計
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">総ユーザー数</span>
              <span className="text-sm font-medium">1,234</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">アクティブ</span>
              <span className="text-sm font-medium">856</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">新規（今日）</span>
              <span className="text-sm font-medium">12</span>
            </div>
          </CardContent>
        </Card>

        {/* データベース情報 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="size-4" />
              データベース
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">使用容量</span>
              <span className="text-sm font-medium">2.4 GB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">接続数</span>
              <span className="text-sm font-medium">8/100</span>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* クイックアクション */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Activity className="size-4" />
            クイックアクション
          </h4>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <BarChart3 className="size-4 mr-2" />
              レポート生成
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Users className="size-4 mr-2" />
              ユーザー管理
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Settings className="size-4 mr-2" />
              システム設定
            </Button>
          </div>
        </div>

        {/* 最近のアクティビティ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">最近のアクティビティ</CardTitle>
            <CardDescription className="text-xs">
              過去24時間の主要な変更
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">ユーザー登録</span>
                <span className="text-muted-foreground">2時間前</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">システム更新</span>
                <span className="text-muted-foreground">5時間前</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">バックアップ完了</span>
                <span className="text-muted-foreground">12時間前</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}